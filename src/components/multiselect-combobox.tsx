import { XIcon, Loader2Icon } from "lucide-react"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"

interface MultiSelectComboboxProps {
  items: string[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  emptyText?: string
  isLoading?: boolean
}

export function MultiSelectCombobox({
  items,
  value,
  onValueChange,
  placeholder = "Выберите...",
  emptyText = "Нет результатов",
  isLoading = false,
}: MultiSelectComboboxProps) {
  const anchor = useComboboxAnchor()

  return (
    <Combobox
      multiple
      autoHighlight
      items={items}
      value={value}
      onValueChange={(v) => onValueChange([...v] as string[])}
    >
      <div className="relative w-full">
        <ComboboxChips ref={anchor} className={value.length > 0 ? "w-full pr-7" : "w-full"}>
          <ComboboxValue>
            {(values: string[]) => (
              <>
                {values.length > 0 && (
                  <ComboboxChip showRemove={false}>{`Выбрано: ${values.length}`}</ComboboxChip>
                )}
                <ComboboxChipsInput
                  placeholder={values.length === 0 ? placeholder : undefined}
                />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        {value.length > 0 && (
          <button
            onClick={() => onValueChange([])}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground opacity-50 hover:opacity-100"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>
          {isLoading ? (
            <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          ) : (
            emptyText
          )}
        </ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
