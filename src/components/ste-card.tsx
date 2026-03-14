import { useState } from "react"
import type { SearchSteGroup } from "@/shared/api/autogen/types.gen"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SteDetailModal } from "./ste-detail-modal"

interface SteCardProps {
  item: SearchSteGroup
  linkedContractIds: Set<number>
  onLink: (contractId: number) => void
  onUnlink: (contractId: number) => void
  linkingId: number | null
}

export function SteCard({ item, linkedContractIds, onLink, onUnlink, linkingId }: SteCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const contractIds = item.contract_item_ids ?? []
  const selectedCount = contractIds.filter((id) => linkedContractIds.has(id)).length
  const totalCount = contractIds.length
  const hasSelected = selectedCount > 0

  return (
    <>
      <Card
        size="sm"
        className={cn(
          hasSelected && "ring-1 ring-primary/60 bg-primary/5"
        )}
      >
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
        </CardHeader>

        <CardContent className="flex items-center justify-between gap-3 py-2">
          <span
            className={cn(
              "text-xs",
              hasSelected ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            Выбрано {selectedCount}/{totalCount} контрактов
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs shrink-0"
            onClick={() => setModalOpen(true)}
          >
            Редактировать
          </Button>
        </CardContent>
      </Card>

      <SteDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={item}
        linkedContractIds={linkedContractIds}
        onLink={onLink}
        onUnlink={onUnlink}
        linkingId={linkingId}
      />
    </>
  )
}
