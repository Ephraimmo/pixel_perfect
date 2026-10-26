import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Check,
  ChevronDown,
  Columns3,
  ExternalLink,
  List,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Field, PageError, PageHeader, pageHead } from "@/components/kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/lib/store";
import {
  DEMO_TODAY,
  formatDate,
  formatTime,
  money,
  moneyShort,
  type ClientSource,
  type ClientType,
} from "@/lib/demo-data";
import type { Lead, LeadStage } from "@/lib/leads-data";
import { CLIENT_SOURCE_LABELS, CLIENT_TYPE_LABELS, relativeDay } from "@/lib/clients";
import {
  LEAD_STAGES,
  LEAD_STAGE_LABELS,
  LOST_REASONS,
  OPEN_STAGES,
  filterLeads,
  leadTrend,
  leadsByStage,
  matchingClient,
  nextStage,
  pipelineValue,
  validateLeadForm,
  validateLeadSearch,
  winRate,
  type LeadFormErrors,
  type LeadListSearch,
} from "@/lib/leads";
import { findConflicts, slotLabel } from "@/lib/sessions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/leads")({
  head: () => pageHead("Leads", "Track inquiries from first message to booking."),
  // Filters, view and the open lead live in the URL so they can be shared and survive reloads.
  validateSearch: validateLeadSearch,
  component: Leads,
  errorComponent: ({ reset }) => <PageError title="Couldn't load your leads" reset={reset} />,
});

const STAGE_DOT: Record<LeadStage, string> = {
  new: "bg-info",
  contacted: "bg-warning",
  consultation: "bg-chart-2",
  proposal: "bg-clay",
  booked: "bg-success",
  lost: "bg-muted-foreground/50",
};

function StageBadge({ stage }: { stage: LeadStage }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium">
      <span className={cn("h-1.5 w-1.5 rounded-full", STAGE_DOT[stage])} />
      {LEAD_STAGE_LABELS[stage]}
    </span>
  );
}

/** Shared move logic: lost asks for a reason, booked offers conversion. */
function useLeadActions(askLostReason: (id: string) => void) {
  const { state: demo, moveLead, convertLead } = useDemo();
  const move = (lead: Lead, stage: LeadStage) => {
    if (stage === lead.stage) return;
    if (stage === "lost") return askLostReason(lead.id);
    moveLead(lead.id, stage);
    if (stage === "booked" && !lead.clientId) {
      const existing = matchingClient(lead, demo.clients);
      toast.success(`${lead.name} booked`, {
        description: existing
          ? `Matches your client ${existing.name}.`
          : "Create their client profile to start the project.",
        action: {
          label: existing ? "Link client" : "Create client",
          onClick: () => {
            convertLead(lead.id);
            toast.success(existing ? "Linked to client profile" : "Client profile created");
          },
        },
      });
    } else {
      toast.success(`${lead.name} moved to ${LEAD_STAGE_LABELS[stage]}`);
    }
  };
  return { move };
}

/** A search update; `undefined` removes the param. */
type SearchPatch = { [K in keyof LeadListSearch]?: LeadListSearch[K] | undefined };

function Leads() {
  const { state: demo, ready } = useDemo();
  const search = Route.useSearch();
  const { q = "", type, view = "board", lead: openId } = search;
  const navigate = Route.useNavigate();
  const [lostFor, setLostFor] = useState<string | null>(null);
  const { move } = useLeadActions(setLostFor);

  const update = (patch: SearchPatch, replace = true) =>
    void navigate({ search: (prev) => validateLeadSearch({ ...prev, ...patch }), replace });
  const open = (id: string | undefined) => update({ lead: id }, false);

  const rows = filterLeads(demo.leads, { q, ...(type ? { type } : {}) });
  const filtered = q.trim() !== "" || !!type;
  const trend = leadTrend(demo.leads, DEMO_TODAY);
  const rate = winRate(demo.leads);
  const openCount = demo.leads.filter((l) => OPEN_STAGES.includes(l.stage)).length;

  let body: ReactNode;
  if (!ready) {
    body = <BoardSkeleton />;
  } else if (demo.leads.length === 0) {
    body = (
      <EmptyState
        title="No inquiries yet"
        description="Inquiries from your booking page land here automatically. You can also log one you received by phone or email."
        action={<AddLeadDialog onCreated={(l) => open(l.id)} label="Log your first inquiry" />}
      />
    );
  } else if (rows.length === 0) {
    body = (
      <EmptyState
        title={q.trim() ? `No leads match “${q.trim()}”` : "No leads of this type"}
        description="Try a different name, email, location or keyword."
        action={
          <Button variant="outline" size="sm" onClick={() => update({ q: "", type: undefined })}>
            Clear filters
          </Button>
        }
      />
    );
  } else if (view === "list") {
    body = <LeadList leads={rows} onOpen={open} onMove={move} />;
  } else {
    body = <Board leads={rows} onOpen={open} onMove={move} />;
  }

  const selected = demo.leads.find((l) => l.id === openId);

  return (
    <div className="mx-auto max-w-[96rem]">
      <PageHeader
        title="Leads"
        description="Track inquiries from first message to booking."
        actions={
          <>
            <Button asChild size="sm" variant="outline" className="bg-card">
              <a href="/book" target="_blank" rel="noreferrer">
                <ExternalLink /> Booking page
              </a>
            </Button>
            <AddLeadDialog onCreated={(l) => open(l.id)} />
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open leads" value={ready ? openCount : "—"} />
        <Stat label="Pipeline value" value={ready ? moneyShort(pipelineValue(demo.leads)) : "—"} />
        <Stat
          label="New in last 30 days"
          value={ready ? trend.current : "—"}
          sub={
            ready && trend.change !== null
              ? `${trend.change >= 0 ? "↑" : "↓"} ${Math.abs(trend.change)}% vs previous 30 days`
              : undefined
          }
        />
        <Stat
          label="Win rate"
          value={ready && rate !== null ? `${rate}%` : "—"}
          sub="Booked vs. lost"
        />
      </dl>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            onKeyDown={(e) => e.key === "Escape" && update({ q: "" })}
            placeholder="Search name, email, location or message..."
            aria-label="Search leads"
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
        <div className="flex gap-2">
          <Select
            value={type ?? "all"}
            onValueChange={(v) => update({ type: v === "all" ? undefined : (v as ClientType) })}
          >
            <SelectTrigger
              className="h-9 flex-1 bg-card text-xs sm:w-36"
              aria-label="Filter by type"
            >
              <SelectValue>{type ? CLIENT_TYPE_LABELS[type] : "All types"}</SelectValue>
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
          <div
            className="inline-flex shrink-0 rounded-md border bg-card p-0.5"
            role="group"
            aria-label="View"
          >
            {(
              [
                ["board", Columns3, "Board"],
                ["list", List, "List"],
              ] as const
            ).map(([v, Icon, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => update({ view: v === "board" ? undefined : v })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded px-2.5 text-xs",
                  view === v
                    ? "bg-accent font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p
        className="mt-3 flex h-4 items-center gap-2 text-xs text-muted-foreground"
        aria-live="polite"
      >
        {ready && filtered && rows.length > 0
          ? `Showing ${rows.length} of ${demo.leads.length} leads`
          : null}
      </p>

      <div className="mt-2 min-w-0">{body}</div>

      <LeadSheet
        lead={selected}
        onClose={() => open(undefined)}
        onMove={move}
        onDeleted={() => open(undefined)}
      />
      <LostReasonDialog leadId={lostFor} onClose={() => setLostFor(null)} />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: string | undefined;
}) {
  return (
    <div className="rounded-lg border bg-card p-3.5 shadow-soft">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{value}</dd>
      {sub ? <dd className="text-[11px] text-muted-foreground">{sub}</dd> : null}
    </div>
  );
}

// ---------- board ----------

type MoveFn = (lead: Lead, stage: LeadStage) => void;

function Board({
  leads,
  onOpen,
  onMove,
}: {
  leads: Lead[];
  onOpen: (id: string) => void;
  onMove: MoveFn;
}) {
  const groups = leadsByStage(leads);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<LeadStage | null>(null);

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
      <div className="flex snap-x snap-mandatory gap-3 sm:snap-none">
        {LEAD_STAGES.map((stage) => {
          const items = groups[stage.value];
          const value = items.reduce((s, l) => s + l.budget, 0);
          return (
            <section
              key={stage.value}
              aria-label={`${stage.label} (${items.length})`}
              onDragOver={(e) => {
                if (!dragging) return;
                e.preventDefault();
                setOver(stage.value);
              }}
              onDragLeave={() => setOver((o) => (o === stage.value ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                const lead = leads.find((l) => l.id === e.dataTransfer.getData("text/lead"));
                if (lead) onMove(lead, stage.value);
                setDragging(null);
                setOver(null);
              }}
              className={cn(
                "flex w-[78vw] max-w-[17rem] shrink-0 snap-start flex-col rounded-lg border bg-muted/40 p-2 transition-colors sm:w-[16.5rem]",
                over === stage.value && "border-ring bg-accent/60",
                stage.value === "lost" && "opacity-80",
              )}
            >
              <header className="px-1.5 pb-2 pt-1">
                <p className="flex items-center gap-2 text-xs font-semibold">
                  <span className={cn("h-2 w-2 rounded-full", STAGE_DOT[stage.value])} />
                  {stage.label}
                  <span className="ml-auto rounded bg-card px-1.5 text-[11px] font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </p>
                <p className="mt-0.5 pl-4 text-[11px] text-muted-foreground">
                  {items.length ? moneyShort(value) : stage.hint}
                </p>
              </header>
              <ul className="flex min-h-24 flex-1 flex-col gap-2">
                {items.map((l) => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    onOpen={() => onOpen(l.id)}
                    onMove={onMove}
                    dragging={dragging === l.id}
                    onDragStart={() => setDragging(l.id)}
                    onDragEnd={() => {
                      setDragging(null);
                      setOver(null);
                    }}
                  />
                ))}
                {items.length === 0 ? (
                  <li className="flex flex-1 items-center justify-center rounded-md border border-dashed px-3 py-6 text-center text-[11px] text-muted-foreground">
                    {dragging ? "Drop here" : "No leads"}
                  </li>
                ) : null}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  onOpen,
  onMove,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  lead: Lead;
  onOpen: () => void;
  onMove: MoveFn;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const { state: demo } = useDemo();
  const client = matchingClient(lead, demo.clients);
  const received = relativeDay(lead.receivedAt.slice(0, 10), DEMO_TODAY);

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/lead", lead.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative cursor-grab rounded-md border bg-card p-3 shadow-soft transition-shadow hover:shadow-lift active:cursor-grabbing",
        dragging && "opacity-40",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full pr-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Open ${lead.name}'s inquiry`}
      >
        <span className="block truncate text-sm font-medium">{lead.name}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {CLIENT_TYPE_LABELS[lead.type]} · {moneyShort(lead.budget)}
        </span>
        {lead.eventDate ? (
          <span className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarDays className="h-3 w-3" /> {formatDate(lead.eventDate)}
          </span>
        ) : null}
        <span className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {received} · {CLIENT_SOURCE_LABELS[lead.source]}
          {client ? (
            <span className="rounded bg-success/12 px-1 font-medium text-success">Client</span>
          ) : null}
          {lead.stage === "lost" && lead.lostReason ? (
            <span className="rounded bg-muted px-1">{lead.lostReason}</span>
          ) : null}
        </span>
      </button>
      <div className="absolute right-1.5 top-1.5">
        <MoveMenu lead={lead} onMove={onMove} />
      </div>
    </li>
  );
}

/** Stage picker. `variant="field"` renders it like a select, for the list view. */
function MoveMenu({
  lead,
  onMove,
  variant = "icon",
}: {
  lead: Lead;
  onMove: MoveFn;
  variant?: "icon" | "field";
}) {
  const next = nextStage(lead.stage);
  return (
    // Non-modal: "Mark as lost…" opens a dialog, and a modal menu (or a Radix Select) would
    // leave the page unclickable (body pointer-events) after that dialog closes.
    <DropdownMenu modal={false}>
      {variant === "icon" ? (
        <DropdownMenuTrigger
          aria-label={`Change stage for ${lead.name}`}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger
          aria-label={`Stage for ${lead.name}`}
          className="flex h-8 w-[9.5rem] shrink-0 items-center justify-between gap-1.5 rounded-md border border-input bg-card px-2.5 text-xs hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:w-full"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", STAGE_DOT[lead.stage])} />
            <span className="truncate">{LEAD_STAGE_LABELS[lead.stage]}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align="end" className="w-48">
        {next ? (
          <>
            <DropdownMenuItem onSelect={() => onMove(lead, next)}>
              <ArrowRight className="h-4 w-4" /> Move to {LEAD_STAGE_LABELS[next]}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
          Move to stage
        </DropdownMenuLabel>
        {LEAD_STAGES.map((s) => (
          <DropdownMenuItem
            key={s.value}
            disabled={s.value === lead.stage}
            onSelect={() => onMove(lead, s.value)}
          >
            <span className={cn("h-2 w-2 rounded-full", STAGE_DOT[s.value])} />
            {s.value === "lost" ? "Mark as lost…" : s.label}
            {s.value === lead.stage ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------- list ----------

function LeadList({
  leads,
  onOpen,
  onMove,
}: {
  leads: Lead[];
  onOpen: (id: string) => void;
  onMove: MoveFn;
}) {
  const cols = "md:grid md:grid-cols-[minmax(0,1.6fr)_7rem_6rem_7rem_10.5rem]";
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
      <div
        className={cn(
          "hidden gap-3 border-b bg-muted/40 px-4 py-2 text-[11px] font-medium text-muted-foreground",
          cols,
        )}
      >
        <span>Lead</span>
        <span>Type</span>
        <span className="text-right">Budget</span>
        <span>Received</span>
        <span>Stage</span>
      </div>
      <ul className="divide-y">
        {leads.map((l) => (
          <li key={l.id} className={cn("flex items-center gap-3 px-4 py-3 md:items-center", cols)}>
            <button type="button" onClick={() => onOpen(l.id)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium">{l.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{l.email}</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground md:hidden">
                {CLIENT_TYPE_LABELS[l.type]} · {moneyShort(l.budget)} ·{" "}
                {relativeDay(l.receivedAt.slice(0, 10), DEMO_TODAY)}
              </span>
            </button>
            <span className="hidden text-xs md:block">{CLIENT_TYPE_LABELS[l.type]}</span>
            <span className="hidden text-right text-xs tabular-nums md:block">
              {moneyShort(l.budget)}
            </span>
            <span className="hidden text-xs text-muted-foreground md:block">
              {relativeDay(l.receivedAt.slice(0, 10), DEMO_TODAY)}
            </span>
            <MoveMenu lead={l} onMove={onMove} variant="field" />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- detail sheet ----------

function LeadSheet({
  lead,
  onClose,
  onMove,
  onDeleted,
}: {
  lead: Lead | undefined;
  onClose: () => void;
  onMove: MoveFn;
  onDeleted: () => void;
}) {
  const { state: demo, convertLead, deleteLead, restoreLead } = useDemo();
  const goTo = useNavigate();
  const client = lead ? matchingClient(lead, demo.clients) : undefined;

  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {lead ? (
          <div className="space-y-5 pb-6">
            <SheetHeader className="space-y-2 text-left">
              <StageBadge stage={lead.stage} />
              <SheetTitle className="display-title text-2xl">{lead.name}</SheetTitle>
              <SheetDescription>
                {CLIENT_TYPE_LABELS[lead.type]} inquiry · received{" "}
                {relativeDay(lead.receivedAt.slice(0, 10), DEMO_TODAY).toLowerCase()} via{" "}
                {CLIENT_SOURCE_LABELS[lead.source]}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-wrap gap-2 px-4">
              <Button asChild size="sm" variant="outline" className="bg-card">
                <a
                  href={`mailto:${lead.email}?subject=${encodeURIComponent(
                    `Re: your ${CLIENT_TYPE_LABELS[lead.type].toLowerCase()} photography inquiry`,
                  )}`}
                >
                  <Mail /> Reply
                </a>
              </Button>
              {lead.phone ? (
                <Button asChild size="sm" variant="outline" className="bg-card">
                  <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}>
                    <Phone /> Call
                  </a>
                </Button>
              ) : null}
            </div>

            <section className="px-4">
              <h3 className="text-sm font-semibold">Stage</h3>
              {lead.stage === "lost" ? (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2.5 text-xs">
                  <span>Lost{lead.lostReason ? ` — ${lead.lostReason}` : ""}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 bg-card text-xs"
                    onClick={() => {
                      const last = [...lead.history].reverse().find((h) => h.stage !== "lost");
                      onMove(lead, last?.stage ?? "new");
                    }}
                  >
                    <RotateCcw /> Reopen
                  </Button>
                </div>
              ) : (
                <>
                  <ol className="mt-2 grid grid-cols-5 gap-1" aria-label="Pipeline stage">
                    {[...OPEN_STAGES, "booked" as const].map((s, i, all) => {
                      const current = all.indexOf(lead.stage);
                      return (
                        <li key={s}>
                          <button
                            type="button"
                            onClick={() => onMove(lead, s)}
                            aria-current={s === lead.stage ? "step" : undefined}
                            title={LEAD_STAGE_LABELS[s]}
                            className="group w-full text-left"
                          >
                            <span
                              className={cn(
                                "block h-1.5 rounded-full transition-colors",
                                i <= current
                                  ? STAGE_DOT[lead.stage]
                                  : "bg-muted group-hover:bg-accent",
                              )}
                            />
                            <span
                              className={cn(
                                "mt-1.5 block truncate text-[10px]",
                                s === lead.stage ? "font-semibold" : "text-muted-foreground",
                              )}
                            >
                              {LEAD_STAGE_LABELS[s].replace(" inquiry", "").replace(" sent", "")}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {nextStage(lead.stage) ? (
                      <Button size="sm" onClick={() => onMove(lead, nextStage(lead.stage)!)}>
                        Move to {LEAD_STAGE_LABELS[nextStage(lead.stage)!]} <ArrowRight />
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-card"
                      onClick={() => onMove(lead, "lost")}
                    >
                      Mark as lost
                    </Button>
                  </div>
                </>
              )}
            </section>

            <section className="px-4">
              <h3 className="text-sm font-semibold">Inquiry</h3>
              <blockquote className="mt-2 whitespace-pre-wrap rounded-md border-l-2 border-clay bg-muted/40 px-3 py-2.5 text-sm leading-relaxed">
                {lead.message}
              </blockquote>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <Detail label="Session type" value={CLIENT_TYPE_LABELS[lead.type]} />
                <Detail label="Estimated budget" value={money(lead.budget)} />
                <Detail
                  label="Requested date"
                  value={lead.eventDate ? formatDate(lead.eventDate) : "Flexible"}
                />
                <Detail label="Source" value={CLIENT_SOURCE_LABELS[lead.source]} />
                <Detail
                  label="Location"
                  value={
                    lead.location ? (
                      <span className="inline-flex items-start gap-1">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {lead.location}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                  wide
                />
                <Detail
                  label="Email"
                  value={
                    <a className="break-all hover:underline" href={`mailto:${lead.email}`}>
                      {lead.email}
                    </a>
                  }
                  wide
                />
                <Detail label="Phone" value={lead.phone || "—"} />
              </dl>
            </section>

            {lead.requested ? (
              <RequestedSlot
                lead={lead}
                onConfirmed={(id) => void goTo({ to: "/studio/sessions/$id", params: { id } })}
              />
            ) : null}

            <section className="px-4">
              <h3 className="text-sm font-semibold">Client profile</h3>
              <div className="mt-2 rounded-md border p-3 text-xs">
                {lead.clientId && client ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-success" /> Linked to {client.name}
                    </span>
                    <Button asChild size="sm" variant="outline" className="h-7 bg-card text-xs">
                      <Link to="/clients/$id" params={{ id: client.id }}>
                        View profile
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      {client
                        ? `This email belongs to your client ${client.name}. Linking marks the lead as booked and logs it on their profile.`
                        : "Converting creates a client profile from this inquiry and marks the lead as booked."}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        convertLead(lead.id);
                        toast.success(
                          client ? `Linked to ${client.name}` : `${lead.name} is now a client`,
                        );
                      }}
                    >
                      <UserCheck /> {client ? "Link to client & book" : "Convert to client"}
                    </Button>
                  </div>
                )}
              </div>
            </section>

            <section className="px-4">
              <h3 className="text-sm font-semibold">History</h3>
              <ol className="mt-2 space-y-2 border-l pl-4">
                {[...lead.history].reverse().map((h, i) => (
                  <li key={`${h.at}-${i}`} className="relative text-xs">
                    <span
                      className={cn(
                        "absolute -left-[1.3rem] top-1 h-2 w-2 rounded-full ring-2 ring-card",
                        STAGE_DOT[h.stage],
                      )}
                    />
                    <span className="font-medium">
                      {h.stage === "new"
                        ? "Inquiry received"
                        : `Moved to ${LEAD_STAGE_LABELS[h.stage]}`}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {formatDate(h.at.slice(0, 10))} · {formatTime(h.at.slice(11, 16))}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <div className="border-t px-4 pt-4">
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  deleteLead(lead.id);
                  onDeleted();
                  toast("Lead deleted", {
                    description: lead.name,
                    action: { label: "Undo", onClick: () => restoreLead(lead) },
                  });
                }}
              >
                <Trash2 /> Delete lead
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/** A slot requested on the public booking page, confirmable in one step. */
function RequestedSlot({
  lead,
  onConfirmed,
}: {
  lead: Lead;
  onConfirmed: (sessionId: string) => void;
}) {
  const { state: demo, convertLead, addSession, updateSessionStatus, setLeadSession } = useDemo();
  const r = lead.requested!;
  const type = demo.bookingTypes.find((t) => t.id === r.typeId);
  const session = lead.sessionId ? demo.sessions.find((x) => x.id === lead.sessionId) : undefined;
  const conflicts = session ? [] : findConflicts(demo.sessions, r);

  const confirm = () => {
    const clientId = convertLead(lead.id);
    if (!clientId) return;
    const created = addSession({
      title: type?.name ?? "Session",
      clientId,
      kind: type?.kind ?? "shoot",
      date: r.date,
      start: r.start,
      end: r.end,
      location: type?.location ?? lead.location,
      notes: lead.message,
    });
    updateSessionStatus(created.id, "confirmed");
    setLeadSession(lead.id, created.id);
    toast.success("Booking confirmed", {
      description: `${type?.name ?? "Session"} · ${slotLabel(r.date, r.start)}`,
      action: { label: "View session", onClick: () => onConfirmed(created.id) },
    });
  };

  return (
    <section className="px-4">
      <h3 className="text-sm font-semibold">Requested on your booking page</h3>
      <div className="mt-2 space-y-2 rounded-md border p-3 text-xs">
        <p className="flex items-center gap-1.5 font-medium">
          <CalendarDays className="h-3.5 w-3.5" /> {type?.name ?? "Session"} ·{" "}
          {slotLabel(r.date, r.start)}–{formatTime(r.end)}
        </p>
        {session ? (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-success">
              <Check className="h-3.5 w-3.5" /> Confirmed as a session
            </span>
            <Button asChild size="sm" variant="outline" className="h-7 bg-card text-xs">
              <Link to="/studio/sessions/$id" params={{ id: session.id }}>
                View session
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {conflicts.length ? (
              <p className="rounded bg-warning/10 px-2 py-1.5 text-warning">
                This slot now overlaps {conflicts.map((c) => c.title).join(", ")}. Reply to suggest
                another time, or confirm anyway.
              </p>
            ) : (
              <p className="text-muted-foreground">
                The slot is still free. Confirming creates their client profile (or links the
                existing one) and books a confirmed session.
              </p>
            )}
            <Button size="sm" onClick={confirm}>
              <CalendarCheck2 /> Confirm booking
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

function Detail({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && "col-span-2")}>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function LostReasonDialog({ leadId, onClose }: { leadId: string | null; onClose: () => void }) {
  const { state: demo, moveLead } = useDemo();
  const lead = demo.leads.find((l) => l.id === leadId);
  const [reason, setReason] = useState<string>(LOST_REASONS[0]);

  return (
    <Dialog open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!lead) return;
            moveLead(lead.id, "lost", reason);
            toast(`${lead.name} marked as lost`, { description: reason });
            onClose();
          }}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle className="display-title text-xl">Why was it lost?</DialogTitle>
            <DialogDescription>
              Tracking reasons shows where bookings slip away. {lead ? `(${lead.name})` : ""}
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={reason} onValueChange={setReason} className="gap-2.5">
            {LOST_REASONS.map((r) => (
              <div key={r} className="flex items-center gap-2">
                <RadioGroupItem id={`lost-${r}`} value={r} />
                <Label htmlFor={`lost-${r}`} className="font-normal">
                  {r}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Mark as lost</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- add ----------

const EMPTY_LEAD = {
  name: "",
  email: "",
  phone: "",
  type: "wedding" as ClientType,
  source: "website" as ClientSource,
  eventDate: "",
  location: "",
  budget: "",
  message: "",
};

function AddLeadDialog({
  onCreated,
  label = "Add lead",
}: {
  onCreated: (lead: Lead) => void;
  label?: string;
}) {
  const { state: demo, addLead } = useDemo();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_LEAD);
  const [submitted, setSubmitted] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const errors = validateLeadForm(form, demo.leads);
  const visible = (k: keyof LeadFormErrors) => (submitted ? errors[k] : undefined);
  const describe = (k: keyof LeadFormErrors) =>
    visible(k) ? { "aria-invalid": true, "aria-describedby": `al-${k}-error` } : {};
  const existing = form.email.includes("@")
    ? matchingClient({ email: form.email }, demo.clients)
    : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    const lead = addLead({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      type: form.type,
      source: form.source,
      eventDate: form.eventDate,
      location: form.location.trim(),
      budget: form.budget.trim() ? Math.round(Number(form.budget)) : 0,
      message: form.message.trim(),
    });
    toast.success(`Inquiry from ${lead.name} added to New`);
    setOpen(false);
    onCreated(lead);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setForm(EMPTY_LEAD);
          setSubmitted(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle className="display-title text-xl">Log an inquiry</DialogTitle>
            <DialogDescription>
              For inquiries that came in by phone, email or DM. Booking-page inquiries are added
              automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="al-name"
              label="Name"
              required
              error={visible("name")}
              className="sm:col-span-2"
            >
              <Input
                id="al-name"
                autoFocus
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                {...describe("name")}
              />
            </Field>
            <Field
              id="al-email"
              label="Email"
              required
              error={visible("email")}
              hint={existing ? `Existing client: ${existing.name}` : undefined}
            >
              <Input
                id="al-email"
                type="email"
                value={form.email}
                onChange={(e) => set({ email: e.target.value })}
                {...describe("email")}
              />
            </Field>
            <Field id="al-phone" label="Phone" error={visible("phone")}>
              <Input
                id="al-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value })}
                {...describe("phone")}
              />
            </Field>
            <div className="space-y-1.5">
              <Label>Session type</Label>
              <Select value={form.type} onValueChange={(v) => set({ type: v as ClientType })}>
                <SelectTrigger aria-label="Session type">
                  <SelectValue>{CLIENT_TYPE_LABELS[form.type]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CLIENT_TYPE_LABELS) as ClientType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {CLIENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => set({ source: v as ClientSource })}>
                <SelectTrigger aria-label="Source">
                  <SelectValue>{CLIENT_SOURCE_LABELS[form.source]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CLIENT_SOURCE_LABELS) as ClientSource[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {CLIENT_SOURCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field id="al-date" label="Requested date">
              <Input
                id="al-date"
                type="date"
                min={DEMO_TODAY}
                value={form.eventDate}
                onChange={(e) => set({ eventDate: e.target.value })}
              />
            </Field>
            <Field id="al-budget" label="Estimated budget ($)" error={visible("budget")}>
              <Input
                id="al-budget"
                inputMode="decimal"
                value={form.budget}
                onChange={(e) => set({ budget: e.target.value })}
                placeholder="e.g. 2500"
                {...describe("budget")}
              />
            </Field>
            <Field id="al-location" label="Location" className="sm:col-span-2">
              <Input
                id="al-location"
                value={form.location}
                onChange={(e) => set({ location: e.target.value })}
                placeholder="Venue or area"
              />
            </Field>
            <Field
              id="al-message"
              label="What they asked for"
              required
              error={visible("message")}
              className="sm:col-span-2"
            >
              <Textarea
                id="al-message"
                rows={4}
                value={form.message}
                onChange={(e) => set({ message: e.target.value })}
                {...describe("message")}
              />
            </Field>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add inquiry</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BoardSkeleton() {
  return (
    <div
      className="flex gap-3 overflow-hidden"
      aria-busy="true"
      aria-label="Loading leads"
      role="status"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="w-[16.5rem] shrink-0 space-y-2 rounded-lg border bg-muted/40 p-2">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 3 - (i % 2) }, (_, j) => (
            <Skeleton key={j} className="h-24 w-full rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}
