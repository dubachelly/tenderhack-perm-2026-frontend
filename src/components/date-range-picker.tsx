import { CalendarIcon, XIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatDate(d: Date) {
  return d.toLocaleDateString("ru-RU")
}

interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Период",
}: DateRangePickerProps) {
  const label = value?.from
    ? value.to
      ? `${formatDate(value.from)} – ${formatDate(value.to)}`
      : formatDate(value.from)
    : null

  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full justify-start text-xs font-normal"
            />
          }
        >
          <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className={label ? "" : "text-muted-foreground"}>
            {label ?? placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {value?.from && (
        <button
          onClick={() => onChange(undefined)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground opacity-50 hover:opacity-100"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export type { DateRange }
