import { describe, expect, it } from "vitest";
import {
  addDays,
  pctChange,
  periodRanges,
  recentOrders,
  revenueSeries,
  seedShopState,
  summarize,
  topProducts,
  type ShopOrder,
} from "./shop-data";

const order = (
  o: Partial<ShopOrder> & Pick<ShopOrder, "id" | "date" | "status" | "total">,
): ShopOrder => ({
  number: `#${o.id}`,
  customer: "Test Customer",
  email: "test@example.com",
  phone: "",
  subtotal: o.total,
  discount: 0,
  shipping: 0,
  couponCode: null,
  delivery: "ship",
  shippingAddress: null,
  paymentMethod: "manual",
  note: "",
  items: [{ productId: "p1", name: "8x10 Print", quantity: 1, unitPrice: o.total }],
  ...o,
});

describe("store sales helpers", () => {
  it("builds the current and previous periods back to back", () => {
    const { current, previous } = periodRanges(7, "2025-04-20");
    expect(current).toEqual({ from: "2025-04-14", to: "2025-04-20" });
    expect(previous).toEqual({ from: "2025-04-07", to: "2025-04-13" });
    expect(addDays("2025-03-01", -1)).toBe("2025-02-28");
  });

  it("never counts orders awaiting payment as revenue", () => {
    const orders = [
      order({ id: "1", date: "2025-04-20", status: "paid", total: 100 }),
      order({ id: "2", date: "2025-04-19", status: "pending", total: 900 }),
      order({ id: "3", date: "2025-04-18", status: "shipped", total: 50 }),
      order({ id: "4", date: "2025-03-01", status: "paid", total: 500 }), // out of range
    ];
    const s = summarize(orders, { from: "2025-04-14", to: "2025-04-20" });
    expect(s).toMatchObject({
      revenue: 150,
      orders: 3,
      paidOrders: 2,
      averageOrder: 75,
      itemsSold: 2,
    });
  });

  it("reports no change when there is nothing to compare with", () => {
    expect(pctChange(100, 0)).toBeNull();
    expect(pctChange(150, 100)).toBe(50);
  });

  it("buckets revenue daily for short ranges and weekly for long ones", () => {
    const orders = [order({ id: "1", date: "2025-04-20", status: "paid", total: 40 })];
    expect(revenueSeries(orders, periodRanges(7).current)).toHaveLength(7);
    const weekly = revenueSeries(orders, periodRanges(90).current);
    expect(weekly).toHaveLength(13);
    expect(weekly.reduce((s, p) => s + p.revenue, 0)).toBe(40);
  });

  it("ranks top products by paid revenue and sorts recent orders newest first", () => {
    const { products, orders } = seedShopState();
    const range = periodRanges(90).current;
    const top = topProducts(orders, products, range, 3);
    expect(top).toHaveLength(3);
    expect(top[0]!.revenue).toBeGreaterThanOrEqual(top[1]!.revenue);
    const recent = recentOrders(orders, 5);
    expect(recent[0]!.date >= recent[4]!.date).toBe(true);
  });

  it("seeds the same realistic history on every load", () => {
    const a = seedShopState();
    const b = seedShopState();
    expect(a.orders).toEqual(b.orders);
    expect(a.orders.length).toBeGreaterThan(40);
    for (const o of a.orders) {
      expect(o.subtotal).toBeCloseTo(
        o.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
        2,
      );
      expect(o.total).toBeCloseTo(o.subtotal - o.discount + o.shipping, 2);
      expect(o.delivery === "ship").toBe(o.shippingAddress !== null);
    }
    expect(a.orders.some((o) => o.couponCode === "SPRING15" && o.discount > 0)).toBe(true);
    expect(a.orders.some((o) => o.delivery === "pickup")).toBe(true);
    expect(a.orders.some((o) => o.status === "pending")).toBe(true);
  });
});
