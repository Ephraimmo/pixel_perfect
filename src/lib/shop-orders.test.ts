import { describe, expect, it } from "vitest";
import { seedShopState, summarize, type ShopOrder } from "./shop-data";
import {
  countOrdersByStatus,
  customerHistory,
  filterOrders,
  orderActions,
  orderSteps,
  ordersToCsv,
  paginate,
  paymentState,
  validateOrderSearch,
} from "./shop-orders";

const { orders } = seedShopState();
const base = orders.find((o) => o.delivery === "ship")!;
const as = (patch: Partial<ShopOrder>): ShopOrder => ({ ...base, ...patch });

describe("order lifecycle", () => {
  it("only lets the studio record payment for bank transfers", () => {
    const transfer = orderActions(as({ status: "pending", paymentMethod: "manual" }));
    expect(transfer.map((a) => a.to)).toEqual(["paid", "cancelled"]);
    expect(transfer[0]!.confirm).toMatch(/in your bank account/);
    const card = orderActions(as({ status: "pending", paymentMethod: "stripe" }));
    expect(card.map((a) => a.to)).toEqual(["cancelled"]);
  });

  it("follows the right path for shipped, collected and digital orders", () => {
    expect(orderActions(as({ status: "paid" }))[0]!.to).toBe("processing");
    expect(orderActions(as({ status: "processing" }))[0]!.to).toBe("shipped");
    expect(orderActions(as({ status: "processing", delivery: "pickup" }))[0]!.label).toBe(
      "Mark collected",
    );
    expect(orderActions(as({ status: "paid", delivery: "digital" }))[0]!.to).toBe("delivered");
    expect(orderActions(as({ status: "delivered" }))).toEqual([]);
    expect(orderActions(as({ status: "cancelled" }))).toEqual([]);
    expect(orderSteps({ delivery: "digital" })).toEqual(["pending", "paid", "delivered"]);
    expect(paymentState({ status: "cancelled" })).toBe("void");
    expect(paymentState({ status: "shipped" })).toBe("paid");
  });

  it("leaves cancelled orders out of sales", () => {
    const range = { from: "2025-01-01", to: "2025-12-31" };
    const cancelled = as({ id: "x", status: "cancelled", date: "2025-04-01", total: 999 });
    expect(summarize([cancelled], range)).toMatchObject({ revenue: 0, orders: 0 });
    expect(orders.some((o) => o.status === "cancelled")).toBe(true);
  });
});

describe("order list", () => {
  it("searches by number, name or email and sorts", () => {
    const first = orders[0]!;
    expect(filterOrders(orders, { q: first.number }).map((o) => o.id)).toContain(first.id);
    expect(filterOrders(orders, { q: first.number.replace("#", "") }).map((o) => o.id)).toContain(
      first.id,
    );
    const byEmail = filterOrders(orders, { q: "SARAH@sarahmitchell.com" });
    expect(byEmail.length).toBeGreaterThan(0);
    expect(byEmail.every((o) => o.email === "sarah@sarahmitchell.com")).toBe(true);
    const totals = filterOrders(orders, { sort: "total-desc" }).map((o) => o.total);
    expect(totals).toEqual([...totals].sort((a, b) => b - a));
    const pending = filterOrders(orders, { status: "pending" });
    expect(pending.length).toBe(countOrdersByStatus(orders).pending);
  });

  it("paginates and validates search params", () => {
    const p = paginate(orders, 99);
    expect(p.page).toBe(p.pages);
    expect(paginate([], 1)).toMatchObject({ page: 1, pages: 1, from: 0, to: 0 });
    expect(validateOrderSearch({ status: "nope", sort: "newest", page: "1", q: "" })).toEqual({});
    expect(validateOrderSearch({ status: "delivered", page: "3" })).toEqual({
      status: "delivered",
      page: 3,
    });
  });

  it("summarises a customer and exports CSV safely", () => {
    const h = customerHistory(orders, "sarah@sarahmitchell.com");
    expect(h.orders).toBeGreaterThan(0);
    expect(h.firstOrder).toMatch(/^2025-/);
    const csv = ordersToCsv([as({ customer: 'Ann "Annie" Lee, Jr', number: "#9" })]);
    const [header, row] = csv.split("\n");
    expect(header!.startsWith("Order,Date,Customer")).toBe(true);
    expect(row).toContain('"Ann ""Annie"" Lee, Jr"');
  });
});

describe("seeded orders", () => {
  it("never ships an order the client collects or downloads", () => {
    for (const o of orders) {
      if (o.delivery !== "ship") expect(o.status).not.toBe("shipped");
      if (o.delivery === "digital") expect(["processing"]).not.toContain(o.status);
    }
  });
});
