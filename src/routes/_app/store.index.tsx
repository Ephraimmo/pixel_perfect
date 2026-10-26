import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CircleCheck,
  Clock,
  EyeOff,
  Package,
  ShoppingBag,
  Store,
} from "lucide-react";
import { EmptyState, PageHeader, Panel, pageHead } from "@/components/kit";
import { OrderStatusBadge } from "@/components/store-orders";
import { RevenueChart, StatTile } from "@/components/store-charts";
import { StoreTabs } from "@/components/store-tabs";
import { AddProductButton } from "@/components/store-products";
import { useShop } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { formatDate, money, moneyShort } from "@/lib/demo-data";
import {
  itemCount,
  pctChange,
  productImage,
  periodRanges,
  recentOrders,
  revenueSeries,
  summarize,
  topProducts,
  type RevenuePoint,
} from "@/lib/shop-data";

const RANGES = [7, 30, 90] as const;
type RangeDays = (typeof RANGES)[number];

export const Route = createFileRoute("/_app/store/")({
  head: () =>
    pageHead("Store", "Sales, recent orders and shortcuts for your print and download shop."),
  validateSearch: (raw: Record<string, unknown>): { days?: RangeDays } => {
    const days = Number(raw["days"]);
    return RANGES.includes(days as RangeDays) && days !== 30 ? { days: days as RangeDays } : {};
  },
  component: StoreOverview,
});

function StoreOverview() {
  const { state: shop } = useShop();
  const { days = 30 } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { current, previous } = periodRanges(days);
  const now = summarize(shop.orders, current);
  const before = summarize(shop.orders, previous);
  const series = revenueSeries(shop.orders, current);
  const best = topProducts(shop.orders, shop.products, current, 4);
  const recent = recentOrders(shop.orders, 6);
  const awaiting = shop.orders.filter((o) => o.status === "pending");
  const toStart = shop.orders.filter((o) => o.status === "paid");
  const toFulfil = shop.orders.filter((o) => o.status === "processing");
  const hidden = shop.products.filter((p) => !p.active).length;
  const vs = `vs previous ${days} days`;

  return (
    <div className="mx-auto max-w-6xl">
      <StoreTabs />
      <PageHeader
        title="Store"
        description="Sales from your print and download shop."
        actions={<AddProductButton />}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Reporting period"
          className="inline-flex gap-1 rounded-lg border bg-card p-1"
        >
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={days === d}
              onClick={() => void navigate({ search: d === 30 ? {} : { days: d }, replace: true })}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs transition-colors",
                days === d
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Last {d} days
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDate(current.from)} – {formatDate(current.to)}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Revenue"
          value={moneyShort(now.revenue)}
          change={pctChange(now.revenue, before.revenue)}
          caption={vs}
        />
        <StatTile
          label="Orders"
          value={String(now.orders)}
          change={pctChange(now.orders, before.orders)}
          caption={vs}
        />
        <StatTile
          label="Average order"
          value={money(now.averageOrder)}
          change={pctChange(now.averageOrder, before.averageOrder)}
          caption={vs}
        />
        <StatTile
          label="Items sold"
          value={String(now.itemsSold)}
          change={pctChange(now.itemsSold, before.itemsSold)}
          caption={vs}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_18rem]">
        <RevenueChart series={series} weekly={days > 31} />

        <Panel className="h-fit p-4">
          <h2 className="text-sm font-semibold">Needs attention</h2>
          <ul className="mt-3 space-y-2">
            <AttentionRow
              icon={<Clock className="h-4 w-4" />}
              title={`${awaiting.length} awaiting payment`}
              detail={`${money(awaiting.reduce((s, o) => s + o.total, 0))} not yet collected`}
              status="pending"
            />
            <AttentionRow
              icon={<CircleCheck className="h-4 w-4" />}
              title={`${toStart.length} paid, not started`}
              detail="Start production or deliver downloads"
              status="paid"
            />
            <AttentionRow
              icon={<Package className="h-4 w-4" />}
              title={`${toFulfil.length} in production`}
              detail="Waiting to ship or be collected"
              status="processing"
            />
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Revenue counts paid orders only. No payment provider is connected in this demo, so
            nothing here was charged to a real card.
          </p>
        </Panel>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_18rem]">
        <Panel>
          <div className="flex items-center justify-between px-4 pt-4">
            <h2 className="text-sm font-semibold">Recent orders</h2>
            <Link
              to="/store/orders"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No orders yet"
                description="Orders from your storefront will show up here."
              />
            </div>
          ) : (
            <ul className="mt-2 divide-y">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link
                    to="/store/orders/$id"
                    params={{ id: o.id }}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {o.customer} <span className="text-muted-foreground">· {o.number}</span>
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {formatDate(o.date)} · {itemCount(o)}{" "}
                        {itemCount(o) === 1 ? "item" : "items"} ·{" "}
                        {o.items.map((i) => i.name).join(", ")}
                      </p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                    <span className="w-20 shrink-0 text-right text-xs font-medium tabular-nums">
                      {money(o.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="h-fit p-4">
          <h2 className="text-sm font-semibold">Shortcuts</h2>
          <div className="mt-3 grid gap-2">
            <a href="/shop" target="_blank" rel="noreferrer" className={shortcutClass}>
              <ShortcutBody icon={<Store className="h-4 w-4" />}>
                View storefront
                <span className="block text-[11px] font-normal text-muted-foreground">
                  What clients see · opens in a new tab
                </span>
              </ShortcutBody>
            </a>
            <Link to="/store/products" className={shortcutClass}>
              <ShortcutBody icon={<ShoppingBag className="h-4 w-4" />}>
                Manage products
                <span className="block text-[11px] font-normal text-muted-foreground">
                  {shop.products.length} products
                </span>
              </ShortcutBody>
            </Link>
            {hidden > 0 ? (
              <Link
                to="/store/products"
                search={{ visibility: "hidden" }}
                className={shortcutClass}
              >
                <ShortcutBody icon={<EyeOff className="h-4 w-4" />}>
                  {hidden} hidden {hidden === 1 ? "product" : "products"}
                  <span className="block text-[11px] font-normal text-muted-foreground">
                    Not visible to clients
                  </span>
                </ShortcutBody>
              </Link>
            ) : null}
          </div>
          <div className="mt-3">
            <AddProductButton variant="outline" />
          </div>
        </Panel>
      </div>

      <Panel className="mt-5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Top products</h2>
          <span className="text-[11px] text-muted-foreground">
            By paid revenue, last {days} days
          </span>
        </div>
        {best.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No paid sales in this period.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {best.map(({ product, units, revenue }) => (
              <Link
                key={product.id}
                to="/store/products/$id"
                params={{ id: product.id }}
                className="group flex items-center gap-3 rounded-md border p-2 transition-colors hover:bg-accent/40"
              >
                <img
                  src={productImage(product.image, 120, 120)}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{product.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {units} sold · {moneyShort(revenue)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function AttentionRow({
  icon,
  title,
  detail,
  status,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  status: "pending" | "paid" | "processing";
}) {
  return (
    <li>
      <Link
        to="/store/orders"
        search={{ status }}
        className="flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-accent/40"
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium">{title}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{detail}</span>
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
      </Link>
    </li>
  );
}

const shortcutClass =
  "flex items-center gap-3 rounded-md border px-3 py-2.5 text-xs font-medium transition-colors hover:bg-accent/40";

function ShortcutBody({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <>
      <span className="text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
    </>
  );
}
