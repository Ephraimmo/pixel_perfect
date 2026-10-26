import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  CircleCheck,
  Clock,
  Mail,
  MapPin,
  PenLine,
  Phone,
  RotateCcw,
  XCircle,
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
  CancelSessionDialog,
  KindLabel,
  RescheduleDialog,
  SessionFormDialog,
} from "@/components/studio";
import { ProjectStatusBadge } from "@/components/projects";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, formatTime, type Session, type SessionChange } from "@/lib/demo-data";
import { fromKey } from "@/lib/calendar";
import { relativeDay } from "@/lib/clients";
import { SESSION_STATUS_LABELS, durationLabel, sessionIcs, slotLabel } from "@/lib/sessions";
import { projectOf } from "@/lib/projects";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/studio/sessions/$id")({
  head: () => pageHead("Session", "Session details, client and history."),
  component: SessionDetails,
  errorComponent: ({ reset }) => <PageError title="Couldn't load this session" reset={reset} />,
});

type DialogName = "edit" | "reschedule" | "cancel" | null;

function SessionDetails() {
  const { id } = Route.useParams();
  const { state: demo, ready, updateSessionStatus, reinstateSession } = useDemo();
  const [dialog, setDialog] = useState<DialogName>(null);
  const s = demo.sessions.find((x) => x.id === id);

  if (!ready) return <DetailsSkeleton />;
  if (!s) {
    return (
      <div className="mx-auto max-w-5xl">
        <BackLink />
        <EmptyState
          title="Session not found"
          description="It may have been removed, or the link is incomplete."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/studio">View all sessions</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const client = demo.clients.find((c) => c.id === s.clientId);
  const project = projectOf(demo.projects, { sessionId: s.id });
  const cancelled = s.status === "cancelled";
  const isPast = s.date < DEMO_TODAY;
  const others = demo.sessions
    .filter((x) => x.clientId === s.clientId && x.id !== s.id && x.status !== "cancelled")
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

  const downloadIcs = () => {
    const blob = new Blob([sessionIcs(s, client?.name ?? "Client", demo.profile.studio)], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${s.date}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Calendar file downloaded", {
      description: "Open it to add the session to Google, Apple or Outlook Calendar.",
    });
  };

  const statusAction =
    s.status === "pending" ? (
      <Button
        size="sm"
        onClick={() => {
          updateSessionStatus(s.id, "confirmed");
          toast.success(`${s.title} confirmed`);
        }}
      >
        <CircleCheck /> Confirm
      </Button>
    ) : s.status === "confirmed" ? (
      <Button
        size="sm"
        variant={isPast || s.date === DEMO_TODAY ? "default" : "outline"}
        className={cn(!(isPast || s.date === DEMO_TODAY) && "bg-card")}
        onClick={() => {
          updateSessionStatus(s.id, "completed");
          toast.success(`${s.title} marked completed`);
        }}
      >
        <CheckCircle2 /> Mark completed
      </Button>
    ) : s.status === "completed" ? (
      <Button
        size="sm"
        variant="outline"
        className="bg-card"
        onClick={() => {
          updateSessionStatus(s.id, "confirmed");
          toast(`${s.title} reopened as confirmed`);
        }}
      >
        <RotateCcw /> Reopen
      </Button>
    ) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink />

      <Panel className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <KindLabel kind={s.kind} />
              <StatusBadge status={s.status} label={SESSION_STATUS_LABELS[s.status]} />
            </div>
            <h1
              className={cn(
                "display-title mt-1.5 text-2xl",
                cancelled && "text-muted-foreground line-through",
              )}
            >
              {s.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {format(fromKey(s.date), "EEEE, MMMM d, yyyy")} · {formatTime(s.start)} –{" "}
              {formatTime(s.end)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {cancelled ? (
              <Button
                size="sm"
                onClick={() => {
                  reinstateSession(s.id);
                  toast.success(`${s.title} reinstated as pending`);
                }}
              >
                <RotateCcw /> Reinstate
              </Button>
            ) : (
              <>
                {statusAction}
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-card"
                  onClick={() => setDialog("reschedule")}
                >
                  <CalendarClock /> Reschedule
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-card"
                  onClick={() => setDialog("edit")}
                >
                  <PenLine /> Edit
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" className="bg-card" onClick={downloadIcs}>
              <CalendarPlus /> Add to calendar
            </Button>
          </div>
        </div>
        {cancelled ? (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-rose/25 bg-rose/5 px-3 py-2.5 text-sm">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose" />
            <p>
              Cancelled{s.cancelReason ? ` — ${s.cancelReason}` : ""}. It's off your calendar;
              reinstate it to book this slot again.
            </p>
          </div>
        ) : null}
      </Panel>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-5">
          <dl className="grid gap-3 sm:grid-cols-3">
            <Fact icon={<CalendarDays className="h-4 w-4" />} label="Date">
              {format(fromKey(s.date), "EEE, MMM d")}
              <span className="block text-[11px] text-muted-foreground">
                {s.date === DEMO_TODAY
                  ? "Today"
                  : isPast
                    ? relativeDay(s.date, DEMO_TODAY)
                    : `In ${Math.round((fromKey(s.date).getTime() - fromKey(DEMO_TODAY).getTime()) / 864e5)} days`}
              </span>
            </Fact>
            <Fact icon={<Clock className="h-4 w-4" />} label="Time">
              {formatTime(s.start)} – {formatTime(s.end)}
              <span className="block text-[11px] text-muted-foreground">
                {durationLabel(s.start, s.end)}
              </span>
            </Fact>
            <Fact icon={<MapPin className="h-4 w-4" />} label="Location">
              <span className="break-words">{s.location || "Not set"}</span>
              {s.location && !/^(studio|online|phone|video call)$/i.test(s.location) ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.location)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                >
                  Open in Maps ↗
                </a>
              ) : null}
            </Fact>
          </dl>

          <Panel className="p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Prep notes</h2>
              {!cancelled ? (
                <button
                  type="button"
                  onClick={() => setDialog("edit")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {s.notes ? "Edit notes" : "Add notes"}
                </button>
              ) : null}
            </div>
            {s.notes ? (
              <p className="mt-2 whitespace-pre-wrap text-sm">{s.notes}</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No notes yet — add gear, a shot list or parking details.
              </p>
            )}
          </Panel>

          <Panel className="p-4">
            <h2 className="text-sm font-semibold">History</h2>
            <History session={s} />
          </Panel>
        </div>

        <aside className="space-y-5">
          {project ? (
            <Panel className="p-4">
              <h2 className="text-sm font-semibold">Project</h2>
              <Link
                to="/projects/$id"
                params={{ id: project.id }}
                className="mt-2 block rounded-md p-1.5 hover:bg-accent/50"
              >
                <span className="block truncate text-sm font-medium">{project.name}</span>
                <span className="mt-1 block">
                  <ProjectStatusBadge status={project.status} />
                </span>
              </Link>
            </Panel>
          ) : null}
          <Panel className="p-4">
            <h2 className="text-sm font-semibold">Client</h2>
            {client ? (
              <>
                <Link
                  to="/clients/$id"
                  params={{ id: client.id }}
                  className="mt-3 flex items-center gap-3 rounded-md hover:bg-accent/50"
                >
                  <PersonAvatar name={client.name} photo={client.avatar} className="h-10 w-10" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{client.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {client.company || client.city || "View profile"}
                    </span>
                  </span>
                </Link>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline" className="h-8 bg-card text-xs">
                    <a
                      href={`mailto:${client.email}?subject=${encodeURIComponent(`${s.title} on ${slotLabel(s.date, s.start)}`)}`}
                    >
                      <Mail /> Email
                    </a>
                  </Button>
                  {client.phone ? (
                    <Button asChild size="sm" variant="outline" className="h-8 bg-card text-xs">
                      <a href={`tel:${client.phone.replace(/[^\d+]/g, "")}`}>
                        <Phone /> Call
                      </a>
                    </Button>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">This client was removed.</p>
            )}
          </Panel>

          <Panel className="p-4">
            <h2 className="text-sm font-semibold">
              Other sessions with {client?.name.split(" ")[0] ?? "this client"}
            </h2>
            {others.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No other sessions.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {others.slice(0, 5).map((o) => (
                  <li key={o.id}>
                    <Link
                      to="/studio/sessions/$id"
                      params={{ id: o.id }}
                      className="flex items-center justify-between gap-2 rounded px-1.5 py-1.5 text-xs hover:bg-accent/50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{o.title}</span>
                        <span className="text-muted-foreground">{slotLabel(o.date, o.start)}</span>
                      </span>
                      <StatusBadge status={o.status} label={SESSION_STATUS_LABELS[o.status]} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>

      <SessionFormDialog
        session={s}
        hideTrigger
        open={dialog === "edit"}
        onOpenChange={(o) => !o && setDialog(null)}
      />
      <RescheduleDialog
        session={s}
        open={dialog === "reschedule"}
        onOpenChange={(o) => setDialog(o ? "reschedule" : null)}
      />
      <CancelSessionDialog
        session={s}
        open={dialog === "cancel"}
        onOpenChange={(o) => setDialog(o ? "cancel" : null)}
      />

      {!cancelled ? (
        <div className="mt-6 border-t pt-4">
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDialog("cancel")}
          >
            <XCircle /> Cancel this session
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/studio"
      className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Sessions
    </Link>
  );
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border bg-card p-3.5 shadow-soft">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 text-sm">
        <dt className="text-[11px] text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 font-medium">{children}</dd>
      </div>
    </div>
  );
}

const CHANGE_LABEL: Record<SessionChange["kind"], string> = {
  created: "Session booked",
  edited: "Details edited",
  rescheduled: "Rescheduled",
  confirmed: "Confirmed",
  completed: "Marked completed",
  cancelled: "Cancelled",
  reinstated: "Reinstated",
};

function History({ session }: { session: Session }) {
  const entries = [...(session.history ?? [])].reverse();
  if (entries.length === 0) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        No changes recorded — this session was imported before history tracking.
      </p>
    );
  }
  return (
    <ol className="mt-3 space-y-3 border-l pl-4">
      {entries.map((h, i) => (
        <li key={`${h.at}-${i}`} className="relative text-xs">
          <span
            className={cn(
              "absolute -left-[1.3rem] top-1 h-2 w-2 rounded-full ring-2 ring-card",
              h.kind === "cancelled"
                ? "bg-rose"
                : h.kind === "rescheduled"
                  ? "bg-warning"
                  : "bg-muted-foreground/50",
            )}
          />
          <p className="font-medium">{CHANGE_LABEL[h.kind]}</p>
          {h.detail ? <p className="text-muted-foreground">{h.detail}</p> : null}
          <p className="text-[11px] text-muted-foreground">
            {format(fromKey(h.at.slice(0, 10)), "MMM d, yyyy")} · {formatTime(h.at.slice(11, 16))}
          </p>
        </li>
      ))}
    </ol>
  );
}

function DetailsSkeleton() {
  return (
    <div
      className="mx-auto max-w-5xl space-y-5"
      aria-busy="true"
      aria-label="Loading session"
      role="status"
    >
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}
