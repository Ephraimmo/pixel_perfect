import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  FileText,
  ImageOff,
  Link2,
  MoreHorizontal,
  PenLine,
  Plus,
  Trash2,
  Unlink,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  EmptyState,
  PageError,
  Panel,
  PersonAvatar,
  StatusBadge,
  pageHead,
} from "@/components/kit";
import {
  PROJECT_STATUS_DOT,
  ProgressBar,
  ProjectFormDialog,
  dueLabel,
} from "@/components/projects";
import { KindLabel, SessionFormDialog } from "@/components/studio";
import { QuoteStatusBadge } from "@/components/quotes";
import { ContractStatusBadge, NewContractDialog, SignatureProgress } from "@/components/contracts";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, formatDate, img, money, moneyShort } from "@/lib/demo-data";
import type { Project } from "@/lib/projects-data";
import { CLIENT_TYPE_LABELS } from "@/lib/clients";
import { INVOICE_STATUS_LABELS, invoiceDisplayStatus, invoiceTotal } from "@/lib/invoices";
import { PROJECT_STATUSES, projectMoney, projectOf, projectProgress } from "@/lib/projects";
import { SESSION_STATUS_LABELS, slotLabel } from "@/lib/sessions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/projects/$id")({
  head: () => pageHead("Project", "Project tasks, sessions, galleries and invoices."),
  component: ProjectDetails,
  errorComponent: ({ reset }) => <PageError title="Couldn't load this project" reset={reset} />,
});

function ProjectDetails() {
  const { id } = Route.useParams();
  const {
    state: demo,
    ready,
    setProjectStatus,
    archiveProject,
    deleteProject,
    restoreProject,
  } = useDemo();
  const goTo = useNavigate();
  const p = demo.projects.find((x) => x.id === id);

  if (!ready) return <DetailsSkeleton />;
  if (!p) {
    return (
      <div className="mx-auto max-w-6xl">
        <BackLink />
        <EmptyState
          title="Project not found"
          description="It may have been deleted, or the link is incomplete."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/projects">View all projects</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const client = demo.clients.find((c) => c.id === p.clientId);
  const totals = projectMoney(p, demo.invoices);
  const progress = projectProgress(p.tasks);
  const due = dueLabel(p);

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink />

      <Panel className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {CLIENT_TYPE_LABELS[p.type]} project
              {p.archived ? " · Archived" : ""}
            </p>
            <h1 className="display-title mt-1 text-2xl">{p.name}</h1>
            {client ? (
              <Link
                to="/clients/$id"
                params={{ id: client.id }}
                className="mt-2 inline-flex items-center gap-2 text-sm hover:underline"
              >
                <PersonAvatar
                  name={client.name}
                  photo={client.avatar}
                  className="h-6 w-6 text-[9px]"
                />
                {client.name}
              </Link>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <ProjectFormDialog
              project={p}
              trigger={
                <Button size="sm" variant="outline" className="bg-card">
                  <PenLine /> Edit
                </Button>
              }
            />
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="bg-card" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onSelect={() => {
                    archiveProject(p.id, !p.archived);
                    toast.success(p.archived ? "Project restored" : "Project archived");
                  }}
                >
                  {p.archived ? (
                    <ArchiveRestore className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                  {p.archived ? "Unarchive" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => {
                    deleteProject(p.id);
                    void goTo({ to: "/projects" });
                    toast("Project deleted", {
                      description: `${p.name} — sessions, galleries and invoices are kept.`,
                      action: { label: "Undo", onClick: () => restoreProject(p) },
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <ol className="mt-5 grid grid-cols-5 gap-1.5" aria-label="Project status">
          {PROJECT_STATUSES.map((s, i) => {
            const current = PROJECT_STATUSES.findIndex((x) => x.value === p.status);
            return (
              <li key={s.value}>
                <button
                  type="button"
                  onClick={() => {
                    setProjectStatus(p.id, s.value);
                    if (s.value !== p.status) toast.success(`Moved to ${s.label}`);
                  }}
                  aria-current={s.value === p.status ? "step" : undefined}
                  className="group w-full text-left"
                >
                  <span
                    className={cn(
                      "block h-1.5 rounded-full transition-colors",
                      i <= current
                        ? PROJECT_STATUS_DOT[p.status]
                        : "bg-muted group-hover:bg-accent",
                    )}
                  />
                  <span
                    className={cn(
                      "mt-1.5 block truncate text-[11px]",
                      s.value === p.status ? "font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </Panel>

      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Project value" value={moneyShort(p.value)} />
        <Stat
          label="Invoiced"
          value={money(totals.invoiced)}
          sub={
            totals.uninvoiced
              ? `${moneyShort(totals.uninvoiced)} not yet invoiced`
              : "Fully invoiced"
          }
        />
        <Stat label="Paid" value={money(totals.paid)} />
        <Stat
          label="Outstanding"
          value={money(totals.outstanding)}
          tone={totals.outstanding ? "warning" : undefined}
        />
        <Stat
          label="Delivery"
          value={formatDate(p.dueDate)}
          sub={due.text}
          tone={due.tone === "rose" ? "rose" : undefined}
          className="col-span-2 lg:col-span-1"
        />
      </dl>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-5">
          <TasksPanel project={p} progress={progress} />
          <SessionsPanel project={p} />
          <GalleriesPanel project={p} />
          <QuotesPanel project={p} />
          <ContractsPanel project={p} />
          <InvoicesPanel invoices={totals.invoices} projectId={p.id} />
        </div>
        <aside className="space-y-5">
          <NotesPanel project={p} />
          <Panel className="p-4 text-xs">
            <h2 className="text-sm font-semibold">Dates</h2>
            <dl className="mt-2 space-y-2">
              <Row label="Started">{formatDate(p.startDate)}</Row>
              <Row label="Delivery due">{formatDate(p.dueDate)}</Row>
              <Row label="Created">{formatDate(p.createdAt)}</Row>
            </dl>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/projects"
      className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Projects
    </Link>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: "rose" | "warning" | undefined;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-3.5 shadow-soft", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-lg font-semibold tracking-tight tabular-nums",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </dd>
      {sub ? (
        <dd
          className={cn(
            "text-[11px] text-muted-foreground",
            tone === "rose" && "font-medium text-rose",
          )}
        >
          {sub}
        </dd>
      ) : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function SectionHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

function TasksPanel({ project: p, progress }: { project: Project; progress: number }) {
  const { addProjectTask, toggleProjectTask, removeProjectTask } = useDemo();
  const [draft, setDraft] = useState("");
  const add = () => {
    const title = draft.trim();
    if (!title) return;
    addProjectTask(p.id, title.slice(0, 120));
    setDraft("");
  };
  const done = p.tasks.filter((t) => t.done).length;

  return (
    <Panel className="p-4">
      <SectionHeader title="Checklist">
        <span className="text-xs text-muted-foreground">
          {done}/{p.tasks.length} done
        </span>
      </SectionHeader>
      <ProgressBar value={progress} className="mt-2" />
      {p.tasks.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No tasks yet — add the steps for this job below.
        </p>
      ) : (
        <ul className="mt-3 divide-y">
          {p.tasks.map((t) => (
            <li key={t.id} className="group flex items-center gap-2.5 py-2">
              <Checkbox
                id={`task-${t.id}`}
                checked={t.done}
                onCheckedChange={() => toggleProjectTask(p.id, t.id)}
              />
              <label
                htmlFor={`task-${t.id}`}
                className={cn(
                  "flex-1 cursor-pointer text-sm",
                  t.done && "text-muted-foreground line-through",
                )}
              >
                {t.title}
              </label>
              <button
                type="button"
                aria-label={`Remove task ${t.title}`}
                onClick={() => removeProjectTask(p.id, t.id)}
                className="rounded p-1 text-muted-foreground opacity-100 hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task..."
          aria-label="New task"
          className="h-8 text-xs"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="h-8 bg-card"
          disabled={!draft.trim()}
        >
          <Plus /> Add
        </Button>
      </form>
    </Panel>
  );
}

function SessionsPanel({ project: p }: { project: Project }) {
  const { state: demo, linkToProject } = useDemo();
  const linked = p.sessionIds
    .map((id) => demo.sessions.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const available = demo.sessions.filter(
    (s) => s.clientId === p.clientId && !p.sessionIds.includes(s.id) && s.status !== "cancelled",
  );

  return (
    <Panel className="p-4">
      <SectionHeader title={`Sessions (${linked.length})`}>
        {available.length ? (
          <Select
            value=""
            onValueChange={(sessionId) => {
              const owner = projectOf(demo.projects, { sessionId });
              linkToProject(p.id, { sessionId }, true);
              toast.success(
                "Session linked",
                owner ? { description: `Moved from ${owner.name}` } : undefined,
              );
            }}
          >
            <SelectTrigger className="h-8 w-auto gap-2 bg-card text-xs" aria-label="Link a session">
              <Link2 className="h-3.5 w-3.5" />
              <SelectValue placeholder="Link session" />
            </SelectTrigger>
            <SelectContent>
              {available.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title} · {slotLabel(s.date, s.start)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <SessionFormDialog
          defaultClientId={p.clientId}
          defaultDate={DEMO_TODAY}
          triggerLabel="Book session"
          onSaved={(s) => linkToProject(p.id, { sessionId: s.id }, true)}
        />
      </SectionHeader>
      {linked.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          No sessions linked yet. Book one, or link an existing session for this client.
        </p>
      ) : (
        <ul className="mt-3 divide-y rounded-md border">
          {linked.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-3 py-2.5">
              <Link
                to="/studio/sessions/$id"
                params={{ id: s.id }}
                className="min-w-0 flex-1 hover:underline"
              >
                <span className="block truncate text-sm font-medium">{s.title}</span>
                <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  {slotLabel(s.date, s.start)} <KindLabel kind={s.kind} />
                </span>
              </Link>
              <StatusBadge status={s.status} label={SESSION_STATUS_LABELS[s.status]} />
              <button
                type="button"
                aria-label={`Unlink ${s.title}`}
                onClick={() => {
                  linkToProject(p.id, { sessionId: s.id }, false);
                  toast("Session unlinked", {
                    action: {
                      label: "Undo",
                      onClick: () => linkToProject(p.id, { sessionId: s.id }, true),
                    },
                  });
                }}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Unlink className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function GalleriesPanel({ project: p }: { project: Project }) {
  const { state: demo, linkToProject, createGallery } = useDemo();
  const linked = p.galleryIds
    .map((id) => demo.galleries.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => !!g);
  const available = demo.galleries.filter(
    (g) => !p.galleryIds.includes(g.id) && (!g.clientId || g.clientId === p.clientId),
  );

  return (
    <Panel className="p-4">
      <SectionHeader title={`Galleries (${linked.length})`}>
        {available.length ? (
          <Select
            value=""
            onValueChange={(galleryId) => {
              linkToProject(p.id, { galleryId }, true);
              toast.success("Gallery linked");
            }}
          >
            <SelectTrigger className="h-8 w-auto gap-2 bg-card text-xs" aria-label="Link a gallery">
              <Link2 className="h-3.5 w-3.5" />
              <SelectValue placeholder="Link gallery" />
            </SelectTrigger>
            <SelectContent>
              {available.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          className="h-8 bg-card text-xs"
          onClick={() => {
            const g = createGallery(p.name);
            linkToProject(p.id, { galleryId: g.id }, true);
            toast.success(`Draft gallery “${p.name}” created`, {
              description: "Add photos from the gallery page.",
            });
          }}
        >
          <Plus /> New gallery
        </Button>
      </SectionHeader>
      {linked.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          No galleries yet. Create one when you're ready to deliver photos.
        </p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {linked.map((g) => (
            <li key={g.id} className="group relative overflow-hidden rounded-md border bg-card">
              <Link to="/galleries/$id" params={{ id: g.id }} className="block">
                {g.photos.length ? (
                  <img
                    src={img(g.cover, 480, 240)}
                    alt=""
                    loading="lazy"
                    className="aspect-[2/1] w-full bg-muted object-cover"
                  />
                ) : (
                  <span className="flex aspect-[2/1] flex-col items-center justify-center gap-1 bg-muted text-xs text-muted-foreground">
                    <ImageOff className="h-4 w-4" /> No photos yet
                  </span>
                )}
                <span className="block p-2.5">
                  <span className="block truncate text-sm font-medium">{g.title}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge status={g.status} /> {g.photoCount} photos
                  </span>
                </span>
              </Link>
              <button
                type="button"
                aria-label={`Unlink ${g.title}`}
                onClick={() => {
                  linkToProject(p.id, { galleryId: g.id }, false);
                  toast("Gallery unlinked", {
                    action: {
                      label: "Undo",
                      onClick: () => linkToProject(p.id, { galleryId: g.id }, true),
                    },
                  });
                }}
                className="absolute right-2 top-2 rounded-md bg-card/90 p-1.5 text-muted-foreground shadow-soft hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                <Unlink className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ContractsPanel({ project: p }: { project: Project }) {
  const { state: demo } = useDemo();
  const contracts = demo.contracts.filter((c) => c.projectId === p.id);
  return (
    <Panel className="p-4">
      <SectionHeader title={`Contracts (${contracts.length})`}>
        <NewContractDialog
          defaultClientId={p.clientId}
          defaultProjectId={p.id}
          trigger={
            <Button size="sm" variant="outline" className="h-8 bg-card text-xs">
              <Plus /> New contract
            </Button>
          }
        />
      </SectionHeader>
      {contracts.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          No contract for this project yet.
        </p>
      ) : (
        <ul className="mt-3 divide-y rounded-md border">
          {contracts.map((c) => (
            <li key={c.id}>
              <Link
                to="/contracts/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.title}</span>
                <SignatureProgress contract={c} />
                <ContractStatusBadge status={c.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function QuotesPanel({ project: p }: { project: Project }) {
  const { state: demo } = useDemo();
  const quotes = demo.quotes.filter((q) => q.projectId === p.id);
  return (
    <Panel className="p-4">
      <SectionHeader title={`Quotes (${quotes.length})`}>
        <Button asChild size="sm" variant="outline" className="h-8 bg-card text-xs">
          <Link to="/quotes/new" search={{ project: p.id }}>
            <Plus /> New quote
          </Link>
        </Button>
      </SectionHeader>
      {quotes.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          No quotes for this project yet.
        </p>
      ) : (
        <ul className="mt-3 divide-y rounded-md border">
          {quotes.map((q) => (
            <li key={q.id}>
              <Link
                to="/quotes/$id"
                params={{ id: q.id }}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{q.number}</span>
                  <span className="block truncate text-xs text-muted-foreground">{q.title}</span>
                </span>
                <QuoteStatusBadge quote={q} />
                <span className="text-sm font-semibold tabular-nums">{money(invoiceTotal(q))}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function InvoicesPanel({
  invoices,
  projectId,
}: {
  invoices: ReturnType<typeof projectMoney>["invoices"];
  projectId: string;
}) {
  return (
    <Panel className="p-4">
      <SectionHeader title={`Invoices (${invoices.length})`}>
        <Button asChild size="sm" variant="outline" className="h-8 bg-card text-xs">
          <Link to="/invoices/new" search={{ project: projectId }}>
            <Plus /> New invoice
          </Link>
        </Button>
      </SectionHeader>
      {invoices.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          No invoices linked to this project yet.
        </p>
      ) : (
        <ul className="mt-3 divide-y rounded-md border">
          {invoices.map((inv) => {
            const status = invoiceDisplayStatus(inv, DEMO_TODAY);
            return (
              <li key={inv.id} className="flex items-center gap-3 px-3 py-2.5">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <Link
                    to="/invoices/$id"
                    params={{ id: inv.id }}
                    className="block text-sm font-medium hover:underline"
                  >
                    {inv.number}
                  </Link>
                  <span className="block truncate text-xs text-muted-foreground">
                    {inv.items[0]?.description} · due {formatDate(inv.dueDate)}
                  </span>
                </span>
                <StatusBadge status={status} label={INVOICE_STATUS_LABELS[status]} />
                <span className="text-sm font-semibold tabular-nums">
                  {money(invoiceTotal(inv))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function NotesPanel({ project: p }: { project: Project }) {
  const { updateProject } = useDemo();
  const [draft, setDraft] = useState(p.notes);
  const [synced, setSynced] = useState(p.notes);
  // Pick up outside changes (e.g. undo) when not editing.
  if (p.notes !== synced) {
    setSynced(p.notes);
    setDraft(p.notes);
  }
  const dirty = draft !== p.notes;
  return (
    <Panel className="p-4">
      <h2 className="text-sm font-semibold">Notes</h2>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={5}
        maxLength={2000}
        placeholder="Brief, references, things to remember..."
        aria-label="Project notes"
        className="mt-2 text-sm"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {dirty ? "Unsaved changes" : "Saved"}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 bg-card text-xs"
          disabled={!dirty}
          onClick={() => {
            updateProject(p.id, { notes: draft.trim() });
            toast.success("Notes saved");
          }}
        >
          Save notes
        </Button>
      </div>
    </Panel>
  );
}

function DetailsSkeleton() {
  return (
    <div
      className="mx-auto max-w-6xl space-y-4"
      aria-busy="true"
      aria-label="Loading project"
      role="status"
    >
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-36 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
