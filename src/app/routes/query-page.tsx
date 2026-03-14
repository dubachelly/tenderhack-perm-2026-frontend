import { useRef, useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBasket } from "lucide-react";

import {
  getApplicationsByIdOptions,
  getApplicationsByIdQueryKey,
  getSearchItemsInfiniteOptions,
  postApplicationsByAppIdQueriesByQueryIdContractsMutation,
} from "@/shared/api/autogen/@tanstack/react-query.gen";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SteResultsList } from "@/components/ste-results-list";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";

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
  const linkedContracts = currentQuery?.contracts ?? [];

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
    ...postApplicationsByAppIdQueriesByQueryIdContractsMutation(),
    onMutate: (vars) => setLinkingId(vars.body.contractId),
    onSettled: () => setLinkingId(null),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: getApplicationsByIdQueryKey({ path: { id: numAppId } }),
      });
    },
  });

  const handleLink = (contractId: number) => {
    linkMutation.mutate({
      path: { appId: numAppId, queryId: numQueryId },
      body: { contractId },
    });
  };

  return (
    <div className="px-6 py-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to={`/applications/${numAppId}`} />}>
                {app?.name ?? "Заявка"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{queryText || "Запрос"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
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
              <span className="text-sm font-medium">Привязанные контракты</span>
              {linkedContracts.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {linkedContracts.length}
                </span>
              )}
            </div>
            <div className="p-2">
              {linkedContracts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6 px-2">
                  Нет привязанных контрактов
                </p>
              ) : (
                <ul className="space-y-1">
                  {linkedContracts.map((c) => (
                    <li
                      key={c.contractId}
                      className="flex items-start gap-2 rounded-md px-2 py-2 text-xs hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate" title={c.procurementName ?? undefined}>
                          {c.procurementName ?? "—"}
                        </p>
                        {c.procurementMethod && (
                          <p className="text-muted-foreground truncate">{c.procurementMethod}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <ScrollToTopButton scrollContainerRef={scrollRef} />
    </div>
  );
}
