// Invoice math and status rules, kept pure so every screen that shows money
// (client profiles, the invoice list, dashboards) agrees to the cent.

import type { Invoice, InvoiceStatus, LineItem } from "./crm-data";

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
