import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, ChevronDown, LogOut, RotateCcw, Search, Settings, User } from "lucide-react";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/kit";
import { useDemo } from "@/lib/store";
<<<<<<< HEAD
import { useShop } from "@/lib/shop";
=======
>>>>>>> origin/main
import { avatar } from "@/lib/demo-data";

function SearchBox() {
  const { state: demo } = useDemo();
<<<<<<< HEAD
  const { state: shop } = useShop();
=======
>>>>>>> origin/main
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const results = q
    ? [
        ...demo.galleries
          .filter((g) => g.title.toLowerCase().includes(q))
          .map((g) => ({
            key: g.id,
            label: g.title,
            kind: "Gallery",
            go: () => navigate({ to: "/galleries/$id", params: { id: g.id } }),
          })),
        ...demo.clients
          .filter((c) => c.name.toLowerCase().includes(q))
          .map((c) => ({
            key: c.id,
            label: c.name,
            kind: "Client",
<<<<<<< HEAD
            go: () => navigate({ to: "/clients", search: { q: c.name } }),
          })),
        ...shop.products
=======
            go: () => navigate({ to: "/clients" }),
          })),
        ...demo.products
>>>>>>> origin/main
          .filter((p) => p.name.toLowerCase().includes(q))
          .map((p) => ({
            key: p.id,
            label: p.name,
            kind: "Product",
<<<<<<< HEAD
            go: () => navigate({ to: "/store/products/$id", params: { id: p.id } }),
=======
            go: () => navigate({ to: "/store" }),
>>>>>>> origin/main
          })),
      ].slice(0, 8)
    : [];

  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setQuery("");
          if (e.key === "Enter" && results[0]) {
            void results[0].go();
            setQuery("");
          }
        }}
        placeholder="Search anything..."
        aria-label="Search"
        className="h-8 w-full rounded-md border bg-card pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
      />
      {q ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover shadow-lift">
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-muted-foreground">No results for "{query}"</p>
          ) : (
            results.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => {
                  void r.go();
                  setQuery("");
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-accent"
              >
                <span className="truncate">{r.label}</span>
                <span className="text-[10px] text-muted-foreground">{r.kind}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function Notifications() {
  const { state: demo } = useDemo();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <p className="border-b px-4 py-2.5 text-xs font-semibold">Notifications</p>
        <ul className="divide-y">
          {demo.activity.map((a) => (
            <li key={a.id} className="flex gap-2.5 px-4 py-2.5">
              <Avatar src={avatar(a.avatar)} alt="" className="h-7 w-7" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{a.title}</p>
                <p className="text-[11px] text-muted-foreground">{a.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function Topbar() {
  const { state: demo, resetDemo } = useDemo();
<<<<<<< HEAD
  const { resetShop } = useShop();
=======
>>>>>>> origin/main
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
      <SidebarTrigger className="-ml-1 md:hidden" />
      <SearchBox />
      <div className="ml-auto flex items-center gap-1.5">
        <Notifications />
        <Link
          to="/team"
          aria-label="Team"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <User className="h-4 w-4" />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 hover:bg-accent">
            <Avatar src={avatar(demo.profile.avatar)} alt="" className="h-7 w-7" />
            <span className="text-xs font-medium max-sm:hidden">{demo.profile.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{demo.profile.name}</p>
              <p className="text-xs text-muted-foreground">{demo.profile.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
              <Settings className="h-4 w-4" /> Account settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                resetDemo();
<<<<<<< HEAD
                resetShop();
=======
>>>>>>> origin/main
                toast.success("Demo data reset");
              }}
            >
              <RotateCcw className="h-4 w-4" /> Reset demo data
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/login" })}>
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
