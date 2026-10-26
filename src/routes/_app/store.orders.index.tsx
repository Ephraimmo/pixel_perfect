import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Download, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, PageHeader, Panel, TabBar, pageHead } from "@/components/kit";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StoreTabs } from "@/components/store-tabs";
import { OrderStatusBadge } from "@/components/store-orders";
import { useShop } from "@/lib/shop";
import { formatDate, money } from "@/lib/demo-data";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  itemCount,
  type ShopOrderStatus,
} from "@/lib/shop-data";
import {
  ORDER_SORT_LABELS,
  countOrdersByStatus,
  filterOrders,
  ordersToCsv,
  paginate,
  validateOrderSearch,
  type OrderListSearch,
  type OrderSort,
} from "@/lib/shop-orders";

export const Route = createFileRoute("/_app/store/orders/")({
  head: () => pageHead("Orders", "Store orders from your clients."),
  // ?status= lets the store overview link straight to e.g. orders awaiting payment.
  validateSearch: validateOrderSearch,
  component: Orders,
});

const DELIVERY_LABELS = { ship: "Ship", pickup: "Pickup", digital: "Download" } as const;

function Orders() {
  const { state: shop } = useShop();
  const { status, q = "", sort = "newest", page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();
  const update = (patch: Omit<OrderListSearch, "status"> & { status?: ShopOrderStatus | "all" }) =>
    void navigate({
      search: (prev) => {
        const next: Record<string, unknown> = { ...prev, page: 1, ...patch };
        if (next["status"] === "all") delete next["status"];
        return validateOrderSearch(next);
      },
      replace: true,
    });

  const counts = countOrdersByStatus(shop.orders);
  const filtered = filterOrders(shop.orders, { ...(status ? { status } : {}), q, sort });
  const view = paginate(filtered, page);
  const value = filtered.reduce((s, o) => s + o.total, 0);

  const exportCsv = () => {
    const blob = new Blob([ordersToCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders${status ? `-${status}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} orders`);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <StoreTabs />
      <PageHeader
        title="Orders"
        description={`${filtered.length} ${filtered.length === 1 ? "order" : "orders"} · ${money(value)}`}
        actions={
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download /> Export CSV
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Search by order #, name or email"
            aria-label="Search orders"
            className="h-9 w-full rounded-md border bg-card pl-8 pr-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
          />
          {q ? (
            <button
              type="button"
              onClick={() => update({ q: "" })}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <Select value={sort} onValueChange={(v) => update({ sort: v as OrderSort })}>
          <SelectTrigger className="h-9 bg-card text-xs sm:w-44" aria-label="Sort orders">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ORDER_SORT_LABELS) as OrderSort[]).map((s) => (
              <SelectItem key={s} value={s}>
                {ORDER_SORT_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TabBar
        className="mt-4"
        value={status ?? "all"}
        onChange={(v) => update({ status: v })}
        tabs={[
          { value: "all" as const, label: `All (${counts.all})` },
          ...ORDER_STATUSES.map((s) => ({
            value: s,
            label: `${ORDER_STATUS_LABELS[s]} (${counts[s]})`,
          })),
        ]}
      />

      <Panel className="mt-3">
        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title={shop.orders.length === 0 ? "No orders yet" : "No orders match"}
              description={
                shop.orders.length === 0
                  ? "Orders placed in your storefront will show up here."
                  : q
                    ? `Nothing matches "${q}".`
                    : `No ${status ? ORDER_STATUS_LABELS[status].toLowerCase() : ""} orders.`
              }
            />
          </div>
        ) : (
          <>
            {/* Table on wider screens, stacked rows on phones. */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-xs">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Order</th>
                    <th className="px-4 py-2.5 font-medium">Customer</th>
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">Items</th>
                    <th className="px-4 py-2.5 font-medium">Delivery</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {view.rows.map((o) => (
                    <tr key={o.id} className="relative hover:bg-accent/40">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          to="/store/orders/$id"
                          params={{ id: o.id }}
                          className="after:absolute after:inset-0 hover:underline"
                        >
                          {o.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-medium">{o.customer}</span>
                        <span className="text-muted-foreground">{o.email}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(o.date)}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {itemCount(o)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {DELIVERY_LABELS[o.delivery]}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {money(o.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y md:hidden">
              {view.rows.map((o) => (
                <li key={o.id}>
                  <Link
                    to="/store/orders/$id"
                    params={{ id: o.id }}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {o.customer}{" "}
                        <span className="font-normal text-muted-foreground">{o.number}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(o.date)} · {itemCount(o)}{" "}
                        {itemCount(o) === 1 ? "item" : "items"} · {DELIVERY_LABELS[o.delivery]}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-medium tabular-nums">{money(o.total)}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
              <span>
                {view.from}–{view.to} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  disabled={view.page <= 1}
                  onClick={() =>
                    void navigate({ search: (p) => ({ ...p, page: view.page - 1 }), replace: true })
                  }
                  aria-label="Previous page"
                >
                  <ChevronLeft />
                </Button>
                <span className="tabular-nums">
                  Page {view.page} of {view.pages}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  disabled={view.page >= view.pages}
                  onClick={() =>
                    void navigate({ search: (p) => ({ ...p, page: view.page + 1 }), replace: true })
                  }
                  aria-label="Next page"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
