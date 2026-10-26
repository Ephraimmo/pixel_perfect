<<<<<<< HEAD
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { format, isSameDay, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, MapPin, User } from "lucide-react";
import { PageError, Panel, StatusBadge, pageHead } from "@/components/kit";
import { AddSessionDialog, KIND_STYLE, StudioTabs, type SessionDraft } from "@/components/studio";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, formatTime, type Session, type SessionKind } from "@/lib/demo-data";
import {
  SESSION_KIND_LABELS,
  SESSION_KIND_SINGULAR,
  dayKey,
  fromKey,
  fromMins,
  layoutDay,
  rangeLabel,
  sessionsIn,
  slotTime,
  stepCursor,
  toMins,
  validateCalendarSearch,
  visibleDays,
  type CalendarView,
} from "@/lib/calendar";
=======
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Panel, pageHead } from "@/components/kit";
import { AddSessionDialog, StudioTabs } from "@/components/studio";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDemo } from "@/lib/store";
import { formatTime, type Session } from "@/lib/demo-data";
>>>>>>> origin/main
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/studio/calendar")({
  head: () => pageHead("Studio Calendar", "Your week of shoots, consultations and edits."),
<<<<<<< HEAD
  // View and date live in the URL so reloads and shared links land on the same range.
  validateSearch: validateCalendarSearch,
  component: StudioCalendar,
  errorComponent: ({ reset }) => <PageError title="Couldn't load your calendar" reset={reset} />,
});

const FIRST_HOUR = 6;
const LAST_HOUR = 22; // grid ends at 10pm
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => i + FIRST_HOUR);
const ROW = 48; // px per hour

const KINDS = Object.keys(SESSION_KIND_LABELS) as SessionKind[];

function StudioCalendar() {
  const { state: demo, ready } = useDemo();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const isMobile = useIsMobile();
  const view: CalendarView = search.view ?? (isMobile ? "day" : "week");
  const cursor = fromKey(search.date ?? DEMO_TODAY);
  const [hidden, setHidden] = useState<Set<SessionKind>>(new Set());
  const [slot, setSlot] = useState<SessionDraft | undefined>();

  const go = (patch: { view?: CalendarView; date?: string }) =>
    void navigate({
      search: (prev) => validateCalendarSearch({ ...prev, ...patch }),
      replace: true,
    });

  const days = visibleDays(view, cursor);
  // Month view counts only the month itself, not the padding days.
  const rangeDays = view === "month" ? days.filter((d) => isSameMonth(d, cursor)) : days;
  // Cancelled sessions stay in your records but come off the calendar.
  const active = demo.sessions.filter((s) => s.status !== "cancelled");
  const inRange = sessionsIn(active, rangeDays);
  const shown = inRange.filter((s) => !hidden.has(s.kind));
  const clientName = (id: string) =>
    demo.clients.find((c) => c.id === id)?.name ?? "Unknown client";
  const toggle = (k: SessionKind) =>
    setHidden((h) => {
      const next = new Set(h);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const unit = view === "month" ? "month" : view === "week" ? "week" : "day";
=======
  component: StudioCalendar,
});

type View = "month" | "week" | "day";

// The demo data lives in the week of Apr 20, 2025.
const DEMO_ANCHOR = new Date(2025, 3, 20);
const FIRST_HOUR = 8;
const HOURS = Array.from({ length: 10 }, (_, i) => i + FIRST_HOUR); // 8am–5pm
const ROW = 52; // px per hour

const chip: Record<Session["color"], string> = {
  info: "bg-info/12 border-info/30 text-info",
  violet:
    "bg-[oklch(0.6_0.12_300/0.14)] border-[oklch(0.6_0.12_300/0.35)] text-[oklch(0.45_0.12_300)]",
  success: "bg-success/12 border-success/30 text-success",
};

const toMins = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

function StudioCalendar() {
  const { state: demo } = useDemo();
  const [view, setView] = useState<View>("week");
  const [cursor, setCursor] = useState(DEMO_ANCHOR);

  const step = (dir: 1 | -1) =>
    setCursor((c) =>
      view === "month" ? addMonths(c, dir) : addDays(c, dir * (view === "week" ? 7 : 1)),
    );

  const weekStart = startOfWeek(cursor);
  const days =
    view === "day" ? [cursor] : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 6);
  const label =
    view === "month"
      ? format(cursor, "MMMM yyyy")
      : view === "day"
        ? format(cursor, "EEEE, MMM d, yyyy")
        : `${format(weekStart, "MMM d")} – ${format(weekEnd, isSameMonth(weekStart, weekEnd) ? "d, yyyy" : "MMM d, yyyy")}`;

  const sessionsOn = (d: Date) => demo.sessions.filter((s) => s.date === dayKey(d));
  const client = (id: string) => demo.clients.find((c) => c.id === id)?.name ?? "";
>>>>>>> origin/main

  return (
    <div className="mx-auto max-w-6xl">
      <StudioTabs />
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h1 className="display-title text-2xl">Studio Calendar</h1>
        <AddSessionDialog defaultDate={dayKey(cursor)} />
      </div>

<<<<<<< HEAD
      <Panel className="p-3 sm:p-4">
=======
      <Panel className="p-4">
>>>>>>> origin/main
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
<<<<<<< HEAD
              aria-label={`Previous ${unit}`}
              onClick={() => go({ date: dayKey(stepCursor(view, cursor, -1)) })}
=======
              aria-label="Previous"
              onClick={() => step(-1)}
>>>>>>> origin/main
              className="rounded p-1 hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
<<<<<<< HEAD
            <p className="min-w-40 text-center text-sm font-medium" aria-live="polite">
              {rangeLabel(view, cursor)}
            </p>
            <button
              type="button"
              aria-label={`Next ${unit}`}
              onClick={() => go({ date: dayKey(stepCursor(view, cursor, 1)) })}
=======
            <p className="min-w-40 text-center text-sm font-medium">{label}</p>
            <button
              type="button"
              aria-label="Next"
              onClick={() => step(1)}
>>>>>>> origin/main
              className="rounded p-1 hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
<<<<<<< HEAD
              onClick={() => go({ date: DEMO_TODAY })}
              className="ml-2 rounded border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
            >
              Today
            </button>
          </div>
          <div
            className="inline-flex rounded-md border p-0.5 text-xs"
            role="group"
            aria-label="Calendar view"
          >
=======
              onClick={() => setCursor(DEMO_ANCHOR)}
              className="ml-2 rounded border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
            >
              This week
            </button>
          </div>
          <div className="inline-flex rounded-md border p-0.5 text-xs">
>>>>>>> origin/main
            {(["month", "week", "day"] as const).map((v) => (
              <button
                key={v}
                type="button"
<<<<<<< HEAD
                aria-pressed={view === v}
                onClick={() => go({ view: v })}
=======
                onClick={() => setView(v)}
>>>>>>> origin/main
                className={cn(
                  "rounded px-3 py-1 capitalize",
                  view === v
                    ? "bg-accent font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

<<<<<<< HEAD
        <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Filter by type">
          {KINDS.map((k) => {
            const count = inRange.filter((s) => s.kind === k).length;
            const off = hidden.has(k);
            return (
              <button
                key={k}
                type="button"
                aria-pressed={!off}
                onClick={() => toggle(k)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                  off ? "text-muted-foreground line-through opacity-60" : "bg-card hover:bg-accent",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", KIND_STYLE[k].dot)} />
                {SESSION_KIND_LABELS[k]}
                <span className="text-muted-foreground">{ready ? count : ""}</span>
              </button>
            );
          })}
          <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">
            Click an empty slot to add a session
          </span>
        </div>

        {!ready ? (
          <CalendarSkeleton />
        ) : view === "month" ? (
          <MonthGrid
            cursor={cursor}
            days={days}
            sessions={shown}
            clientName={clientName}
            onPickDay={(d) => go({ view: "day", date: dayKey(d) })}
          />
        ) : (
          <TimeGrid
            days={days}
            sessions={shown}
            clientName={clientName}
            onSlot={(date, start) =>
              setSlot({ date, start, end: fromMins(Math.min(toMins(start) + 60, LAST_HOUR * 60)) })
            }
            onPickDay={(d) => go({ view: "day", date: dayKey(d) })}
          />
        )}

        {ready && shown.length === 0 ? (
          <p
            className="mt-3 rounded-md border border-dashed px-3 py-2.5 text-center text-xs text-muted-foreground"
            role="status"
          >
            {inRange.length
              ? `Everything this ${unit} is hidden by your filters.`
              : `Nothing scheduled this ${unit}. Click a time slot or “Add Session” to book one.`}
          </p>
        ) : null}
      </Panel>

      <AddSessionDialog
        hideTrigger
        open={!!slot}
        onOpenChange={(o) => !o && setSlot(undefined)}
        initial={slot}
      />
    </div>
  );
}

// ---------- week & day ----------

function TimeGrid({
  days,
  sessions,
  clientName,
  onSlot,
  onPickDay,
}: {
  days: Date[];
  sessions: Session[];
  clientName: (id: string) => string;
  onSlot: (date: string, start: string) => void;
  onPickDay: (d: Date) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const today = fromKey(DEMO_TODAY);
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const rangeKey = days.map(dayKey).join();

  // Scroll to the first appointment in range (or 8am) whenever the range changes.
  const earliest = Math.min(8 * 60, ...sessions.map((s) => toMins(s.start)));
  useEffect(() => {
    scroller.current?.scrollTo({
      top: Math.max(0, ((earliest - FIRST_HOUR * 60) / 60) * ROW - 12),
    });
  }, [rangeKey, earliest]);

  return (
    <div className="mt-3 overflow-x-auto rounded-md border">
      <div className={cn(days.length > 1 && "min-w-[640px]")}>
        <div
          className="grid border-b bg-card"
          style={{ gridTemplateColumns: `3.25rem repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div />
          {days.map((d) => (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onPickDay(d)}
              disabled={days.length === 1}
              className="py-2 text-center text-[11px] text-muted-foreground enabled:hover:bg-accent/50"
            >
              {format(d, "EEE")}{" "}
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-medium text-foreground",
                  isSameDay(d, today) && "bg-primary text-primary-foreground",
                )}
              >
                {format(d, "d")}
              </span>
            </button>
          ))}
        </div>

        <div ref={scroller} className="max-h-[34rem] overflow-y-auto" data-testid="time-grid">
          <div
            className="grid"
            style={{ gridTemplateColumns: `3.25rem repeat(${days.length}, minmax(0, 1fr))` }}
          >
            <div>
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ height: ROW }}
                  className="pr-2 pt-0.5 text-right text-[10px] text-muted-foreground"
                >
                  {format(new Date(2025, 0, 1, h), "h a")}
                </div>
              ))}
            </div>
            {days.map((d) => {
              const key = dayKey(d);
              const placed = layoutDay(sessions.filter((s) => s.date === key));
              const isToday = isSameDay(d, today);
              return (
                <div
                  key={key}
                  role="presentation"
                  data-day={key}
                  className={cn("relative cursor-copy border-l", isToday && "bg-accent/25")}
                  style={{ height: ROW * HOURS.length }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    onSlot(key, slotTime(e.clientY - rect.top, ROW, FIRST_HOUR));
                  }}
=======
        {view === "month" ? (
          <MonthGrid
            cursor={cursor}
            sessionsOn={sessionsOn}
            onPick={(d) => {
              setCursor(d);
              setView("day");
            }}
          />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <div
              className={cn("grid", view === "day" ? "min-w-0" : "min-w-[640px]")}
              style={{ gridTemplateColumns: `3rem repeat(${days.length}, minmax(0, 1fr))` }}
            >
              <div />
              {days.map((d) => (
                <div
                  key={d.toISOString()}
                  className="border-b pb-2 text-center text-[11px] text-muted-foreground"
                >
                  {format(d, "EEE")}{" "}
                  <span className="font-medium text-foreground">{format(d, "d")}</span>
                </div>
              ))}

              <div className="relative">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    style={{ height: ROW }}
                    className="pr-2 pt-0.5 text-right text-[10px] text-muted-foreground"
                  >
                    {format(new Date(2025, 0, 1, h), "h a")}
                  </div>
                ))}
              </div>
              {days.map((d) => (
                <div
                  key={d.toISOString()}
                  className="relative border-l"
                  style={{ height: ROW * HOURS.length }}
>>>>>>> origin/main
                >
                  {HOURS.map((h) => (
                    <div key={h} style={{ height: ROW }} className="border-b border-dashed" />
                  ))}
<<<<<<< HEAD
                  {isToday && nowMins >= FIRST_HOUR * 60 && nowMins < LAST_HOUR * 60 ? (
                    <div
                      aria-label="Current time"
                      className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-rose"
                      style={{ top: ((nowMins - FIRST_HOUR * 60) / 60) * ROW }}
                    >
                      <span className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-rose" />
                    </div>
                  ) : null}
                  {placed.map(({ session: s, col, cols }) => {
                    const startM = Math.max(toMins(s.start), FIRST_HOUR * 60);
                    const endM = Math.min(Math.max(toMins(s.end), startM + 15), LAST_HOUR * 60);
                    const top = ((startM - FIRST_HOUR * 60) / 60) * ROW;
                    const height = Math.max(22, ((endM - startM) / 60) * ROW - 2);
                    return (
                      <Popover key={s.id}>
                        <PopoverTrigger
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`${s.title}, ${clientName(s.clientId)}, ${formatTime(s.start)} to ${formatTime(s.end)}`}
                          // Opaque card underneath so grid lines don't show through the tint.
                          className="absolute z-[1] rounded bg-card text-left text-[11px] leading-tight shadow-soft"
                          style={{
                            top: top + 1,
                            height,
                            left: `calc(${(col / cols) * 100}% + 2px)`,
                            width: `calc(${100 / cols}% - 4px)`,
                          }}
                        >
                          <span
                            className={cn(
                              "flex h-full flex-col overflow-hidden rounded border px-1.5 py-1",
                              KIND_STYLE[s.kind].chip,
                              s.status === "pending" && "border-dashed",
                            )}
                          >
                            <span className="block truncate font-medium">{s.title}</span>
                            <span className="block truncate opacity-80">
                              {formatTime(s.start)} · {clientName(s.clientId)}
                            </span>
                          </span>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-64 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EventDetails session={s} clientName={clientName(s.clientId)} />
=======
                  {sessionsOn(d).map((s) => {
                    const top = ((toMins(s.start) - FIRST_HOUR * 60) / 60) * ROW;
                    const height = Math.max(26, ((toMins(s.end) - toMins(s.start)) / 60) * ROW - 3);
                    return (
                      <Popover key={s.id}>
                        <PopoverTrigger
                          className={cn(
                            "absolute inset-x-1 overflow-hidden rounded border px-1.5 py-1 text-left text-[11px] leading-tight",
                            chip[s.color],
                          )}
                          style={{ top: Math.max(0, top) + 1, height }}
                        >
                          <span className="block truncate font-medium">
                            {s.note ?? client(s.clientId)}
                          </span>
                          <span className="block truncate opacity-80">{s.title}</span>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 text-xs">
                          <p className="text-sm font-semibold">{s.title}</p>
                          <p className="mt-1 text-muted-foreground">{client(s.clientId)}</p>
                          <p className="mt-2">
                            {format(d, "EEE, MMM d")} · {formatTime(s.start)} – {formatTime(s.end)}
                          </p>
                          <p className="text-muted-foreground">{s.location}</p>
                          <p className="mt-2 capitalize">{s.status}</p>
>>>>>>> origin/main
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>
<<<<<<< HEAD
              );
            })}
          </div>
        </div>
      </div>
=======
              ))}
            </div>
          </div>
        )}
      </Panel>
>>>>>>> origin/main
    </div>
  );
}

<<<<<<< HEAD
function EventDetails({ session: s, clientName }: { session: Session; clientName: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug">{s.title}</p>
        <StatusBadge status={s.status} />
      </div>
      <p className="flex items-center gap-1.5 text-muted-foreground">
        <span className={cn("h-2 w-2 rounded-full", KIND_STYLE[s.kind].dot)} />
        {SESSION_KIND_SINGULAR[s.kind]}
      </p>
      <Row icon={<Clock className="h-3.5 w-3.5" />}>
        {format(fromKey(s.date), "EEE, MMM d")} · {formatTime(s.start)} – {formatTime(s.end)}
      </Row>
      <Row icon={<MapPin className="h-3.5 w-3.5" />}>{s.location || "No location"}</Row>
      <Row icon={<User className="h-3.5 w-3.5" />}>
        <Link
          to="/clients/$id"
          params={{ id: s.clientId }}
          className="underline-offset-2 hover:underline"
        >
          {clientName}
        </Link>
      </Row>
      {s.note ? (
        <p className="rounded bg-muted px-2 py-1.5 text-muted-foreground">{s.note}</p>
      ) : null}
      <Link
        to="/studio/sessions/$id"
        params={{ id: s.id }}
        className="inline-flex items-center gap-1 pt-1 text-xs font-medium underline-offset-2 hover:underline"
      >
        View details →
      </Link>
    </div>
  );
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </p>
  );
}

// ---------- month ----------

const MAX_CHIPS = 3;

function MonthGrid({
  cursor,
  days,
  sessions,
  clientName,
  onPickDay,
}: {
  cursor: Date;
  days: Date[];
  sessions: Session[];
  clientName: (id: string) => string;
  onPickDay: (d: Date) => void;
}) {
  const today = fromKey(DEMO_TODAY);
  return (
    <div className="mt-3 grid grid-cols-7 overflow-hidden rounded-md border text-xs">
=======
function MonthGrid({
  cursor,
  sessionsOn,
  onPick,
}: {
  cursor: Date;
  sessionsOn: (d: Date) => Session[];
  onPick: (d: Date) => void;
}) {
  const start = startOfWeek(startOfMonth(cursor));
  const end = endOfWeek(endOfMonth(cursor));
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  return (
    <div className="mt-4 grid grid-cols-7 overflow-hidden rounded-md border text-xs">
>>>>>>> origin/main
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div
          key={d}
          className="border-b bg-muted/50 py-1.5 text-center text-[11px] text-muted-foreground"
        >
          {d}
        </div>
      ))}
<<<<<<< HEAD
      {days.map((d) => {
        const key = dayKey(d);
        const items = sessions.filter((s) => s.date === key);
        const extra = items.length - MAX_CHIPS;
        return (
          <div
            key={key}
            data-day={key}
            className={cn(
              "min-h-16 border-b border-r p-1 sm:min-h-24 sm:p-1.5 [&:nth-child(7n)]:border-r-0",
              !isSameMonth(d, cursor) && "bg-muted/30 text-muted-foreground/60",
            )}
          >
            <button
              type="button"
              onClick={() => onPickDay(d)}
              aria-label={`${format(d, "EEEE, MMMM d")}: ${items.length} ${items.length === 1 ? "session" : "sessions"}`}
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-accent",
                isSameDay(d, today) && "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {format(d, "d")}
            </button>
            {/* Phones: coloured dots. Larger screens: chips with details on click. */}
            {items.length ? (
              <button
                type="button"
                onClick={() => onPickDay(d)}
                aria-hidden
                tabIndex={-1}
                className="mt-1 flex flex-wrap gap-0.5 sm:hidden"
              >
                {items.map((s) => (
                  <span
                    key={s.id}
                    className={cn("h-1.5 w-1.5 rounded-full", KIND_STYLE[s.kind].dot)}
                  />
                ))}
              </button>
            ) : null}
            <div className="hidden sm:block">
              {items.slice(0, MAX_CHIPS).map((s) => (
                <Popover key={s.id}>
                  <PopoverTrigger
                    className={cn(
                      "mt-1 block w-full truncate rounded border px-1 text-left text-[10px]",
                      KIND_STYLE[s.kind].chip,
                      s.status === "pending" && "border-dashed",
                    )}
                  >
                    {formatTime(s.start)} {s.title}
                  </PopoverTrigger>
                  <PopoverContent className="w-64 text-xs">
                    <EventDetails session={s} clientName={clientName(s.clientId)} />
                  </PopoverContent>
                </Popover>
              ))}
              {extra > 0 ? (
                <button
                  type="button"
                  onClick={() => onPickDay(d)}
                  className="mt-1 block text-[10px] font-medium text-muted-foreground hover:text-foreground"
                >
                  +{extra} more
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="mt-3 space-y-2" aria-busy="true" aria-label="Loading calendar" role="status">
      <Skeleton className="h-8 w-full" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 14 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
=======
      {days.map((d) => (
        <button
          key={d.toISOString()}
          type="button"
          onClick={() => onPick(d)}
          className={cn(
            "min-h-20 border-b border-r p-1.5 text-left align-top hover:bg-accent/40",
            !isSameMonth(d, cursor) && "text-muted-foreground/50",
          )}
        >
          <span
            className={cn(
              "inline-flex h-5 w-5 items-center justify-center rounded-full",
              isSameDay(d, DEMO_ANCHOR) && "bg-primary text-primary-foreground",
            )}
          >
            {format(d, "d")}
          </span>
          {sessionsOn(d).map((s) => (
            <span
              key={s.id}
              className={cn("mt-1 block truncate rounded border px-1 text-[10px]", chip[s.color])}
            >
              {formatTime(s.start)} {s.title}
            </span>
          ))}
        </button>
      ))}
>>>>>>> origin/main
    </div>
  );
}
