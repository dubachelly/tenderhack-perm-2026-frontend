import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ScrollToTopButtonProps {
  scrollContainerRef: React.RefObject<HTMLElement | null>
}

export function ScrollToTopButton({
  scrollContainerRef,
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const onScroll = () => setVisible(el.scrollTop > 400)
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [scrollContainerRef])

  const handleClick = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <Button
      size="icon"
      variant="secondary"
      onClick={handleClick}
      className={cn(
        "fixed bottom-20 left-6 z-50 shadow-md transition-all duration-200",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      )}
      aria-label="Наверх"
    >
      <ArrowUp className="size-4" />
    </Button>
  )
}
