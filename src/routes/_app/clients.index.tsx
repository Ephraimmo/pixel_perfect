import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  ChevronRight,
  Copy,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  EmptyState,
  ListSkeleton,
  PageError,
  PageHeader,
  PersonAvatar,
  StatusBadge,
  TabBar,
  pageHead,
} from "@/components/kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientFormDialog } from "@/components/clients";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, type Client, type ClientType } from "@/lib/demo-data";
import {
  CLIENT_SORT_LABELS,
  CLIENT_STATUS_TABS,
  CLIENT_TYPE_LABELS,
  countClients,
  filterClients,
  relativeDay,
  validateClientListSearch,
  type ClientListSearch,
  type ClientSort,
  type ClientTypeFilter,
} from "@/lib/clients";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/clients/")({
  head: () => pageHead("Clients", "Your clients and their sessions."),
  // Filters live in the URL so they survive navigation and can be shared.
  validateSearch: validateClientListSearch,
  component: Clients,
  errorComponent: ({ reset }) => <PageError title="Couldn't load your clients" reset={reset} />,
});

const COLS = "md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.5fr)_6.5rem_4.5rem_6.5rem_3.5rem]";

function Clients() {
  const { state: demo, ready, toggleClientStar } = useDemo();
  const { status = "all", type = "all", q = "", sort = "recent" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const goTo = useNavigate();
  const openProfile = (id: string) => void goTo({ to: "/clients/$id", params: { id } });

  const update = (patch: ClientListSearch) =>
    void navigate({
      search: (prev) => validateClientListSearch({ ...prev, ...patch }),
      replace: true,
    });
  const clearFilters = () => update({ q: "", status: "all", type: "all" });

  const counts = countClients(demo.clients);
  const rows = filterClients(demo.clients, { status, type, q, sort });
  const filtered = status !== "all" || type !== "all" || q.trim() !== "";

  let body: ReactNode;
  if (!ready) {
    body = <ListSkeleton label="Loading clients" />;
  } else if (demo.clients.length === 0) {
    body = (
      <EmptyState
        title="No clients yet"
        description="Add your first client to keep their contact details, sessions and galleries together."
        action={
          <ClientFormDialog
            trigger={
              <Button size="sm">
                <Plus /> Add your first client
              </Button>
            }
            onSaved={(c) => toast.success(`${c.name} added`)}
          />
        }
      />
    );
  } else if (rows.length === 0) {
    body = (
      <EmptyState
        title={q.trim() ? `No clients match “${q.trim()}”` : "No clients in this view"}
        description="Try a different name, email, phone number or tag — or clear the filters."
        action={
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    );
  } else {
    body = (
      <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
        <div
          className={cn(
            "hidden gap-3 border-b bg-muted/40 px-4 py-2 text-[11px] font-medium text-muted-foreground",
            COLS,
          )}
        >
          <span>Client</span>
          <span>Contact</span>
          <span>Type</span>
          <span className="text-right">Sessions</span>
          <span>Last activity</span>
          <span className="sr-only">Actions</span>
        </div>
        <ul className="divide-y">
          {rows.map((c) => (
            <ClientRow key={c.id} c={c} onStar={() => toggleClientStar(c.id)} />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Clients"
        description={
          ready
            ? `${counts.all} ${counts.all === 1 ? "client" : "clients"} · ${counts.active} active`
            : "Your clients and their sessions."
        }
        actions={
          <ClientFormDialog
            trigger={
              <Button size="sm">
                <Plus /> Add Client
              </Button>
            }
            onSaved={(c) => {
              if (filtered) clearFilters();
              toast.success(`${c.name} added`, {
                action: { label: "Open profile", onClick: () => openProfile(c.id) },
              });
            }}
          />
        }
      />

      <TabBar
        value={status}
        onChange={(s) => update({ status: s })}
        tabs={CLIENT_STATUS_TABS.map((t) => ({
          value: t.value,
          label: ready ? `${t.label} (${counts[t.value]})` : t.label,
        }))}
      />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            onKeyDown={(e) => e.key === "Escape" && update({ q: "" })}
            placeholder="Search name, email, phone, company or tag..."
            aria-label="Search clients"
            className="h-9 bg-card pl-8 pr-8 text-xs [&::-webkit-search-cancel-button]:hidden"
          />
          {q ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => update({ q: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select value={type} onValueChange={(v) => update({ type: v as ClientTypeFilter })}>
            <SelectTrigger className="h-9 bg-card text-xs sm:w-36" aria-label="Filter by type">
              {/* Explicit label so the trigger renders server-side too. */}
              <SelectValue>{type === "all" ? "All types" : CLIENT_TYPE_LABELS[type]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {(Object.keys(CLIENT_TYPE_LABELS) as ClientType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {CLIENT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => update({ sort: v as ClientSort })}>
            <SelectTrigger className="h-9 bg-card text-xs sm:w-44" aria-label="Sort clients">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue>{CLIENT_SORT_LABELS[sort]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CLIENT_SORT_LABELS) as ClientSort[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {CLIENT_SORT_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p
        className="mt-3 flex h-4 items-center gap-2 text-xs text-muted-foreground"
        aria-live="polite"
      >
        {ready && filtered && rows.length > 0 ? (
          <>
            Showing {rows.length} of {demo.clients.length} clients
            <button
              type="button"
              onClick={clearFilters}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Clear filters
            </button>
          </>
        ) : null}
      </p>

      <div className="mt-2">{body}</div>
    </div>
  );
}

function ClientRow({ c, onStar }: { c: Client; onStar: () => void }) {
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(c.email);
      toast.success("Email copied", { description: c.email });
    } catch {
      toast.info(c.email);
    }
  };

  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 md:items-center",
        COLS,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <PersonAvatar name={c.name} photo={c.avatar} className="h-9 w-9" />
        <Link
          to="/clients/$id"
          params={{ id: c.id }}
          className="min-w-0 flex-1 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <span className="truncate">{c.name}</span>
            {c.starred ? (
              <Star className="h-3 w-3 shrink-0 fill-warning text-warning" aria-label="Starred" />
            ) : null}
            {c.status === "past" ? <StatusBadge status="past" label="Past" /> : null}
          </span>
          {/* Mobile: email + meta under the name. Desktop: company · city. */}
          <span className="block truncate text-xs text-muted-foreground md:hidden">{c.email}</span>
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground md:hidden">
            {CLIENT_TYPE_LABELS[c.type]} · {relativeDay(c.lastActivity, DEMO_TODAY)}
          </span>
          <span className="hidden truncate text-xs text-muted-foreground md:block">
            {[c.company, c.city].filter(Boolean).join(" · ") || "—"}
          </span>
        </Link>
      </div>

      <div className="hidden min-w-0 text-xs md:block">
        <a
          href={`mailto:${c.email}`}
          className="block truncate text-foreground hover:underline"
          title={c.email}
        >
          {c.email}
        </a>
        {c.phone ? (
          <a
            href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
            className="block truncate text-muted-foreground hover:text-foreground"
          >
            {c.phone}
          </a>
        ) : (
          <span className="text-muted-foreground">No phone</span>
        )}
      </div>
      <span className="hidden md:block">
        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
          {CLIENT_TYPE_LABELS[c.type]}
        </span>
      </span>
      <span className="hidden text-right text-xs tabular-nums md:block">{c.sessions}</span>
      <span className="hidden text-xs text-muted-foreground md:block">
        {relativeDay(c.lastActivity, DEMO_TODAY)}
      </span>

      <div className="flex shrink-0 items-center justify-end gap-0.5">
        <button
          type="button"
          aria-label={c.starred ? `Unstar ${c.name}` : `Star ${c.name}`}
          aria-pressed={c.starred}
          onClick={onStar}
          className="rounded p-1 text-muted-foreground hover:text-warning"
        >
          <Star className={cn("h-4 w-4", c.starred && "fill-warning text-warning")} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Actions for ${c.name}`}
            className="rounded p-1 text-muted-foreground hover:bg-accent"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link to="/clients/$id" params={{ id: c.id }}>
                <ChevronRight className="h-4 w-4" /> Open profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={`mailto:${c.email}`}>
                <Mail className="h-4 w-4" /> Send email
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild disabled={!c.phone}>
              <a href={c.phone ? `tel:${c.phone.replace(/[^\d+]/g, "")}` : undefined}>
                <Phone className="h-4 w-4" /> Call
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void copyEmail()}>
              <Copy className="h-4 w-4" /> Copy email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
