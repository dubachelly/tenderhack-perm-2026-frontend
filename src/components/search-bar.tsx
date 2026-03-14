import { useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

interface SearchBarProps {
  defaultValue?: string
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({
  defaultValue = "",
  onSearch,
  placeholder = "Поиск СТЕ...",
  className,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      onSearch(value.trim())
    }
  }

  return (
    <InputGroup className={cn("h-10 rounded-md", className)}>
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="text-sm"
      />
    </InputGroup>
  )
}
