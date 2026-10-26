import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDemo } from "@/lib/store";
import { photo } from "@/lib/demo-data";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  galleries: "Galleries",
  new: "New gallery",
  settings: "Settings",
  activity: "Activity",
  clients: "Clients",
  contacts: "Contacts",
  studio: "Studio",
  calendar: "Calendar",
  sessions: "Sessions",
  leads: "Leads",
  quotes: "Quotes",
  contracts: "Contracts",
  invoices: "Invoices",
  questionnaires: "Questionnaires",
  automations: "Automations",
  website: "Website",
  pages: "Pages",
  templates: "Templates",
  design: "Design",
  domain: "Domain",
  preview: "Preview",
  store: "Store",
  products: "Products",
  orders: "Orders",
  coupons: "Coupons",
  editor: "Editor",
  integrations: "Integrations",
  "mobile-apps": "Mobile apps",
  profile: "Profile",
  branding: "Branding",
  billing: "Billing",
  team: "Team",
  security: "Security",
  favorites: "Favorites",
  downloads: "Downloads",
};

function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, i) => {
    const label = segmentLabels[part] ?? (part.startsWith("g-") ? "Gallery" : part);
    return { label, href: "/" + parts.slice(0, i + 1).join("/") };
  });
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          const isId = !segmentLabels[part];
          return (
            <BreadcrumbItem key={crumb.href}>
              {last ? (
                <BreadcrumbPage className="max-w-48 truncate">{crumb.label}</BreadcrumbPage>
              ) : isId ? (
                <span className="max-w-48 truncate text-muted-foreground">{crumb.label}</span>
              ) : (
                <Link to={crumb.href} className="max-w-40 truncate text-muted-foreground transition-colors hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
              {last ? null : <BreadcrumbSeparator />}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

const navEntries: { title: string; to: string; group: string }[] = [
  { title: "Dashboard", to: "/dashboard", group: "Overview" },
  { title: "Galleries", to: "/galleries", group: "Work" },
  { title: "New gallery", to: "/galleries/new", group: "Work" },
  { title: "Studio", to: "/studio", group: "Work" },
  { title: "Store", to: "/store", group: "Work" },
  { title: "Website", to: "/website", group: "Work" },
  { title: "Editor", to: "/editor", group: "Work" },
  { title: "Clients", to: "/clients", group: "People" },
  { title: "Contacts", to: "/contacts", group: "People" },
  { title: "Settings", to: "/settings/profile", group: "Account" },
  { title: "Integrations", to: "/integrations", group: "Account" },
  { title: "Mobile apps", to: "/mobile-apps", group: "Account" },
];

function SearchDialog() {
  const { state: demo } = useDemo();
  const [open, setOpen] = useState(false);
  const go = (to: string) => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("pixora:navigate", { detail: to }));
  };
  const q = (s: string) => s.toLowerCase();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-56 justify-start gap-2 text-muted-foreground max-sm:w-9 max-sm:px-0" aria-label="Search">
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs font-normal max-sm:hidden">Search Pixora…</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Jump to a page, gallery or client</DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Search pages, galleries, clients…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Pages">
              {navEntries.map((n) => (
                <CommandItem key={n.to} value={`page ${n.title}`} onSelect={() => go(n.to)}>
                  {n.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Galleries">
              {demo.galleries.slice(0, 6).map((g) => (
                <CommandItem key={g.id} value={`gallery ${q(g.title)}`} onSelect={() => go(`/galleries/${g.id}`)}>
                  {g.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Clients">
              {demo.clients.slice(0, 6).map((c) => (
                <CommandItem key={c.id} value={`client ${q(c.name)}`} onSelect={() => go(`/clients/${c.id}`)}>
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function Notifications() {
  const { state: demo } = useDemo();
  const [open, setOpen] = useState(false);
  const go = (to: string) => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("pixora:navigate", { detail: to }));
  };
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          {demo.activity.length > 0 ? (
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-clay" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Recent activity</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {demo.activity.slice(0, 6).map((a) => (
          <DropdownMenuItem key={a.id} className="flex-col items-start gap-0.5 py-2" onSelect={() => go("/dashboard/activity")}>
            <p className="line-clamp-2 text-xs text-foreground">{a.message}</p>
            <p className="text-[10px] text-muted-foreground">{new Date(a.time).toLocaleString()}</p>
          </DropdownMenuItem>
        ))}
        {demo.activity.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">Nothing new yet.</p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar() {
  const { state: demo, signOut, resetDemo } = useDemo();
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur">
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-1.5">
        <SearchDialog />
        <Notifications />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-1 pr-2 text-left transition-colors hover:bg-accent" aria-label="Account menu">
              <Avatar className="h-7 w-7">
                <AvatarImage src={photo("pixora-owner-avatar", 80, 80)} alt="" />
                <AvatarFallback>AM</AvatarFallback>
              </Avatar>
              <span className="hidden text-xs font-semibold sm:inline">{demo.studioName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold">Alex Mercer</p>
              <p className="text-xs font-normal text-muted-foreground">Owner · alex@pixora.studio</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings/profile">Account settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                resetDemo();
                window.location.href = "/dashboard";
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset demo data
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                signOut();
                window.location.href = "/";
              }}
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
