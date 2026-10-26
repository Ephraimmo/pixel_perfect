import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Download } from "lucide-react";
import { toast } from "sonner";
import { Button, PageHeader, Panel, pageHead } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StoreTabs } from "@/components/store-tabs";
import { RevenueChart, StatTile } from "@/components/store-charts";
import { useShop } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { formatDate, money, moneyShort } from "@/lib/demo-data";
import { revenueSeries } from "@/lib/shop-data";
import { SHOP_CATEGORY_LABELS } from "@/lib/shop-storefront";
import { CATEGORY_LABELS } from "@/lib/shop-catalog";
import {
  RANGE_PRESETS,
  compareReports,
  couponReport,
  productReport,
  productReportCsv,
  resolveRange,
  salesByCategory,
  salesReport,
  sortProductRows,
  validateReportSearch,
  type ProductSortKey,
} from "@/lib/shop-reports";

export const Route = createFileRoute("/_app/store/reports")({
  head: () => pageHead("Store reports", "Sales, revenue and product performance for your store."),
  validateSearch: validateReportSearch,
  component: Reports,
});

function Reports() {
  const { state: shop } = useShop();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { current, previous, days, custom } = resolveRange(search);
  const [from, setFrom] = useState(current.from);
  const [to, setTo] = useState(current.to);
  // Keep the date fields on the active range when a preset or the URL changes it.
  useEffect(() => {
    setFrom(current.from);
    setTo(current.to);
  }, [current.from, current.to]);
  const [sort, setSort] = useState<{ key: ProductSortKey; dir: "asc" | "desc" }>({
    key: "revenue",
    dir: "desc",
  });

  const now = salesReport(shop.orders, current);
  const before = salesReport(shop.orders, previous);
  const change = compareReports(now, before);
  const series = revenueSeries(shop.orders, current);
  const categories = salesByCategory(shop.orders, shop.products, current);
  const products = sortProductRows(
    productReport(shop.orders, shop.products, current, previous),
    sort.key,
    sort.dir,
  );
  const coupons = couponReport(shop.orders, shop.coupons, current);
  const vs = `vs previous ${days} days`;
  const maxCategory = Math.max(...categories.map((c) => c.revenue), 0);

  const applyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || from > to) {
      toast.error("Pick a start date on or before the end date.");
      return;
    }
    void navigate({ search: { from, to }, replace: true });
  };

  const sortBy = (key: ProductSortKey) =>
    // Names start A–Z; numbers start highest first. A second click flips the direction.
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "desc" ? "asc" : "desc" }
        : { key, dir: key === "name" ? "asc" : "desc" },
    );

  const exportCsv = () => {
    const blob = new Blob([productReportCsv(products, current)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product-performance-${current.from}-to-${current.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <StoreTabs />
      <PageHeader
        title="Reports"
        description={`${formatDate(current.from)} – ${formatDate(current.to)} · compared with the ${days} days before`}
      />

      {/* One filter row scopes every figure below. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div
          role="group"
          aria-label="Reporting period"
          className="inline-flex w-fit gap-1 rounded-lg border bg-card p-1"
        >
          {RANGE_PRESETS.map((d) => {
            const active = !custom && days === d;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  void navigate({ search: d === 30 ? {} : { days: d }, replace: true })
                }
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs transition-colors",
                  active
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Last {d} days
              </button>
            );
          })}
        </div>
        <form onSubmit={applyCustom} className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="r-from" className="text-xs">
              From
            </Label>
            <Input
              id="r-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 w-40 bg-card"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="r-to" className="text-xs">
              To
            </Label>
            <Input
              id="r-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 w-40 bg-card"
            />
          </div>
          <Button type="submit" size="sm" variant={custom ? "default" : "outline"} className="h-9">
            {custom ? "Custom range" : "Apply range"}
          </Button>
        </form>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Net revenue"
          value={moneyShort(now.net)}
          change={change.net}
          caption={vs}
        />
        <StatTile
          label="Paid orders"
          value={String(now.paidOrders)}
          change={change.paidOrders}
          caption={vs}
        />
        <StatTile
          label="Average order"
          value={money(now.averageOrder)}
          change={change.averageOrder}
          caption={vs}
        />
        <StatTile
          label="Items sold"
          value={String(now.itemsSold)}
          change={change.itemsSold}
          caption={vs}
        />
        <StatTile
          label="Discounts given"
          value={money(now.discounts)}
          change={change.discounts}
          caption={vs}
          noComparison="No discounts in the previous period"
        />
        <div className="rounded-lg border bg-card p-4 shadow-soft">
          <p className="text-xs text-muted-foreground">Awaiting payment</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">{money(now.awaitingValue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {now.awaitingCount} {now.awaitingCount === 1 ? "order" : "orders"} · not counted as
            revenue
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_20rem]">
        <RevenueChart series={series} weekly={days > 31} />

        <div className="space-y-5">
          <Panel className="p-4">
            <h2 className="text-sm font-semibold">Revenue summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <SummaryRow label="Item sales" value={money(now.gross)} />
              <SummaryRow label="Discounts" value={`−${money(now.discounts)}`} />
              <SummaryRow label="Shipping collected" value={money(now.shipping)} />
              <div className="flex justify-between border-t pt-2 font-semibold">
                <dt>Net revenue</dt>
                <dd className="tabular-nums">{money(now.net)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Paid orders only.{" "}
              {now.cancelled
                ? `${now.cancelled} cancelled ${now.cancelled === 1 ? "order is" : "orders are"} excluded. `
                : ""}
              No payment-provider fees are deducted — none is connected.
            </p>
          </Panel>

          <Panel className="p-4">
            <h2 className="text-sm font-semibold">Item sales by type</h2>
            <ul className="mt-3 space-y-3" aria-label="Item sales by product type">
              {categories.map((c) => (
                <li key={c.category}>
                  <div className="flex justify-between text-xs">
                    <span>{SHOP_CATEGORY_LABELS[c.category]}</span>
                    <span className="tabular-nums text-muted-foreground">{c.units} sold</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-r bg-muted/60">
                      <div
                        className="h-full rounded-r bg-[var(--chart-1)]"
                        style={{ width: `${maxCategory ? (c.revenue / maxCategory) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-20 text-right text-xs font-medium tabular-nums">
                      {money(c.revenue)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
          <div>
            <h2 className="text-sm font-semibold">Product performance</h2>
            <p className="text-[11px] text-muted-foreground">
              Paid item sales, before order discounts
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download /> Export CSV
          </Button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="border-b text-muted-foreground">
              <tr>
                <SortHeader label="Product" k="name" sort={sort} onSort={sortBy} />
                <th className="px-4 py-2.5 font-medium">Type</th>
                <SortHeader label="Units" k="units" sort={sort} onSort={sortBy} right />
                <SortHeader label="Orders" k="orders" sort={sort} onSort={sortBy} right />
                <SortHeader label="Revenue" k="revenue" sort={sort} onSort={sortBy} right />
                <th className="px-4 py-2.5 font-medium">Share</th>
                <SortHeader label="Change" k="change" sort={sort} onSort={sortBy} right />
              </tr>
            </thead>
            <tbody className="divide-y tabular-nums">
              {products.map((r) => (
                <tr key={r.id} className={r.revenue === 0 ? "text-muted-foreground" : ""}>
                  <td className="px-4 py-2.5 font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {r.category ? CATEGORY_LABELS[r.category] : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">{r.units}</td>
                  <td className="px-4 py-2.5 text-right">{r.orders}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{money(r.revenue)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-[var(--chart-1)]"
                          style={{ width: `${r.share}%` }}
                        />
                      </div>
                      <span className="w-10 text-muted-foreground">{r.share.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Change value={r.change} revenue={r.revenue} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="mt-5">
        <h2 className="px-4 pt-4 text-sm font-semibold">Coupon performance</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Code</th>
                <th className="px-4 py-2.5 text-right font-medium">Paid orders</th>
                <th className="px-4 py-2.5 text-right font-medium">Discount given</th>
                <th className="px-4 py-2.5 text-right font-medium">Order revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y tabular-nums">
              {coupons.map((c) => (
                <tr key={c.code} className={c.redemptions ? "" : "text-muted-foreground"}>
                  <td className="px-4 py-2.5 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-2.5 text-right">{c.redemptions}</td>
                  <td className="px-4 py-2.5 text-right">{money(c.discount)}</td>
                  <td className="px-4 py-2.5 text-right">{money(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function SortHeader({
  label,
  k,
  sort,
  onSort,
  right,
}: {
  label: string;
  k: ProductSortKey;
  sort: { key: ProductSortKey; dir: "asc" | "desc" };
  onSort: (k: ProductSortKey) => void;
  right?: boolean;
}) {
  const active = sort.key === k;
  return (
    <th
      className={cn("px-4 py-2.5 font-medium", right && "text-right")}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          active && "text-foreground",
        )}
      >
        {label}
        {active ? (
          sort.dir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : null}
      </button>
    </th>
  );
}

/** Change vs the previous period; "New" when it only sold in this one. */
function Change({ value, revenue }: { value: number | null; revenue: number }) {
  if (value === null)
    return <span className="text-muted-foreground">{revenue > 0 ? "New" : "—"}</span>;
  const up = value >= 0;
  return (
    <span className={up ? "text-success" : "text-rose"}>
      {up ? "+" : "−"}
      {Math.abs(value).toFixed(0)}%
    </span>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
