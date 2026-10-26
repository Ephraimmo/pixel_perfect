import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ComponentType, type ReactNode } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Copy,
  CreditCard,
  FileText,
  Images,
  Link2,
  Mail,
  MapPin,
  MoreHorizontal,
  PenLine,
  Phone,
  Pin,
  PinOff,
  Star,
  StickyNote,
  Trash2,
  Unlink,
  UserCog,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  EmptyState,
  PageError,
  Panel,
  PersonAvatar,
  StatusBadge,
  TabBar,
  pageHead,
} from "@/components/kit";
import { ClientFormDialog } from "@/components/clients";
import { AddSessionDialog } from "@/components/studio";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/lib/store";
import {
  DEMO_TODAY,
  formatDate,
  formatTime,
  img,
  money,
  moneyShort,
  type Client,
} from "@/lib/demo-data";
import type { Invoice } from "@/lib/crm-data";
import {
  CLIENT_SOURCE_LABELS,
  CLIENT_TYPE_LABELS,
  NOTE_MAX,
  clientTimeline,
  groupByDay,
  relativeDay,
  sortNotes,
  type TimelineEntry,
} from "@/lib/clients";
import {
  INVOICE_STATUS_LABELS,
  invoiceBalance,
  invoiceDisplayStatus,
  invoiceTotal,
} from "@/lib/invoices";
import { cn } from "@/lib/utils";

type Tab = "activity" | "sessions" | "galleries" | "invoices" | "notes";
const TABS: Tab[] = ["activity", "sessions", "galleries", "invoices", "notes"];

export const Route = createFileRoute("/_app/clients/$id")({
  head: () => pageHead("Client", "Contact details, sessions, galleries, invoices and notes."),
  validateSearch: (raw: Record<string, unknown>): { tab?: Tab } => {
    const { tab } = raw;
    return TABS.includes(tab as Tab) && tab !== "activity" ? { tab: tab as Tab } : {};
  },
  component: ClientProfile,
  errorComponent: ({ reset }) => <PageError title="Couldn't load this client" reset={reset} />,
});

const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

function ClientProfile() {
  const { id } = Route.useParams();
  const { tab = "activity" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { state: demo, ready, toggleClientStar, setClientStatus } = useDemo();
  const client = demo.clients.find((c) => c.id === id);

  if (!ready) return <ProfileSkeleton />;
  if (!client) {
    return (
      <div className="mx-auto max-w-5xl">
        <BackLink />
        <EmptyState
          title="Client not found"
          description="This client may have been removed, or the link is incomplete."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/clients">View all clients</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const sessions = demo.sessions.filter((s) => s.clientId === id);
  const galleries = demo.galleries.filter((g) => g.clientId === id);
  const invoices = demo.invoices
    .filter((i) => i.clientId === id)
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  const notes = sortNotes(demo.clientNotes.filter((n) => n.clientId === id));
  const outstanding = invoices.reduce((sum, i) => sum + invoiceBalance(i), 0);
  const overdue = invoices.filter((i) => invoiceDisplayStatus(i, DEMO_TODAY) === "overdue").length;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(client.email);
      toast.success("Email copied", { description: client.email });
    } catch {
      toast.info(client.email);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink />

      <Panel className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <PersonAvatar
            name={client.name}
            photo={client.avatar}
            size={160}
            className="h-16 w-16 text-lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="display-title text-2xl">{client.name}</h1>
              <button
                type="button"
                aria-label={client.starred ? "Unstar client" : "Star client"}
                aria-pressed={client.starred}
                onClick={() => toggleClientStar(client.id)}
                className="rounded p-1 text-muted-foreground hover:text-warning"
              >
                <Star className={cn("h-4 w-4", client.starred && "fill-warning text-warning")} />
              </button>
              <StatusBadge
                status={client.status}
                label={client.status === "past" ? "Past client" : "Active"}
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {[CLIENT_TYPE_LABELS[client.type] + " client", client.company, client.city]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {client.tags.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {client.tags.map((t) => (
                  <span key={t} className="rounded-full border px-2 py-0.5 text-[11px]">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline" className="bg-card">
              <a href={`mailto:${client.email}`}>
                <Mail /> Email
              </a>
            </Button>
            {client.phone ? (
              <Button asChild size="sm" variant="outline" className="bg-card">
                <a href={tel(client.phone)}>
                  <Phone /> Call
                </a>
              </Button>
            ) : null}
            <ClientFormDialog
              client={client}
              trigger={
                <Button size="sm">
                  <PenLine /> Edit
                </Button>
              }
              onSaved={() => toast.success("Contact details saved")}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="bg-card" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={() => void copyEmail()}>
                  <Copy className="h-4 w-4" /> Copy email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    const next = client.status === "past" ? "active" : "past";
                    setClientStatus(client.id, next);
                    toast.success(
                      next === "past" ? "Moved to past clients" : "Marked as an active client",
                    );
                  }}
                >
                  <UserCog className="h-4 w-4" />
                  {client.status === "past" ? "Mark as active" : "Mark as past client"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Panel>

      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Lifetime sessions" value={client.sessions} />
        <Stat label="Galleries" value={galleries.length} />
        <Stat label="Total spent" value={moneyShort(client.totalSpent)} />
        <Stat
          label="Outstanding"
          value={money(outstanding)}
          sub={overdue ? `${overdue} overdue` : outstanding ? "Not yet due" : "All settled"}
          tone={overdue ? "rose" : undefined}
        />
      </dl>

      <div className="mt-5 grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <ContactCard client={client} />

        <div className="min-w-0">
          <TabBar
            value={tab}
            onChange={(t) =>
              void navigate({ search: t === "activity" ? {} : { tab: t }, replace: true })
            }
            tabs={[
              { value: "activity", label: "Activity" },
              { value: "sessions", label: `Sessions (${sessions.length})` },
              { value: "galleries", label: `Galleries (${galleries.length})` },
              { value: "invoices", label: `Invoices (${invoices.length})` },
              { value: "notes", label: `Notes (${notes.length})` },
            ]}
          />
          <div className="mt-4" role="tabpanel">
            {tab === "activity" ? (
              <ActivityTab entries={clientTimeline(client, demo.clientEvents)} />
            ) : tab === "sessions" ? (
              <SessionsTab clientId={client.id} />
            ) : tab === "galleries" ? (
              <GalleriesTab clientId={client.id} />
            ) : tab === "invoices" ? (
              <InvoicesTab client={client} invoices={invoices} />
            ) : (
              <NotesTab clientId={client.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/clients"
      className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> All clients
    </Link>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: "rose" | undefined;
}) {
  return (
    <div className="rounded-lg border bg-card p-3.5 shadow-soft">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{value}</dd>
      {sub ? (
        <dd className={cn("text-[11px] text-muted-foreground", tone === "rose" && "text-rose")}>
          {sub}
        </dd>
      ) : null}
    </div>
  );
}

function ContactCard({ client }: { client: Client }) {
  const rows: [ComponentType<{ className?: string }>, string, ReactNode][] = [
    [
      Mail,
      "Email",
      <a key="e" href={`mailto:${client.email}`} className="break-all hover:underline">
        {client.email}
      </a>,
    ],
    [
      Phone,
      "Phone",
      client.phone ? (
        <a key="p" href={tel(client.phone)} className="hover:underline">
          {client.phone}
        </a>
      ) : (
        <span key="p" className="text-muted-foreground">
          Not added
        </span>
      ),
    ],
    [Building2, "Company", client.company || <span className="text-muted-foreground">—</span>],
    [MapPin, "City", client.city || <span className="text-muted-foreground">—</span>],
    [UserPlus, "Source", CLIENT_SOURCE_LABELS[client.source]],
    [CalendarDays, "Client since", formatDate(client.createdAt)],
  ];
  return (
    <Panel className="h-fit p-4">
      <h2 className="text-sm font-semibold">Contact information</h2>
      <dl className="mt-3 space-y-3 text-xs">
        {rows.map(([Icon, label, value]) => (
          <div key={label} className="flex gap-2.5">
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <dt className="text-[11px] text-muted-foreground">{label}</dt>
              <dd className="mt-0.5">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t pt-3 text-[11px] text-muted-foreground">
        Last activity {relativeDay(client.lastActivity, DEMO_TODAY).toLowerCase()}
      </p>
    </Panel>
  );
}

// ---------- tabs ----------

const EVENT_ICON: Record<TimelineEntry["kind"], ComponentType<{ className?: string }>> = {
  email: Mail,
  call: Phone,
  session: CalendarDays,
  gallery: Images,
  invoice: FileText,
  payment: CreditCard,
  note: StickyNote,
  contract: PenLine,
  update: UserCog,
  created: UserPlus,
};

function dayHeading(day: string) {
  if (day === DEMO_TODAY) return "Today";
  const rel = relativeDay(day, DEMO_TODAY);
  return rel === "Yesterday" ? rel : format(new Date(`${day}T12:00:00`), "EEE, MMM d, yyyy");
}

function ActivityTab({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="space-y-5">
      {groupByDay(entries).map((g) => (
        <li key={g.day}>
          <p className="eyebrow mb-2">{dayHeading(g.day)}</p>
          <ul className="overflow-hidden rounded-lg border bg-card">
            {g.items.map((e) => {
              const Icon = EVENT_ICON[e.kind];
              return (
                <li key={e.id} className="flex gap-3 border-b px-4 py-3 last:border-b-0">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{e.title}</p>
                    {e.detail ? (
                      <p className="mt-0.5 break-words text-xs text-muted-foreground">{e.detail}</p>
                    ) : null}
                  </div>
                  {e.at.length > 10 ? (
                    <time className="shrink-0 text-[11px] text-muted-foreground">
                      {formatTime(e.at.slice(11, 16))}
                    </time>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function SessionsTab({ clientId }: { clientId: string }) {
  const { state: demo } = useDemo();
  const all = demo.sessions
    .filter((s) => s.clientId === clientId)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const upcoming = all.filter((s) => s.date >= DEMO_TODAY);
  const past = all.filter((s) => s.date < DEMO_TODAY).reverse();

  const list = (title: string, items: typeof all) =>
    items.length ? (
      <section>
        <p className="eyebrow mb-2">{title}</p>
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {items.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex w-11 shrink-0 flex-col items-center rounded-md border py-1">
                <span className="text-[10px] uppercase text-muted-foreground">
                  {format(new Date(`${s.date}T12:00:00`), "MMM")}
                </span>
                <span className="text-sm font-semibold leading-none">
                  {format(new Date(`${s.date}T12:00:00`), "d")}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatTime(s.start)} – {formatTime(s.end)} · {s.location}
                </p>
              </div>
              <StatusBadge status={s.status} />
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddSessionDialog
          defaultClientId={clientId}
          defaultDate={DEMO_TODAY}
          triggerLabel="Book session"
        />
      </div>
      {all.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          description="Book a session for this client and it will show up here and on your calendar."
        />
      ) : (
        <>
          {list("Upcoming", upcoming)}
          {list("Past", past)}
        </>
      )}
    </div>
  );
}

function GalleriesTab({ clientId }: { clientId: string }) {
  const { state: demo, linkGallery } = useDemo();
  const linked = demo.galleries.filter((g) => g.clientId === clientId);
  const unlinked = demo.galleries.filter((g) => !g.clientId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {unlinked.length ? (
          <Select
            value=""
            onValueChange={(gid) => {
              linkGallery(gid, clientId);
              toast.success("Gallery linked to this client");
            }}
          >
            <SelectTrigger className="h-8 w-auto gap-2 bg-card text-xs" aria-label="Link a gallery">
              <Link2 className="h-3.5 w-3.5" />
              <SelectValue placeholder="Link a gallery" />
            </SelectTrigger>
            <SelectContent>
              {unlinked.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Button asChild size="sm" variant="outline" className="bg-card">
          <Link to="/galleries">
            <Images /> All galleries
          </Link>
        </Button>
      </div>
      {linked.length === 0 ? (
        <EmptyState
          title="No galleries yet"
          description={
            unlinked.length
              ? "Link an existing gallery above, or create one from Galleries."
              : "Create a gallery from Galleries, then link it to this client."
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {linked.map((g) => (
            <li key={g.id} className="photo-card photo-card-hover group relative bg-card">
              <Link to="/galleries/$id" params={{ id: g.id }} className="block">
                {g.photos.length ? (
                  <img
                    src={img(g.cover, 640, 360)}
                    alt=""
                    loading="lazy"
                    className="aspect-[16/9] w-full bg-muted object-cover"
                  />
                ) : (
                  <span className="flex aspect-[16/9] items-center justify-center bg-muted text-xs text-muted-foreground">
                    No photos yet
                  </span>
                )}
                <div className="p-3">
                  <p className="truncate text-sm font-medium">{g.title}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge status={g.status} /> {g.photoCount} photos · {formatDate(g.date)}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                aria-label={`Unlink ${g.title}`}
                title="Unlink from client"
                onClick={() => {
                  linkGallery(g.id, undefined);
                  toast.success(`${g.title} unlinked`, {
                    action: { label: "Undo", onClick: () => linkGallery(g.id, clientId) },
                  });
                }}
                className="absolute right-2 top-2 rounded-md bg-card/90 p-1.5 text-muted-foreground opacity-100 shadow-soft hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                <Unlink className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InvoicesTab({ client, invoices }: { client: Client; invoices: Invoice[] }) {
  const { markInvoicePaid } = useDemo();
  if (invoices.length === 0) {
    return (
      <EmptyState
        title="No invoices yet"
        description="Invoices you send this client will appear here with their payment status."
      />
    );
  }
  const paid = invoices.reduce((sum, i) => sum + (i.status === "void" ? 0 : i.amountPaid), 0);
  const outstanding = invoices.reduce((sum, i) => sum + invoiceBalance(i), 0);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {money(paid)} paid ·{" "}
        <span className="text-foreground">{money(outstanding)} outstanding</span>
      </p>
      <ul className="divide-y overflow-hidden rounded-lg border bg-card">
        {invoices.map((inv) => {
          const status = invoiceDisplayStatus(inv, DEMO_TODAY);
          const balance = invoiceBalance(inv);
          return (
            <li key={inv.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {inv.number}
                  <StatusBadge status={status} label={INVOICE_STATUS_LABELS[status]} />
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {inv.items[0]?.description}
                  {inv.items.length > 1 ? ` + ${inv.items.length - 1} more` : ""}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Issued {formatDate(inv.issueDate)} ·{" "}
                  {inv.status === "paid" && inv.paidDate
                    ? `Paid ${formatDate(inv.paidDate)}`
                    : `Due ${formatDate(inv.dueDate)}`}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{money(invoiceTotal(inv))}</span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Actions for ${inv.number}`}
                  className="rounded p-1 text-muted-foreground hover:bg-accent"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    disabled={balance === 0}
                    onSelect={() => {
                      markInvoicePaid(inv.id);
                      toast.success(`${inv.number} marked as paid`, {
                        description: `${money(balance)} recorded`,
                      });
                    }}
                  >
                    <CreditCard className="h-4 w-4" /> Mark as paid
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild disabled={balance === 0}>
                    <a
                      href={`mailto:${client.email}?subject=${encodeURIComponent(
                        `Reminder: ${inv.number} (${money(balance)})`,
                      )}`}
                    >
                      <Mail className="h-4 w-4" /> Email a reminder
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NotesTab({ clientId }: { clientId: string }) {
  const {
    state: demo,
    addClientNote,
    toggleNotePin,
    deleteClientNote,
    restoreClientNote,
  } = useDemo();
  const [draft, setDraft] = useState("");
  const notes = sortNotes(demo.clientNotes.filter((n) => n.clientId === clientId));
  const body = draft.trim();

  const save = () => {
    if (!body) return;
    addClientNote(clientId, body);
    setDraft("");
    toast.success("Note added");
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="rounded-lg border bg-card p-3"
      >
        <label htmlFor="note-draft" className="sr-only">
          New note
        </label>
        <Textarea
          id="note-draft"
          value={draft}
          maxLength={NOTE_MAX}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
          }}
          placeholder="Add a private note — preferences, family names, shot ideas..."
          className="min-h-20 resize-y border-0 bg-transparent p-1 text-sm shadow-none focus-visible:ring-0"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            Only your studio sees notes · {draft.length}/{NOTE_MAX}
          </span>
          <Button type="submit" size="sm" disabled={!body}>
            Add note
          </Button>
        </div>
      </form>

      {notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          description="Keep track of preferences and details you'll want before the next shoot."
        />
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className={cn(
                "rounded-lg border bg-card p-3.5",
                n.pinned && "border-sand-foreground/20 bg-sand/40",
              )}
            >
              <p className="whitespace-pre-wrap break-words text-sm">{n.body}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  {n.pinned ? <Pin className="h-3 w-3" aria-label="Pinned" /> : null}
                  {formatDate(n.createdAt.slice(0, 10))} · {formatTime(n.createdAt.slice(11, 16))}
                </span>
                <span className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleNotePin(n.id)}
                    aria-label={n.pinned ? "Unpin note" : "Pin note"}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {n.pinned ? (
                      <PinOff className="h-3.5 w-3.5" />
                    ) : (
                      <Pin className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteClientNote(n.id);
                      toast("Note deleted", {
                        action: { label: "Undo", onClick: () => restoreClientNote(n) },
                      });
                    }}
                    aria-label="Delete note"
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-6xl" aria-busy="true" aria-label="Loading client" role="status">
      <Skeleton className="mb-4 h-3 w-20" />
      <div className="flex items-center gap-4 rounded-lg border bg-card p-5">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3.5 w-64 max-w-full" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}
