// Session management helpers — list tabs, conflicts, form rules, labels and
// calendar-file export. Pure so the pages and their tests share them.

import { format } from "date-fns";
import type { Client, Session, SessionKind, SessionStatus } from "./demo-data";
import { fromKey, toMins } from "./calendar";

export type SessionTab = "upcoming" | "past" | "cancelled" | "all";

export const SESSION_TABS: { value: SessionTab; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const CANCEL_REASONS = [
  "Client requested",
  "Weather",
  "Illness",
  "Scheduling conflict",
  "Venue unavailable",
  "Other",
] as const;

export interface SessionListSearch {
  tab?: SessionTab;
  q?: string;
  kind?: SessionKind;
}

const KINDS: SessionKind[] = ["shoot", "consultation", "editing", "delivery"];

export function validateSessionSearch(raw: Record<string, unknown>): SessionListSearch {
  const out: SessionListSearch = {};
  const { tab, q, kind } = raw;
  if (tab === "past" || tab === "cancelled" || tab === "all") out.tab = tab;
  if (typeof q === "string" && q.trim()) out.q = q;
  if (KINDS.includes(kind as SessionKind)) out.kind = kind as SessionKind;
  return out;
}

/** Which list tab a session belongs to (besides "all"). */
export function sessionTab(s: Session, today: string): Exclude<SessionTab, "all"> {
  if (s.status === "cancelled") return "cancelled";
  if (s.status === "completed" || s.date < today) return "past";
  return "upcoming";
}

export function countSessionTabs(sessions: Session[], today: string): Record<SessionTab, number> {
  const out = { upcoming: 0, past: 0, cancelled: 0, all: sessions.length };
  for (const s of sessions) out[sessionTab(s, today)] += 1;
  return out;
}

/** Upcoming soonest first; past and cancelled most recent first. */
export function filterSessions(
  sessions: Session[],
  clients: Client[],
  { tab = "upcoming", q = "", kind }: SessionListSearch,
  today: string,
): Session[] {
  const needle = q.trim().toLowerCase();
  const name = (id: string) => clients.find((c) => c.id === id)?.name.toLowerCase() ?? "";
  const asc = (a: Session, b: Session) => (a.date + a.start).localeCompare(b.date + b.start);
  return sessions
    .filter((s) => tab === "all" || sessionTab(s, today) === tab)
    .filter((s) => !kind || s.kind === kind)
    .filter(
      (s) =>
        !needle ||
        s.title.toLowerCase().includes(needle) ||
        s.location.toLowerCase().includes(needle) ||
        name(s.clientId).includes(needle),
    )
    .sort((a, b) => (tab === "upcoming" ? asc(a, b) : asc(b, a)));
}

/** Other active sessions that overlap the given slot on the same day. */
export function findConflicts(
  sessions: Session[],
  slot: { date: string; start: string; end: string },
  ignoreId?: string,
): Session[] {
  const start = toMins(slot.start);
  const end = toMins(slot.end);
  return sessions.filter(
    (s) =>
      s.id !== ignoreId &&
      s.status !== "cancelled" &&
      s.date === slot.date &&
      toMins(s.start) < end &&
      start < toMins(s.end),
  );
}

export function durationLabel(start: string, end: string): string {
  const mins = Math.max(0, toMins(end) - toMins(start));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} ${h === 1 ? "hour" : "hours"}`;
}

/** "Thu, Apr 24 · 2:00 PM" — used in reschedule history and notices. */
export function slotLabel(date: string, start: string): string {
  const [h = 0, m = 0] = start.split(":").map(Number);
  const time = format(new Date(2025, 0, 1, h, m), "h:mm a");
  return `${format(fromKey(date), "EEE, MMM d")} · ${time}`;
}

export interface SessionFormInput {
  title: string;
  clientId: string;
  date: string;
  start: string;
  end: string;
}

export function validateSessionForm(
  input: SessionFormInput,
): Partial<Record<keyof SessionFormInput, string>> {
  const errors: Partial<Record<keyof SessionFormInput, string>> = {};
  if (!input.title.trim()) errors.title = "Give the session a name.";
  if (!input.clientId) errors.clientId = "Choose a client.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) errors.date = "Pick a date.";
  if (!input.start || !input.end) errors.end = "Set a start and end time.";
  else if (input.end <= input.start) errors.end = "End must be after start.";
  return errors;
}

const icsEscape = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * A minimal iCalendar file for one session. Times are "floating" (no time
 * zone), so they show at the same wall-clock time in any calendar app.
 */
export function sessionIcs(s: Session, clientName: string, studio: string): string {
  const stamp = (date: string, hhmm: string) =>
    `${date.replace(/-/g, "")}T${hhmm.replace(":", "")}00`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pixora//Studio Sessions//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${s.id}@pixora.demo`,
    `DTSTAMP:${stamp(s.date, s.start)}`,
    `DTSTART:${stamp(s.date, s.start)}`,
    `DTEND:${stamp(s.date, s.end)}`,
    `SUMMARY:${icsEscape(`${s.title} — ${clientName}`)}`,
    `LOCATION:${icsEscape(s.location)}`,
    `DESCRIPTION:${icsEscape(`${studio} session with ${clientName}.${s.notes ? `\n\n${s.notes}` : ""}`)}`,
    `STATUS:${s.status === "cancelled" ? "CANCELLED" : s.status === "pending" ? "TENTATIVE" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
