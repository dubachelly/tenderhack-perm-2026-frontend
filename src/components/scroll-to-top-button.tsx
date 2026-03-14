import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScrollToTopButtonProps {
  scrollContainerRef: React.RefObject<HTMLElement | null>;
}

export function ScrollToTopButton({ scrollContainerRef }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onScroll = () => setVisible(el.scrollTop > 400);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollContainerRef]);

  const handleClick = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={handleClick}
      className={cn(
        "fixed bottom-6 right-6 z-50 shadow-md transition-all duration-200",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      )}
      aria-label="Наверх"
    >
      <ArrowUp className="size-4" />
    </Button>
  );
}
