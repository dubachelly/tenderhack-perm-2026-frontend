import { Fragment, useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowUp, ArrowDown, Loader2 } from "lucide-react"
import type {
  SearchSteGroup,
  SteContractRow,
} from "@/shared/api/autogen/types.gen"
import { getSearchSteBySteIdContractsOptions } from "@/shared/api/autogen/@tanstack/react-query.gen"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { parseCharacteristics } from "@/lib/utils"
import { Badge } from "./ui/badge"

interface SteDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: SearchSteGroup
  linkedContractIds: Set<number>
  onLink: (contractId: number) => void
  onUnlink: (contractId: number) => void
  linkingId: number | null
  categoryFilter?: string[]
  supplierRegionFilter?: string[]
  procurementMethodFilter?: string[]
  periodFrom?: string | null
  periodTo?: string | null
}

const currencyFmt = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "—"
  return currencyFmt.format(value)
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString("ru-RU")
}

function formatPercent(value: number | null | undefined) {
  if (value == null) return "—"
  return `${parseFloat(value.toPrecision(3)).toLocaleString("ru-RU")}%`
}

function ContractTable({
  contracts,
  linkedContractIds,
  onLink,
  onUnlink,
  linkingId,
}: {
  contracts: SteContractRow[]
  linkedContractIds: Set<number>
  onLink: (contractId: number) => void
  onUnlink: (contractId: number) => void
  linkingId: number | null
}) {
  if (contracts.length === 0) {
    return <p className="py-2 text-xs text-muted-foreground">Нет закупок</p>
  }

  const cols = "2rem minmax(0,2fr) auto auto minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) auto auto"

  return (
    <div className="text-xs" style={{ display: "grid", gridTemplateColumns: cols }}>
      {/* header */}
      <div />
      <div className="py-1.5 pr-3 font-normal text-muted-foreground">Наименование</div>
      <div className="py-1.5 pr-3 text-right font-normal text-muted-foreground">НДС</div>
      <div className="py-1.5 pr-3 text-right font-normal text-muted-foreground">Дата</div>
      <div className="py-1.5 pr-3 font-normal text-muted-foreground">Регион заказчика</div>
      <div className="py-1.5 pr-3 font-normal text-muted-foreground">Регион поставщика</div>
      <div className="py-1.5 pr-3 font-normal text-muted-foreground">ИНН поставщика</div>
      <div className="py-1.5 pr-3 text-right font-normal text-muted-foreground">Количество</div>
      <div className="py-1.5 text-right font-normal text-muted-foreground">Цена за ед.</div>

      {/* rows */}
      {contracts.map((c) => {
        const itemId = c.item_id
        const linked = itemId !== undefined && linkedContractIds.has(itemId)
        const pending = itemId !== undefined && linkingId === itemId
        return (
          <Fragment key={c.item_id ?? c.contract_id}>
            <div className="flex items-center border-t border-border/50 py-1.5 pr-2">
              <Button
                size="icon-sm"
                variant={linked ? "secondary" : "default"}
                disabled={pending || !itemId}
                onClick={() =>
                  itemId && (linked ? onUnlink(itemId) : onLink(itemId))
                }
              >
                {pending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : linked ? (
                  <ArrowDown className="size-3" />
                ) : (
                  <ArrowUp className="size-3" />
                )}
              </Button>
            </div>
            <div className="break-words border-t border-border/50 py-1.5 pr-3">{c.procurement_name ?? "—"}</div>
            <div className="border-t border-border/50 py-1.5 pr-3 text-right">{formatPercent(c.vat_rate)}</div>
            <div className="border-t border-border/50 py-1.5 pr-3 text-right">{formatDate(c.contract_signing_date)}</div>
            <div className="border-t border-border/50 py-1.5 pr-3">{c.buyer_region ?? "—"}</div>
            <div className="border-t border-border/50 py-1.5 pr-3">{c.supplier_region ?? "—"}</div>
            <div className="border-t border-border/50 py-1.5 pr-3">{c.supplier_inn ?? "—"}</div>
            <div className="border-t border-border/50 py-1.5 pr-3 text-right">
              {c.quantity != null
                ? `${c.quantity.toLocaleString("ru-RU")} ${c.unit ?? ""}`.trim()
                : "—"}
            </div>
            <div className="border-t border-border/50 py-1.5 text-right">{formatCurrency(c.unit_price)}</div>
          </Fragment>
        )
      })}
    </div>
  )
}

export function SteDetailModal({
  open,
  onOpenChange,
  item,
  linkedContractIds,
  onLink,
  onUnlink,
  categoryFilter,
  supplierRegionFilter,
  procurementMethodFilter,
  periodFrom,
  periodTo,
}: SteDetailModalProps) {
  const characteristics = parseCharacteristics(item.ste_characteristics)

  const [pendingLinkedIds, setPendingLinkedIds] = useState<Set<number>>(
    () => new Set(linkedContractIds)
  )

  useEffect(() => {
    if (open) {
      setPendingLinkedIds(new Set(linkedContractIds))
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLocalLink = (contractId: number) => {
    setPendingLinkedIds((prev) => new Set([...prev, contractId]))
  }

  const handleLocalUnlink = (contractId: number) => {
    setPendingLinkedIds((prev) => {
      const next = new Set(prev)
      next.delete(contractId)
      return next
    })
  }

  const handleSave = () => {
    for (const id of pendingLinkedIds) {
      if (!linkedContractIds.has(id)) onLink(id)
    }
    for (const id of linkedContractIds) {
      if (!pendingLinkedIds.has(id)) onUnlink(id)
    }
    onOpenChange(false)
  }

  const { data, isLoading } = useQuery({
    ...getSearchSteBySteIdContractsOptions({
      path: { steId: item.ste_id! },
      query: {
        ...(categoryFilter && categoryFilter.length > 0
          ? { category: categoryFilter }
          : {}),
        ...(supplierRegionFilter && supplierRegionFilter.length > 0
          ? { supplier_region: supplierRegionFilter }
          : {}),
        ...(procurementMethodFilter && procurementMethodFilter.length > 0
          ? { procurement_method: procurementMethodFilter }
          : {}),
        ...(periodFrom ? { period_from: periodFrom } : {}),
        ...(periodTo ? { period_to: periodTo } : {}),
      },
    }),
    enabled: open && !!item.ste_id,
  })

  const contracts = data?.data ?? []
  const suggestedItems = data?.suggestedItems ?? []
  const selectedContracts = contracts.filter(
    (c) => c.item_id !== undefined && pendingLinkedIds.has(c.item_id)
  )
  const suggestedIds = new Set(suggestedItems.map((c) => c.item_id))
  const hasLinkedSuggested = suggestedItems.some(
    (c) => c.item_id !== undefined && pendingLinkedIds.has(c.item_id)
  )
  const showRecommended = suggestedItems.length > 0 && !hasLinkedSuggested
  const otherContracts = contracts.filter((c) => {
    if (c.item_id !== undefined && pendingLinkedIds.has(c.item_id)) return false
    if (showRecommended && suggestedIds.has(c.item_id)) return false
    return true
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[92vw]">
        <DialogHeader className="border-b p-6 pb-4">
          <DialogTitle
            className="pr-6 text-base leading-snug font-semibold break-words"
            title={item.ste_name ?? "—"}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.ste_name ?? "—"}
          </DialogTitle>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {item.ste_category && <Badge>{item.ste_category}</Badge>}
            {item.ste_manufacturer && (
              <Badge>
                {item.ste_manufacturer
                  .replace(/общество с ограниченной ответственностью/gi, "ООО")
                  .replace(/закрытое акционерное общество/gi, "ЗАО")
                  .replace(/открытое акционерное общество/gi, "ОАО")
                  .replace(/публичное акционерное общество/gi, "ПАО")
                  .replace(/акционерное общество/gi, "АО")
                  .replace(/федеральное государственное унитарное предприятие/gi, "ФГУП")
                  .replace(/федеральное каз[её]нное предприятие/gi, "ФКП")}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea
          className="flex-1 overflow-auto"
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="space-y-6 p-6">
            {characteristics.length > 0 ? (
              <section>
                <h3 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Характеристики
                </h3>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                  {characteristics.map(({ key, value }) => (
                    <Fragment key={key}>
                      <dt
                        className="whitespace-nowrap text-muted-foreground"
                      >
                        {key}
                      </dt>
                      <dd className="font-medium">
                        {value}
                      </dd>
                    </Fragment>
                  ))}
                </dl>
              </section>
            ) : (
              <span className="text-muted-foreground">Нет характеристик</span>
            )}

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                <section>
                  <h3 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Выбранные закупки
                  </h3>
                  <ContractTable
                    contracts={selectedContracts}
                    linkedContractIds={pendingLinkedIds}
                    onLink={handleLocalLink}
                    onUnlink={handleLocalUnlink}
                    linkingId={null}
                  />
                </section>

                {showRecommended && (
                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Рекомендуемые закупки
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        onClick={() =>
                          setPendingLinkedIds((prev) => {
                            const next = new Set(prev)
                            suggestedItems.forEach((c) => {
                              if (c.item_id !== undefined) next.add(c.item_id)
                            })
                            return next
                          })
                        }
                      >
                        Добавить все
                      </Button>
                    </div>
                    <ContractTable
                      contracts={suggestedItems}
                      linkedContractIds={pendingLinkedIds}
                      onLink={handleLocalLink}
                      onUnlink={handleLocalUnlink}
                      linkingId={null}
                    />
                  </section>
                )}

                <section>
                  <h3 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Остальные закупки
                  </h3>
                  <ContractTable
                    contracts={otherContracts}
                    linkedContractIds={pendingLinkedIds}
                    onLink={handleLocalLink}
                    onUnlink={handleLocalUnlink}
                    linkingId={null}
                  />
                </section>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
