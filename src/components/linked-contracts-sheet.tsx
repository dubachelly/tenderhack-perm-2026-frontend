import { useState } from "react"
import {
  ShoppingBasket,
  Download,
  TableOfContentsIcon,
  DownloadIcon,
  Trash2,
} from "lucide-react"
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

interface LinkedContractsSheetProps {
  contracts: ApplicationQueryContractWithContract[]
  appName?: string
  queryText?: string
  onRemove?: (contractItemId: number) => void
}

function formatCurrency(value?: number | null) {
  if (value == null) return "—"
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("ru-RU")
}

async function downloadReport(
  contracts: ApplicationQueryContractWithContract[],
  appName: string,
  queryText: string
) {
  const summaryPrice = contracts.reduce((sum, c) => sum + (c.unitPrice ?? 0), 0)

  const body = {
    contractName: appName,
    summaryPrice,
    position: {
      positionName: queryText,
      positionPrice: summaryPrice,
      items: contracts.map((c) => ({
        contractId: String(c.contractId ?? ""),
        procurementMethod: c.procurementMethod ?? "",
        initialContractValue: String(c.initialContractValue ?? "0"),
        contractValueAfterSigning: String(c.contractValueAfterSigning ?? "0"),
        reductionPercent: String(c.reductionPercent ?? "0"),
        contractSigningDate: c.contractSigningDate ?? "",
        buyerInn: c.buyerInn ?? "",
        supplierInn: c.supplierInn ?? "",
        steId: c.steId ?? 0,
        steItemName: c.steItemName ?? "",
        unitPrice: String(c.unitPrice ?? "0"),
      })),
    },
  }

  const response = await fetch(
    "http://localhost:8000/api/v1/ste-price-justification/doc",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    throw new Error(`Ошибка при скачивании: ${response.status}`)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "price-justification.docx"
  a.click()
  URL.revokeObjectURL(url)
}

export function LinkedContractsSheet({
  contracts,
  appName = "",
  queryText = "",
  onRemove,
}: LinkedContractsSheetProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await downloadReport(contracts, appName, queryText)
    } finally {
      setIsDownloading(false)
    }
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

      <SheetContent side="bottom" className="max-h-[60vh]">
        <SheetHeader className="border-b pb-3">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBasket className="size-4 text-muted-foreground" />
            Привязанные контракты
            {contracts.length > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                {contracts.length}
              </span>
            )}
            {contracts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mr-8 ml-auto"
                disabled={isDownloading}
                onClick={handleDownload}
              >
                <Download className="size-3.5" />
                {isDownloading ? "Скачивание..." : "Скачать отчет"}
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-auto px-4 py-4">
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
      </SheetContent>
    </Sheet>
  )
}
