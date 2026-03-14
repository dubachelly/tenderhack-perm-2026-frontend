import { useRef, useEffect, useState } from "react";
import { useParams } from "react-router";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBasket, FileDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  getApplicationsByIdOptions,
  getApplicationsByIdQueryKey,
  getSearchItemsInfiniteOptions,
  postApplicationsByAppIdQueriesByQueryIdStesMutation,
} from "@/shared/api/autogen/@tanstack/react-query.gen";
import { SearchBar } from "@/components/search-bar";
import { SteResultsList } from "@/components/ste-results-list";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { useAddQueryToApplication } from "@/hooks/use-add-query-to-application";

export function QueryPage() {
  const { appId, queryId } = useParams<{ appId: string; queryId: string }>();
  const scrollRef = useRef<HTMLElement | null>(null);
  const qc = useQueryClient();
  const [linkingId, setLinkingId] = useState<number | null>(null);

  useEffect(() => {
    scrollRef.current = document.querySelector("main");
  }, []);

  const numAppId = Number(appId);
  const numQueryId = Number(queryId);

  const { data: app } = useQuery(
    getApplicationsByIdOptions({ path: { id: numAppId } })
  );

  const currentQuery = app?.queries?.find((q) => q.id === numQueryId);
  const queryText = currentQuery?.queryText ?? "";
  const linkedStes = currentQuery?.stes ?? [];

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      ...getSearchItemsInfiniteOptions({
        query: { q: queryText, limit: 20 },
      }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, _all, lastPageParam) => {
        const { total = 0, limit = 20, page = 1 } = lastPage;
        if ((page as number) * (limit as number) >= (total as number))
          return undefined;
        return (lastPageParam as number) + 1;
      },
      enabled: !!queryText,
    });

  const linkMutation = useMutation({
    ...postApplicationsByAppIdQueriesByQueryIdStesMutation(),
    onMutate: (vars) => setLinkingId(vars.body.steId),
    onSettled: () => setLinkingId(null),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: getApplicationsByIdQueryKey({ path: { id: numAppId } }),
      });
    },
  });

  const addQuery = useAddQueryToApplication();

  const handleSearch = (q: string) => {
    addQuery.mutate({
      path: { id: numAppId },
      body: { queryText: q },
    });
  };

  const handleLink = (steId: number, rank: number) => {
    linkMutation.mutate({
      path: { appId: numAppId, queryId: numQueryId },
      body: { steId, nameMatchPercent: rank },
    });
  };

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleGenerateReport = async () => {
    if (linkedStes.length === 0) return;
    setIsGeneratingReport(true);
    try {
      const firstSte = linkedStes[0];
      const payload = {
        items: linkedStes.map((ste) => ({
          contractId: "",
          procurementMethod: "",
          initialContractValue: "",
          contractValueAfterSigning: "",
          reductionPercent: "",
          contractSigningDate: "",
          buyerInn: "",
          supplierInn: "",
          steId: ste.steId ?? 0,
          steItemName: ste.steName ?? "",
          unitPrice: ste.medianPrice != null ? String(ste.medianPrice) : "",
        })),
        currency: "RUB",
        reportTitle: "Обоснование начальной цены СТЕ",
        steId: firstSte.steId ?? 0,
        steItemName: firstSte.steName ?? "",
        signerName: "",
        signerTitle: "",
      };
      const response = await fetch(
        "http://localhost:8000/api/v1/ste-price-justification/doc",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "report.doc";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="px-6 py-6 max-w-7xl mx-auto">
      <div className="space-y-2 mb-6">
        {app && (
          <p className="text-xs text-muted-foreground">
            Заявка:{" "}
            <span className="font-medium text-foreground">{app.name}</span>
          </p>
        )}
        <SearchBar
          defaultValue={queryText}
          onSearch={handleSearch}
          placeholder="Новый поисковый запрос..."
          className="w-full"
        />
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          {queryText ? (
            <SteResultsList
              data={data}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={!!hasNextPage}
              fetchNextPage={fetchNextPage}
              queryData={currentQuery}
              appId={numAppId}
              queryId={numQueryId}
              onLink={handleLink}
              linkingId={linkingId}
            />
          ) : (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
              Загрузка...
            </div>
          )}
        </div>

        <div className="w-72 shrink-0 sticky top-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <ShoppingBasket className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Привязанные СТЕ</span>
              {linkedStes.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {linkedStes.length}
                </span>
              )}
            </div>
            <div className="p-2">
              {linkedStes.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6 px-2">
                  Нет привязанных СТЕ
                </p>
              ) : (
                <ul className="space-y-1">
                  {linkedStes.map((ste) => (
                    <li
                      key={ste.id}
                      className="flex items-start gap-2 rounded-md px-2 py-2 text-xs hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate" title={ste.steName ?? undefined}>
                          {ste.steName ?? "—"}
                        </p>
                        {ste.steCategory && (
                          <p className="text-muted-foreground truncate">{ste.steCategory}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <Button
            className="w-full mt-2"
            size="sm"
            disabled={linkedStes.length === 0 || isGeneratingReport}
            onClick={handleGenerateReport}
          >
            <FileDown className="size-4" />
            {isGeneratingReport ? "Генерация..." : "Сгенерировать отчёт"}
          </Button>
        </div>
      </div>

      <ScrollToTopButton scrollContainerRef={scrollRef} />
    </div>
  );
}
