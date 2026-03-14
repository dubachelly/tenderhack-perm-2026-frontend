import { ChevronDownIcon, CheckIcon, XIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface MultiSelectProps {
  items: string[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
}

export function MultiSelect({
  items,
  value,
  onValueChange,
  placeholder = "Выберите...",
}: MultiSelectProps) {
  const toggle = (item: string) => {
    if (value.includes(item)) {
      onValueChange(value.filter((v) => v !== item))
    } else {
      onValueChange([...value, item])
    }
  }

  const label = value.length > 0 ? `Выбрано: ${value.length}` : null

  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full justify-start gap-1.5 text-xs font-normal"
            />
          }
        >
          <span className={label ? "" : "text-muted-foreground"}>
            {label ?? placeholder}
          </span>
          <ChevronDownIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-64 max-h-72 overflow-y-auto p-1"
        >
          {items.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              Нет вариантов
            </p>
          ) : (
            items.map((item) => (
              <button
                key={item}
                onClick={() => toggle(item)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground"
              >
                <span className="flex size-3.5 shrink-0 items-center justify-center">
                  {value.includes(item) && <CheckIcon className="size-3.5" />}
                </span>
                <span className="text-left">{item}</span>
              </button>
            ))
          )}
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <button
          onClick={() => onValueChange([])}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground opacity-50 hover:opacity-100"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  )
}
