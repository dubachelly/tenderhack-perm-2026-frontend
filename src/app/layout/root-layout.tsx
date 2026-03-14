import { Outlet, useNavigate, useLocation } from "react-router"
import { Home, History } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RootLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="flex h-svh overflow-hidden">
      <aside className="flex w-14 flex-col items-center gap-2 border-r bg-background py-4">
        <Button
          size="icon"
          variant={location.pathname === "/" ? "default" : "ghost"}
          onClick={() => navigate("/")}
          className="size-10"
          title="Главная"
        >
          <Home className="size-5" />
        </Button>
        <Button
          size="icon"
          variant={location.pathname === "/history" ? "default" : "ghost"}
          onClick={() => navigate("/history")}
          className="size-10"
          title="История заявок"
        >
          <History className="size-5" />
        </Button>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
