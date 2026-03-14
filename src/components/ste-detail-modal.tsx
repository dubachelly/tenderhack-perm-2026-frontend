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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { parseCharacteristics } from "@/lib/utils"

interface SteDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: SearchSteGroup
  linkedContractIds: Set<number>
  onLink: (contractId: number) => void
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
  linkingId,
}: {
  contracts: SteContractRow[]
  linkedContractIds: Set<number>
  onLink: (contractId: number) => void
  linkingId: number | null
}) {
  if (contracts.length === 0) {
    return <p className="py-2 text-xs text-muted-foreground">Нет контрактов</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="sticky left-0 z-10 w-8 bg-background pr-2 pb-1" />
            <th className="min-w-48 pr-3 pb-1 text-left font-normal">
              Наименование закупки
            </th>
            <th className="pr-3 pb-1 text-right font-normal whitespace-nowrap">
              Начальная стоимость
            </th>
            <th className="pr-3 pb-1 text-right font-normal whitespace-nowrap">
              Конечная стоимость
            </th>
            <th className="pr-3 pb-1 text-right font-normal whitespace-nowrap">
              Снижение стоимости
            </th>
            <th className="pr-3 pb-1 text-right font-normal whitespace-nowrap">
              НДС
            </th>
            <th className="pr-3 pb-1 text-right font-normal whitespace-nowrap">
              Дата заключения
            </th>
            <th className="pr-3 pb-1 text-left font-normal whitespace-nowrap">
              Регион заказчика
            </th>
            <th className="pr-3 pb-1 text-right font-normal whitespace-nowrap">
              Количество
            </th>
            <th className="pb-1 text-right font-normal whitespace-nowrap">
              Цена за ед., ₽
            </th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c) => {
            const contractId = c.contract_id
            const linked =
              contractId !== undefined && linkedContractIds.has(contractId)
            const pending = contractId !== undefined && linkingId === contractId
            return (
              <tr
                key={c.item_id ?? c.contract_id}
                className="border-b border-border/50 last:border-0"
              >
                <td className="sticky left-0 z-10 bg-background py-1.5 pr-2">
                  <Button
                    size="icon-sm"
                    variant={linked ? "secondary" : "default"}
                    disabled={pending || !contractId}
                    onClick={() => contractId && onLink(contractId)}
                  >
                    {pending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : linked ? (
                      <ArrowDown className="size-3" />
                    ) : (
                      <ArrowUp className="size-3" />
                    )}
                  </Button>
                </td>
                <td className="max-w-56 truncate py-1.5 pr-3">
                  {c.procurement_name ?? "—"}
                </td>
                <td className="py-1.5 pr-3 text-right whitespace-nowrap">
                  {formatCurrency(c.initial_contract_value)}
                </td>
                <td className="py-1.5 pr-3 text-right whitespace-nowrap">
                  {formatCurrency(c.contract_value_after_signing)}
                </td>
                <td className="py-1.5 pr-3 text-right whitespace-nowrap">
                  {formatPercent(c.reduction_percent)}
                </td>
                <td className="py-1.5 pr-3 text-right whitespace-nowrap">
                  {formatPercent(c.vat_rate)}
                </td>
                <td className="py-1.5 pr-3 text-right whitespace-nowrap">
                  {formatDate(c.contract_signing_date)}
                </td>
                <td className="py-1.5 pr-3 whitespace-nowrap">
                  {c.buyer_region ?? "—"}
                </td>
                <td className="py-1.5 pr-3 text-right whitespace-nowrap">
                  {c.quantity != null
                    ? `${c.quantity.toLocaleString("ru-RU")} ${c.unit ?? ""}`.trim()
                    : "—"}
                </td>
                <td className="py-1.5 text-right whitespace-nowrap">
                  {formatCurrency(c.unit_price)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function SteDetailModal({
  open,
  onOpenChange,
  item,
  linkedContractIds,
  onLink,
  linkingId,
}: SteDetailModalProps) {
  const characteristics = parseCharacteristics(item.ste_characteristics)

  const { data, isLoading } = useQuery({
    ...getSearchSteBySteIdContractsOptions({ path: { steId: item.ste_id! } }),
    enabled: open && !!item.ste_id,
  })

  const contracts = data?.data ?? []
  const selectedContracts = contracts.filter(
    (c) => c.contract_id !== undefined && linkedContractIds.has(c.contract_id)
  )
  const otherContracts = contracts.filter(
    (c) => c.contract_id === undefined || !linkedContractIds.has(c.contract_id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[92vw]">
        <DialogHeader className="border-b p-6 pb-4">
          <DialogTitle className="pr-6 text-base leading-snug font-semibold">
            {item.ste_name ?? "—"}
          </DialogTitle>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {item.ste_category && <span>{item.ste_category}</span>}
            {item.ste_manufacturer && <span>{item.ste_manufacturer}</span>}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="space-y-6 p-6">
            {characteristics.length > 0 && (
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
                    Выбранные контракты
                  </h3>
                  <ContractTable
                    contracts={selectedContracts}
                    linkedContractIds={linkedContractIds}
                    onLink={onLink}
                    linkingId={linkingId}
                  />
                </section>

                <section>
                  <h3 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Остальные контракты
                  </h3>
                  <ContractTable
                    contracts={otherContracts}
                    linkedContractIds={linkedContractIds}
                    onLink={onLink}
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
