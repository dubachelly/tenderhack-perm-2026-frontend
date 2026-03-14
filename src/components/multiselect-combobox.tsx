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
}

export function MultiSelectCombobox({
  items,
  value,
  onValueChange,
  placeholder = "Выберите...",
  emptyText = "Нет результатов",
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
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(values: string[]) => (
            <>
              {values.map((v) => (
                <ComboboxChip key={v}>{v}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder={values.length === 0 ? placeholder : undefined}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
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
