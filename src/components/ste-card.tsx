import { useState } from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import type { SearchSteGroup } from "@/shared/api/autogen/types.gen"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { parseCharacteristics } from "@/lib/utils"

interface SteCardProps {
  item: SearchSteGroup
  isLinked: boolean
  onLink: (steId: number, rank: number) => void
  isPending: boolean
}

export function SteCard({ item, isLinked, onLink, isPending }: SteCardProps) {
  const [expanded, setExpanded] = useState(false)
  const characteristics = parseCharacteristics(item.ste_characteristics)
  const contracts = item.contracts ?? []

  const handleLink = () => {
    if (!item.ste_id) return
    const matchPercent = Math.round((item.rank ?? 0) * 100)
    onLink(item.ste_id, matchPercent)
  }

  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>{item.ste_name ?? "—"}</CardTitle>
        <div className="flex flex-wrap gap-2">
          {item.ste_category && (
            <Badge variant="secondary">{item.ste_category}</Badge>
          )}
          {item.ste_manufacturer && (
            <Badge variant="outline">{item.ste_manufacturer}</Badge>
          )}
        </div>
        <CardAction>
          <Button
            size="sm"
            variant={isLinked ? "outline" : "default"}
            disabled={isLinked || isPending || !item.ste_id}
            onClick={handleLink}
          >
            {isLinked ? (
              <>
                <Check className="size-3.5" />
                Привязана
              </>
            ) : (
              "Привязать"
            )}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-0">
        <button
          className="flex w-full items-center justify-between py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          <span>
            {contracts.length > 0
              ? `${contracts.length} контракт${contracts.length === 1 ? "" : contracts.length < 5 ? "а" : "ов"}`
              : "Нет контрактов"}
            {characteristics.length > 0 &&
              ` · ${characteristics.length} характеристик`}
          </span>
          {expanded ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>

        {item.median_price && (
          <p className="truncate text-2xl">
            {Intl.NumberFormat("ru-RU", {
              style: "currency",
              currency: "RUB",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(item.median_price)}
          </p>
        )}

        {expanded && (
          <div className="space-y-3 pt-1 pb-2">
            {characteristics.length > 0 && (
              <div className="space-y-0.5">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Характеристики
                </p>
                {characteristics.map(({ key, value }) => (
                  <div key={key} className="flex gap-2 text-xs">
                    <span className="shrink-0 text-muted-foreground">
                      {key}:
                    </span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {contracts.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Контракты
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="pr-3 pb-1 text-left font-normal">
                          Наименование позиции
                        </th>
                        <th className="pr-3 pb-1 text-right font-normal">
                          Количество
                        </th>
                        <th className="pb-1 text-right font-normal">
                          Цена за ед., ₽
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((c) => (
                        <tr
                          key={c.id}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="py-1 pr-3">
                            {c.ste_item_name ?? "—"}
                          </td>
                          <td className="py-1 pr-3 text-right whitespace-nowrap">
                            {c.quantity
                              ? `${c.quantity} ${c.unit ?? ""}`.trim()
                              : "—"}
                          </td>
                          <td className="py-1 text-right whitespace-nowrap">
                            {c.unit_price ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
