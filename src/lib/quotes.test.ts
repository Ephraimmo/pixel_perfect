import { describe, expect, it } from "vitest";

import { DEMO_TODAY, seedState } from "@/lib/demo-data";
import { invoiceTotal } from "@/lib/invoices";
import {
  acceptanceRate,
  countQuotes,
  filterQuotes,
  isQuoteLocked,
  nextQuoteNumber,
  openQuoteValue,
  parseAmount,
  quoteDisplayStatus,
  quoteRecipient,
  validateQuote,
  validateQuoteSearch,
} from "@/lib/quotes";

const { quotes, clients, leads } = seedState();
const byNumber = (n: string) => quotes.find((q) => q.number === n)!;
const name = (q: (typeof quotes)[number]) => quoteRecipient(q, clients, leads)?.name ?? "";

describe("seeded quotes", () => {
  it("total to the cent with shared invoice math", () => {
    expect(invoiceTotal(byNumber("Q-1021"))).toBe(3920); // 4,220 − $300
    expect(invoiceTotal(byNumber("Q-1023"))).toBe(720); // 800 − 10%
    expect(invoiceTotal(byNumber("Q-1017"))).toBe(3220); // 2,800 + 15% tax
    expect(invoiceTotal(byNumber("Q-1019"))).toBe(3000); // matches the project value
  });

  it("go to an existing client or lead", () => {
    for (const q of quotes) {
      expect(!!q.clientId !== !!q.leadId, q.number).toBe(true);
      expect(quoteRecipient(q, clients, leads), q.number).toBeDefined();
    }
    expect(quoteRecipient(byNumber("Q-1021"), clients, leads)).toMatchObject({
      kind: "lead",
      name: "Nomvula Sithole",
    });
  });
});

describe("status", () => {
  it("derives expired from the valid-until date", () => {
    expect(quoteDisplayStatus(byNumber("Q-1015"), DEMO_TODAY)).toBe("expired");
    expect(quoteDisplayStatus(byNumber("Q-1021"), DEMO_TODAY)).toBe("sent"); // valid through Apr 21
    expect(quoteDisplayStatus(byNumber("Q-1021"), "2025-04-22")).toBe("expired");
    expect(quoteDisplayStatus(byNumber("Q-1019"), "2030-01-01")).toBe("accepted");
  });

  it("locks answered quotes", () => {
    expect(isQuoteLocked(byNumber("Q-1019"))).toBe(true);
    expect(isQuoteLocked(byNumber("Q-1017"))).toBe(true);
    expect(isQuoteLocked(byNumber("Q-1022"))).toBe(false);
  });

  it("counts tabs and summarises", () => {
    expect(countQuotes(quotes, DEMO_TODAY)).toEqual({
      all: 7,
      draft: 1,
      sent: 3,
      accepted: 1,
      declined: 1,
      expired: 1,
    });
    expect(openQuoteValue(quotes, DEMO_TODAY)).toBe(2100 + 3920 + 2350);
    expect(acceptanceRate(quotes)).toBe(50);
    expect(acceptanceRate([])).toBeNull();
  });
});

describe("filterQuotes", () => {
  it("lists newest first and filters by tab and search", () => {
    const all = filterQuotes(quotes, name, {}, DEMO_TODAY);
    expect(all[0]?.number).toBe("Q-1023");
    expect(filterQuotes(quotes, name, { tab: "expired" }, DEMO_TODAY).map((q) => q.number)).toEqual(
      ["Q-1015"],
    );
    expect(filterQuotes(quotes, name, { q: "nomvula" }, DEMO_TODAY).map((q) => q.number)).toEqual([
      "Q-1021",
    ]);
    expect(filterQuotes(quotes, name, { q: "q-1019" }, DEMO_TODAY)).toHaveLength(1);
    expect(filterQuotes(quotes, name, { q: "headshots" }, DEMO_TODAY).map((q) => q.number)).toEqual(
      ["Q-1020"],
    );
  });
});

describe("editor rules", () => {
  const base = byNumber("Q-1022");

  it("numbers new quotes after the highest", () => {
    expect(nextQuoteNumber(quotes)).toBe("Q-1024");
    expect(nextQuoteNumber([])).toBe("Q-1001");
  });

  it("accepts a complete quote", () => {
    expect(validateQuote(base)).toEqual({});
  });

  it("flags recipient, title, dates, empty items and bad lines", () => {
    const e = validateQuote({
      ...base,
      clientId: undefined,
      leadId: undefined,
      title: " ",
      validUntil: "2025-04-01",
      items: [
        { id: "x", description: "", quantity: 1, unitPrice: 10 },
        { id: "y", description: "Prints", quantity: 0, unitPrice: 10 },
        { id: "z", description: "Album", quantity: 1, unitPrice: NaN },
      ],
    });
    expect(e.recipient).toBeDefined();
    expect(e.title).toBeDefined();
    expect(e.validUntil).toMatch(/on or after/);
    expect(e.lines).toEqual({
      x: "Describe this item.",
      y: "Quantity must be more than 0.",
      z: "Price can't be negative.",
    });
    expect(validateQuote({ ...base, items: [] }).items).toBeDefined();
  });

  it("bounds discount and tax", () => {
    expect(
      validateQuote({ ...base, discount: { kind: "percent", value: 120 } }).discount,
    ).toBeDefined();
    expect(
      validateQuote({ ...base, discount: { kind: "amount", value: -1 } }).discount,
    ).toBeDefined();
    expect(validateQuote({ ...base, taxRate: NaN }).taxRate).toBeDefined();
  });

  it("parses typed amounts", () => {
    expect(parseAmount(" 1,250.50 ")).toBe(1250.5);
    expect(parseAmount("")).toBeNaN();
    expect(parseAmount("abc")).toBeNaN();
  });

  it("validates list search", () => {
    expect(validateQuoteSearch({ tab: "expired", q: "x" })).toEqual({ tab: "expired", q: "x" });
    expect(validateQuoteSearch({ tab: "all", q: " " })).toEqual({});
    expect(validateQuoteSearch({ tab: "won" })).toEqual({});
  });
});
