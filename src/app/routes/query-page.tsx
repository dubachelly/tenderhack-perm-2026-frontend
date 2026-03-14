import { useRef, useEffect, useState } from "react";
import { useParams } from "react-router";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
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

      <ScrollToTopButton scrollContainerRef={scrollRef} />
    </div>
  );
}
