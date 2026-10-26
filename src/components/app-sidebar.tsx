import { Link, useRouterState } from "@tanstack/react-router";
import {
  Camera,
  Globe,
  Images,
  LayoutDashboard,
  Puzzle,
  Settings,
  SlidersHorizontal,
  Smartphone,
  Store,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/kit";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Galleries", url: "/galleries", icon: Images },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Website", url: "/website", icon: Globe },
  { title: "Store", url: "/store", icon: Store },
  { title: "Studio", url: "/studio", icon: Camera },
  { title: "Photo Editor", url: "/editor", icon: SlidersHorizontal },
  { title: "Mobile Apps", url: "/mobile-apps", icon: Smartphone },
  { title: "Team & Integrations", url: "/team", icon: Puzzle },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (router) => router.location.pathname });
  const isActive = (url: string) => currentPath === url || currentPath.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center px-4 group-data-[collapsible=icon]:px-2">
        <Logo to="/dashboard" className="text-base group-data-[collapsible=icon]:[&>span]:hidden" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="text-[13px] text-muted-foreground data-[active=true]:font-medium data-[active=true]:text-foreground"
                  >
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
      </SidebarContent>
    </Sidebar>
  );
}
