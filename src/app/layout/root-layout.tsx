import { Outlet } from "react-router";
import { Sidebar } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";

export function RootLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-svh overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
