import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleCheck,
  Eye,
  MoreHorizontal,
  PenLine,
  Plus,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button, Field, SubNav } from "@/components/kit";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/lib/store";
import { formatTime, type Session, type SessionKind } from "@/lib/demo-data";
import { SESSION_KIND_SINGULAR } from "@/lib/calendar";
import {
  CANCEL_REASONS,
  findConflicts,
  slotLabel,
  validateSessionForm,
  type SessionFormInput,
} from "@/lib/sessions";
import { cn } from "@/lib/utils";

export function StudioTabs() {
  return (
    <SubNav
      items={[
        { to: "/studio", label: "Sessions", exact: true },
        { to: "/studio/calendar", label: "Calendar" },
      ]}
    />
  );
}

/** Colour tokens per session kind, shared by the calendar, lists and details. */
export const KIND_STYLE: Record<SessionKind, { chip: string; dot: string }> = {
  shoot: { chip: "bg-info/12 border-info/30 text-info", dot: "bg-info" },
  consultation: { chip: "bg-success/12 border-success/30 text-success", dot: "bg-success" },
  editing: {
    chip: "bg-[oklch(0.6_0.12_300/0.14)] border-[oklch(0.6_0.12_300/0.35)] text-[oklch(0.45_0.12_300)] dark:text-[oklch(0.78_0.1_300)]",
    dot: "bg-[oklch(0.6_0.12_300)]",
  },
  delivery: { chip: "bg-warning/15 border-warning/35 text-warning", dot: "bg-warning" },
};

export function KindLabel({ kind }: { kind: SessionKind }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", KIND_STYLE[kind].dot)} />
      {SESSION_KIND_SINGULAR[kind]}
    </span>
  );
}

/** Lists other sessions that overlap a slot, as a warning (double-booking is allowed). */
function ConflictWarning({ conflicts }: { conflicts: Session[] }) {
  const { state: demo } = useDemo();
  if (!conflicts.length) return null;
  return (
    <div
      role="status"
      className="flex gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs"
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
      <div>
        <p className="font-medium">
          Overlaps with{" "}
          {conflicts.length === 1 ? "another session" : `${conflicts.length} sessions`}
        </p>
        <ul className="mt-0.5 text-muted-foreground">
          {conflicts.map((c) => (
            <li key={c.id}>
              {c.title} · {formatTime(c.start)}–{formatTime(c.end)} ·{" "}
              {demo.clients.find((x) => x.id === c.clientId)?.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Run `reset` during render whenever `open` turns true, so dialogs opened via props start fresh. */
function useResetOnOpen(open: boolean, reset: () => void) {
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) reset();
  }
}

export interface SessionDraft {
  date: string;
  start: string;
  end: string;
}

type Form = SessionFormInput & { kind: SessionKind; location: string; notes: string };

/**
 * Create a session, or edit one when `session` is given. Uncontrolled with its
 * own trigger by default; pass `open`/`onOpenChange` (and `initial`) to open it
 * from elsewhere, e.g. a calendar slot or an actions menu.
 */
export function SessionFormDialog({
  session,
  defaultDate = "2025-04-24",
  defaultClientId = "",
  triggerLabel = "Add Session",
  open: openProp,
  onOpenChange,
  initial,
  hideTrigger,
  onSaved,
}: {
  session?: Session | undefined;
  defaultDate?: string;
  defaultClientId?: string;
  triggerLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initial?: SessionDraft | undefined;
  hideTrigger?: boolean;
  onSaved?: (s: Session) => void;
}) {
  const { state: demo, addSession, updateSession } = useDemo();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const blank = (): Form =>
    session
      ? {
          title: session.title,
          clientId: session.clientId,
          kind: session.kind,
          date: session.date,
          start: session.start,
          end: session.end,
          location: session.location,
          notes: session.notes ?? "",
        }
      : {
          title: "",
          clientId: defaultClientId,
          kind: "shoot",
          date: initial?.date ?? defaultDate,
          start: initial?.start ?? "10:00",
          end: initial?.end ?? "11:00",
          location: "Studio",
          notes: "",
        };
  const [form, setForm] = useState(blank);
  const [submitted, setSubmitted] = useState(false);
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const setOpen = (o: boolean) => {
    setOpenState(o);
    onOpenChange?.(o);
  };
  useResetOnOpen(open, () => {
    setForm(blank());
    setSubmitted(false);
  });

  const errors = validateSessionForm(form);
  const shown = (k: keyof typeof errors) => (submitted ? errors[k] : undefined);
  const conflicts =
    errors.end || errors.date ? [] : findConflicts(demo.sessions, form, session?.id);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    const values = {
      ...form,
      title: form.title.trim(),
      location: form.location.trim(),
      notes: form.notes.trim(),
    };
    if (session) {
      updateSession(session.id, values);
      toast.success("Session updated");
      onSaved?.({ ...session, ...values });
    } else {
      const created = addSession(values);
      toast.success(`${values.title} added as pending`);
      onSaved?.(created);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {hideTrigger ? null : (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus /> {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90svh] max-w-md overflow-y-auto">
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle className="display-title text-xl">
              {session ? "Edit session" : "New session"}
            </DialogTitle>
          </DialogHeader>
          <Field id="ns-title" label="Session name" required error={shown("title")}>
            <Input
              id="ns-title"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Engagement Shoot"
              aria-invalid={!!shown("title")}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select value={form.clientId} onValueChange={(clientId) => set({ clientId })}>
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
              <Select value={form.kind} onValueChange={(v) => set({ kind: v as SessionKind })}>
                <SelectTrigger aria-label="Session type">
                  <SelectValue>{SESSION_KIND_SINGULAR[form.kind]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SESSION_KIND_SINGULAR) as SessionKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {SESSION_KIND_SINGULAR[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SlotFields
            value={form}
            onChange={set}
            error={shown("end") ?? shown("date")}
            idPrefix="ns"
          />
          <ConflictWarning conflicts={conflicts} />
          <Field id="ns-loc" label="Location">
            <Input
              id="ns-loc"
              value={form.location}
              onChange={(e) => set({ location: e.target.value })}
            />
          </Field>
          <Field id="ns-notes" label="Prep notes" hint="Only your studio sees these.">
            <Textarea
              id="ns-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="Gear, shot list, parking..."
            />
          </Field>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{session ? "Save changes" : "Add session"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Kept for existing callers: the create-only form. */
export function AddSessionDialog(props: Omit<Parameters<typeof SessionFormDialog>[0], "session">) {
  return <SessionFormDialog {...props} />;
}

function SlotFields({
  value,
  onChange,
  error,
  idPrefix,
}: {
  value: SessionDraft;
  onChange: (patch: Partial<SessionDraft>) => void;
  error: string | undefined;
  idPrefix: string;
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Field id={`${idPrefix}-date`} label="Date">
          <Input
            id={`${idPrefix}-date`}
            type="date"
            required
            value={value.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </Field>
        <Field id={`${idPrefix}-start`} label="Start">
          <Input
            id={`${idPrefix}-start`}
            type="time"
            required
            value={value.start}
            onChange={(e) => onChange({ start: e.target.value })}
          />
        </Field>
        <Field id={`${idPrefix}-end`} label="End">
          <Input
            id={`${idPrefix}-end`}
            type="time"
            required
            value={value.end}
            onChange={(e) => onChange({ end: e.target.value })}
            aria-invalid={!!error}
          />
        </Field>
      </div>
      {error ? <p className="-mt-2 text-xs text-destructive">{error}</p> : null}
    </>
  );
}

export function RescheduleDialog({
  session,
  open,
  onOpenChange,
}: {
  session: Session;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state: demo, rescheduleSession } = useDemo();
  const [slot, setSlot] = useState<SessionDraft>(session);
  const [notify, setNotify] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const client = demo.clients.find((c) => c.id === session.clientId);
  const errors = validateSessionForm({ ...slot, title: session.title, clientId: session.clientId });
  const unchanged =
    slot.date === session.date && slot.start === session.start && slot.end === session.end;
  const conflicts = errors.end ? [] : findConflicts(demo.sessions, slot, session.id);
  useResetOnOpen(open, () => {
    setSlot({ date: session.date, start: session.start, end: session.end });
    setSubmitted(false);
    setNotify(true);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
            if (errors.end || errors.date || unchanged) return;
            rescheduleSession(session.id, slot, notify);
            toast.success("Session rescheduled", {
              description: `${slotLabel(slot.date, slot.start)}${notify ? " · client notified" : ""}`,
            });
            onOpenChange(false);
          }}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle className="display-title text-xl">Reschedule session</DialogTitle>
            <DialogDescription>
              {session.title} with {client?.name} — currently{" "}
              <span className="font-medium text-foreground">
                {slotLabel(session.date, session.start)}–{formatTime(session.end)}
              </span>
            </DialogDescription>
          </DialogHeader>
          <SlotFields
            value={slot}
            onChange={(p) => setSlot((s) => ({ ...s, ...p }))}
            error={
              submitted
                ? (errors.end ??
                  errors.date ??
                  (unchanged ? "Pick a different date or time." : undefined))
                : undefined
            }
            idPrefix="rs"
          />
          <ConflictWarning conflicts={conflicts} />
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={notify}
              onCheckedChange={(v) => setNotify(v === true)}
              className="mt-0.5"
            />
            <span>
              Email {client?.name ?? "the client"} about the new time
              <span className="block text-xs text-muted-foreground">
                Demo: logged on their profile — no email is actually sent.
              </span>
            </span>
          </label>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Keep current time
            </Button>
            <Button type="submit">
              <CalendarClock /> Reschedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CancelSessionDialog({
  session,
  open,
  onOpenChange,
}: {
  session: Session;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state: demo, cancelSession } = useDemo();
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0]);
  const [other, setOther] = useState("");
  const [notify, setNotify] = useState(true);
  const client = demo.clients.find((c) => c.id === session.clientId);
  const finalReason = reason === "Other" ? other.trim() : reason;
  useResetOnOpen(open, () => {
    setReason(CANCEL_REASONS[0]);
    setOther("");
    setNotify(true);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!finalReason) return;
            cancelSession(session.id, finalReason, notify);
            toast(`${session.title} cancelled`, {
              description: notify ? `${client?.name} notified` : finalReason,
            });
            onOpenChange(false);
          }}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle className="display-title text-xl">Cancel this session?</DialogTitle>
            <DialogDescription>
              {session.title} with {client?.name} on {slotLabel(session.date, session.start)}. It
              comes off your calendar but stays in your records, and you can reinstate it later.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={reason} onValueChange={setReason} className="gap-2.5">
            {CANCEL_REASONS.map((r) => (
              <div key={r} className="flex items-center gap-2">
                <RadioGroupItem id={`cancel-${r}`} value={r} />
                <Label htmlFor={`cancel-${r}`} className="font-normal">
                  {r}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {reason === "Other" ? (
            <Field id="cancel-other" label="Reason" required>
              <Input
                id="cancel-other"
                autoFocus
                value={other}
                onChange={(e) => setOther(e.target.value)}
              />
            </Field>
          ) : null}
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={notify}
              onCheckedChange={(v) => setNotify(v === true)}
              className="mt-0.5"
            />
            <span>
              Email {client?.name ?? "the client"} about the cancellation
              <span className="block text-xs text-muted-foreground">
                Demo: logged on their profile — no email is actually sent.
              </span>
            </span>
          </label>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Keep session
            </Button>
            <Button type="submit" variant="destructive" disabled={!finalReason}>
              <XCircle /> Cancel session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type SessionDialog = "edit" | "reschedule" | "cancel" | null;

/**
 * Actions for one session plus the dialogs they open. The menu is non-modal so
 * closing a dialog opened from it never leaves the page unclickable.
 */
export function SessionActionsMenu({
  session,
  showView = true,
  trigger,
}: {
  session: Session;
  showView?: boolean;
  trigger?: ReactNode;
}) {
  const { updateSessionStatus, reinstateSession } = useDemo();
  const [dialog, setDialog] = useState<SessionDialog>(null);
  const cancelled = session.status === "cancelled";

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          {trigger ?? (
            <button
              type="button"
              aria-label={`Actions for ${session.title}`}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {showView ? (
            <>
              <DropdownMenuItem asChild>
                <Link to="/studio/sessions/$id" params={{ id: session.id }}>
                  <Eye className="h-4 w-4" /> View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          {cancelled ? (
            <DropdownMenuItem
              onSelect={() => {
                reinstateSession(session.id);
                toast.success(`${session.title} reinstated as pending`);
              }}
            >
              <RotateCcw className="h-4 w-4" /> Reinstate
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onSelect={() => setDialog("edit")}>
                <PenLine className="h-4 w-4" /> Edit details
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog("reschedule")}>
                <CalendarClock className="h-4 w-4" /> Reschedule
              </DropdownMenuItem>
              {session.status === "pending" ? (
                <DropdownMenuItem
                  onSelect={() => {
                    updateSessionStatus(session.id, "confirmed");
                    toast.success(`${session.title} confirmed`);
                  }}
                >
                  <CircleCheck className="h-4 w-4" /> Mark confirmed
                </DropdownMenuItem>
              ) : null}
              {session.status === "confirmed" ? (
                <DropdownMenuItem
                  onSelect={() => {
                    updateSessionStatus(session.id, "completed");
                    toast.success(`${session.title} marked completed`);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark completed
                </DropdownMenuItem>
              ) : null}
              {session.status !== "pending" ? (
                <DropdownMenuItem
                  onSelect={() => {
                    updateSessionStatus(session.id, "pending");
                    toast(`${session.title} marked pending`);
                  }}
                >
                  <RotateCcw className="h-4 w-4" /> Mark pending
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setDialog("cancel")}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="h-4 w-4" /> Cancel session
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <SessionFormDialog
        session={session}
        hideTrigger
        open={dialog === "edit"}
        onOpenChange={(o) => !o && setDialog(null)}
      />
      <RescheduleDialog
        session={session}
        open={dialog === "reschedule"}
        onOpenChange={(o) => setDialog(o ? "reschedule" : null)}
      />
      <CancelSessionDialog
        session={session}
        open={dialog === "cancel"}
        onOpenChange={(o) => setDialog(o ? "cancel" : null)}
      />
    </>
  );
}
