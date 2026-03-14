import { useCallback } from "react";
import type { InfiniteData } from "@tanstack/react-query";
import type { GetSearchItemsResponse } from "@/shared/api/autogen/types.gen";
import type { ApplicationQueryFull } from "@/shared/api/autogen/types.gen";
import { SteCard } from "./ste-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface SteResultsListProps {
  data: InfiniteData<GetSearchItemsResponse> | undefined;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  queryData: ApplicationQueryFull | undefined;
  appId: number;
  queryId: number;
  onLink: (steId: number, rank: number) => void;
  linkingId: number | null;
}

export function SteResultsList({
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  queryData,
  onLink,
  linkingId,
}: SteResultsListProps) {
  const linkedSteIds = new Set(queryData?.stes?.map((s) => s.steId));

  const handleIntersect = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useIntersectionObserver(handleIntersect, {
    rootMargin: "200px",
  });

  const items = data?.pages.flatMap((p) => p.data ?? []) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Ничего не найдено</p>
        <p className="text-xs mt-1">Попробуйте изменить поисковый запрос</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <SteCard
          key={item.id}
          item={item}
          isLinked={!!item.ste_id && linkedSteIds.has(item.ste_id)}
          isPending={linkingId === item.ste_id}
          onLink={onLink}
        />
      ))}
      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}
      {!hasNextPage && items.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          Все результаты загружены
        </p>
      )}
    </div>
  );
}
