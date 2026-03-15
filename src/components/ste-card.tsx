import { useState } from "react"
import type { SearchSteGroup } from "@/shared/api/autogen/types.gen"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SteDetailModal } from "./ste-detail-modal"

interface SteCardProps {
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

export function SteCard({
  item,
  linkedContractIds,
  onLink,
  onUnlink,
  linkingId,
  categoryFilter,
  supplierRegionFilter,
  procurementMethodFilter,
  periodFrom,
  periodTo,
}: SteCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const contractIds = item.contract_item_ids ?? []
  const selectedCount = contractIds.filter((id) =>
    linkedContractIds.has(id)
  ).length
  const totalCount = contractIds.length
  const hasSelected = selectedCount > 0

  return (
    <>
      <Card
        size="sm"
        className={cn(
          "cursor-pointer transition-colors hover:bg-accent/50",
          hasSelected && "bg-primary/5 ring-1 ring-primary/60"
        )}
        onClick={() => setModalOpen(true)}
      >
        <CardHeader>
          <CardTitle
            className="break-words"
            title={item.ste_name ?? "—"}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              overflowWrap: "anywhere",
            }}
          >
            {item.ste_name ?? "—"}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {item.ste_category && (
              <Badge variant="secondary">{item.ste_category}</Badge>
            )}
            {item.ste_manufacturer && (
              <Badge variant="outline">
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
            <span
              className={cn(
                "text-xs",
                hasSelected
                  ? "font-medium text-primary"
                  : "text-muted-foreground",
                "ml-auto"
              )}
            >
              {selectedCount}/{totalCount}
            </span>
          </div>
        </CardHeader>
      </Card>

      <SteDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={item}
        linkedContractIds={linkedContractIds}
        onLink={onLink}
        onUnlink={onUnlink}
        linkingId={linkingId}
        categoryFilter={categoryFilter}
        supplierRegionFilter={supplierRegionFilter}
        procurementMethodFilter={procurementMethodFilter}
        periodFrom={periodFrom}
        periodTo={periodTo}
      />
    </>
  )
}
