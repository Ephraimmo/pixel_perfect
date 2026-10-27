import { describe, expect, it } from "vitest";

import { DEMO_TODAY, seedState } from "@/lib/demo-data";
import type { Invoice } from "@/lib/crm-data";
import {
  addDaysIso,
  applyPayment,
  countInvoices,
  daysOverdue,
  filterInvoices,
  invoiceBalance,
  invoiceStats,
  nextInvoiceNumber,
  validateInvoice,
  validateInvoiceSearch,
  validatePayment,
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

  it("adds up the outstanding balances the dashboard shows", () => {
    const pending = invoices.filter((i) => invoiceBalance(i) > 0);
    expect(pending.map((i) => i.number).sort()).toEqual([
      "INV-1043",
      "INV-1044",
      "INV-1045",
      "INV-1048",
    ]);
    // 450 + 560 + 230 + (966 − 300 deposit)
    expect(pending.reduce((s, i) => s + invoiceBalance(i), 0)).toBe(1906);
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

describe("payments", () => {
  const sent: Invoice = {
    ...base,
    taxRate: 0,
    discount: { kind: "amount", value: 0 },
    payments: [],
  };
  // total 237.49

  it("moves sent → partial → paid and keeps a history", () => {
    const part = applyPayment(sent, {
      id: "p1",
      amount: 100,
      date: "2025-04-18",
      method: "eft",
      note: "",
    });
    expect(part).toMatchObject({ status: "partial", amountPaid: 100 });
    expect(invoiceBalance(part)).toBe(137.49);
    const full = applyPayment(part, {
      id: "p2",
      amount: 137.49,
      date: "2025-04-20",
      method: "card",
      note: "",
    });
    expect(full).toMatchObject({ status: "paid", amountPaid: 237.49, paidDate: "2025-04-20" });
    expect(full.payments).toHaveLength(2);
  });

  it("refuses zero, negative and overpayments", () => {
    expect(validatePayment(0, sent)).toBeDefined();
    expect(validatePayment(-5, sent)).toBeDefined();
    expect(validatePayment(237.5, sent)).toMatch(/more than the \$237.49/);
    expect(validatePayment(237.49, sent)).toBeUndefined();
    expect(validatePayment(Number.NaN, sent)).toBeDefined();
  });
});

describe("list and stats", () => {
  const today = DEMO_TODAY;
  const name = () => "";

  it("counts tabs, with overdue split from outstanding", () => {
    expect(countInvoices(invoices, today)).toEqual({
      all: 12,
      draft: 1,
      outstanding: 3,
      overdue: 1,
      paid: 6,
      void: 1,
    });
  });

  it("puts overdue invoices first, then newest", () => {
    const rows = filterInvoices(invoices, name, {}, today);
    expect(rows[0]?.number).toBe("INV-1044");
    expect(rows[1]?.number).toBe("INV-1047");
    expect(filterInvoices(invoices, name, { q: "canvas" }, today).map((i) => i.number)).toEqual([
      "INV-1047",
    ]);
    expect(filterInvoices(invoices, name, { tab: "void" }, today).map((i) => i.number)).toEqual([
      "INV-1037",
    ]);
  });

  it("summarises money for the page and dashboard", () => {
    expect(invoiceStats(invoices, today)).toEqual({
      outstandingCount: 4,
      outstanding: 1906,
      overdueCount: 1,
      overdue: 560,
      paidLast30: 1500, // 1,200 (INV-1042) + 300 deposit (INV-1048)
    });
    expect(daysOverdue(byNumber("INV-1044"), today)).toBe(6);
    expect(daysOverdue(byNumber("INV-1043"), today)).toBe(0);
  });

  it("numbers, dates and search params", () => {
    expect(nextInvoiceNumber(invoices)).toBe("INV-1049");
    expect(addDaysIso("2025-04-20", 14)).toBe("2025-05-04");
    expect(validateInvoiceSearch({ tab: "overdue", q: "x" })).toEqual({ tab: "overdue", q: "x" });
    expect(validateInvoiceSearch({ tab: "late" })).toEqual({});
  });

  it("validates the editor", () => {
    expect(validateInvoice(base)).toEqual({});
    const e = validateInvoice({ ...base, clientId: "", dueDate: "2025-03-01", items: [] });
    expect(Object.keys(e).sort()).toEqual(["clientId", "dueDate", "items"]);
  });
});
