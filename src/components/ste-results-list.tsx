import { useCallback } from "react"
import type { InfiniteData } from "@tanstack/react-query"
import type { GetSearchItemsResponse, GetSearchItemsTrigramResponse } from "@/shared/api/autogen/types.gen"
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
  trigramData?: InfiniteData<GetSearchItemsTrigramResponse> | undefined
  isLoadingTrigram?: boolean
  isFetchingNextTrigramPage?: boolean
  hasNextTrigramPage?: boolean
  fetchNextTrigramPage?: () => void
  queryData: ApplicationQueryFull | undefined
  appId: number
  queryId: number
  onLink: (contractId: number) => void
  onUnlink: (contractId: number) => void
  linkingId: number | null
  tooShort?: boolean
  categoryFilter?: string[]
  supplierRegionFilter?: string[]
  procurementMethodFilter?: string[]
  periodFrom?: string | null
  periodTo?: string | null
}

export function SteResultsList({
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  trigramData,
  isLoadingTrigram,
  isFetchingNextTrigramPage,
  hasNextTrigramPage,
  fetchNextTrigramPage,
  queryData,
  onLink,
  onUnlink,
  linkingId,
  tooShort,
  categoryFilter,
  supplierRegionFilter,
  procurementMethodFilter,
  periodFrom,
  periodTo,
}: SteResultsListProps) {
  const linkedContractIds = new Set(queryData?.contracts?.map((c) => c.contractItemId).filter((id): id is number => id !== undefined))

  const handleIntersect = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleTrigramIntersect = useCallback(() => {
    if (hasNextTrigramPage && !isFetchingNextTrigramPage) fetchNextTrigramPage?.()
  }, [hasNextTrigramPage, isFetchingNextTrigramPage, fetchNextTrigramPage])

  const sentinelRef = useIntersectionObserver(handleIntersect, {
    rootMargin: "200px",
  })

  const trigramSentinelRef = useIntersectionObserver(handleTrigramIntersect, {
    rootMargin: "200px",
  })

  const items = data?.pages.flatMap((p) => p.data ?? []) ?? []
  const trigramItems = trigramData?.pages.flatMap((p) => p.data ?? []) ?? []

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
    if (isLoadingTrigram) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )
    }
    if (trigramItems.length > 0) {
      return (
        <div className="space-y-3">
          {trigramItems.map((item) => (
            <SteCard
              key={`trigram-${item.ste_id}`}
              item={item}
              linkedContractIds={linkedContractIds}
              linkingId={linkingId}
              onLink={onLink}
              onUnlink={onUnlink}
              categoryFilter={categoryFilter}
              supplierRegionFilter={supplierRegionFilter}
              procurementMethodFilter={procurementMethodFilter}
              periodFrom={periodFrom}
              periodTo={periodTo}
            />
          ))}
          <div ref={trigramSentinelRef} className="h-1" />
          {isFetchingNextTrigramPage && (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          )}
          {!hasNextTrigramPage && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Все результаты загружены
            </p>
          )}
        </div>
      )
    }
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
          categoryFilter={categoryFilter}
          supplierRegionFilter={supplierRegionFilter}
          procurementMethodFilter={procurementMethodFilter}
          periodFrom={periodFrom}
          periodTo={periodTo}
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
        <>
          {(isLoadingTrigram || trigramItems.length > 0) && (
            <p className="py-3 text-center text-xs font-medium text-muted-foreground">
              Результаты триграммного поиска
            </p>
          )}
          {isLoadingTrigram ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <>
              {trigramItems.map((item) => (
                <SteCard
                  key={`trigram-${item.ste_id}`}
                  item={item}
                  linkedContractIds={linkedContractIds}
                  linkingId={linkingId}
                  onLink={onLink}
                  onUnlink={onUnlink}
                  categoryFilter={categoryFilter}
                  supplierRegionFilter={supplierRegionFilter}
                  procurementMethodFilter={procurementMethodFilter}
                  periodFrom={periodFrom}
                  periodTo={periodTo}
                />
              ))}
              <div ref={trigramSentinelRef} className="h-1" />
              {isFetchingNextTrigramPage && (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              )}
              {!hasNextTrigramPage && trigramItems.length > 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Все результаты загружены
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
