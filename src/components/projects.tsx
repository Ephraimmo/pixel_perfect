import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Images, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, PersonAvatar } from "@/components/kit";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, formatDate, moneyShort, type ClientType } from "@/lib/demo-data";
import type { Project, ProjectStatus } from "@/lib/projects-data";
import { CLIENT_TYPE_LABELS } from "@/lib/clients";
import {
  PROJECT_STATUS_LABELS,
  TASK_TEMPLATES,
  daysUntil,
  isOverdue,
  projectOf,
  projectProgress,
  validateProjectForm,
  type ProjectForm,
} from "@/lib/projects";
import { slotLabel } from "@/lib/sessions";
import { cn } from "@/lib/utils";

export const PROJECT_STATUS_DOT: Record<ProjectStatus, string> = {
  planning: "bg-muted-foreground/60",
  shooting: "bg-info",
  editing: "bg-[oklch(0.6_0.12_300)]",
  delivered: "bg-clay",
  completed: "bg-success",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium">
      <span className={cn("h-1.5 w-1.5 rounded-full", PROJECT_STATUS_DOT[status])} />
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Checklist progress"
      className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all",
          value === 100 ? "bg-success" : "bg-clay",
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/** "Overdue by 2 days", "Due in 5 days", "Delivered" … */
export function dueLabel(p: Project): { text: string; tone: "rose" | "muted" | "warning" } {
  if (p.status === "completed") return { text: "Completed", tone: "muted" };
  if (p.status === "delivered")
    return { text: `Delivered · due ${formatDate(p.dueDate)}`, tone: "muted" };
  const d = daysUntil(p.dueDate, DEMO_TODAY);
  if (isOverdue(p, DEMO_TODAY))
    return { text: `Overdue by ${-d} ${d === -1 ? "day" : "days"}`, tone: "rose" };
  if (d === 0) return { text: "Due today", tone: "warning" };
  if (d <= 7) return { text: `Due in ${d} ${d === 1 ? "day" : "days"}`, tone: "warning" };
  return { text: `Due ${formatDate(p.dueDate)}`, tone: "muted" };
}

export function ProjectCard({ project: p }: { project: Project }) {
  const { state: demo } = useDemo();
  const client = demo.clients.find((c) => c.id === p.clientId);
  const progress = projectProgress(p.tasks);
  const due = dueLabel(p);
  return (
    <Link
      to="/projects/$id"
      params={{ id: p.id }}
      className={cn(
        "flex h-full flex-col rounded-lg border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        p.archived && "opacity-70",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <ProjectStatusBadge status={p.status} />
        <span
          className={cn(
            "text-[11px]",
            due.tone === "rose"
              ? "font-medium text-rose"
              : due.tone === "warning"
                ? "text-warning"
                : "text-muted-foreground",
          )}
        >
          {due.text}
        </span>
      </div>
      <p className="mt-2.5 line-clamp-2 text-sm font-semibold">{p.name}</p>
      {client ? (
        <p className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
          <PersonAvatar name={client.name} photo={client.avatar} className="h-5 w-5 text-[8px]" />
          {client.name}
        </p>
      ) : null}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {p.tasks.filter((t) => t.done).length}/{p.tasks.length} tasks
          </span>
          <span>{progress}%</span>
        </div>
        <ProgressBar value={progress} className="mt-1" />
        <p className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" /> {p.sessionIds.length}
          </span>
          <span className="inline-flex items-center gap-1">
            <Images className="h-3 w-3" /> {p.galleryIds.length}
          </span>
          <span className="ml-auto font-medium text-foreground">{moneyShort(p.value)}</span>
        </p>
      </div>
    </Link>
  );
}

const TYPES = Object.keys(CLIENT_TYPE_LABELS) as ClientType[];

/**
 * Create a project (with optional client preselected), or edit one's details
 * when `project` is given. Linking sessions and galleries is offered on create;
 * afterwards it happens on the project page.
 */
export function ProjectFormDialog({
  project,
  defaultClientId = "",
  trigger,
  onSaved,
}: {
  project?: Project;
  defaultClientId?: string;
  trigger: ReactNode;
  onSaved?: (p: Project) => void;
}) {
  const { state: demo, addProject, updateProject } = useDemo();
  const [open, setOpen] = useState(false);
  const blank = (): ProjectForm & { type: ClientType } => ({
    name: project?.name ?? "",
    clientId: project?.clientId ?? defaultClientId,
    type: project?.type ?? demo.clients.find((c) => c.id === defaultClientId)?.type ?? "portrait",
    startDate: project?.startDate ?? DEMO_TODAY,
    dueDate: project?.dueDate ?? "",
    value: project ? String(project.value) : "",
  });
  const [form, setForm] = useState(blank);
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [galleryIds, setGalleryIds] = useState<string[]>([]);
  const [useTemplate, setUseTemplate] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const errors = validateProjectForm(form);
  const shown = (k: keyof ProjectForm) => (submitted ? errors[k] : undefined);

  const clientSessions = demo.sessions
    .filter((s) => s.clientId === form.clientId && s.status !== "cancelled")
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const galleries = demo.galleries.filter((g) => !g.clientId || g.clientId === form.clientId);
  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    const base = {
      name: form.name.trim(),
      type: form.type,
      startDate: form.startDate,
      dueDate: form.dueDate,
      value: form.value.trim() ? Math.round(Number(form.value)) : 0,
    };
    if (project) {
      updateProject(project.id, base);
      toast.success("Project updated");
      onSaved?.({ ...project, ...base });
    } else {
      const created = addProject({
        ...base,
        clientId: form.clientId,
        sessionIds,
        galleryIds,
        tasks: useTemplate ? TASK_TEMPLATES[form.type] : [],
      });
      toast.success(`${created.name} created`);
      onSaved?.(created);
    }
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setForm(blank());
          setSessionIds([]);
          setGalleryIds([]);
          setUseTemplate(true);
          setSubmitted(false);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle className="display-title text-xl">
              {project ? "Edit project" : "New project"}
            </DialogTitle>
            <DialogDescription>
              A project groups a client's sessions, galleries and invoices for one job.
            </DialogDescription>
          </DialogHeader>
          <Field id="pf-name" label="Project name" required error={shown("name")}>
            <Input
              id="pf-name"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Ndlovu & Du Bois Wedding"
              aria-invalid={!!shown("name")}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select
                value={form.clientId}
                disabled={!!project}
                onValueChange={(clientId) => {
                  set({
                    clientId,
                    type: demo.clients.find((c) => c.id === clientId)?.type ?? form.type,
                  });
                  setSessionIds([]);
                  setGalleryIds([]);
                }}
              >
                <SelectTrigger aria-label="Client" aria-invalid={!!shown("clientId")}>
                  <SelectValue placeholder="Choose a client">
                    {demo.clients.find((c) => c.id === form.clientId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {demo.clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {shown("clientId") ? (
                <p className="text-xs text-destructive">{shown("clientId")}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set({ type: v as ClientType })}>
                <SelectTrigger aria-label="Project type">
                  <SelectValue>{CLIENT_TYPE_LABELS[form.type]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {CLIENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field id="pf-start" label="Start date" error={shown("startDate")}>
              <Input
                id="pf-start"
                type="date"
                value={form.startDate}
                onChange={(e) => set({ startDate: e.target.value })}
              />
            </Field>
            <Field id="pf-due" label="Delivery date" required error={shown("dueDate")}>
              <Input
                id="pf-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => set({ dueDate: e.target.value })}
                aria-invalid={!!shown("dueDate")}
              />
            </Field>
            <Field
              id="pf-value"
              label="Project value ($)"
              error={shown("value")}
              className="sm:col-span-2"
            >
              <Input
                id="pf-value"
                inputMode="decimal"
                value={form.value}
                onChange={(e) => set({ value: e.target.value })}
                placeholder="e.g. 3500"
                aria-invalid={!!shown("value")}
              />
            </Field>
          </div>

          {!project && form.clientId ? (
            <>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Sessions</legend>
                {clientSessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">This client has no sessions yet.</p>
                ) : (
                  clientSessions.map((s) => {
                    const owner = projectOf(demo.projects, { sessionId: s.id });
                    return (
                      <label key={s.id} className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={sessionIds.includes(s.id)}
                          onCheckedChange={() => setSessionIds((l) => toggle(l, s.id))}
                          className="mt-0.5"
                        />
                        <span>
                          {s.title}
                          <span className="block text-xs text-muted-foreground">
                            {slotLabel(s.date, s.start)}
                            {owner ? ` · moves from “${owner.name}”` : ""}
                          </span>
                        </span>
                      </label>
                    );
                  })
                )}
              </fieldset>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Galleries</legend>
                {galleries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No galleries available for this client.
                  </p>
                ) : (
                  galleries.map((g) => (
                    <label key={g.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={galleryIds.includes(g.id)}
                        onCheckedChange={() => setGalleryIds((l) => toggle(l, g.id))}
                      />
                      {g.title}
                    </label>
                  ))
                )}
              </fieldset>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={useTemplate}
                  onCheckedChange={(v) => setUseTemplate(v === true)}
                  className="mt-0.5"
                />
                <span>
                  Start with the {CLIENT_TYPE_LABELS[form.type].toLowerCase()} checklist
                  <span className="block text-xs text-muted-foreground">
                    {TASK_TEMPLATES[form.type].join(" · ")}
                  </span>
                </span>
              </label>
            </>
          ) : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{project ? "Save changes" : "Create project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewProjectButton({
  defaultClientId,
  onSaved,
  label = "New Project",
}: {
  defaultClientId?: string;
  onSaved?: (p: Project) => void;
  label?: string;
}) {
  return (
    <ProjectFormDialog
      {...(defaultClientId ? { defaultClientId } : {})}
      {...(onSaved ? { onSaved } : {})}
      trigger={
        <Button size="sm">
          <Plus /> {label}
        </Button>
      }
    />
  );
}
