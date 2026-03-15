import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Download,
  Pencil,
  Plus,
  TableOfContentsIcon,
  Trash2,
  TriangleAlert,
} from "lucide-react"

import {
  getApplicationsByIdOptions,
  getApplicationsByIdQueryKey,
  deleteApplicationsByAppIdQueriesByQueryIdMutation,
  deleteApplicationsByAppIdQueriesByQueryIdContractsByContractItemIdMutation,
} from "@/shared/api/autogen/@tanstack/react-query.gen"
import type { ApplicationQueryContractWithContract } from "@/shared/api/autogen/types.gen"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  buildStePricePayload,
  downloadStePriceReport,
  loadPositionMeta,
  updatePositionMeta,
  type PositionMeta,
} from "@/shared/report/ste-price"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function formatCurrency(value?: number | null) {
  if (value == null) return "—"
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)
}

function calcMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("ru-RU")
}

type PositionGroup = {
  id: number
  name: string
  contracts: ApplicationQueryContractWithContract[]
}

export function ApplicationPage() {
  const { appId } = useParams<{ appId: string }>()
  const numAppId = Number(appId)
  const [isDownloading, setIsDownloading] = useState(false)
  const [positionMeta, setPositionMeta] = useState<
    Record<number, PositionMeta>
  >({})
  const [editingQuantityId, setEditingQuantityId] = useState<number | null>(
    null
  )
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>(
    {}
  )
  const [editingManualNmckId, setEditingManualNmckId] = useState<number | null>(
    null
  )
  const [manualNmckDrafts, setManualNmckDrafts] = useState<
    Record<number, string>
  >({})

  const queryClient = useQueryClient()

  const { data: app, isLoading } = useQuery(
    getApplicationsByIdOptions({ path: { id: numAppId } })
  )

  const deletePosition = useMutation({
    ...deleteApplicationsByAppIdQueriesByQueryIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getApplicationsByIdQueryKey({ path: { id: numAppId } }),
      })
    },
  })

  const deleteContract = useMutation({
    ...deleteApplicationsByAppIdQueriesByQueryIdContractsByContractItemIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getApplicationsByIdQueryKey({ path: { id: numAppId } }),
      })
    },
  })

  const positions = useMemo<PositionGroup[]>(() => {
    if (!app?.queries) return []
    return app.queries.map((q) => ({
      id: q.id ?? 0,
      name: q.queryText ?? "Позиция",
      contracts: q.contracts ?? [],
    }))
  }, [app?.queries])

  useEffect(() => {
    if (!app?.queries || !Number.isFinite(numAppId)) return
    const next: Record<number, PositionMeta> = {}
    app.queries.forEach((q) => {
      const id = q.id ?? 0
      if (!id) return
      const meta = loadPositionMeta(numAppId, id)
      if (meta) next[id] = meta
    })
    setPositionMeta(next)
  }, [app?.queries, numAppId])

  const getQuantity = (positionId: number) => {
    const qty = positionMeta[positionId]?.quantity
    return typeof qty === "number" && Number.isFinite(qty) && qty > 0 ? qty : 1
  }

  const getManualNmck = (positionId: number) => {
    const value = positionMeta[positionId]?.manualNmck
    return typeof value === "number" && Number.isFinite(value) ? value : 0
  }

  const getPositionPrice = (position: PositionGroup) => {
    const quantity = getQuantity(position.id)
    const unitPrices = position.contracts
      .map((c) => c.unitPrice ?? 0)
      .filter((price) => price > 0)
    const median = calcMedian(unitPrices)
    if (position.contracts.length > 0) {
      return median * quantity
    }
    return getManualNmck(position.id)
  }

  const startEditQuantity = (positionId: number) => {
    setQuantityDrafts((prev) => ({
      ...prev,
      [positionId]: String(getQuantity(positionId)),
    }))
    setEditingQuantityId(positionId)
  }

  const handleQuantityInputChange = (positionId: number, value: string) => {
    setQuantityDrafts((prev) => ({ ...prev, [positionId]: value }))
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return
    if (!Number.isFinite(numAppId) || positionId <= 0) return
    const normalized = Math.floor(parsed)
    const next = updatePositionMeta(numAppId, positionId, {
      quantity: normalized,
    })
    setPositionMeta((prev) => ({ ...prev, [positionId]: next }))
  }

  const commitQuantity = (positionId: number) => {
    if (!Number.isFinite(numAppId) || positionId <= 0) {
      setEditingQuantityId(null)
      return
    }
    const raw = quantityDrafts[positionId]
    const parsed = Number(raw)
    const fallback = getQuantity(positionId)
    const normalized =
      Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
    const next = updatePositionMeta(numAppId, positionId, {
      quantity: normalized,
    })
    setPositionMeta((prev) => ({ ...prev, [positionId]: next }))
    setQuantityDrafts((prev) => ({ ...prev, [positionId]: String(normalized) }))
    setEditingQuantityId(null)
  }

  const startEditManualNmck = (positionId: number) => {
    setManualNmckDrafts((prev) => ({
      ...prev,
      [positionId]: String(getManualNmck(positionId)),
    }))
    setEditingManualNmckId(positionId)
  }

  const handleManualNmckInputChange = (positionId: number, value: string) => {
    setManualNmckDrafts((prev) => ({ ...prev, [positionId]: value }))
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 0) return
    if (!Number.isFinite(numAppId) || positionId <= 0) return
    const next = updatePositionMeta(numAppId, positionId, {
      manualNmck: parsed,
    })
    setPositionMeta((prev) => ({ ...prev, [positionId]: next }))
  }

  const commitManualNmck = (positionId: number) => {
    if (!Number.isFinite(numAppId) || positionId <= 0) {
      setEditingManualNmckId(null)
      return
    }
    const raw = manualNmckDrafts[positionId]
    const parsed = Number(raw)
    const normalized = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
    const next = updatePositionMeta(numAppId, positionId, {
      manualNmck: normalized,
    })
    setPositionMeta((prev) => ({ ...prev, [positionId]: next }))
    setManualNmckDrafts((prev) => ({
      ...prev,
      [positionId]: String(normalized),
    }))
    setEditingManualNmckId(null)
  }

  const totalContracts = useMemo(() => {
    return positions.reduce((sum, p) => sum + p.contracts.length, 0)
  }, [positions])

  const positionsWithItems = useMemo(
    () => positions.filter((p) => p.contracts.length > 0),
    [positions]
  )

  const hasReportablePositions = useMemo(() => {
    return positions.some((p) => {
      if (p.contracts.length > 0) return true
      return getManualNmck(p.id) > 0
    })
  }, [positions, positionMeta])

  const missingPositions = positions.length - positionsWithItems.length

  const hasBlockingPositions = useMemo(() => {
    return positions.some((p) => {
      if (p.contracts.length <= 1) return false
      const inns = p.contracts.map((c) => c.supplierInn)
      return new Set(inns).size === 1
    })
  }, [positions])

  const handleDownload = async () => {
    if (!app) return
    setIsDownloading(true)
    try {
      const payload = buildStePricePayload({
        contractName: app.name ?? "Заявка",
        docType: "docx",
        positions: positions.map((p) => ({
          name: p.name,
          contracts: p.contracts,
          positionPrice: getPositionPrice(p),
          positionCount: getQuantity(p.id),
        })),
      })

      if (payload.positions.length > 0) {
        await downloadStePriceReport(
          payload,
          `price-justification-${app.id ?? "app"}.docx`
        )
      }
    } finally {
      setIsDownloading(false)
    }
  }

  if (isNaN(numAppId)) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-6">
        <p className="text-sm text-muted-foreground">Некорректный id заявки</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-6">
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/history" />}>
                История заявок
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{app?.name ?? "Заявка"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <TableOfContentsIcon className="size-4 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{app?.name ?? "Заявка"}</h1>
          {totalContracts > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {totalContracts}
            </span>
          )}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={
              isDownloading || !hasReportablePositions || hasBlockingPositions
            }
          >
            <Download className="mr-2 size-4" />
            Скачать отчёт
          </Button>
        </div>
      </div>

      {missingPositions > 0 && (
        <p className="mb-4 text-xs text-muted-foreground">
          Позиции без привязанных контрактов попадут в отчёт, если задана ручная
          НМЦК.
        </p>
      )}

      {positions.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Нет запросов в заявке
        </div>
      ) : (
        <div className="space-y-4">
          {positions.map((position) => {
            const quantity = getQuantity(position.id)
            const unitPrices = position.contracts
              .map((c) => c.unitPrice ?? 0)
              .filter((price) => price > 0)
            const median = calcMedian(unitPrices)
            const computedNmck = median * quantity
            const manualNmck = getManualNmck(position.id)
            const canEditPrice = position.contracts.length <= 1
            const allSameSupplierInn =
              position.contracts.length > 1 &&
              new Set(position.contracts.map((c) => c.supplierInn)).size === 1

            return (
              <div key={position.id} className="rounded-lg border bg-card">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <Link
                    to={`/applications/${numAppId}/queries/${position.id}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {position.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {position.contracts.length} контрактов
                    </span>
                    <button
                      onClick={() =>
                        deletePosition.mutate({
                          path: { appId: numAppId, queryId: position.id },
                        })
                      }
                      disabled={deletePosition.isPending}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                      title="Удалить товар"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                {allSameSupplierInn && (
                  <Alert variant="destructive">
                    <TriangleAlert />
                    <AlertTitle>Единственный поставщик</AlertTitle>
                    <AlertDescription>
                      Все контракты по этой позиции были заключены с
                      единственным поставщиком. Для обоснования цены необходимо
                      минимум 2 различных поставщика.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Количество
                      </span>
                      {editingQuantityId === position.id ? (
                        <Input
                          id={`quantity-${position.id}`}
                          type="number"
                          min={1}
                          value={quantityDrafts[position.id] ?? ""}
                          onChange={(e) =>
                            handleQuantityInputChange(
                              position.id,
                              e.target.value
                            )
                          }
                          onBlur={() => commitQuantity(position.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              commitQuantity(position.id)
                            }
                            if (e.key === "Escape") {
                              e.preventDefault()
                              setEditingQuantityId(null)
                            }
                          }}
                          className="h-7 w-24"
                          autoFocus
                        />
                      ) : (
                        <>
                          <span className="font-medium tabular-nums">
                            {quantity}
                          </span>
                          {canEditPrice && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-foreground"
                              onClick={() => startEditQuantity(position.id)}
                              title="Редактировать количество"
                              aria-label="Редактировать количество"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    {position.contracts.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Расчётная НМЦК
                        </span>
                        <span className="font-semibold tabular-nums">
                          {formatCurrency(computedNmck)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Расчётная НМЦК
                        </span>
                        {editingManualNmckId === position.id ? (
                          <Input
                            id={`manual-nmck-${position.id}`}
                            type="number"
                            min={0}
                            step="0.01"
                            value={manualNmckDrafts[position.id] ?? ""}
                            onChange={(e) =>
                              handleManualNmckInputChange(
                                position.id,
                                e.target.value
                              )
                            }
                            onBlur={() => commitManualNmck(position.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                commitManualNmck(position.id)
                              }
                              if (e.key === "Escape") {
                                e.preventDefault()
                                setEditingManualNmckId(null)
                              }
                            }}
                            className="h-7 w-40"
                            autoFocus
                          />
                        ) : (
                          <>
                            <span className="font-semibold tabular-nums">
                              {formatCurrency(manualNmck)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-foreground"
                              onClick={() => startEditManualNmck(position.id)}
                              title="Редактировать цену"
                              aria-label="Редактировать цену"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {position.contracts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Нет привязанных контрактов
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs text-muted-foreground">
                          <TableHead>Наименование СТЕ</TableHead>
                          <TableHead>Способ закупки</TableHead>
                          <TableHead>Цена за единицу</TableHead>
                          <TableHead>Дата подписания</TableHead>
                          <TableHead>Регион поставщика</TableHead>
                          <TableHead>ИНН поставщика</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {position.contracts.map((c) => (
                          <TableRow key={c.contractItemId} className="group">
                            <TableCell>{c.steItemName ?? "—"}</TableCell>
                            <TableCell>{c.procurementMethod ?? "—"}</TableCell>
                            <TableCell className="tabular-nums">
                              {formatCurrency(c.unitPrice)}
                            </TableCell>
                            <TableCell>
                              {formatDate(c.contractSigningDate)}
                            </TableCell>
                            <TableCell>{c.supplierRegion ?? "—"}</TableCell>
                            <TableCell>{c.supplierInn ?? "—"}</TableCell>
                            <TableCell className="w-8">
                              <button
                                onClick={() =>
                                  deleteContract.mutate({
                                    path: {
                                      appId: numAppId,
                                      queryId: position.id,
                                      contractItemId: c.contractItemId!,
                                    },
                                  })
                                }
                                disabled={deleteContract.isPending}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded"
                                title="Удалить контракт"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Link
        title="Добавить позицию в заявку"
        to={`/?appId=${numAppId}`}
        className="fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  )
}
