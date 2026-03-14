import { useRef, useEffect, useState } from "react"
import { useParams, Link } from "react-router"
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { SlidersHorizontal } from "lucide-react"

import {
  getApplicationsByIdOptions,
  getApplicationsByIdQueryKey,
  getSearchItemsInfiniteOptions,
  getContractsSupplierRegionsOptions,
  getContractsProcurementMethodsOptions,
  getSteCategoriesOptions,
  postApplicationsByAppIdQueriesByQueryIdContractsMutation,
  deleteApplicationsByAppIdQueriesByQueryIdContractsByContractItemIdMutation,
} from "@/shared/api/autogen/@tanstack/react-query.gen"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { SteResultsList } from "@/components/ste-results-list"
import { ScrollToTopButton } from "@/components/scroll-to-top-button"
import { MultiSelectCombobox } from "@/components/multiselect-combobox"
import { MultiSelect } from "@/components/multi-select"
import { DateRangePicker, toISODate } from "@/components/date-range-picker"
import type { DateRange } from "@/components/date-range-picker"
import { LinkedContractsSheet } from "@/components/linked-contracts-sheet"

export function QueryPage() {
  const { appId, queryId } = useParams<{ appId: string; queryId: string }>()
  const scrollRef = useRef<HTMLElement | null>(null)
  const qc = useQueryClient()
  const [linkingId, setLinkingId] = useState<number | null>(null)

  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [supplierRegionFilter, setSupplierRegionFilter] = useState<string[]>([])
  const [procurementMethodFilter, setProcurementMethodFilter] = useState<
    string[]
  >([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  useEffect(() => {
    scrollRef.current = document.querySelector("main")
  }, [])

  const numAppId = Number(appId)
  const numQueryId = Number(queryId)

  const { data: app } = useQuery(
    getApplicationsByIdOptions({ path: { id: numAppId } })
  )

  const { data: supplierRegions = [] } = useQuery(
    getContractsSupplierRegionsOptions()
  )
  const { data: procurementMethods = [] } = useQuery(
    getContractsProcurementMethodsOptions()
  )

  const currentQuery = app?.queries?.find((q) => q.id === numQueryId)
  const queryText = currentQuery?.queryText ?? ""

  const { data: categories = [] } = useQuery({
    ...getSteCategoriesOptions({ query: { query: queryText } }),
    enabled: !!queryText,
  })
  const linkedContracts = currentQuery?.contracts ?? []

  const activeQuery = {
    q: queryText,
    limit: 20,
    ...(categoryFilter.length > 0 ? { category: categoryFilter } : {}),
    ...(supplierRegionFilter.length > 0
      ? { supplier_region: supplierRegionFilter }
      : {}),
    ...(procurementMethodFilter.length > 0
      ? { procurement_method: procurementMethodFilter }
      : {}),
    ...(dateRange?.from ? { period_from: toISODate(dateRange.from) } : {}),
    ...(dateRange?.to ? { period_to: toISODate(dateRange.to) } : {}),
  }

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      ...getSearchItemsInfiniteOptions({ query: activeQuery }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, _all, lastPageParam) => {
        const { total = 0, limit = 20, page = 1 } = lastPage
        if ((page as number) * (limit as number) >= (total as number))
          return undefined
        return (lastPageParam as number) + 1
      },
      enabled: !!queryText,
    })

  const linkMutation = useMutation({
    ...postApplicationsByAppIdQueriesByQueryIdContractsMutation(),
    onMutate: (vars) => setLinkingId(vars.body.contractItemId),
    onSettled: () => setLinkingId(null),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: getApplicationsByIdQueryKey({ path: { id: numAppId } }),
      })
    },
  })

  const unlinkMutation = useMutation({
    ...deleteApplicationsByAppIdQueriesByQueryIdContractsByContractItemIdMutation(),
    onMutate: (vars) => setLinkingId(vars.path.contractItemId),
    onSettled: () => setLinkingId(null),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: getApplicationsByIdQueryKey({ path: { id: numAppId } }),
      })
    },
  })

  const handleLink = (contractItemId: number) => {
    linkMutation.mutate({
      path: { appId: numAppId, queryId: numQueryId },
      body: { contractItemId },
    })
  }

  const handleUnlink = (contractItemId: number) => {
    unlinkMutation.mutate({
      path: { appId: numAppId, queryId: numQueryId, contractItemId },
    })
  }

  const hasActiveFilters =
    categoryFilter.length > 0 ||
    supplierRegionFilter.length > 0 ||
    procurementMethodFilter.length > 0 ||
    !!dateRange?.from

  const resetFilters = () => {
    setCategoryFilter([])
    setSupplierRegionFilter([])
    setProcurementMethodFilter([])
    setDateRange(undefined)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link to={`/applications/${numAppId}`} />}
              >
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

      <div className="mb-4 rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Фильтры</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 text-xs"
              onClick={resetFilters}
            >
              Сбросить
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Категория</p>
            <MultiSelectCombobox
              items={categories}
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              placeholder="Все категории"
              emptyText="Нет категорий"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Регион поставщика</p>
            <MultiSelectCombobox
              items={supplierRegions as string[]}
              value={supplierRegionFilter}
              onValueChange={setSupplierRegionFilter}
              placeholder="Все регионы"
              emptyText="Нет регионов"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Способ закупки</p>
            <MultiSelect
              items={procurementMethods as string[]}
              value={procurementMethodFilter}
              onValueChange={setProcurementMethodFilter}
              placeholder="Все способы"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Период заключения</p>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Любой период"
            />
          </div>
        </div>
      </div>

      <div className="pb-14">
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
            onUnlink={handleUnlink}
            linkingId={linkingId}
          />
        ) : (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            Загрузка...
          </div>
        )}
      </div>

      <LinkedContractsSheet
        contracts={linkedContracts}
        appName={app?.name ?? ""}
        queryText={queryText}
      />

      <ScrollToTopButton scrollContainerRef={scrollRef} />
    </div>
  )
}
