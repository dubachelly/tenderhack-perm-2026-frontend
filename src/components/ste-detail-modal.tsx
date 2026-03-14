import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowUp, ArrowDown, Loader2, SlidersHorizontal } from "lucide-react"
import type {
  SearchSteGroup,
  SteContractRow,
} from "@/shared/api/autogen/types.gen"
import { getSearchSteBySteIdContractsOptions } from "@/shared/api/autogen/@tanstack/react-query.gen"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { parseCharacteristics } from "@/lib/utils"
import { MultiSelect } from "@/components/multi-select"
import { DateRangePicker, toISODate } from "@/components/date-range-picker"
import type { DateRange } from "@/components/date-range-picker"
import { Badge } from "./ui/badge"

interface SteDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: SearchSteGroup
  linkedContractIds: Set<number>
  onLink: (contractId: number) => void
  onUnlink: (contractId: number) => void
  linkingId: number | null
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

  return (
    <Table>
      <TableHeader>
        <TableRow className="text-muted-foreground">
          <TableHead className="sticky left-0 z-10 w-8 bg-background" />
          <TableHead className="min-w-48 font-normal">Наименование</TableHead>
          <TableHead className="text-right font-normal">НДС</TableHead>
          <TableHead className="text-right font-normal">Дата</TableHead>
          <TableHead className="font-normal">Регион заказчика</TableHead>
          <TableHead className="font-normal">Регион поставщика</TableHead>
          <TableHead className="text-right font-normal">Количество</TableHead>
          <TableHead className="text-right font-normal">Цена за ед.</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contracts.map((c) => {
          const itemId = c.item_id
          const linked = itemId !== undefined && linkedContractIds.has(itemId)
          const pending = itemId !== undefined && linkingId === itemId
          return (
            <TableRow
              key={c.item_id ?? c.contract_id}
              className="border-border/50"
            >
              <TableCell className="sticky left-0 z-10 bg-background py-1.5 pr-2">
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
              </TableCell>
              <TableCell className="py-1.5">
                {c.procurement_name ?? "—"}
              </TableCell>
              <TableCell className="py-1.5 text-right">
                {formatPercent(c.vat_rate)}
              </TableCell>
              <TableCell className="py-1.5 text-right">
                {formatDate(c.contract_signing_date)}
              </TableCell>
              <TableCell className="py-1.5">{c.buyer_region ?? "—"}</TableCell>
              <TableCell className="py-1.5">
                {c.supplier_region ?? "—"}
              </TableCell>
              <TableCell className="py-1.5 text-right">
                {c.quantity != null
                  ? `${c.quantity.toLocaleString("ru-RU")} ${c.unit ?? ""}`.trim()
                  : "—"}
              </TableCell>
              <TableCell className="py-1.5 text-right">
                {formatCurrency(c.unit_price)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export function SteDetailModal({
  open,
  onOpenChange,
  item,
  linkedContractIds,
  onLink,
  onUnlink,
  linkingId,
}: SteDetailModalProps) {
  const characteristics = parseCharacteristics(item.ste_characteristics)

  const [supplierFilter, setSupplierFilter] = useState<string[]>([])
  const [methodFilter, setMethodFilter] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const { data, isLoading } = useQuery({
    ...getSearchSteBySteIdContractsOptions({ path: { steId: item.ste_id! } }),
    enabled: open && !!item.ste_id,
  })

  const contracts = data?.data ?? []
  const selectedContracts = contracts.filter(
    (c) => c.item_id !== undefined && linkedContractIds.has(c.item_id)
  )
  const otherContracts = contracts.filter(
    (c) => c.item_id === undefined || !linkedContractIds.has(c.item_id)
  )

  const supplierOptions = useMemo(
    () => [
      ...new Set(
        otherContracts
          .map((c) => c.supplier_region)
          .filter((v): v is string => !!v)
      ),
    ],
    [otherContracts]
  )
  const methodOptions = useMemo(
    () => [
      ...new Set(
        otherContracts
          .map((c) => c.procurement_method)
          .filter((v): v is string => !!v)
      ),
    ],
    [otherContracts]
  )

  const periodFrom = dateRange?.from ? toISODate(dateRange.from) : null
  const periodTo = dateRange?.to ? toISODate(dateRange.to) : null

  const filteredOtherContracts = useMemo(() => {
    return otherContracts.filter((c) => {
      if (
        supplierFilter.length > 0 &&
        !supplierFilter.includes(c.supplier_region ?? "")
      )
        return false
      if (
        methodFilter.length > 0 &&
        !methodFilter.includes(c.procurement_method ?? "")
      )
        return false
      if (periodFrom || periodTo) {
        const signDate = c.contract_signing_date?.slice(0, 10) ?? null
        if (!signDate) return false
        if (periodFrom && signDate < periodFrom) return false
        if (periodTo && signDate > periodTo) return false
      }
      return true
    })
  }, [otherContracts, supplierFilter, methodFilter, periodFrom, periodTo])

  const hasActiveFilters =
    supplierFilter.length > 0 || methodFilter.length > 0 || !!dateRange?.from

  const resetFilters = () => {
    setSupplierFilter([])
    setMethodFilter([])
    setDateRange(undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[92vw]">
        <DialogHeader className="border-b p-6 pb-4">
          <DialogTitle className="pr-6 text-base leading-snug font-semibold">
            {item.ste_name ?? "—"}
          </DialogTitle>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {item.ste_category && <Badge>{item.ste_category}</Badge>}
            {item.ste_manufacturer && (
              <Badge>
                {item.ste_manufacturer.replace(
                  /общество с ограниченной ответственностью/gi,
                  "ООО"
                )}
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
                    <>
                      <dt
                        key={`dt-${key}`}
                        className="whitespace-nowrap text-muted-foreground"
                      >
                        {key}
                      </dt>
                      <dd key={`dd-${key}`} className="font-medium">
                        {value}
                      </dd>
                    </>
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
                    linkedContractIds={linkedContractIds}
                    onLink={onLink}
                    onUnlink={onUnlink}
                    linkingId={linkingId}
                  />
                </section>

                <section>
                  <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Остальные закупки
                    </h3>
                    {otherContracts.length > 0 && (
                      <div className="ml-auto flex flex-wrap items-center gap-2">
                        <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                        {supplierOptions.length > 1 && (
                          <div className="w-44">
                            <MultiSelect
                              items={supplierOptions}
                              value={supplierFilter}
                              onValueChange={setSupplierFilter}
                              placeholder="Регион поставщика"
                            />
                          </div>
                        )}
                        {methodOptions.length > 1 && (
                          <div className="w-44">
                            <MultiSelect
                              items={methodOptions}
                              value={methodFilter}
                              onValueChange={setMethodFilter}
                              placeholder="Способ закупки"
                            />
                          </div>
                        )}
                        {otherContracts.length > 1 && (
                          <div className="w-48">
                            <DateRangePicker
                              value={dateRange}
                              onChange={setDateRange}
                              placeholder="Период заключения"
                            />
                          </div>
                        )}
                        {hasActiveFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={resetFilters}
                          >
                            Сбросить
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {hasActiveFilters &&
                    filteredOtherContracts.length !== otherContracts.length && (
                      <p className="mb-2 text-xs text-muted-foreground">
                        Показано {filteredOtherContracts.length} из{" "}
                        {otherContracts.length}
                      </p>
                    )}
                  <ContractTable
                    contracts={filteredOtherContracts}
                    linkedContractIds={linkedContractIds}
                    onLink={onLink}
                    onUnlink={onUnlink}
                    linkingId={linkingId}
                  />
                </section>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
