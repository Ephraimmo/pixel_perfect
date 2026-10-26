import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, pageHead } from "@/components/kit";
import { useShop } from "@/lib/shop";
import { money } from "@/lib/demo-data";
import { ORDER_STATUS_LABELS } from "@/lib/shop-data";
import { PAYMENT_PROVIDERS } from "@/lib/shop-payments";

export const Route = createFileRoute("/shop/order/$orderId")({
  head: () => pageHead("Order received", "Your order and how to pay."),
  component: OrderConfirmation,
});

// In production this page needs an unguessable token (or a signed-in client), not just the id.
function OrderConfirmation() {
  const { orderId } = Route.useParams();
  const { state: shop, ready } = useShop();
  const order = shop.orders.find((o) => o.id === orderId);

  if (!order) {
    if (!ready) return <div className="min-h-[50vh]" />;
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <p className="display-title text-2xl">We couldn't find that order</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Check the link in your email, or contact the studio.
        </p>
        <Link
          to="/shop"
          className="mt-5 inline-block text-sm font-medium underline-offset-2 hover:underline"
        >
          Back to the shop
        </Link>
      </div>
    );
  }

  const awaiting = order.status === "pending";
  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(order.number);
      toast.success("Reference copied");
    } catch {
      toast.error("Couldn't copy — note the reference down instead.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
        Order {order.number}
      </p>
      <h1 className="display-title mt-2 text-3xl">
        {awaiting
          ? `Thanks, ${order.customer.split(" ")[0]} — your order is reserved`
          : "Thank you for your order"}
      </h1>

      <div className="mt-5 flex items-start gap-3 rounded-lg border bg-card p-4 shadow-soft">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div className="text-sm">
          <p className="font-medium">Status: {ORDER_STATUS_LABELS[order.status]}</p>
          <p className="mt-0.5 text-muted-foreground">
            {awaiting
              ? `Nothing has been charged. Pay ${money(order.total)} by ${order.paymentMethod === "manual" ? "bank transfer (EFT)" : PAYMENT_PROVIDERS[order.paymentMethod].name} using the details below; the studio starts on your order once the transfer clears.`
              : "Your payment has been confirmed by the studio."}
          </p>
        </div>
      </div>

      {awaiting && order.paymentMethod === "manual" ? (
        <section className="mt-6 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Bank transfer details</h2>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {shop.settings.payments.manualInstructions}
          </pre>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-3 text-sm">
            <p>
              Amount: <span className="font-semibold tabular-nums">{money(order.total)}</span>
            </p>
            <p className="flex items-center gap-1.5">
              Reference: <span className="font-mono font-semibold">{order.number}</span>
              <button
                type="button"
                onClick={() => void copyRef()}
                aria-label="Copy payment reference"
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </p>
          </div>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="text-sm font-semibold">Order summary</h2>
        <ul className="mt-3 divide-y border-y text-sm">
          {order.items.map((i, n) => (
            <li key={n} className="flex justify-between gap-3 py-2.5">
              <span>
                {i.quantity} × {i.name}
                {i.variant ? (
                  <span className="block text-xs text-muted-foreground">{i.variant}</span>
                ) : null}
              </span>
              <span className="tabular-nums">{money(i.quantity * i.unitPrice)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 text-sm">
          <Line label="Subtotal" value={money(order.subtotal)} />
          {order.discount > 0 ? (
            <Line label={`Discount (${order.couponCode})`} value={`−${money(order.discount)}`} />
          ) : null}
          {order.delivery !== "digital" ? (
            <Line
              label={order.delivery === "pickup" ? "Collection" : "Shipping"}
              value={order.shipping ? money(order.shipping) : "Free"}
            />
          ) : null}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Contact
          </h2>
          <p className="mt-1">{order.customer}</p>
          <p className="text-muted-foreground">{order.email}</p>
          {order.phone ? <p className="text-muted-foreground">{order.phone}</p> : null}
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Delivery
          </h2>
          {order.delivery === "ship" && order.shippingAddress ? (
            <address className="mt-1 not-italic text-muted-foreground">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? <>, {order.shippingAddress.line2}</> : null}
              <br />
              {order.shippingAddress.city}
              {order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ""}{" "}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </address>
          ) : order.delivery === "pickup" ? (
            <p className="mt-1 text-muted-foreground">{shop.settings.shipping.pickupNote}</p>
          ) : (
            <p className="mt-1 text-muted-foreground">
              Download link emailed to {order.email} once paid.
            </p>
          )}
        </div>
      </section>

      <Button variant="outline" className="mt-8" asChild>
        <Link to="/shop">Continue shopping</Link>
      </Button>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
