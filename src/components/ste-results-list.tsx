import { useCallback } from "react"
import type { InfiniteData } from "@tanstack/react-query"
import type { GetSearchItemsResponse } from "@/shared/api/autogen/types.gen"
import type { ApplicationQueryFull } from "@/shared/api/autogen/types.gen"
import { SteCard } from "./ste-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"

interface SteResultsListProps {
  data: InfiniteData<GetSearchItemsResponse> | undefined
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  queryData: ApplicationQueryFull | undefined
  appId: number
  queryId: number
  onLink: (contractId: number) => void
  onUnlink: (contractId: number) => void
  linkingId: number | null
  tooShort?: boolean
}

export function SteResultsList({
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  queryData,
  onLink,
  onUnlink,
  linkingId,
  tooShort,
}: SteResultsListProps) {
  const linkedContractIds = new Set(queryData?.contracts?.map((c) => c.contractItemId).filter((id): id is number => id !== undefined))

  const handleIntersect = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const sentinelRef = useIntersectionObserver(handleIntersect, {
    rootMargin: "200px",
  })

  const items = data?.pages.flatMap((p) => p.data ?? []) ?? []

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        {tooShort ? (
          <p className="text-sm">Введите не менее 3 символов</p>
        ) : (
          <>
            <p className="text-sm">Ничего не найдено</p>
            <p className="mt-1 text-xs">Попробуйте изменить поисковый запрос</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <SteCard
          key={item.ste_id}
          item={item}
          linkedContractIds={linkedContractIds}
          linkingId={linkingId}
          onLink={onLink}
          onUnlink={onUnlink}
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
        <p className="py-4 text-center text-xs text-muted-foreground">
          Все результаты загружены
        </p>
      )}
    </div>
  )
}
