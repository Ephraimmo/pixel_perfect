import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Panel, StatusBadge, pageHead } from "@/components/kit";
import { Switch } from "@/components/ui/switch";
import { StoreTabs } from "@/components/store-tabs";
import { AvailabilityBadge } from "@/components/store-products";
import { DigitalSummary } from "@/components/store-digital";
import { PrintSummary } from "@/components/store-print";
import { useShop } from "@/lib/shop";
import { formatDate, money } from "@/lib/demo-data";
import { fromPrice, productImage } from "@/lib/shop-data";
import { OrderStatusBadge } from "@/components/store-orders";
import { CATEGORY_LABELS, productPerformance } from "@/lib/shop-catalog";

export const Route = createFileRoute("/_app/store/products/$id/")({
  head: () => pageHead("Product", "Product details, visibility and sales."),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { state: shop, ready, toggleProduct } = useShop();
  const product = shop.products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="mx-auto max-w-5xl">
        <StoreTabs />
        <BackLink />
        {ready ? (
          <EmptyState
            title="Product not found"
            description="It may have been removed, or the link is out of date."
            action={
              <Link
                to="/store/products"
                className="text-sm font-medium underline-offset-2 hover:underline"
              >
                Back to products
              </Link>
            }
          />
        ) : null}
      </div>
    );
  }

  const perf = productPerformance(product.id, shop.orders);
  const stats = [
    { label: "Units sold", value: String(perf.units) },
    { label: "Revenue", value: money(perf.revenue) },
    { label: "Paid orders", value: String(perf.orders) },
    { label: "Customers", value: String(perf.customers) },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <StoreTabs />
      <BackLink />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="self-start overflow-hidden rounded-lg border bg-card shadow-soft">
          <img
            src={productImage(product.image, 800, 600)}
            alt={product.name}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow">{CATEGORY_LABELS[product.category]}</p>
              <h1 className="display-title mt-1 text-2xl text-foreground">{product.name}</h1>
            </div>
            <div className="flex shrink-0 gap-2">
              {product.active ? (
                <Button size="sm" variant="ghost" asChild>
                  <a href={`/shop/${product.id}`} target="_blank" rel="noreferrer">
                    <ExternalLink /> View in store
                  </a>
                </Button>
              ) : null}
              <Button size="sm" variant="outline" asChild>
                <Link to="/store/products/$id/edit" params={{ id: product.id }}>
                  <Pencil /> Edit
                </Link>
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight">
            {product.variants.length ? `From ${money(fromPrice(product))}` : money(product.price)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AvailabilityBadge product={product} />
            {product.popular ? <StatusBadge status="popular" label="Popular" /> : null}
            {product.inventory !== null ? (
              <span className="text-[11px] text-muted-foreground">
                {product.inventory} in stock
              </span>
            ) : null}
            {product.availableUntil ? (
              <span className="text-[11px] text-muted-foreground">
                Available until {formatDate(product.availableUntil)}
              </span>
            ) : null}
          </div>
          {product.description ? (
            <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          ) : null}

          {product.category === "digital" && product.digital ? (
            <div className="mt-5">
              <DigitalSummary digital={product.digital} />
            </div>
          ) : null}

          {product.category === "print" && product.print ? (
            <div className="mt-5">
              <PrintSummary print={product.print} sizes={product.variants} />
            </div>
          ) : product.variants.length ? (
            <div className="mt-5 overflow-hidden rounded-lg border">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">{product.optionName || "Variant"}</th>
                    <th className="px-3 py-2 font-medium">SKU</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y tabular-nums">
                  {product.variants.map((v) => (
                    <tr key={v.id} className={v.available ? "" : "text-muted-foreground"}>
                      <td className="px-3 py-2">
                        {v.name}
                        {v.available ? null : (
                          <span className="ml-1.5 text-[11px]">· out of stock</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{v.sku || "—"}</td>
                      <td className="px-3 py-2 text-right">{money(v.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <Panel className="mt-5 flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium">Listed in store</p>
              <p className="text-xs text-muted-foreground">
                {product.active
                  ? "Clients can find and buy this product."
                  : "Hidden — clients can't see or buy this product."}
              </p>
            </div>
            <Switch
              checked={product.active}
              aria-label={product.active ? `Hide ${product.name}` : `List ${product.name}`}
              onCheckedChange={() => {
                toggleProduct(product.id);
                toast.success(
                  `${product.name} ${product.active ? "hidden from" : "listed in"} your store`,
                );
              }}
            />
          </Panel>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg border bg-card p-3 shadow-soft">
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">{s.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            All-time paid sales
            {perf.lastSold ? ` · last sold ${formatDate(perf.lastSold)}` : " · not sold yet"}
          </p>
        </div>
      </div>

      <Panel className="mt-6 overflow-x-auto">
        <div className="px-4 pt-4">
          <h2 className="text-sm font-semibold">Orders with this product</h2>
        </div>
        {perf.orderList.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-muted-foreground">
            No orders include this product yet.
          </p>
        ) : (
          <table className="mt-2 w-full min-w-[520px] text-left text-xs">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Order #</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                <th className="px-4 py-2.5 text-right font-medium">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y tabular-nums">
              {perf.orderList.slice(0, 10).map((o) => {
                const lines = o.items.filter((i) => i.productId === product.id);
                const qty = lines.reduce((n, i) => n + i.quantity, 0);
                const variants = lines.flatMap((i) => (i.variant ? [i.variant] : []));
                return (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-medium">
                      <Link
                        to="/store/orders/$id"
                        params={{ id: o.id }}
                        className="hover:underline"
                      >
                        {o.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{o.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(o.date)}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {qty}
                      {variants.length ? (
                        <span className="block text-[11px] text-muted-foreground">
                          {variants.join(", ")}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {money(lines.reduce((n, i) => n + i.quantity * i.unitPrice, 0))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {perf.orderList.length > 10 ? (
          <p className="border-t px-4 py-2.5 text-[11px] text-muted-foreground">
            Showing the 10 most recent of {perf.orderList.length} orders.
          </p>
        ) : null}
      </Panel>
    </div>
  );
}

function BackLink() {
  return (
    <div className="mb-4">
      <Link
        to="/store/products"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Products
      </Link>
    </div>
  );
}
