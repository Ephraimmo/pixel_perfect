import { describe, expect, it } from "vitest";
import { isPaid, seedShopState, type ShopOrder } from "./shop-data";
import {
  couponReport,
  productReport,
  productReportCsv,
  resolveRange,
  salesByCategory,
  salesReport,
  sortProductRows,
  validateReportSearch,
} from "./shop-reports";

const { orders, products, coupons } = seedShopState();
const all = { from: "2025-01-01", to: "2025-04-20" };

describe("report ranges", () => {
  it("parses presets and custom ranges", () => {
    expect(validateReportSearch({ days: "7" })).toEqual({ days: 7 });
    expect(validateReportSearch({ days: "30" })).toEqual({});
    expect(validateReportSearch({ from: "2025-04-01", to: "2025-04-10", days: "7" })).toEqual({
      from: "2025-04-01",
      to: "2025-04-10",
    });
    expect(validateReportSearch({ from: "2025-04-10", to: "2025-04-01" })).toEqual({});
    const r = resolveRange({ from: "2025-04-01", to: "2025-04-10" });
    expect(r).toMatchObject({
      days: 10,
      custom: true,
      previous: { from: "2025-03-22", to: "2025-03-31" },
    });
    expect(resolveRange({}, "2025-04-20").current).toEqual({
      from: "2025-03-22",
      to: "2025-04-20",
    });
  });
});

describe("sales report", () => {
  it("reconciles gross − discounts + shipping = net over paid orders", () => {
    const r = salesReport(orders, all);
    expect(r.net).toBeCloseTo(r.gross - r.discounts + r.shipping, 2);
    const paid = orders.filter(isPaid);
    expect(r.paidOrders).toBe(paid.length);
    expect(r.net).toBeCloseTo(
      paid.reduce((s, o) => s + o.total, 0),
      2,
    );
    expect(r.awaitingCount).toBe(orders.filter((o) => o.status === "pending").length);
  });

  it("splits item sales by product type and matches the product table", () => {
    const cats = salesByCategory(orders, products, all);
    const rows = productReport(orders, products, all, { from: "2024-01-01", to: "2024-12-31" });
    const catTotal = cats.reduce((s, c) => s + c.revenue, 0);
    expect(catTotal).toBeCloseTo(
      rows.reduce((s, r) => s + r.revenue, 0),
      2,
    );
    expect(catTotal).toBeCloseTo(salesReport(orders, all).gross, 2);
    expect(rows.reduce((s, r) => s + r.share, 0)).toBeCloseTo(100, 0);
    expect(rows.every((r) => r.change === null)).toBe(true); // nothing in the previous year
  });

  it("compares product revenue with the previous period and sorts", () => {
    const mk = (id: string, date: string, total: number): ShopOrder => ({
      ...orders[0]!,
      id,
      date,
      status: "paid",
      items: [{ productId: "p1", name: "8x10 Print", quantity: 1, unitPrice: total }],
      subtotal: total,
      discount: 0,
      shipping: 0,
      total,
      couponCode: null,
    });
    const list = [mk("a", "2025-04-15", 150), mk("b", "2025-04-05", 100)];
    const rows = productReport(
      list,
      products,
      { from: "2025-04-11", to: "2025-04-20" },
      { from: "2025-04-01", to: "2025-04-10" },
    );
    const p1 = rows.find((r) => r.id === "p1")!;
    expect(p1).toMatchObject({ revenue: 150, previousRevenue: 100, change: 50, share: 100 });
    const byName = sortProductRows(rows, "name", "asc").map((r) => r.name);
    expect(byName).toEqual(
      [...byName].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    );
    expect(sortProductRows(rows, "change", "desc")[0]!.id).toBe("p1");
  });

  it("reports coupon redemptions on paid orders and exports CSV", () => {
    const rows = couponReport(orders, coupons, all);
    const spring = rows.find((r) => r.code === "SPRING15")!;
    expect(spring.redemptions).toBe(
      orders.filter((o) => o.couponCode === "SPRING15" && isPaid(o)).length,
    );
    expect(spring.discount).toBeGreaterThan(0);
    expect(rows.map((r) => r.code)).toContain("MOTHERSDAY"); // unused codes still listed
    const csv = productReportCsv(productReport(orders, products, all, all), all);
    expect(csv.split("\n")[0]).toBe("# 2025-01-01 to 2025-04-20");
    expect(csv.split("\n")[1]).toBe(
      "Product,Type,Units,Orders,Revenue,Share %,Previous revenue,Change %",
    );
  });
});
