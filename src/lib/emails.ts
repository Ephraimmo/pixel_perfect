// Email helpers — merge fields drawn from a client's real data, rendering,
// draft validation and outbox ordering. Pure so pages and tests share them.

import type { DemoState } from "./demo-data";
import type { EmailCategory, EmailTemplate, SentEmail } from "./emails-data";
import { fillFields } from "./contracts";
import { invoiceBalance } from "./invoices";

export const EMAIL_CATEGORY_LABELS: Record<EmailCategory, string> = {
  booking: "Booking",
  session: "Sessions",
  gallery: "Galleries",
  payment: "Payments",
  "follow-up": "Follow-up",
};

export const EMAIL_FIELDS: { key: string; label: string }[] = [
  { key: "client.firstName", label: "Client first name" },
  { key: "client.name", label: "Client full name" },
  { key: "studio.name", label: "Studio name" },
  { key: "photographer.name", label: "Your name" },
  { key: "session.date", label: "Next session date" },
  { key: "session.time", label: "Next session time" },
  { key: "session.location", label: "Next session location" },
  { key: "gallery.title", label: "Latest gallery title" },
  { key: "gallery.link", label: "Latest gallery link" },
  { key: "invoice.number", label: "Unpaid invoice number" },
  { key: "invoice.balance", label: "Unpaid invoice balance" },
  { key: "invoice.dueDate", label: "Unpaid invoice due date" },
];

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const longDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
const clock = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

/**
 * Values for one client: their next active session, latest published gallery
 * and oldest unpaid invoice. Fields with nothing to show stay undefined.
 */
export function emailValues(
  clientId: string,
  demo: Pick<DemoState, "clients" | "sessions" | "galleries" | "invoices" | "profile">,
  today: string,
  origin = "https://pixora.app",
): Record<string, string | undefined> {
  const client = demo.clients.find((c) => c.id === clientId);
  const session = demo.sessions
    .filter(
      (s) =>
        s.clientId === clientId &&
        s.status !== "cancelled" &&
        s.status !== "completed" &&
        s.date >= today,
    )
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0];
  const gallery = demo.galleries
    .filter((g) => g.clientId === clientId && g.status === "published")
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const invoice = demo.invoices
    .filter((i) => i.clientId === clientId && invoiceBalance(i) > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  return {
    "client.firstName": client?.name.split(" ")[0],
    "client.name": client?.name,
    "studio.name": demo.profile.studio,
    "photographer.name": demo.profile.name,
    "session.date": session ? longDate(session.date) : undefined,
    "session.time": session ? clock(session.start) : undefined,
    "session.location": session?.location || undefined,
    "gallery.title": gallery?.title,
    "gallery.link": gallery ? `${origin}/g/${gallery.id}` : undefined,
    "invoice.number": invoice?.number,
    "invoice.balance": invoice ? usd(invoiceBalance(invoice)) : undefined,
    "invoice.dueDate": invoice ? longDate(invoice.dueDate) : undefined,
  };
}

/** Render subject and body; `missing` lists fields this client has no data for. */
export function renderEmail(
  t: Pick<EmailTemplate, "subject" | "body">,
  values: Record<string, string | undefined>,
) {
  const subject = fillFields(t.subject, values);
  const body = fillFields(t.body, values);
  return {
    subject: subject.text,
    body: body.text,
    missing: [...new Set([...subject.missing, ...body.missing])],
  };
}

export const fieldLabel = (key: string) => EMAIL_FIELDS.find((f) => f.key === key)?.label ?? key;

/** Why a missing field can't be filled, in the studio's words. */
export function missingReason(key: string): string {
  if (key.startsWith("session.")) return "no upcoming session";
  if (key.startsWith("gallery.")) return "no published gallery";
  if (key.startsWith("invoice.")) return "no unpaid invoice";
  return "not a known field";
}

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  scheduleAt?: string | undefined; // ISO date-time, or undefined to send now
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmailDraft(d: EmailDraft, now: string) {
  const errors: { to?: string; subject?: string; body?: string; scheduleAt?: string } = {};
  if (!EMAIL_RE.test(d.to.trim())) errors.to = "This client has no valid email address.";
  if (!d.subject.trim()) errors.subject = "Add a subject.";
  else if (/\{\{/.test(d.subject)) errors.subject = "Fill in or remove the highlighted fields.";
  if (!d.body.trim()) errors.body = "Write a message.";
  else if (/\{\{/.test(d.body)) errors.body = "Fill in or remove the highlighted fields.";
  if (d.scheduleAt !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(d.scheduleAt))
      errors.scheduleAt = "Pick a date and time.";
    else if (d.scheduleAt <= now) errors.scheduleAt = "Schedule it for a time in the future.";
  }
  return errors;
}

export function validateTemplateDraft(t: Pick<EmailTemplate, "name" | "subject" | "body">) {
  const errors: { name?: string; subject?: string; body?: string; unknown: string[] } = {
    unknown: [],
  };
  if (!t.name.trim()) errors.name = "Name the template.";
  if (!t.subject.trim()) errors.subject = "Add a subject line.";
  if (!t.body.trim()) errors.body = "Write the email.";
  const known = new Set(EMAIL_FIELDS.map((f) => f.key));
  errors.unknown = [...`${t.subject}\n${t.body}`.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)]
    .map((m) => m[1]!)
    .filter((k, i, all) => !known.has(k) && all.indexOf(k) === i);
  return errors;
}

/** Scheduled (soonest first), then sent (newest first). */
export function sortOutbox(list: SentEmail[]): SentEmail[] {
  return [...list].sort((a, b) =>
    a.status !== b.status
      ? a.status === "scheduled"
        ? -1
        : 1
      : a.status === "scheduled"
        ? a.at.localeCompare(b.at)
        : b.at.localeCompare(a.at),
  );
}

export function filterTemplates(
  templates: EmailTemplate[],
  q: string,
  category?: EmailCategory,
): EmailTemplate[] {
  const needle = q.trim().toLowerCase();
  return templates.filter(
    (t) =>
      (!category || t.category === category) &&
      (!needle ||
        t.name.toLowerCase().includes(needle) ||
        t.subject.toLowerCase().includes(needle)),
  );
}

export interface EmailSearch {
  view?: "sent";
  q?: string;
  category?: EmailCategory;
}

export function validateEmailSearch(raw: Record<string, unknown>): EmailSearch {
  const out: EmailSearch = {};
  const { view, q, category } = raw;
  if (view === "sent") out.view = "sent";
  if (typeof q === "string" && q.trim()) out.q = q;
  if (typeof category === "string" && category in EMAIL_CATEGORY_LABELS)
    out.category = category as EmailCategory;
  return out;
}
