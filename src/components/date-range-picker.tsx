import { useState } from "react"
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

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

const PRESETS = [
  { label: "Месяц", months: -1 },
  { label: "3 месяца", months: -3 },
  { label: "Полгода", months: -6 },
  { label: "Год", months: -12 },
]

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
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>(value)

  const label = value?.from
    ? value.to
      ? `${formatDate(value.from)} – ${formatDate(value.to)}`
      : formatDate(value.from)
    : null

  const handleOpenChange = (o: boolean) => {
    if (o) setDraft(value)
    setOpen(o)
  }

  const apply = () => {
    onChange(draft)
    setOpen(false)
  }

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={`h-8 w-full justify-start text-xs font-normal ${value?.from ? "pr-7" : ""}`}
            />
          }
        >
          <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className={label ? "" : "text-muted-foreground"}>
            {label ?? placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <div className="flex gap-1 border-b p-2">
            {PRESETS.map((p) => (
              <Button
                key={p.label}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const today = new Date()
                  const range = { from: addMonths(today, p.months), to: today }
                  onChange(range)
                  setOpen(false)
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={draft}
            onSelect={setDraft}
            numberOfMonths={2}
          />
          <div className="flex justify-end gap-2 border-t p-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={apply}>
              Применить
            </Button>
          </div>
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
