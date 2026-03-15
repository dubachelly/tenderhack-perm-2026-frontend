import { useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import { TableOfContentsIcon, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { ApplicationQueryContractWithContract } from "@/shared/api/autogen/types.gen"
import { loadPositionMeta, updatePositionMeta } from "@/shared/report/ste-price"

interface LinkedContractsSheetProps {
  contracts: ApplicationQueryContractWithContract[]
  appName?: string
  appId: number
  queryId: number
  onRemove?: (contractItemId: number) => void
}

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

export function LinkedContractsSheet({
  contracts,
  appName = "",
  appId,
  queryId,
  onRemove,
}: LinkedContractsSheetProps) {
  const [quantity, setQuantity] = useState(1)
  const [manualNmckInput, setManualNmckInput] = useState("0")
  const hydratedKeyRef = useRef<string | null>(null)

  const storageKey =
    Number.isFinite(appId) && Number.isFinite(queryId)
      ? `${appId}:${queryId}`
      : null

  useEffect(() => {
    if (!storageKey) return
    const meta = loadPositionMeta(appId, queryId)
    const storedQuantity =
      typeof meta?.quantity === "number" && Number.isFinite(meta.quantity)
        ? meta.quantity
        : 1
    const storedManualNmck =
      typeof meta?.manualNmck === "number" && Number.isFinite(meta.manualNmck)
        ? meta.manualNmck
        : 0
    setQuantity(Math.max(1, storedQuantity))
    setManualNmckInput(String(storedManualNmck))
    hydratedKeyRef.current = storageKey
  }, [appId, queryId, storageKey])

  useEffect(() => {
    if (!storageKey || hydratedKeyRef.current !== storageKey) return
    updatePositionMeta(appId, queryId, { quantity })
  }, [appId, queryId, quantity, storageKey])

  const unitPrices = contracts.map((c) => c.unitPrice ?? 0).filter((p) => p > 0)
  const median = calcMedian(unitPrices)
  const hasContracts = contracts.length > 0
  const parsedManual = Number(manualNmckInput)
  const manualNmck =
    Number.isFinite(parsedManual) && parsedManual >= 0 ? parsedManual : 0
  const nmck = hasContracts ? quantity * median : manualNmck

  const handleManualNmckChange = (value: string) => {
    setManualNmckInput(value)
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 0) return
    updatePositionMeta(appId, queryId, { manualNmck: parsed })
  }

  const handleManualNmckBlur = () => {
    const parsed = Number(manualNmckInput)
    const normalized =
      Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
    if (String(normalized) !== manualNmckInput) {
      setManualNmckInput(String(normalized))
    }
    updatePositionMeta(appId, queryId, { manualNmck: normalized })
  }

  const handleClearAll = () => {
    if (!onRemove) return
    const shouldClear = window.confirm(
      "Очистить все выбранные элементы из отчёта?"
    )
    if (!shouldClear) return
    const ids = contracts
      .map((c) => c.contractItemId)
      .filter((id): id is number => typeof id === "number")
    ids.forEach((id) => onRemove(id))
  }

  return (
    <Sheet>
      <SheetTrigger className="fixed right-4 bottom-0 left-14 z-40 flex h-14 cursor-pointer items-center gap-3 border-t bg-background px-6 shadow-lg transition-colors hover:bg-accent">
        <div className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-muted-foreground/30" />
        <TableOfContentsIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Отчёт</span>
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
          {contracts.length}
        </span>
      </SheetTrigger>

      <SheetContent side="bottom" className="flex max-h-[60vh] flex-col">
        <SheetHeader className="border-b pb-3">
          <SheetTitle className="flex items-center gap-2">
            <TableOfContentsIcon className="size-4 text-muted-foreground" />
            Отчёт
            {Number.isFinite(appId) && appName && (
              <Link
                to={`/applications/${appId}`}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                {appName}
              </Link>
            )}
            {hasContracts && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                {contracts.length}
              </span>
            )}
            <div className="mr-4 ml-auto flex flex-wrap items-center gap-2">
              <Label
                htmlFor="quantity"
                className="text-sm font-normal text-muted-foreground"
              >
                Количество:
              </Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value) || 1))
                }
                className="h-8 w-24"
              />
              {!hasContracts && (
                <>
                  <Label
                    htmlFor="manual-nmck"
                    className="text-sm font-normal text-muted-foreground"
                  >
                    Расчётная НМЦК:
                  </Label>
                  <Input
                    id="manual-nmck"
                    type="number"
                    min={0}
                    step="0.01"
                    value={manualNmckInput}
                    onChange={(e) => handleManualNmckChange(e.target.value)}
                    onBlur={handleManualNmckBlur}
                    className="h-8 w-32"
                  />
                </>
              )}
              {hasContracts && onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleClearAll}
                >
                  <Trash2 className="mr-1 size-3.5" />
                  Очистить
                </Button>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-4 py-4">
          {contracts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
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
                  {onRemove && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.contractItemId}>
                    <TableCell>{c.steItemName ?? "—"}</TableCell>
                    <TableCell>{c.procurementMethod ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(c.unitPrice)}
                    </TableCell>
                    <TableCell>{formatDate(c.contractSigningDate)}</TableCell>
                    <TableCell>{c.supplierRegion ?? "—"}</TableCell>
                    {onRemove && (
                      <TableCell className="w-8 pr-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => onRemove(c.contractItemId!)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-center justify-end border-t px-6 py-3">
          <span className="text-2xl font-bold tabular-nums">
            Расчётная НМЦК: {formatCurrency(nmck)}
          </span>
        </div>
      </SheetContent>
    </Sheet>
  )
}
