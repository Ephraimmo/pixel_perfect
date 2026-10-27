// Invoice math and status rules, kept pure so every screen that shows money
// (client profiles, the invoice list, dashboards) agrees to the cent.

import type { Invoice, InvoiceStatus, LineItem, Payment, PaymentMethod } from "./crm-data";

/** Stored statuses plus "overdue", which is derived from the due date. */
export type InvoiceDisplayStatus = InvoiceStatus | "overdue";

export const INVOICE_STATUS_LABELS: Record<InvoiceDisplayStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  partial: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

const cents = (n: number) => Math.round(n * 100) / 100;

export function lineTotal(item: LineItem): number {
  return cents(item.quantity * item.unitPrice);
}

export function invoiceSubtotal(inv: Pick<Invoice, "items">): number {
  return cents(inv.items.reduce((sum, i) => sum + lineTotal(i), 0));
}

/** Discount in currency, never more than the subtotal. */
export function invoiceDiscount(inv: Pick<Invoice, "items" | "discount">): number {
  const subtotal = invoiceSubtotal(inv);
  const raw =
    inv.discount.kind === "percent" ? (subtotal * inv.discount.value) / 100 : inv.discount.value;
  return cents(Math.min(Math.max(raw, 0), subtotal));
}

export function invoiceTax(inv: Pick<Invoice, "items" | "discount" | "taxRate">): number {
  return cents(((invoiceSubtotal(inv) - invoiceDiscount(inv)) * Math.max(inv.taxRate, 0)) / 100);
}

export function invoiceTotal(inv: Pick<Invoice, "items" | "discount" | "taxRate">): number {
  return cents(invoiceSubtotal(inv) - invoiceDiscount(inv) + invoiceTax(inv));
}

export function invoiceBalance(inv: Invoice): number {
  if (inv.status === "void" || inv.status === "draft") return 0;
  return cents(Math.max(invoiceTotal(inv) - inv.amountPaid, 0));
}

export function invoiceDisplayStatus(inv: Invoice, today: string): InvoiceDisplayStatus {
  if ((inv.status === "sent" || inv.status === "partial") && inv.dueDate < today) return "overdue";
  return inv.status;
}

// ---------- list, payments and the editor ----------

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: "Card",
  eft: "Bank transfer (EFT)",
  cash: "Cash",
  other: "Other",
};

export const PAYMENT_TERMS = [
  { label: "Due on receipt", days: 0 },
  { label: "Net 7", days: 7 },
  { label: "Net 14", days: 14 },
  { label: "Net 30", days: 30 },
] as const;

export type InvoiceTab = "all" | "draft" | "outstanding" | "overdue" | "paid" | "void";

export const INVOICE_TABS: { value: InvoiceTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "outstanding", label: "Outstanding" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

export function invoiceTab(inv: Invoice, today: string): Exclude<InvoiceTab, "all"> {
  const s = invoiceDisplayStatus(inv, today);
  if (s === "sent" || s === "partial") return "outstanding";
  return s;
}

export function countInvoices(invoices: Invoice[], today: string): Record<InvoiceTab, number> {
  const out: Record<InvoiceTab, number> = {
    all: invoices.length,
    draft: 0,
    outstanding: 0,
    overdue: 0,
    paid: 0,
    void: 0,
  };
  for (const i of invoices) out[invoiceTab(i, today)] += 1;
  return out;
}

export interface InvoiceSearch {
  tab?: InvoiceTab;
  q?: string;
}

export function validateInvoiceSearch(raw: Record<string, unknown>): InvoiceSearch {
  const out: InvoiceSearch = {};
  const { tab, q } = raw;
  if (INVOICE_TABS.some((t) => t.value === tab) && tab !== "all") out.tab = tab as InvoiceTab;
  if (typeof q === "string" && q.trim()) out.q = q;
  return out;
}

/** Overdue first (most overdue on top), then newest issued. */
export function filterInvoices(
  invoices: Invoice[],
  clientName: (id: string) => string,
  { tab = "all", q = "" }: InvoiceSearch,
  today: string,
): Invoice[] {
  const needle = q.trim().toLowerCase();
  const overdue = (i: Invoice) => invoiceTab(i, today) === "overdue";
  return invoices
    .filter((i) => tab === "all" || invoiceTab(i, today) === tab)
    .filter(
      (i) =>
        !needle ||
        i.number.toLowerCase().includes(needle) ||
        clientName(i.clientId).toLowerCase().includes(needle) ||
        i.items.some((it) => it.description.toLowerCase().includes(needle)),
    )
    .sort(
      (a, b) =>
        Number(overdue(b)) - Number(overdue(a)) ||
        (overdue(a) ? a.dueDate.localeCompare(b.dueDate) : 0) ||
        b.issueDate.localeCompare(a.issueDate) ||
        b.number.localeCompare(a.number),
    );
}

/** Whole days past the due date, for unpaid sent invoices. */
export function daysOverdue(inv: Invoice, today: string): number {
  if (invoiceDisplayStatus(inv, today) !== "overdue") return 0;
  return Math.round(
    (Date.parse(`${today}T12:00:00`) - Date.parse(`${inv.dueDate}T12:00:00`)) / 86_400_000,
  );
}

/** Headline numbers for the invoices page and dashboard. */
export function invoiceStats(invoices: Invoice[], today: string) {
  const open = invoices.filter(
    (i) => invoiceTab(i, today) === "outstanding" || invoiceTab(i, today) === "overdue",
  );
  const overdue = invoices.filter((i) => invoiceTab(i, today) === "overdue");
  const since = new Date(`${today}T12:00:00`);
  since.setDate(since.getDate() - 30);
  const from = since.toISOString().slice(0, 10);
  const paid30 = invoices
    .flatMap((i) => (i.status === "void" ? [] : (i.payments ?? [])))
    .filter((p) => p.date > from && p.date <= today)
    .reduce((s, p) => s + p.amount, 0);
  const sum = (list: Invoice[]) => cents(list.reduce((s, i) => s + invoiceBalance(i), 0));
  return {
    outstandingCount: open.length,
    outstanding: sum(open),
    overdueCount: overdue.length,
    overdue: sum(overdue),
    paidLast30: cents(paid30),
  };
}

export function nextInvoiceNumber(invoices: Pick<Invoice, "number">[]): string {
  const max = invoices.reduce(
    (m, i) => Math.max(m, Number(i.number.replace(/\D/g, "")) || 0),
    1000,
  );
  return `INV-${max + 1}`;
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface InvoiceFormErrors {
  clientId?: string;
  dueDate?: string;
  items?: string;
  lines?: Record<string, string>;
  discount?: string;
  taxRate?: string;
}

export function validateInvoice(
  inv: Pick<Invoice, "clientId" | "issueDate" | "dueDate" | "items" | "discount" | "taxRate">,
): InvoiceFormErrors {
  const errors: InvoiceFormErrors = {};
  if (!inv.clientId) errors.clientId = "Choose a client.";
  if (!inv.dueDate) errors.dueDate = "Set a due date.";
  else if (inv.dueDate < inv.issueDate) errors.dueDate = "Due date can't be before the issue date.";
  if (inv.items.length === 0) errors.items = "Add at least one line item.";
  const lines: Record<string, string> = {};
  for (const i of inv.items) {
    if (!i.description.trim()) lines[i.id] = "Describe this item.";
    else if (!(i.quantity > 0)) lines[i.id] = "Quantity must be more than 0.";
    else if (!(i.unitPrice >= 0)) lines[i.id] = "Price can't be negative.";
  }
  if (Object.keys(lines).length) errors.lines = lines;
  if (!(inv.discount.value >= 0)) errors.discount = "Discount can't be negative.";
  else if (inv.discount.kind === "percent" && inv.discount.value > 100)
    errors.discount = "A percentage discount can't exceed 100%.";
  if (!(inv.taxRate >= 0) || inv.taxRate > 100) errors.taxRate = "Tax must be between 0 and 100%.";
  return errors;
}

/** A payment must be positive and no more than what's still owed. */
export function validatePayment(amount: number, inv: Invoice): string | undefined {
  const balance = invoiceBalance(inv);
  if (!(amount > 0)) return "Enter an amount greater than 0.";
  if (cents(amount) > balance) return `That's more than the $${balance.toFixed(2)} still owed.`;
  return undefined;
}

/** Add a payment and move the invoice to partial or paid. */
export function applyPayment(inv: Invoice, payment: Payment): Invoice {
  const payments = [...(inv.payments ?? []), { ...payment, amount: cents(payment.amount) }];
  const amountPaid = cents(payments.reduce((s, p) => s + p.amount, 0));
  const paid = amountPaid >= invoiceTotal(inv);
  return {
    ...inv,
    payments,
    amountPaid,
    status: paid ? "paid" : "partial",
    paidDate: paid ? payment.date : inv.paidDate,
  };
}
