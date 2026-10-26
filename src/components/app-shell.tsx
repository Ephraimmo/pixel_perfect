import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";

/** Layout for the signed-in studio app: sidebar + topbar + routed page. */
export function AppShell() {
  const navigate = useNavigate();

  // Topbar search/notifications dispatch this custom event so navigation stays
  // type-safe here instead of reaching for window.location.
  useEffect(() => {
    const handler = (e: Event) => {
      const to = (e as CustomEvent<string>).detail;
      if (typeof to === "string" && to.startsWith("/")) void navigate({ to });
    };
    window.addEventListener("pixora:navigate", handler);
    return () => window.removeEventListener("pixora:navigate", handler);
  }, [navigate]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh">
        <Topbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
