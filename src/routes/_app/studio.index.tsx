<<<<<<< HEAD
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { format } from "date-fns";
import { MapPin, Search, X } from "lucide-react";
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
import { KindLabel, SessionActionsMenu, SessionFormDialog, StudioTabs } from "@/components/studio";
=======
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import { Avatar, EmptyState, PageHeader, Panel, StatusBadge, pageHead } from "@/components/kit";
import { AddSessionDialog, StudioTabs } from "@/components/studio";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
>>>>>>> origin/main
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemo } from "@/lib/store";
<<<<<<< HEAD
import { DEMO_TODAY, formatTime, type Session, type SessionKind } from "@/lib/demo-data";
import { SESSION_KIND_LABELS, fromKey } from "@/lib/calendar";
import { relativeDay } from "@/lib/clients";
import {
  SESSION_STATUS_LABELS,
  SESSION_TABS,
  countSessionTabs,
  filterSessions,
  validateSessionSearch,
  type SessionListSearch,
} from "@/lib/sessions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/studio/")({
  head: () => pageHead("Sessions", "Manage your upcoming shoots and consultations."),
  validateSearch: validateSessionSearch,
  component: Sessions,
  errorComponent: ({ reset }) => <PageError title="Couldn't load your sessions" reset={reset} />,
});

type SearchPatch = { [K in keyof SessionListSearch]?: SessionListSearch[K] | undefined };

function Sessions() {
  const { state: demo, ready } = useDemo();
  const { tab = "upcoming", q = "", kind } = Route.useSearch();
  const navigate = Route.useNavigate();
  const goTo = useNavigate();
  const update = (patch: SearchPatch) =>
    void navigate({
      search: (prev) => validateSessionSearch({ ...prev, ...patch }),
      replace: true,
    });

  const counts = countSessionTabs(demo.sessions, DEMO_TODAY);
  const rows = filterSessions(
    demo.sessions,
    demo.clients,
    { tab, q, ...(kind ? { kind } : {}) },
    DEMO_TODAY,
  );
  const filtered = q.trim() !== "" || !!kind;

  let body: ReactNode;
  if (!ready) {
    body = <ListSkeleton label="Loading sessions" />;
  } else if (rows.length === 0) {
    body = filtered ? (
      <EmptyState
        title="No sessions match"
        description="Try another client name, session name or location."
        action={
          <Button size="sm" variant="outline" onClick={() => update({ q: "", kind: undefined })}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        title={
          tab === "upcoming"
            ? "Nothing booked yet"
            : tab === "cancelled"
              ? "No cancelled sessions"
              : "No sessions yet"
        }
        description={
          tab === "upcoming"
            ? "Book a session and it will show up here and on your calendar."
            : tab === "cancelled"
              ? "Sessions you cancel are kept here so you can reinstate them."
              : "Completed sessions will collect here."
        }
        action={tab === "upcoming" || tab === "all" ? <SessionFormDialog /> : undefined}
      />
    );
  } else {
    body = <SessionGroups sessions={rows} />;
  }
=======
import { avatar, formatDate, formatTime, type SessionStatus } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/studio/")({
  head: () => pageHead("Sessions", "Manage your upcoming shoots and consultations."),
  component: Sessions,
});

function Sessions() {
  const { state: demo, updateSessionStatus } = useDemo();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | SessionStatus>("all");
  const client = (id: string) => demo.clients.find((c) => c.id === id);
  const q = query.trim().toLowerCase();

  const rows = [...demo.sessions]
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .filter((s) => filter === "all" || s.status === filter)
    .filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (client(s.clientId)?.name.toLowerCase().includes(q) ?? false),
    );
>>>>>>> origin/main

  return (
    <div className="mx-auto max-w-5xl">
      <StudioTabs />
<<<<<<< HEAD
      <PageHeader
        title="Sessions"
        description={
          ready
            ? `${counts.upcoming} upcoming · ${demo.sessions.filter((s) => s.status === "pending").length} pending confirmation`
            : "Manage your upcoming shoots and consultations."
        }
        actions={
          <SessionFormDialog
            onSaved={(s) => void goTo({ to: "/studio/sessions/$id", params: { id: s.id } })}
          />
        }
      />

      <TabBar
        value={tab}
        onChange={(t) => update({ tab: t })}
        tabs={SESSION_TABS.map((t) => ({
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
            placeholder="Search session, client or location..."
            aria-label="Search sessions"
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
        <Select
          value={kind ?? "all"}
          onValueChange={(v) => update({ kind: v === "all" ? undefined : (v as SessionKind) })}
        >
          <SelectTrigger className="h-9 bg-card text-xs sm:w-40" aria-label="Filter by type">
            <SelectValue>{kind ? SESSION_KIND_LABELS[kind] : "All types"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(Object.keys(SESSION_KIND_LABELS) as SessionKind[]).map((k) => (
              <SelectItem key={k} value={k}>
                {SESSION_KIND_LABELS[k]}
              </SelectItem>
            ))}
=======
      <PageHeader title="Sessions" actions={<AddSessionDialog />} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients..."
            className="h-9 bg-card pl-8 text-xs"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="h-9 bg-card text-xs sm:w-36">
            <SelectValue>
              {filter === "all" ? "All" : filter === "confirmed" ? "Confirmed" : "Pending"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
>>>>>>> origin/main
          </SelectContent>
        </Select>
      </div>

<<<<<<< HEAD
      <div className="mt-4">{body}</div>
    </div>
  );
}

function dayHeading(date: string) {
  const rel = relativeDay(date, DEMO_TODAY);
  if (date === DEMO_TODAY) return "Today";
  if (date > DEMO_TODAY) {
    const ahead = Math.round((fromKey(date).getTime() - fromKey(DEMO_TODAY).getTime()) / 864e5);
    if (ahead === 1) return "Tomorrow";
  } else if (rel === "Yesterday") return rel;
  return format(fromKey(date), "EEEE, MMM d, yyyy");
}

function SessionGroups({ sessions }: { sessions: Session[] }) {
  const groups: { date: string; items: Session[] }[] = [];
  for (const s of sessions) {
    const last = groups[groups.length - 1];
    if (last?.date === s.date) last.items.push(s);
    else groups.push({ date: s.date, items: [s] });
  }
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.date} aria-label={dayHeading(g.date)}>
          <p className="eyebrow mb-2">{dayHeading(g.date)}</p>
          <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-soft">
            {g.items.map((s) => (
              <SessionRow key={s.id} s={s} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SessionRow({ s }: { s: Session }) {
  const { state: demo } = useDemo();
  const client = demo.clients.find((c) => c.id === s.clientId);
  const cancelled = s.status === "cancelled";
  return (
    <li className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40">
      <div className="w-16 shrink-0 text-xs tabular-nums">
        <p className={cn("font-medium", cancelled && "text-muted-foreground line-through")}>
          {formatTime(s.start)}
        </p>
        <p className="text-muted-foreground">{formatTime(s.end)}</p>
      </div>
      <Link
        to="/studio/sessions/$id"
        params={{ id: s.id }}
        className="min-w-0 flex-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <p
          className={cn(
            "truncate text-sm font-medium",
            cancelled && "text-muted-foreground line-through",
          )}
        >
          {s.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <KindLabel kind={s.kind} />
          {s.location ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{s.location}</span>
            </span>
          ) : null}
        </p>
      </Link>
      {client ? (
        <span className="hidden min-w-0 items-center gap-2 text-xs sm:flex sm:w-40">
          <PersonAvatar name={client.name} photo={client.avatar} className="h-6 w-6 text-[9px]" />
          <span className="truncate">{client.name}</span>
        </span>
      ) : null}
      <StatusBadge status={s.status} label={SESSION_STATUS_LABELS[s.status]} />
      <SessionActionsMenu session={s} />
    </li>
  );
}
=======
      <Panel className="mt-4">
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No sessions found" />
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((s) => {
              const c = client(s.clientId);
              return (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                  {c ? <Avatar src={avatar(c.avatar)} alt="" className="h-9 w-9" /> : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c?.name} · {formatDate(s.date)} · {formatTime(s.start)} – {formatTime(s.end)}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label="Session actions"
                      className="rounded p-1 text-muted-foreground hover:bg-accent"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={s.status === "confirmed"}
                        onSelect={() => {
                          updateSessionStatus(s.id, "confirmed");
                          toast.success(`${s.title} confirmed`);
                        }}
                      >
                        Mark confirmed
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={s.status === "pending"}
                        onSelect={() => updateSessionStatus(s.id, "pending")}
                      >
                        Mark pending
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
>>>>>>> origin/main
