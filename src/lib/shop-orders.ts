// Order management helpers — the status lifecycle and which actions a studio
// can take, list filters, CSV export and per-customer history. Pure.
//
// Payment status is never set by hand for card/PayPal orders: in production a
// provider webhook marks those paid. Only bank-transfer orders can be marked
// paid, by the studio, once the money has arrived.

import { money } from "./demo-data";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  isPaid,
  type ShopOrder,
  type ShopOrderStatus,
} from "./shop-data";

export interface OrderAction {
  to: ShopOrderStatus;
  label: string;
  /** Shown in a confirmation dialog before applying. */
  confirm?: string;
  tone?: "primary" | "danger";
}

/** The next steps available for an order, most likely first. */
export function orderActions(o: ShopOrder): OrderAction[] {
  switch (o.status) {
    case "pending":
      return [
        ...(o.paymentMethod === "manual"
          ? [
              {
                to: "paid" as const,
                label: "Record payment received",
                confirm: `Only do this once ${money(o.total)} from ${o.customer} (reference ${o.number}) is in your bank account.`,
                tone: "primary" as const,
              },
            ]
          : []),
        {
          to: "cancelled",
          label: "Cancel order",
          confirm:
            "The client will need to place a new order. Nothing has been paid, so there's nothing to refund.",
          tone: "danger",
        },
      ];
    case "paid":
      return o.delivery === "digital"
        ? [{ to: "delivered", label: "Mark downloads delivered", tone: "primary" }]
        : [{ to: "processing", label: "Start processing", tone: "primary" }];
    case "processing":
      return o.delivery === "pickup"
        ? [{ to: "delivered", label: "Mark collected", tone: "primary" }]
        : [{ to: "shipped", label: "Mark shipped", tone: "primary" }];
    case "shipped":
      return [{ to: "delivered", label: "Mark delivered", tone: "primary" }];
    default:
      return [];
  }
}

/** Steps shown in the progress tracker for this kind of order. */
export function orderSteps(o: Pick<ShopOrder, "delivery">): ShopOrderStatus[] {
  if (o.delivery === "digital") return ["pending", "paid", "delivered"];
  if (o.delivery === "pickup") return ["pending", "paid", "processing", "delivered"];
  return ["pending", "paid", "processing", "shipped", "delivered"];
}

export const STEP_LABELS: Record<ShopOrderStatus, string> = {
  ...ORDER_STATUS_LABELS,
  pending: "Placed",
};

export type PaymentState = "awaiting" | "paid" | "void";

export function paymentState(o: Pick<ShopOrder, "status">): PaymentState {
  if (o.status === "cancelled") return "void";
  return isPaid(o) ? "paid" : "awaiting";
}

// ---------- list ----------

export type OrderSort = "newest" | "oldest" | "total-desc";

export const ORDER_SORT_LABELS: Record<OrderSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "total-desc": "Highest total",
};

export interface OrderListSearch {
  status?: ShopOrderStatus;
  q?: string;
  sort?: OrderSort;
  page?: number;
}

export function validateOrderSearch(raw: Record<string, unknown>): OrderListSearch {
  const out: OrderListSearch = {};
  const status = raw["status"];
  if (typeof status === "string" && ORDER_STATUSES.includes(status as ShopOrderStatus))
    out.status = status as ShopOrderStatus;
  if (typeof raw["q"] === "string" && raw["q"].trim()) out.q = raw["q"];
  const sort = raw["sort"];
  if (typeof sort === "string" && sort in ORDER_SORT_LABELS && sort !== "newest")
    out.sort = sort as OrderSort;
  const page = Number(raw["page"]);
  if (Number.isInteger(page) && page > 1) out.page = page;
  return out;
}

export function countOrdersByStatus(orders: ShopOrder[]): Record<"all" | ShopOrderStatus, number> {
  const counts = Object.fromEntries([
    ["all", orders.length],
    ...ORDER_STATUSES.map((s) => [s, 0]),
  ]) as Record<"all" | ShopOrderStatus, number>;
  for (const o of orders) counts[o.status] += 1;
  return counts;
}

export function filterOrders(
  orders: ShopOrder[],
  { status, q = "", sort = "newest" }: OrderListSearch,
): ShopOrder[] {
  const needle = q.trim().toLowerCase().replace(/^#/, "");
  const newest = (a: ShopOrder, b: ShopOrder) =>
    b.date.localeCompare(a.date) || b.number.localeCompare(a.number, undefined, { numeric: true });
  const compare: Record<OrderSort, (a: ShopOrder, b: ShopOrder) => number> = {
    newest,
    oldest: (a, b) => -newest(a, b),
    "total-desc": (a, b) => b.total - a.total || newest(a, b),
  };
  return orders
    .filter((o) => !status || o.status === status)
    .filter(
      (o) =>
        !needle ||
        o.number.replace("#", "").includes(needle) ||
        o.customer.toLowerCase().includes(needle) ||
        o.email.toLowerCase().includes(needle),
    )
    .sort(compare[sort]);
}

export const PAGE_SIZE = 20;

export function paginate<T>(rows: T[], page: number) {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  return {
    rows: rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    page: current,
    pages,
    from: rows.length ? (current - 1) * PAGE_SIZE + 1 : 0,
    to: Math.min(current * PAGE_SIZE, rows.length),
  };
}

// ---------- customers & export ----------

export function customerHistory(orders: ShopOrder[], email: string) {
  const mine = orders.filter((o) => o.email.toLowerCase() === email.toLowerCase());
  const paid = mine.filter(isPaid);
  return {
    orders: mine.length,
    spent: paid.reduce((s, o) => s + o.total, 0),
    firstOrder: mine.reduce<string | null>((d, o) => (!d || o.date < d ? o.date : d), null),
  };
}

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function ordersToCsv(orders: ShopOrder[]): string {
  const header = [
    "Order",
    "Date",
    "Customer",
    "Email",
    "Phone",
    "Status",
    "Delivery",
    "Items",
    "Subtotal",
    "Discount",
    "Coupon",
    "Shipping",
    "Total",
  ];
  const rows = orders.map((o) => [
    o.number,
    o.date,
    o.customer,
    o.email,
    o.phone,
    ORDER_STATUS_LABELS[o.status],
    o.delivery,
    o.items.map((i) => `${i.quantity} x ${i.name}${i.variant ? ` (${i.variant})` : ""}`).join("; "),
    o.subtotal.toFixed(2),
    o.discount.toFixed(2),
    o.couponCode ?? "",
    o.shipping.toFixed(2),
    o.total.toFixed(2),
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}
