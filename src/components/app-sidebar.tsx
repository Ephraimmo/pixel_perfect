import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarRange,
  Contact,
  Gauge,
  Globe,
  Images,
  LayoutDashboard,
  PenTool,
  Plug,
  Settings,
  Smartphone,
  Store,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { useDemo } from "@/lib/store";

const groups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Work",
    items: [
      { title: "Galleries", url: "/galleries", icon: Images },
      { title: "Studio", url: "/studio", icon: CalendarRange },
      { title: "Store", url: "/store", icon: Store },
      { title: "Website", url: "/website", icon: Globe },
      { title: "Editor", url: "/editor", icon: PenTool },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Clients", url: "/clients", icon: Users },
      { title: "Contacts", url: "/contacts", icon: Contact },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Settings", url: "/settings/profile", icon: Settings },
      { title: "Integrations", url: "/integrations", icon: Plug },
      { title: "Mobile apps", url: "/mobile-apps", icon: Smartphone },
    ],
  },
];

export function AppSidebar() {
  const { state: demo } = useDemo();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (router) => router.location.pathname });
  const isActive = (url: string) => currentPath === url || currentPath.startsWith(url + "/");

  // Demo storage estimate: ~2.4MB per gallery photo against a 20GB plan.
  const photoCount = demo.galleries.reduce((n, g) => n + g.photos.length, 0);
  const usedGb = Math.min(20, (photoCount * 2.4) / 1024);
  const usedPct = (usedGb / 20) * 100;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={demo.studioName}>
              <Link to="/dashboard" className="gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary font-display text-lg font-semibold text-primary-foreground">
                  P
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm font-semibold">{demo.studioName}</span>
                  <span className="block text-xs text-muted-foreground">Pixora workspace</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => {
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        {!collapsed ? (
          <div className="mx-2 mb-2 rounded-md border bg-card p-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
              Storage
            </div>
            <Progress value={usedPct} className="mt-2 h-1.5" />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {usedGb.toFixed(1)} GB of 20 GB used · {photoCount} photos
            </p>
          </div>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
