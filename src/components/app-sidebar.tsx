import { Link, useRouterState } from "@tanstack/react-router";
import {
  Camera,
  ClipboardList,
  Globe,
  Images,
  FileSignature,
  FileText,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  MailOpen,
  Puzzle,
  Receipt,
  Settings,
  SlidersHorizontal,
  Smartphone,
  Store,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
  { title: "Leads", url: "/leads", icon: Inbox },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Website", url: "/website", icon: Globe },
  { title: "Store", url: "/store", icon: Store },
  { title: "Studio", url: "/studio", icon: Camera },
  { title: "Photo Editor", url: "/editor", icon: SlidersHorizontal },
  { title: "Mobile Apps", url: "/mobile-apps", icon: Smartphone },
  { title: "Team & Integrations", url: "/team", icon: Puzzle },
  { title: "Settings", url: "/settings", icon: Settings },
];

const automationItems = [
  { title: "Email Templates", url: "/emails", icon: MailOpen },
  { title: "Automations", url: "/automations", icon: Workflow },
];

/** Client paperwork, in its own labelled group below the main navigation. */
const businessItems = [
  { title: "Quotes", url: "/quotes", icon: FileText },
  { title: "Contracts", url: "/contracts", icon: FileSignature },
  { title: "Invoices", url: "/invoices", icon: Receipt },
  { title: "Questionnaires", url: "/questionnaires", icon: ClipboardList },
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
        <NavGroup items={items} isActive={isActive} />
        <NavGroup label="Business" items={businessItems} isActive={isActive} />
        <NavGroup label="Automation" items={automationItems} isActive={isActive} />
      </SidebarContent>
    </Sidebar>
  );
}

function NavGroup({
  label,
  items,
  isActive,
}: {
  label?: string;
  items: { title: string; url: string; icon: LucideIcon }[];
  isActive: (url: string) => boolean;
}) {
  return (
    <SidebarGroup>
      {label ? <SidebarGroupLabel className="text-[11px]">{label}</SidebarGroupLabel> : null}
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
  );
}
