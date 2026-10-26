// Store reports — date ranges, revenue breakdowns and product/coupon
// performance over paid orders. Pure, so the reports page and tests agree.

import { DEMO_TODAY } from "./demo-data";
import {
  addDays,
  inRange,
  isPaid,
  pctChange,
  type Coupon,
  type DateRange,
  type ProductCategory,
  type ShopOrder,
  type ShopProduct,
} from "./shop-data";

export const RANGE_PRESETS = [7, 30, 90] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export interface ReportSearch {
  days?: RangePreset;
  from?: string;
  to?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** ?days=7|90 (30 is the default), or a custom ?from=&to= that wins when valid. */
export function validateReportSearch(raw: Record<string, unknown>): ReportSearch {
  const from = raw["from"];
  const to = raw["to"];
  if (
    typeof from === "string" &&
    typeof to === "string" &&
    DATE_RE.test(from) &&
    DATE_RE.test(to) &&
    from <= to
  )
    return { from, to };
  const days = Number(raw["days"]);
  return RANGE_PRESETS.includes(days as RangePreset) && days !== 30
    ? { days: days as RangePreset }
    : {};
}

export function daysInRange(r: DateRange): number {
  return (
    Math.round((Date.parse(`${r.to}T00:00:00Z`) - Date.parse(`${r.from}T00:00:00Z`)) / 86_400_000) +
    1
  );
}

/** The selected range and the equal-length period just before it. */
export function resolveRange(search: ReportSearch, today = DEMO_TODAY) {
  const current: DateRange =
    search.from && search.to
      ? { from: search.from, to: search.to }
      : { from: addDays(today, -((search.days ?? 30) - 1)), to: today };
  const days = daysInRange(current);
  const previous: DateRange = { from: addDays(current.from, -days), to: addDays(current.from, -1) };
  return { current, previous, days, custom: !!(search.from && search.to) };
}

export interface SalesReport {
  /** Item sales before discounts. */
  gross: number;
  discounts: number;
  shipping: number;
  /** What clients paid: gross − discounts + shipping. */
  net: number;
  paidOrders: number;
  averageOrder: number;
  itemsSold: number;
  /** Placed but not yet paid. */
  awaitingCount: number;
  awaitingValue: number;
  cancelled: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function salesReport(orders: ShopOrder[], range: DateRange): SalesReport {
  const inPeriod = orders.filter((o) => inRange(o.date, range));
  const paid = inPeriod.filter(isPaid);
  const sum = (f: (o: ShopOrder) => number, list = paid) =>
    round2(list.reduce((s, o) => s + f(o), 0));
  const net = sum((o) => o.total);
  const awaiting = inPeriod.filter((o) => o.status === "pending");
  return {
    gross: sum((o) => o.subtotal),
    discounts: sum((o) => o.discount),
    shipping: sum((o) => o.shipping),
    net,
    paidOrders: paid.length,
    averageOrder: paid.length ? round2(net / paid.length) : 0,
    itemsSold: paid.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0),
    awaitingCount: awaiting.length,
    awaitingValue: sum((o) => o.total, awaiting),
    cancelled: inPeriod.filter((o) => o.status === "cancelled").length,
  };
}

export function compareReports(current: SalesReport, previous: SalesReport) {
  return {
    net: pctChange(current.net, previous.net),
    paidOrders: pctChange(current.paidOrders, previous.paidOrders),
    averageOrder: pctChange(current.averageOrder, previous.averageOrder),
    itemsSold: pctChange(current.itemsSold, previous.itemsSold),
    discounts: pctChange(current.discounts, previous.discounts),
  };
}

export interface CategorySales {
  category: ProductCategory;
  revenue: number;
  units: number;
}

/** Item sales (before order-level discounts) per product type, largest first. */
export function salesByCategory(
  orders: ShopOrder[],
  products: ShopProduct[],
  range: DateRange,
): CategorySales[] {
  const rows = new Map<ProductCategory, CategorySales>(
    (["print", "digital", "package"] as ProductCategory[]).map((c) => [
      c,
      { category: c, revenue: 0, units: 0 },
    ]),
  );
  for (const o of orders) {
    if (!isPaid(o) || !inRange(o.date, range)) continue;
    for (const i of o.items) {
      const category = products.find((p) => p.id === i.productId)?.category;
      const row = category && rows.get(category);
      if (!row) continue;
      row.revenue = round2(row.revenue + i.quantity * i.unitPrice);
      row.units += i.quantity;
    }
  }
  return [...rows.values()].sort((a, b) => b.revenue - a.revenue);
}

export interface ProductRow {
  id: string;
  name: string;
  category: ProductCategory | null;
  units: number;
  orders: number;
  revenue: number;
  /** Share of item sales in the range, 0–100. */
  share: number;
  previousRevenue: number;
  change: number | null;
}

export type ProductSortKey = "name" | "units" | "orders" | "revenue" | "change";

/** Every product with sales in either period (plus listed products with none), by revenue. */
export function productReport(
  orders: ShopOrder[],
  products: ShopProduct[],
  current: DateRange,
  previous: DateRange,
): ProductRow[] {
  const tally = (range: DateRange) => {
    const out = new Map<
      string,
      { name: string; units: number; orders: Set<string>; revenue: number }
    >();
    for (const o of orders) {
      if (!isPaid(o) || !inRange(o.date, range)) continue;
      for (const i of o.items) {
        const row = out.get(i.productId) ?? {
          name: i.name,
          units: 0,
          orders: new Set<string>(),
          revenue: 0,
        };
        row.units += i.quantity;
        row.orders.add(o.id);
        row.revenue = round2(row.revenue + i.quantity * i.unitPrice);
        out.set(i.productId, row);
      }
    }
    return out;
  };
  const now = tally(current);
  const before = tally(previous);
  const ids = new Set([
    ...now.keys(),
    ...before.keys(),
    ...products.filter((p) => p.active).map((p) => p.id),
  ]);
  const total = [...now.values()].reduce((s, r) => s + r.revenue, 0);
  return [...ids]
    .map((id) => {
      const product = products.find((p) => p.id === id);
      const n = now.get(id);
      const prev = before.get(id)?.revenue ?? 0;
      const revenue = n?.revenue ?? 0;
      return {
        id,
        name: product?.name ?? n?.name ?? before.get(id)?.name ?? "Removed product",
        category: product?.category ?? null,
        units: n?.units ?? 0,
        orders: n?.orders.size ?? 0,
        revenue,
        share: total ? round2((revenue / total) * 100) : 0,
        previousRevenue: prev,
        change: pctChange(revenue, prev),
      };
    })
    .sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name));
}

export function sortProductRows(
  rows: ProductRow[],
  key: ProductSortKey,
  dir: "asc" | "desc",
): ProductRow[] {
  const sign = dir === "asc" ? 1 : -1;
  const value = (r: ProductRow) => (key === "change" ? (r.change ?? -Infinity) : r[key]);
  return [...rows].sort((a, b) => {
    if (key === "name") return sign * a.name.localeCompare(b.name, undefined, { numeric: true });
    const av = value(a) as number;
    const bv = value(b) as number;
    return sign * (av - bv) || a.name.localeCompare(b.name);
  });
}

export interface CouponRow {
  code: string;
  redemptions: number;
  discount: number;
  /** Net revenue from orders that used the code. */
  revenue: number;
}

/** Paid orders that used a coupon in the range, per code. */
export function couponReport(
  orders: ShopOrder[],
  coupons: Coupon[],
  range: DateRange,
): CouponRow[] {
  const rows = new Map<string, CouponRow>();
  for (const o of orders) {
    if (!o.couponCode || !isPaid(o) || !inRange(o.date, range)) continue;
    const row = rows.get(o.couponCode) ?? {
      code: o.couponCode,
      redemptions: 0,
      discount: 0,
      revenue: 0,
    };
    row.redemptions += 1;
    row.discount = round2(row.discount + o.discount);
    row.revenue = round2(row.revenue + o.total);
    rows.set(o.couponCode, row);
  }
  // Keep codes the studio has even if unused in the range, so the table answers "did it work?".
  for (const c of coupons)
    if (!rows.has(c.code))
      rows.set(c.code, { code: c.code, redemptions: 0, discount: 0, revenue: 0 });
  return [...rows.values()].sort(
    (a, b) => b.redemptions - a.redemptions || a.code.localeCompare(b.code),
  );
}

export function productReportCsv(rows: ProductRow[], range: DateRange): string {
  const cell = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = [
    "Product",
    "Type",
    "Units",
    "Orders",
    "Revenue",
    "Share %",
    "Previous revenue",
    "Change %",
  ];
  const lines = rows.map((r) => [
    r.name,
    r.category ?? "",
    r.units,
    r.orders,
    r.revenue.toFixed(2),
    r.share.toFixed(1),
    r.previousRevenue.toFixed(2),
    r.change === null ? "" : r.change.toFixed(1),
  ]);
  return [
    `# ${range.from} to ${range.to}`,
    header.join(","),
    ...lines.map((l) => l.map(cell).join(",")),
  ].join("\n");
}
