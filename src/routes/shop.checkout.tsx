import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { AlertCircle, CreditCard, Landmark, Lock, Store, Truck } from "lucide-react";
import { Button, pageHead } from "@/components/kit";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useShop } from "@/lib/shop";
import { useCart } from "@/lib/shop-cart-context";
import { cn } from "@/lib/utils";
import { money } from "@/lib/demo-data";
import { productImage, type PaymentMethodId } from "@/lib/shop-data";
import { priceCart, type CartTotals } from "@/lib/shop-cart";
import {
  COUNTRIES,
  buildPendingOrder,
  customerCouponUses,
  emptyCheckoutForm,
  nextOrderNumber,
  validateCheckout,
  type CheckoutForm,
} from "@/lib/shop-checkout";
import {
  PAYMENT_PROVIDERS,
  availableMethods,
  isProviderConnected,
  startPayment,
} from "@/lib/shop-payments";

export const Route = createFileRoute("/shop/checkout")({
  head: () => pageHead("Checkout", "Your details, delivery and payment."),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { state: shop, ready } = useShop();
  const cart = useCart();
  if (!ready || !cart.ready) return <div className="min-h-[50vh]" />;
  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h1 className="display-title text-2xl">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add something to your cart before checking out.
        </p>
        <Button className="mt-5" asChild>
          <Link to="/shop">Browse the shop</Link>
        </Button>
      </div>
    );
  }
  const methods = availableMethods(shop.settings.payments);
  return (
    <Checkout
      key="checkout"
      defaultMethod={methods.find(isProviderConnected) ?? methods[0] ?? "stripe"}
    />
  );
}

function Checkout({ defaultMethod }: { defaultMethod: PaymentMethodId }) {
  const { state: shop, placeOrder } = useShop();
  const cart = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<CheckoutForm>(() => emptyCheckoutForm(defaultMethod));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const methods = availableMethods(shop.settings.payments);
  const totals = priceCart(cart.lines, {
    products: shop.products,
    coupons: shop.coupons,
    settings: shop.settings,
    couponCode: cart.couponCode,
    delivery: form.delivery,
    customerUses: customerCouponUses(shop.orders, form.email, cart.couponCode),
  });
  const provider = PAYMENT_PROVIDERS[form.paymentMethod];
  const pickup = shop.settings.shipping.localPickup;

  const set = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors(({ [key]: _, ...rest }) => rest);
    setPaymentError(null);
  };
  const setAddress = (key: keyof CheckoutForm["address"], value: string) => {
    setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));
    setErrors(({ [`address.${key}`]: _, ...rest }) => rest);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    const found = validateCheckout(form, totals.needsShipping);
    if (totals.items.length === 0) found["cart"] = "Nothing in your cart can be bought right now.";
    if (Object.keys(found).length) {
      setErrors(found);
      const first = Object.keys(found)[0];
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus(),
      );
      return;
    }
    setSubmitting(true);
    const number = nextOrderNumber(shop.orders);
    const result = await startPayment(
      {
        provider: form.paymentMethod,
        orderNumber: number,
        amount: totals.total,
        customerEmail: form.email.trim(),
        returnUrl: `${window.location.origin}/shop/order/`,
        cancelUrl: `${window.location.origin}/shop/checkout`,
      },
      shop.settings.payments,
    );
    setSubmitting(false);

    if (result.status === "unavailable") {
      setPaymentError(result.reason);
      return;
    }
    if (result.status === "redirect") {
      // Real providers: the order is confirmed by webhook after the hosted payment page.
      window.location.assign(result.url);
      return;
    }
    const order = buildPendingOrder(form, totals, {
      id: `o-${Date.now().toString(36)}`,
      number,
    });
    placeOrder(order);
    cart.clear();
    void navigate({ to: "/shop/order/$orderId", params: { orderId: order.id } });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/shop/cart" className="text-xs text-muted-foreground hover:text-foreground">
        ← Back to cart
      </Link>
      <h1 className="display-title mt-2 text-3xl">Checkout</h1>

      <form
        onSubmit={(e) => void submit(e)}
        noValidate
        className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem]"
      >
        <div className="min-w-0 space-y-8">
          <Section title="Contact">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="name" label="Full name" error={errors["name"]} className="sm:col-span-2">
                <Input
                  id="name"
                  data-field="name"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  aria-invalid={!!errors["name"]}
                />
              </Field>
              <Field id="email" label="Email" error={errors["email"]}>
                <Input
                  id="email"
                  data-field="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  aria-invalid={!!errors["email"]}
                />
              </Field>
              <Field id="phone" label="Phone (optional)" error={errors["phone"]}>
                <Input
                  id="phone"
                  data-field="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  aria-invalid={!!errors["phone"]}
                />
              </Field>
            </div>
          </Section>

          {totals.needsShipping ? (
            <Section title="Delivery">
              {pickup ? (
                <div
                  role="radiogroup"
                  aria-label="Delivery method"
                  className="grid gap-2 sm:grid-cols-2"
                >
                  <Choice
                    checked={form.delivery === "ship"}
                    onSelect={() => set("delivery", "ship")}
                    icon={<Truck className="h-4 w-4" />}
                    title="Ship to me"
                    detail={
                      totals.shippingBeforeDiscount === 0 && form.delivery === "ship"
                        ? "Free shipping"
                        : `${money(shop.settings.shipping.flatRate)} flat rate`
                    }
                  />
                  <Choice
                    checked={form.delivery === "pickup"}
                    onSelect={() => set("delivery", "pickup")}
                    icon={<Store className="h-4 w-4" />}
                    title="Collect from the studio"
                    detail="Free"
                  />
                </div>
              ) : null}
              {form.delivery === "pickup" ? (
                <p className="rounded-md bg-muted px-3 py-2.5 text-xs">
                  {shop.settings.shipping.pickupNote}
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    id="line1"
                    label="Street address"
                    error={errors["address.line1"]}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="line1"
                      data-field="address.line1"
                      autoComplete="address-line1"
                      value={form.address.line1}
                      onChange={(e) => setAddress("line1", e.target.value)}
                      aria-invalid={!!errors["address.line1"]}
                    />
                  </Field>
                  <Field
                    id="line2"
                    label="Apartment, suite, etc. (optional)"
                    className="sm:col-span-2"
                  >
                    <Input
                      id="line2"
                      autoComplete="address-line2"
                      value={form.address.line2}
                      onChange={(e) => setAddress("line2", e.target.value)}
                    />
                  </Field>
                  <Field id="city" label="City" error={errors["address.city"]}>
                    <Input
                      id="city"
                      data-field="address.city"
                      autoComplete="address-level2"
                      value={form.address.city}
                      onChange={(e) => setAddress("city", e.target.value)}
                      aria-invalid={!!errors["address.city"]}
                    />
                  </Field>
                  <Field id="region" label="Province / state (optional)">
                    <Input
                      id="region"
                      autoComplete="address-level1"
                      value={form.address.region}
                      onChange={(e) => setAddress("region", e.target.value)}
                    />
                  </Field>
                  <Field id="postalCode" label="Postal code" error={errors["address.postalCode"]}>
                    <Input
                      id="postalCode"
                      data-field="address.postalCode"
                      autoComplete="postal-code"
                      value={form.address.postalCode}
                      onChange={(e) => setAddress("postalCode", e.target.value)}
                      aria-invalid={!!errors["address.postalCode"]}
                    />
                  </Field>
                  <Field id="country" label="Country" error={errors["address.country"]}>
                    <Select
                      value={form.address.country}
                      onValueChange={(v) => setAddress("country", v)}
                    >
                      <SelectTrigger id="country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
            </Section>
          ) : (
            <Section title="Delivery">
              <p className="text-sm text-muted-foreground">
                Your downloads will be emailed to {form.email.trim() || "you"} once payment is
                confirmed.
              </p>
            </Section>
          )}

          <Section title="Note for the studio (optional)">
            <Textarea
              id="note"
              data-field="note"
              aria-label="Note for the studio"
              rows={2}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="e.g. which photo you'd like printed, or a gift message"
              aria-invalid={!!errors["note"]}
            />
            <Err message={errors["note"]} />
          </Section>

          <Section title="Payment">
            <div role="radiogroup" aria-label="Payment method" className="grid gap-2">
              {methods.map((id) => {
                const p = PAYMENT_PROVIDERS[id];
                const connected = isProviderConnected(id);
                return (
                  <Choice
                    key={id}
                    checked={form.paymentMethod === id}
                    onSelect={() => set("paymentMethod", id)}
                    icon={
                      id === "manual" ? (
                        <Landmark className="h-4 w-4" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )
                    }
                    title={p.name}
                    detail={p.description}
                    badge={connected ? undefined : "Not available yet"}
                  />
                );
              })}
            </div>
            {provider.kind === "manual" ? (
              <p className="text-xs text-muted-foreground">
                You'll get bank details on the next page. Your order is held and processed once the
                studio confirms your transfer — nothing is charged now.
              </p>
            ) : (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                You'd be taken to {provider.id === "stripe" ? "Stripe's" : "PayPal's"} secure page
                to pay. Card details are never entered on this site.
              </p>
            )}
            {paymentError ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <p className="font-medium">Payment couldn't start</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{paymentError}</p>
                  {methods.includes("manual") && form.paymentMethod !== "manual" ? (
                    <button
                      type="button"
                      onClick={() => set("paymentMethod", "manual")}
                      className="mt-2 text-xs font-medium underline-offset-2 hover:underline"
                    >
                      Pay by bank transfer instead
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Section>

          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                data-field="acceptTerms"
                checked={form.acceptTerms}
                onCheckedChange={(v) => set("acceptTerms", v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="font-normal leading-snug">
                I agree to the studio's terms of sale. Prints are made to order and can't be
                returned unless damaged.
              </Label>
            </div>
            <Err message={errors["acceptTerms"]} />
          </div>
        </div>

        <Summary
          totals={totals}
          couponCode={cart.couponCode}
          submitting={submitting}
          cartError={errors["cart"]}
          submitLabel={
            provider.kind === "manual"
              ? `Place order · ${money(totals.total)}`
              : `Pay ${money(totals.total)} with ${provider.name}`
          }
        />
      </form>
    </div>
  );
}

function Summary({
  totals,
  couponCode,
  submitting,
  submitLabel,
  cartError,
}: {
  totals: CartTotals;
  couponCode: string | null;
  submitting: boolean;
  submitLabel: string;
  cartError?: string | undefined;
}) {
  return (
    <aside
      className="h-fit rounded-lg border bg-card p-5 shadow-soft lg:sticky lg:top-20"
      aria-label="Order summary"
    >
      <h2 className="text-sm font-semibold">Order summary</h2>
      <ul className="mt-4 space-y-3">
        {totals.items.map((i) => (
          <li key={i.line.id} className="flex gap-3">
            <div className="relative shrink-0">
              <img
                src={productImage(i.product.image, 120, 150)}
                alt=""
                className="h-14 w-11 rounded object-cover"
              />
              <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                {i.line.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1 text-xs">
              <p className="font-medium">{i.product.name}</p>
              {i.label ? <p className="text-muted-foreground">{i.label}</p> : null}
            </div>
            <p className="text-xs tabular-nums">{money(i.total)}</p>
          </li>
        ))}
      </ul>
      {totals.unavailable.length ? (
        <p className="mt-3 text-[11px] text-warning">
          {totals.unavailable.length} unavailable{" "}
          {totals.unavailable.length === 1 ? "item is" : "items are"} not included.
        </p>
      ) : null}
      <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
        <Line label="Subtotal" value={money(totals.subtotal)} />
        {totals.discount > 0 ? (
          <Line label={`Discount (${couponCode})`} value={`−${money(totals.discount)}`} />
        ) : null}
        {totals.needsShipping ? (
          <Line
            label="Shipping"
            value={
              totals.shipping === 0
                ? totals.shippingBeforeDiscount > 0
                  ? `Free (${couponCode})`
                  : "Free"
                : money(totals.shipping)
            }
          />
        ) : null}
        <div className="flex items-baseline justify-between border-t pt-3">
          <dt className="font-semibold">Total</dt>
          <dd className="text-lg font-semibold tabular-nums">{money(totals.total)}</dd>
        </div>
      </dl>
      {couponCode && totals.coupon && !totals.coupon.ok ? (
        <p className="mt-2 text-xs text-destructive">{totals.coupon.reason}</p>
      ) : null}
      <Err message={cartError} />
      <Button
        type="submit"
        className="mt-5 h-11 w-full"
        disabled={submitting || totals.items.length === 0}
      >
        {submitting ? "Starting payment…" : submitLabel}
      </Button>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">Prices in USD</p>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      <Err message={error} />
    </div>
  );
}

function Err({ message }: { message?: string | undefined }) {
  return message ? (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}

function Choice({
  checked,
  onSelect,
  icon,
  title,
  detail,
  badge,
}: {
  checked: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  detail: string;
  badge?: string | undefined;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-md border bg-card px-3.5 py-3 text-left transition-colors hover:bg-accent/40",
        checked && "border-foreground ring-1 ring-foreground",
      )}
    >
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {title}
          {badge ? (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {badge}
            </span>
          ) : null}
        </span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </span>
    </button>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
