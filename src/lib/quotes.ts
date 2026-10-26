// Quote helpers — statuses, recipients, list filtering, numbering and the
// editor's rules. Money math is shared with invoices (see invoices.ts).

import type { Client } from "./demo-data";
import type { LineItem } from "./crm-data";
import type { Lead } from "./leads-data";
import type { Quote, QuoteStatus } from "./quotes-data";
import { invoiceTotal } from "./invoices";

export type QuoteDisplayStatus = QuoteStatus | "expired";

export const QUOTE_STATUS_LABELS: Record<QuoteDisplayStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
};

export type QuoteTab = "all" | QuoteDisplayStatus;

export const QUOTE_TABS: { value: QuoteTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "expired", label: "Expired" },
];

/** A sent quote past its valid-until date is expired. */
export function quoteDisplayStatus(q: Quote, today: string): QuoteDisplayStatus {
  return q.status === "sent" && q.validUntil < today ? "expired" : q.status;
}

/** Accepted/declined quotes are a record of what the client saw — no more edits. */
export const isQuoteLocked = (q: Pick<Quote, "status">) =>
  q.status === "accepted" || q.status === "declined";

export interface QuoteRecipient {
  kind: "client" | "lead";
  id: string;
  name: string;
  email: string;
  phone: string;
}

export function quoteRecipient(
  q: Pick<Quote, "clientId" | "leadId">,
  clients: Client[],
  leads: Lead[],
): QuoteRecipient | undefined {
  if (q.clientId) {
    const c = clients.find((x) => x.id === q.clientId);
    return c && { kind: "client", id: c.id, name: c.name, email: c.email, phone: c.phone };
  }
  const l = leads.find((x) => x.id === q.leadId);
  return l && { kind: "lead", id: l.id, name: l.name, email: l.email, phone: l.phone };
}

export interface QuoteSearch {
  tab?: QuoteTab;
  q?: string;
}

export function validateQuoteSearch(raw: Record<string, unknown>): QuoteSearch {
  const out: QuoteSearch = {};
  const { tab, q } = raw;
  if (QUOTE_TABS.some((t) => t.value === tab) && tab !== "all") out.tab = tab as QuoteTab;
  if (typeof q === "string" && q.trim()) out.q = q;
  return out;
}

export function countQuotes(quotes: Quote[], today: string): Record<QuoteTab, number> {
  const out: Record<QuoteTab, number> = {
    all: quotes.length,
    draft: 0,
    sent: 0,
    accepted: 0,
    declined: 0,
    expired: 0,
  };
  for (const q of quotes) out[quoteDisplayStatus(q, today)] += 1;
  return out;
}

/** Newest first; search matches number, title and recipient name. */
export function filterQuotes(
  quotes: Quote[],
  recipientName: (q: Quote) => string,
  { tab = "all", q = "" }: QuoteSearch,
  today: string,
): Quote[] {
  const needle = q.trim().toLowerCase();
  return quotes
    .filter((x) => tab === "all" || quoteDisplayStatus(x, today) === tab)
    .filter(
      (x) =>
        !needle ||
        x.number.toLowerCase().includes(needle) ||
        x.title.toLowerCase().includes(needle) ||
        recipientName(x).toLowerCase().includes(needle),
    )
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number));
}

/** Value of quotes still awaiting an answer (sent, not expired). */
export function openQuoteValue(quotes: Quote[], today: string): number {
  return quotes
    .filter((q) => quoteDisplayStatus(q, today) === "sent")
    .reduce((s, q) => s + invoiceTotal(q), 0);
}

/** Accepted share of quotes that got an answer, 0–100, or null with none. */
export function acceptanceRate(quotes: Quote[]): number | null {
  const accepted = quotes.filter((q) => q.status === "accepted").length;
  const answered = accepted + quotes.filter((q) => q.status === "declined").length;
  return answered ? Math.round((accepted / answered) * 100) : null;
}

/** Next number after the highest existing "Q-####". */
export function nextQuoteNumber(quotes: Pick<Quote, "number">[]): string {
  const max = quotes.reduce((m, q) => Math.max(m, Number(q.number.replace(/\D/g, "")) || 0), 1000);
  return `Q-${max + 1}`;
}

export interface QuoteFormErrors {
  recipient?: string;
  title?: string;
  validUntil?: string;
  items?: string;
  /** Per line item id. */
  lines?: Record<string, string>;
  discount?: string;
  taxRate?: string;
}

export function validateQuote(
  q: Pick<
    Quote,
    "clientId" | "leadId" | "title" | "issueDate" | "validUntil" | "items" | "discount" | "taxRate"
  >,
): QuoteFormErrors {
  const errors: QuoteFormErrors = {};
  if (!q.clientId && !q.leadId) errors.recipient = "Choose who this quote is for.";
  if (!q.title.trim()) errors.title = "Give the quote a title.";
  if (!q.validUntil) errors.validUntil = "Set how long the quote is valid.";
  else if (q.validUntil < q.issueDate) errors.validUntil = "Must be on or after the issue date.";
  if (q.items.length === 0) errors.items = "Add at least one line item.";
  const lines: Record<string, string> = {};
  for (const i of q.items) {
    if (!i.description.trim()) lines[i.id] = "Describe this item.";
    else if (!(i.quantity > 0)) lines[i.id] = "Quantity must be more than 0.";
    else if (!(i.unitPrice >= 0)) lines[i.id] = "Price can't be negative.";
  }
  if (Object.keys(lines).length) errors.lines = lines;
  if (!(q.discount.value >= 0)) errors.discount = "Discount can't be negative.";
  else if (q.discount.kind === "percent" && q.discount.value > 100)
    errors.discount = "A percentage discount can't exceed 100%.";
  if (!(q.taxRate >= 0) || q.taxRate > 100) errors.taxRate = "Tax must be between 0 and 100%.";
  return errors;
}

export const hasQuoteErrors = (e: QuoteFormErrors) => Object.keys(e).length > 0;

/** Parse a user-typed number; blank or junk becomes NaN so validation can flag it. */
export function parseAmount(raw: string): number {
  const t = raw.trim();
  return t === "" ? NaN : Number(t.replace(/,/g, ""));
}

export function blankLine(id: string): LineItem {
  return { id, description: "", quantity: 1, unitPrice: 0 };
}
