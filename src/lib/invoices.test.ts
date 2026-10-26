import { describe, expect, it } from "vitest";

import { DEMO_TODAY, seedState } from "@/lib/demo-data";
import type { Invoice } from "@/lib/crm-data";
import {
  invoiceBalance,
  invoiceDiscount,
  invoiceDisplayStatus,
  invoiceSubtotal,
  invoiceTax,
  invoiceTotal,
} from "@/lib/invoices";

const invoices = seedState().invoices;
const byNumber = (n: string) => invoices.find((i) => i.number === n)!;

const base: Invoice = {
  id: "x",
  number: "INV-X",
  clientId: "c1",
  issueDate: "2025-04-01",
  dueDate: "2025-04-15",
  items: [
    { id: "a", description: "Session", quantity: 1, unitPrice: 199.99 },
    { id: "b", description: "Prints", quantity: 3, unitPrice: 12.5 },
  ],
  taxRate: 15,
  discount: { kind: "percent", value: 10 },
  amountPaid: 0,
  status: "sent",
  notes: "",
};

describe("invoice math", () => {
  it("adds line items, applies the discount, then tax — to the cent", () => {
    expect(invoiceSubtotal(base)).toBe(237.49);
    expect(invoiceDiscount(base)).toBe(23.75);
    expect(invoiceTax(base)).toBe(32.06);
    expect(invoiceTotal(base)).toBe(245.8);
  });

  it("caps an amount discount at the subtotal and ignores negatives", () => {
    expect(invoiceDiscount({ ...base, discount: { kind: "amount", value: 9999 } })).toBe(237.49);
    expect(invoiceTotal({ ...base, discount: { kind: "amount", value: 9999 } })).toBe(0);
    expect(invoiceDiscount({ ...base, discount: { kind: "amount", value: -5 } })).toBe(0);
  });

  it("matches the seeded invoices", () => {
    expect(invoiceTotal(byNumber("INV-1036"))).toBe(575);
    expect(invoiceTotal(byNumber("INV-1039"))).toBe(1725);
    expect(invoiceTotal(byNumber("INV-1045"))).toBe(230);
    expect(invoiceTotal(byNumber("INV-1047"))).toBe(305.33);
  });

  it("keeps the dashboard's pending total of $1,240 across three invoices", () => {
    const pending = invoices.filter((i) => invoiceBalance(i) > 0);
    expect(pending).toHaveLength(3);
    expect(pending.reduce((s, i) => s + invoiceBalance(i), 0)).toBe(1240);
  });
});

describe("invoiceBalance", () => {
  it("is what's left to pay on sent invoices, and zero for drafts, void and paid", () => {
    expect(invoiceBalance({ ...base, amountPaid: 45.8, status: "partial" })).toBe(200);
    expect(invoiceBalance({ ...base, status: "draft" })).toBe(0);
    expect(invoiceBalance({ ...base, status: "void" })).toBe(0);
    expect(invoiceBalance(byNumber("INV-1042"))).toBe(0);
  });
});

describe("invoiceDisplayStatus", () => {
  it("derives overdue from the due date for unpaid sent invoices", () => {
    expect(invoiceDisplayStatus(byNumber("INV-1044"), DEMO_TODAY)).toBe("overdue");
    expect(invoiceDisplayStatus(byNumber("INV-1043"), DEMO_TODAY)).toBe("sent");
    expect(invoiceDisplayStatus({ ...base, status: "partial" }, DEMO_TODAY)).toBe("overdue");
    expect(invoiceDisplayStatus({ ...base, status: "paid" }, DEMO_TODAY)).toBe("paid");
    expect(invoiceDisplayStatus({ ...base, status: "draft" }, DEMO_TODAY)).toBe("draft");
  });
});
