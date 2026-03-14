import { Check } from "lucide-react";
import type { SearchItem } from "@/shared/api/autogen/types.gen";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseCharacteristics } from "@/lib/utils";

interface SteCardProps {
  item: SearchItem;
  isLinked: boolean;
  onLink: (steId: number, rank: number) => void;
  isPending: boolean;
}

export function SteCard({ item, isLinked, onLink, isPending }: SteCardProps) {
  const characteristics = parseCharacteristics(item.ste_characteristics);

  const handleLink = () => {
    if (!item.ste_id) return;
    const matchPercent = Math.round((item.rank ?? 0) * 100);
    onLink(item.ste_id, matchPercent);
  };

  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>{item.ste_name ?? item.ste_item_name ?? "—"}</CardTitle>
        {item.ste_category && (
          <Badge variant="secondary" className="w-fit">
            {item.ste_category}
          </Badge>
        )}
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
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {item.ste_manufacturer && (
            <>
              <span className="text-muted-foreground">Производитель</span>
              <span>{item.ste_manufacturer}</span>
            </>
          )}
          {item.unit_price && (
            <>
              <span className="text-muted-foreground">Цена за ед.</span>
              <span>{item.unit_price} ₽</span>
            </>
          )}
          {item.quantity && (
            <>
              <span className="text-muted-foreground">Количество</span>
              <span>
                {item.quantity} {item.unit ?? ""}
              </span>
            </>
          )}
        </div>
        {characteristics.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {characteristics.map(({ key, value }) => (
              <div key={key} className="flex gap-2 text-xs">
                <span className="text-muted-foreground shrink-0">{key}:</span>
                <span className="text-foreground">{value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {item.ste_item_name && item.ste_name && item.ste_item_name !== item.ste_name && (
        <CardFooter className="text-xs text-muted-foreground">
          Позиция: {item.ste_item_name}
        </CardFooter>
      )}
    </Card>
  );
}
