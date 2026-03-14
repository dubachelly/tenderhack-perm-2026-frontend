import { Outlet, useNavigate } from "react-router"
import { Plus, History } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RootLayout() {
  const navigate = useNavigate()

  return (
    <div className="h-svh overflow-hidden">
      <main className="h-full overflow-y-auto">
        <Outlet />
      </main>

      <div className="fixed right-6 bottom-20 z-50 flex flex-col items-center gap-3">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => navigate("/history")}
          className="size-10 rounded-full shadow-md"
          title="История заявок"
        >
          <History className="size-4" />
        </Button>
        <Button
          size="icon"
          onClick={() => navigate("/")}
          className="size-14 rounded-full shadow-lg"
          title="Новая заявка"
        >
          <Plus className="size-7" />
        </Button>
      </div>
    </div>
  )
}
