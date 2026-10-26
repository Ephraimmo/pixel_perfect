import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ArrowLeft, Check, Landmark, Mail, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Panel, pageHead } from "@/components/kit";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StoreTabs } from "@/components/store-tabs";
import { OrderStatusBadge } from "@/components/store-orders";
import { useShop } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { formatDate, money } from "@/lib/demo-data";
import { ORDER_STATUS_LABELS, itemCount, productImage, type ShopOrder } from "@/lib/shop-data";
import {
  STEP_LABELS,
  customerHistory,
  orderActions,
  orderSteps,
  paymentState,
  type OrderAction,
} from "@/lib/shop-orders";
import { PAYMENT_PROVIDERS } from "@/lib/shop-payments";

export const Route = createFileRoute("/_app/store/orders/$id")({
  head: () => pageHead("Order", "Order details, customer and status."),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const { state: shop, ready, updateOrderStatus } = useShop();
  const order = shop.orders.find((o) => o.id === id);
  const [pending, setPending] = useState<OrderAction | null>(null);

  if (!order) {
    return (
      <div className="mx-auto max-w-5xl">
        <StoreTabs />
        <BackLink />
        {ready ? (
          <EmptyState
            title="Order not found"
            description="It may have been removed, or the link is out of date."
          />
        ) : null}
      </div>
    );
  }

  const apply = (a: OrderAction) => {
    updateOrderStatus(order.id, a.to);
    toast.success(
      `${order.number} ${a.to === "paid" ? "marked paid" : `marked ${ORDER_STATUS_LABELS[a.to].toLowerCase()}`}`,
    );
  };
  const actions = orderActions(order);
  const history = customerHistory(shop.orders, order.email);
  const pay = paymentState(order);
  const provider = PAYMENT_PROVIDERS[order.paymentMethod];

  return (
    <div className="mx-auto max-w-5xl">
      <StoreTabs />
      <BackLink />

      <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="display-title text-2xl">Order {order.number}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {formatDate(order.date)} · {itemCount(order)}{" "}
            {itemCount(order) === 1 ? "item" : "items"} · {money(order.total)}
          </p>
        </div>
        {actions.length ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <Button
                key={a.to}
                size="sm"
                variant={a.tone === "danger" ? "outline" : "default"}
                className={
                  a.tone === "danger" ? "text-destructive hover:text-destructive" : undefined
                }
                onClick={() => (a.confirm ? setPending(a) : apply(a))}
              >
                {a.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <Steps order={order} />

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-5">
          <Panel>
            <h2 className="px-4 pt-4 text-sm font-semibold">Items</h2>
            <ul className="mt-2 divide-y">
              {order.items.map((i, n) => {
                const product = shop.products.find((p) => p.id === i.productId);
                return (
                  <li key={n} className="flex items-center gap-3 px-4 py-3">
                    {product ? (
                      <img
                        src={productImage(product.image, 96, 96)}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-11 w-11 shrink-0 rounded bg-muted" />
                    )}
                    <div className="min-w-0 flex-1 text-xs">
                      {product ? (
                        <Link
                          to="/store/products/$id"
                          params={{ id: product.id }}
                          className="text-sm font-medium hover:underline"
                        >
                          {i.name}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium">{i.name}</p>
                      )}
                      {i.variant ? <p className="text-muted-foreground">{i.variant}</p> : null}
                    </div>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {i.quantity} × {money(i.unitPrice)}
                    </p>
                    <p className="w-20 text-right text-sm font-medium tabular-nums">
                      {money(i.quantity * i.unitPrice)}
                    </p>
                  </li>
                );
              })}
            </ul>
            <dl className="space-y-1.5 border-t px-4 py-3 text-sm">
              <Row label="Subtotal" value={money(order.subtotal)} />
              {order.discount > 0 ? (
                <Row
                  label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
                  value={`−${money(order.discount)}`}
                />
              ) : null}
              {order.delivery !== "digital" ? (
                <Row
                  label={order.delivery === "pickup" ? "Collection" : "Shipping"}
                  value={order.shipping ? money(order.shipping) : "Free"}
                />
              ) : null}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(order.total)}</dd>
              </div>
            </dl>
          </Panel>

          {order.note ? (
            <Panel className="p-4">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <MessageSquare className="h-3.5 w-3.5" /> Note from {order.customer.split(" ")[0]}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{order.note}</p>
            </Panel>
          ) : null}
        </div>

        <div className="min-w-0 space-y-5">
          <Card title="Customer">
            <p className="text-sm font-medium">{order.customer}</p>
            <a
              href={`mailto:${order.email}`}
              className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" /> {order.email}
            </a>
            {order.phone ? (
              <a
                href={`tel:${order.phone.replace(/\s/g, "")}`}
                className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Phone className="h-3.5 w-3.5" /> {order.phone}
              </a>
            ) : null}
            <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
              {history.orders} {history.orders === 1 ? "order" : "orders"} · {money(history.spent)}{" "}
              paid
              {history.firstOrder ? ` · customer since ${formatDate(history.firstOrder)}` : ""}
            </p>
            {history.orders > 1 ? (
              <Link
                to="/store/orders"
                search={{ q: order.email }}
                className="mt-1 inline-block text-xs font-medium underline-offset-2 hover:underline"
              >
                View their orders
              </Link>
            ) : null}
          </Card>

          <Card title="Delivery">
            {order.delivery === "ship" ? (
              order.shippingAddress ? (
                <address className="text-xs not-italic leading-relaxed text-muted-foreground">
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 ? <>, {order.shippingAddress.line2}</> : null}
                  <br />
                  {order.shippingAddress.city}
                  {order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ""}{" "}
                  {order.shippingAddress.postalCode}
                  <br />
                  {order.shippingAddress.country}
                </address>
              ) : (
                <p className="text-xs text-muted-foreground">Ship to client · no address on file</p>
              )
            ) : order.delivery === "pickup" ? (
              <p className="text-xs text-muted-foreground">Collecting from the studio</p>
            ) : (
              <p className="text-xs text-muted-foreground">Digital download to {order.email}</p>
            )}
          </Card>

          <Card title="Payment">
            <p className="flex items-center gap-1.5 text-xs">
              <Landmark className="h-3.5 w-3.5 text-muted-foreground" /> {provider.name}
            </p>
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                pay === "paid"
                  ? "text-success"
                  : pay === "awaiting"
                    ? "text-warning"
                    : "text-muted-foreground",
              )}
            >
              {pay === "paid"
                ? "Paid"
                : pay === "awaiting"
                  ? `Awaiting ${money(order.total)}`
                  : "Cancelled — not paid"}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {provider.kind === "manual"
                ? `Reference ${order.number}. Record the payment once the transfer shows in your bank account.`
                : "Card and PayPal payments update automatically from the provider; they can't be marked paid by hand."}
            </p>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.label}?</AlertDialogTitle>
            <AlertDialogDescription>{pending?.confirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction
              className={
                pending?.tone === "danger"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
              onClick={() => {
                if (pending) apply(pending);
                setPending(null);
              }}
            >
              {pending?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Steps({ order }: { order: ShopOrder }) {
  if (order.status === "cancelled") {
    return (
      <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        This order was cancelled before payment.
      </p>
    );
  }
  const steps = orderSteps(order);
  const at = steps.indexOf(order.status);
  return (
    <ol
      className="flex overflow-x-auto rounded-lg border bg-card p-3 shadow-soft"
      aria-label="Order progress"
    >
      {steps.map((s, i) => {
        const done = i <= at;
        return (
          <li
            key={s}
            className="flex min-w-24 flex-1 items-center gap-2"
            aria-current={i === at ? "step" : undefined}
          >
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold",
                done ? "border-foreground bg-foreground text-background" : "text-muted-foreground",
              )}
            >
              {i < at || (i === at && s === "delivered") ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                i + 1
              )}
            </span>
            <span className={cn("text-xs", done ? "font-medium" : "text-muted-foreground")}>
              {STEP_LABELS[s]}
            </span>
            {i < steps.length - 1 ? (
              <span className={cn("mx-2 h-px flex-1", i < at ? "bg-foreground" : "bg-border")} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel className="p-4">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {children}
    </Panel>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function BackLink() {
  return (
    <div className="mb-4">
      <Link
        to="/store/orders"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Orders
      </Link>
    </div>
  );
}
