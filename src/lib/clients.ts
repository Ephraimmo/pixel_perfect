// Client list helpers — URL search validation, filter/search/sort and the
// add-client form rules, kept pure so the page and its tests share them.

import type { ClientEvent, ClientEventKind, ClientNote } from "./crm-data";
import type { Client, ClientSource, ClientStatus, ClientType } from "./demo-data";

export type ClientStatusFilter = "all" | ClientStatus | "starred";
export type ClientTypeFilter = "all" | ClientType;
export type ClientSort = "recent" | "name" | "newest" | "sessions" | "spent";

export const CLIENT_STATUS_TABS: { value: ClientStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "past", label: "Past" },
  { value: "starred", label: "Starred" },
];

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  wedding: "Wedding",
  portrait: "Portrait",
  family: "Family",
  commercial: "Commercial",
  event: "Event",
};

export const CLIENT_SOURCE_LABELS: Record<ClientSource, string> = {
  website: "Website",
  referral: "Referral",
  instagram: "Instagram",
  google: "Google",
  repeat: "Repeat client",
};

export const CLIENT_SORT_LABELS: Record<ClientSort, string> = {
  recent: "Recent activity",
  name: "Name A–Z",
  newest: "Newest clients",
  sessions: "Most sessions",
  spent: "Highest spend",
};

export interface ClientListSearch {
  status?: ClientStatusFilter;
  type?: ClientTypeFilter;
  q?: string;
  sort?: ClientSort;
}

const isStatus = (v: unknown): v is ClientStatusFilter =>
  CLIENT_STATUS_TABS.some((t) => t.value === v);
const isType = (v: unknown): v is ClientType => typeof v === "string" && v in CLIENT_TYPE_LABELS;
const isSort = (v: unknown): v is ClientSort => typeof v === "string" && v in CLIENT_SORT_LABELS;

/** Parse ?status=&type=&q=&sort= leniently: unknown values fall back to defaults (omitted). */
export function validateClientListSearch(raw: Record<string, unknown>): ClientListSearch {
  const out: ClientListSearch = {};
  const { status, type, q, sort } = raw;
  if (isStatus(status) && status !== "all") out.status = status;
  if (isType(type)) out.type = type;
  if (typeof q === "string" && q.trim()) out.q = q;
  if (isSort(sort) && sort !== "recent") out.sort = sort;
  return out;
}

export function countClients(clients: Client[]): Record<ClientStatusFilter, number> {
  const counts: Record<ClientStatusFilter, number> = {
    all: clients.length,
    active: 0,
    past: 0,
    starred: 0,
  };
  for (const c of clients) {
    counts[c.status] += 1;
    if (c.starred) counts.starred += 1;
  }
  return counts;
}

/** Case-insensitive match on name, email, company, city, tags and phone digits. */
export function matchesClientQuery(c: Client, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return (
    [c.name, c.email, c.company, c.city, ...c.tags].some((f) => f.toLowerCase().includes(q)) ||
    (digits.length >= 3 && c.phone.replace(/\D/g, "").includes(digits))
  );
}

export function filterClients(
  clients: Client[],
  { status = "all", type = "all", q = "", sort = "recent" }: ClientListSearch,
): Client[] {
  const byName = (a: Client, b: Client) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  const compare: Record<ClientSort, (a: Client, b: Client) => number> = {
    recent: (a, b) => b.lastActivity.localeCompare(a.lastActivity) || byName(a, b),
    name: byName,
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt) || byName(a, b),
    sessions: (a, b) => b.sessions - a.sessions || byName(a, b),
    spent: (a, b) => b.totalSpent - a.totalSpent || byName(a, b),
  };
  return clients
    .filter((c) => (status === "starred" ? c.starred : status === "all" || c.status === status))
    .filter((c) => type === "all" || c.type === type)
    .filter((c) => matchesClientQuery(c, q))
    .sort(compare[sort]);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]!.charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : "";
  return (first + last).toUpperCase();
}

/** "Today", "Yesterday", "5 days ago", "3 weeks ago", or a date for anything older. */
export function relativeDay(isoDate: string, today: string): string {
  const days = Math.round(
    (Date.parse(`${today}T12:00:00`) - Date.parse(`${isoDate}T12:00:00`)) / 86_400_000,
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 35) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export const CLIENT_NAME_MAX = 80;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface ClientFormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

/** Validation for the Add Client form. Emails must be unique across clients. */
export function validateClientForm(
  input: { name: string; email: string; phone: string },
  existing: Client[],
  /** The client being edited, so their own email doesn't count as a duplicate. */
  exceptId?: string,
): ClientFormErrors {
  const errors: ClientFormErrors = {};
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) errors.name = "Enter the client's name.";
  else if (name.length > CLIENT_NAME_MAX)
    errors.name = `Keep it under ${CLIENT_NAME_MAX} characters.`;
  if (!email) errors.email = "Enter an email address.";
  else if (!EMAIL_RE.test(email)) errors.email = "That doesn't look like an email address.";
  else {
    const match = existing.find((c) => c.id !== exceptId && c.email.toLowerCase() === email);
    if (match) errors.email = `${match.name} already uses this email.`;
  }
  const digits = input.phone.replace(/\D/g, "");
  if (input.phone.trim() && (digits.length < 7 || /[^\d\s()+.-]/.test(input.phone)))
    errors.phone = "Use digits, spaces, ( ) + or - only, at least 7 digits.";
  return errors;
}

/** "Wedding 2025, album ,  " → ["Wedding 2025", "album"], de-duplicated case-insensitively. */
export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const t of raw.split(",")) {
    const tag = t.trim().slice(0, 24);
    if (tag && !seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase());
      tags.push(tag);
    }
  }
  return tags.slice(0, 6);
}

// ---------- profile ----------

export interface TimelineEntry {
  id: string;
  kind: ClientEventKind | "created";
  title: string;
  detail: string;
  at: string; // ISO date or date-time
}

/** A client's activity, newest first, ending with the day they became a client. */
export function clientTimeline(client: Client, events: ClientEvent[]): TimelineEntry[] {
  return [
    ...events
      .filter((e) => e.clientId === client.id)
      .sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id)),
    {
      id: `created-${client.id}`,
      kind: "created" as const,
      title: "Became a client",
      detail: `via ${CLIENT_SOURCE_LABELS[client.source]}`,
      at: client.createdAt,
    },
  ];
}

/** Group timeline entries under day headings, keeping their order. */
export function groupByDay<T extends { at: string }>(entries: T[]): { day: string; items: T[] }[] {
  const groups: { day: string; items: T[] }[] = [];
  for (const e of entries) {
    const day = e.at.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(e);
    else groups.push({ day, items: [e] });
  }
  return groups;
}

/** Pinned notes first, then newest first. */
export function sortNotes(notes: ClientNote[]): ClientNote[] {
  return [...notes].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt),
  );
}

export const NOTE_MAX = 1000;
