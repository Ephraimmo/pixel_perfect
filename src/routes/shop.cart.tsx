import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button, pageHead } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { QuantityStepper } from "@/components/shop-quantity";
import { useShop } from "@/lib/shop";
import { useCart } from "@/lib/shop-cart-context";
import { money } from "@/lib/demo-data";
import { productImage } from "@/lib/shop-data";
import { normalizeCode } from "@/lib/shop-coupons";
import { priceCart, type CartTotals } from "@/lib/shop-cart";

export const Route = createFileRoute("/shop/cart")({
  head: () => pageHead("Your cart", "Review your prints and downloads before checkout."),
  component: CartPage,
});

function CartPage() {
  const { state: shop, ready: shopReady } = useShop();
  const cart = useCart();
  const totals = priceCart(cart.lines, {
    products: shop.products,
    coupons: shop.coupons,
    settings: shop.settings,
    couponCode: cart.couponCode,
  });

  if (!cart.ready || !shopReady) return <div className="min-h-[50vh]" />;

  const removeLine = (lineId: string, name: string) => {
    const index = cart.lines.findIndex((l) => l.id === lineId);
    const line = cart.lines[index];
    if (!line) return;
    cart.remove(lineId);
    toast(`Removed ${name}`, {
      action: { label: "Undo", onClick: () => cart.restore(line, index) },
    });
  };

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="display-title mt-3 text-2xl">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Prints, albums and downloads you add will show up here.
        </p>
        <Button className="mt-5" asChild>
          <Link to="/shop">Browse the shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="display-title text-3xl">Your cart</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {totals.count} {totals.count === 1 ? "item" : "items"}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <ul className="divide-y border-y">
            {totals.items.map((i) => (
              <li key={i.line.id} className="flex gap-4 py-5">
                <Link
                  to="/shop/$productId"
                  params={{ productId: i.product.id }}
                  className="shrink-0"
                >
                  <img
                    src={productImage(i.product.image, 200, 250)}
                    alt=""
                    className="h-24 w-20 rounded-md object-cover sm:h-28 sm:w-24"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to="/shop/$productId"
                        params={{ productId: i.product.id }}
                        className="text-sm font-medium hover:underline"
                      >
                        {i.product.name}
                      </Link>
                      {i.label ? <p className="text-xs text-muted-foreground">{i.label}</p> : null}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {money(i.unitPrice)} each
                      </p>
                    </div>
                    <p
                      className="text-sm font-medium tabular-nums"
                      aria-label={`Line total for ${i.product.name}`}
                    >
                      {money(i.total)}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    {i.maxQuantity > 1 ? (
                      <QuantityStepper
                        size="sm"
                        label={`Quantity of ${i.product.name}`}
                        value={i.line.quantity}
                        max={i.maxQuantity}
                        onChange={(n) => cart.setQuantity(i.line.id, Math.min(n, i.maxQuantity))}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">Qty 1 · one per order</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeLine(i.line.id, i.product.name)}
                      className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label={`Remove ${i.product.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                  {i.line.quantity < cart.lines.find((l) => l.id === i.line.id)!.quantity ? (
                    <p className="mt-2 text-[11px] text-warning">
                      Only {i.maxQuantity} available — quantity reduced.
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
            {totals.unavailable.map((u) => (
              <li key={u.line.id} className="flex items-center gap-4 py-5 opacity-80">
                <div className="grid h-24 w-20 shrink-0 place-items-center rounded-md bg-muted sm:h-28 sm:w-24">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{u.product?.name ?? "Removed product"}</p>
                  <p className="text-xs text-destructive">
                    {u.reason} — not included in your total.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(u.line.id, u.product?.name ?? "item")}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label={`Remove ${u.product?.name ?? "unavailable item"}`}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </li>
            ))}
          </ul>
          <Link
            to="/shop"
            className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            ← Continue shopping
          </Link>
        </div>

        <OrderSummary totals={totals} />
      </div>
    </div>
  );
}

function OrderSummary({ totals }: { totals: CartTotals }) {
  const { state: shop } = useShop();
  const cart = useCart();
  const [code, setCode] = useState("");
  const coupon = totals.coupon;

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    cart.setCouponCode(normalizeCode(code));
    setCode("");
  };

  return (
    <aside
      className="h-fit rounded-lg border bg-card p-5 shadow-soft lg:sticky lg:top-20"
      aria-label="Order summary"
    >
      <h2 className="text-sm font-semibold">Order summary</h2>
      <dl className="mt-4 space-y-2.5 text-sm">
        <Row label="Subtotal" value={money(totals.subtotal)} />
        {coupon?.ok && totals.discount > 0 ? (
          <Row
            label={`Discount (${coupon.coupon.code})`}
            value={`−${money(totals.discount)}`}
            accent
          />
        ) : null}
        {totals.needsShipping ? (
          <Row
            label="Shipping"
            value={totals.shipping === 0 ? "Free" : money(totals.shipping)}
            hint={
              coupon?.ok && coupon.freeShipping
                ? `${coupon.coupon.code} applied`
                : "Estimate · pickup available at checkout"
            }
          />
        ) : (
          <Row label="Delivery" value="Free" hint="Digital — delivered by email" />
        )}
        <div className="border-t pt-3">
          <Row label="Total" value={money(totals.total)} strong />
        </div>
      </dl>

      {totals.freeShippingGap !== null && totals.freeShippingGap > 0 ? (
        <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs">
          Add {money(totals.freeShippingGap)} more in prints or albums for free shipping.
        </p>
      ) : null}

      <div className="mt-5 border-t pt-4">
        {cart.couponCode ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold">
                <Tag className="h-3.5 w-3.5" /> {cart.couponCode}
              </span>
              <button
                type="button"
                onClick={() => cart.setCouponCode(null)}
                aria-label={`Remove code ${cart.couponCode}`}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p
              role="status"
              className={coupon?.ok ? "text-xs text-success" : "text-xs text-destructive"}
            >
              {coupon?.ok
                ? (coupon.note ??
                  (coupon.freeShipping
                    ? "Free shipping applied."
                    : `You save ${money(coupon.discount)}.`))
                : coupon?.reason}
            </p>
          </div>
        ) : (
          <form onSubmit={apply} className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Discount code"
              aria-label="Discount code"
              className="h-9 font-mono uppercase placeholder:font-sans placeholder:normal-case"
              autoComplete="off"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-9"
              disabled={!code.trim()}
            >
              Apply
            </Button>
          </form>
        )}
      </div>

      {totals.items.length ? (
        <Button className="mt-5 h-11 w-full" asChild>
          <Link to="/shop/checkout">Checkout</Link>
        </Button>
      ) : null}

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Prices in USD.{" "}
        {shop.settings.shipping.localPickup ? "Free pickup from the studio is available. " : ""}
        You'll enter your details and choose a payment method at checkout.
      </p>
    </aside>
  );
}

function Row({
  label,
  value,
  hint,
  strong,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className={strong ? "font-semibold" : "text-muted-foreground"}>
        {label}
        {hint ? (
          <span className="block text-[11px] font-normal text-muted-foreground">{hint}</span>
        ) : null}
      </dt>
      <dd
        className={
          strong
            ? "text-base font-semibold tabular-nums"
            : accent
              ? "tabular-nums text-success"
              : "tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}
