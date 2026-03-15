import { useRef, useEffect, useState } from "react"
import { useParams, Link } from "react-router"
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { SlidersHorizontal, Plus, Search, Star } from "lucide-react"

import {
  getApplicationsByIdOptions,
  getApplicationsByIdQueryKey,
  getSearchItemsInfiniteOptions,
  getSearchItemsTrigramInfiniteOptions,
  getSearchCategoriesOptions,
  getContractsSupplierRegionsOptions,
  getContractsProcurementMethodsOptions,
  getSearchAiItemsOptions,
  postApplicationsByAppIdQueriesByQueryIdContractsMutation,
  deleteApplicationsByAppIdQueriesByQueryIdContractsByContractItemIdMutation,
  patchApplicationsByAppIdQueriesByQueryIdMutation,
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { SteResultsList } from "@/components/ste-results-list"
import { ScrollToTopButton } from "@/components/scroll-to-top-button"
import { MultiSelectCombobox } from "@/components/multiselect-combobox"
import { MultiSelect } from "@/components/multi-select"
import { DateRangePicker, toISODate } from "@/components/date-range-picker"
import type { DateRange } from "@/components/date-range-picker"
import { LinkedContractsSheet } from "@/components/linked-contracts-sheet"
import { SteCard } from "@/components/ste-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type StoredFilters = {
  categoryFilter?: string[]
  supplierRegionFilter?: string[]
  procurementMethodFilter?: string[]
  dateRange?: { from?: string | null; to?: string | null } | null
}

const FILTER_STORAGE_PREFIX = "tenderhack:query-filters"

const parseStoredDate = (value?: string | null) => {
  if (!value) return undefined
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

export function QueryPage() {
  const { appId, queryId } = useParams<{ appId: string; queryId: string }>()
  const scrollRef = useRef<HTMLElement | null>(null)
  const qc = useQueryClient()
  const [linkingId, setLinkingId] = useState<number | null>(null)

  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [supplierRegionFilter, setSupplierRegionFilter] = useState<string[]>([])
  const [procurementMethodFilter, setProcurementMethodFilter] = useState<
    string[]
  >([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [filtersHydrated, setFiltersHydrated] = useState(false)

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

  useEffect(() => {
    if (queryText) {
      setSearchInput(queryText)
      setDebouncedSearch(queryText)
    }
  }, [queryText])

  useEffect(() => {
    const trimmed = searchInput.trim()
    const timer = setTimeout(() => {
      if (trimmed.length === 0 || trimmed.length >= 3) {
        setDebouncedSearch(trimmed)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const storageKey = debouncedSearch
    ? `${FILTER_STORAGE_PREFIX}:${numAppId}:${numQueryId}:${debouncedSearch}`
    : null

  useEffect(() => {
    if (!storageKey) {
      setFiltersHydrated(false)
      return
    }

    setFiltersHydrated(false)
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredFilters
        setCategoryFilter(parsed.categoryFilter ?? [])
        setSupplierRegionFilter(parsed.supplierRegionFilter ?? [])
        setProcurementMethodFilter(parsed.procurementMethodFilter ?? [])
        const from = parseStoredDate(parsed.dateRange?.from ?? null)
        const to = parseStoredDate(parsed.dateRange?.to ?? null)
        setDateRange(from || to ? { from, to } : undefined)
      } catch {
        setCategoryFilter([])
        setSupplierRegionFilter([])
        setProcurementMethodFilter([])
        setDateRange(undefined)
      }
    } else {
      setCategoryFilter([])
      setSupplierRegionFilter([])
      setProcurementMethodFilter([])
      setDateRange(undefined)
    }
    setFiltersHydrated(true)
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || !filtersHydrated) return
    const payload: StoredFilters = {
      categoryFilter,
      supplierRegionFilter,
      procurementMethodFilter,
      dateRange:
        dateRange?.from || dateRange?.to
          ? {
              from: dateRange?.from ? toISODate(dateRange.from) : null,
              to: dateRange?.to ? toISODate(dateRange.to) : null,
            }
          : null,
    }
    localStorage.setItem(storageKey, JSON.stringify(payload))
  }, [
    storageKey,
    filtersHydrated,
    categoryFilter,
    supplierRegionFilter,
    procurementMethodFilter,
    dateRange,
  ])

  const periodFrom = dateRange?.from ? toISODate(dateRange.from) : null
  const periodTo = dateRange?.to ? toISODate(dateRange.to) : null

  const { data: categories = [] } = useQuery(
    getSearchCategoriesOptions({
      query: {
        ...(debouncedSearch ? { q: debouncedSearch } : {}),
      },
    })
  )
  const linkedContracts = currentQuery?.contracts ?? []

  const activeQuery = {
    q: debouncedSearch,
    limit: 20,
    ...(categoryFilter.length > 0 ? { category: categoryFilter } : {}),
    ...(supplierRegionFilter.length > 0
      ? { supplier_region: supplierRegionFilter }
      : {}),
    ...(procurementMethodFilter.length > 0
      ? { procurement_method: procurementMethodFilter }
      : {}),
    ...(periodFrom ? { period_from: periodFrom } : {}),
    ...(periodTo ? { period_to: periodTo } : {}),
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
      enabled: !!debouncedSearch,
    })

  const {
    data: trigramData,
    isLoading: isTrigramLoading,
    isFetchingNextPage: isFetchingNextTrigramPage,
    hasNextPage: hasNextTrigramPage,
    fetchNextPage: fetchNextTrigramPage,
  } = useInfiniteQuery({
    ...getSearchItemsTrigramInfiniteOptions({ query: activeQuery }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _all, lastPageParam) => {
      const { total = 0, limit = 20, page = 1 } = lastPage
      if ((page as number) * (limit as number) >= (total as number))
        return undefined
      return (lastPageParam as number) + 1
    },
    enabled:
      !!debouncedSearch &&
      !isLoading &&
      !hasNextPage &&
      (data?.pages[0]?.total ?? -1) === 0,
  })

  const { data: aiData, isLoading: isAiLoading } = useQuery({
    ...getSearchAiItemsOptions({ query: { q: debouncedSearch } }),
    enabled: !!debouncedSearch,
  })

  const patchQueryMutation = useMutation({
    ...patchApplicationsByAppIdQueriesByQueryIdMutation(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: getApplicationsByIdQueryKey({ path: { id: numAppId } }),
      })
    },
  })

  useEffect(() => {
    if (debouncedSearch && debouncedSearch !== queryText) {
      patchQueryMutation.mutate({
        path: { appId: numAppId, queryId: numQueryId },
        body: { queryText: debouncedSearch },
      })
    }
  }, [debouncedSearch])

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

      <InputGroup className="mb-1 h-9 rounded-md">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Название запроса..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </InputGroup>
      <p className="mb-3 min-h-[1rem] text-xs text-muted-foreground">
        {searchInput.trim().length > 0 && searchInput.trim().length < 3
          ? "Введите не менее 3 символов"
          : ""}
      </p>

      <div className="pb-14">
        {debouncedSearch ? (
          <Tabs defaultValue="search">
            <TabsList className="mb-4">
              <TabsTrigger value="search">
                Поиск
                {!isLoading && data?.pages[0]?.total !== undefined && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {data.pages[0].total as number}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="data-[state=active]:text-purple-600 data-[state=inactive]:text-purple-400"
              >
                <Star className="mr-1 size-3.5" />
                AI-подбор
                {!isAiLoading && aiData?.data && aiData.data.length > 0 && (
                  <span className="ml-1.5 text-xs">{aiData.data.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search">
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
                    <p className="text-xs text-muted-foreground">
                      Регион поставщика
                    </p>
                    <MultiSelectCombobox
                      items={supplierRegions as string[]}
                      value={supplierRegionFilter}
                      onValueChange={setSupplierRegionFilter}
                      placeholder="Все регионы"
                      emptyText="Нет регионов"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Способ закупки
                    </p>
                    <MultiSelect
                      items={procurementMethods as string[]}
                      value={procurementMethodFilter}
                      onValueChange={setProcurementMethodFilter}
                      placeholder="Все способы"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Период заключения
                    </p>
                    <DateRangePicker
                      value={dateRange}
                      onChange={setDateRange}
                      placeholder="Любой период"
                    />
                  </div>
                </div>
              </div>
              <SteResultsList
                data={data}
                isLoading={
                  isLoading &&
                  !(
                    searchInput.trim().length > 0 &&
                    searchInput.trim().length < 3
                  )
                }
                tooShort={
                  searchInput.trim().length > 0 && searchInput.trim().length < 3
                }
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={!!hasNextPage}
                fetchNextPage={fetchNextPage}
                trigramData={trigramData}
                isLoadingTrigram={isTrigramLoading}
                isFetchingNextTrigramPage={isFetchingNextTrigramPage}
                hasNextTrigramPage={!!hasNextTrigramPage}
                fetchNextTrigramPage={fetchNextTrigramPage}
                queryData={currentQuery}
                appId={numAppId}
                queryId={numQueryId}
                onLink={handleLink}
                onUnlink={handleUnlink}
                linkingId={linkingId}
                categoryFilter={categoryFilter}
                supplierRegionFilter={supplierRegionFilter}
                procurementMethodFilter={procurementMethodFilter}
                periodFrom={periodFrom}
                periodTo={periodTo}
              />
            </TabsContent>

            <TabsContent value="ai">
              {isAiLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : !aiData?.data || aiData.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <p className="text-sm">Ничего не найдено</p>
                  <p className="mt-1 text-xs">
                    Попробуйте изменить поисковый запрос
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiData.data.map((item) => (
                    <SteCard
                      key={item.ste_id}
                      item={item}
                      linkedContractIds={
                        new Set(
                          currentQuery?.contracts
                            ?.map((c) => c.contractItemId)
                            .filter((id): id is number => id !== undefined)
                        )
                      }
                      linkingId={linkingId}
                      onLink={handleLink}
                      onUnlink={handleUnlink}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            Загрузка...
          </div>
        )}
      </div>

      <LinkedContractsSheet
        contracts={linkedContracts}
        appName={app?.name ?? ""}
        appId={numAppId}
        queryId={numQueryId}
        onRemove={handleUnlink}
        isPending={linkMutation.isPending || unlinkMutation.isPending}
      />

      <Link
        title="Добавить товар в заявку"
        to={`/?appId=${numAppId}`}
        className="fixed right-10 bottom-20 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
      >
        <Plus className="size-6" />
      </Link>

      <ScrollToTopButton scrollContainerRef={scrollRef} />
    </div>
  )
}
