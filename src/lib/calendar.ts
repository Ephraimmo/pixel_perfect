// Studio calendar helpers — URL search, visible ranges and the overlap layout
// for the time grid. Pure so the page and its tests share them.

import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Session, SessionKind } from "./demo-data";

export type CalendarView = "month" | "week" | "day";

export const SESSION_KIND_LABELS: Record<SessionKind, string> = {
  shoot: "Shoots",
  consultation: "Consultations",
  editing: "Editing",
  delivery: "Deliveries",
};

export const SESSION_KIND_SINGULAR: Record<SessionKind, string> = {
  shoot: "Shoot",
  consultation: "Consultation",
  editing: "Editing block",
  delivery: "Delivery",
};

export interface CalendarSearch {
  view?: CalendarView;
  date?: string; // yyyy-MM-dd
}

export const dayKey = (d: Date) => format(d, "yyyy-MM-dd");
export const fromKey = (key: string) => parseISO(`${key}T12:00:00`);

export function validateCalendarSearch(raw: Record<string, unknown>): CalendarSearch {
  const out: CalendarSearch = {};
  const { view, date } = raw;
  if (view === "month" || view === "day" || view === "week") out.view = view;
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && isValid(fromKey(date)))
    out.date = date;
  return out;
}

export function toMins(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMins(mins: number): string {
  const clamped = Math.max(0, Math.min(mins, 24 * 60 - 1));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

/** Days shown by a view around `cursor` (month view includes leading/trailing days). */
export function visibleDays(view: CalendarView, cursor: Date): Date[] {
  if (view === "day") return [cursor];
  const start = view === "week" ? startOfWeek(cursor) : startOfWeek(startOfMonth(cursor));
  const end = view === "week" ? endOfWeek(cursor) : endOfWeek(endOfMonth(cursor));
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return days;
}

export function stepCursor(view: CalendarView, cursor: Date, dir: 1 | -1): Date {
  if (view === "month") return addMonths(cursor, dir);
  return addDays(cursor, dir * (view === "week" ? 7 : 1));
}

export function rangeLabel(view: CalendarView, cursor: Date): string {
  if (view === "month") return format(cursor, "MMMM yyyy");
  if (view === "day") return format(cursor, "EEEE, MMM d, yyyy");
  const start = startOfWeek(cursor);
  const end = endOfWeek(cursor);
  return `${format(start, "MMM d")} – ${format(end, isSameMonth(start, end) ? "d, yyyy" : "MMM d, yyyy")}`;
}

/** Sessions on the given days, filtered by kind, earliest first. */
export function sessionsIn(
  sessions: Session[],
  days: Date[],
  hidden: ReadonlySet<SessionKind> = new Set(),
): Session[] {
  const keys = new Set(days.map(dayKey));
  return sessions
    .filter((s) => keys.has(s.date) && !hidden.has(s.kind))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

export interface PlacedSession {
  session: Session;
  /** Column within its overlap cluster, 0-based. */
  col: number;
  /** Number of columns the cluster needs. */
  cols: number;
}

/**
 * Lay out one day's sessions side by side where they overlap: each session
 * takes the first free column, and every session in an overlapping cluster
 * shares that cluster's column count.
 */
export function layoutDay(sessions: Session[]): PlacedSession[] {
  const sorted = [...sessions].sort(
    (a, b) => toMins(a.start) - toMins(b.start) || toMins(b.end) - toMins(a.end),
  );
  const placed: PlacedSession[] = [];
  let cluster: PlacedSession[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const p of cluster) p.cols = colEnds.length;
    cluster = [];
    colEnds = [];
  };

  for (const s of sorted) {
    const start = toMins(s.start);
    const end = Math.max(toMins(s.end), start + 15);
    if (start >= clusterEnd) flush();
    let col = colEnds.findIndex((e) => e <= start);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(end);
    } else colEnds[col] = end;
    const p = { session: s, col, cols: 1 };
    cluster.push(p);
    placed.push(p);
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();
  return placed;
}

/** Snap a pixel offset in the time grid to the half-hour slot it falls in. */
export function slotTime(offsetPx: number, rowPx: number, firstHour: number): string {
  const mins = firstHour * 60 + Math.floor(((offsetPx / rowPx) * 60) / 30) * 30;
  return fromMins(mins);
}
