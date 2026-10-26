import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Download, FileText, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button, pageHead } from "@/components/kit";
import { QuantityStepper } from "@/components/shop-quantity";
import { useCart } from "@/lib/shop-cart-context";
import { lineKey, maxQuantity } from "@/lib/shop-cart";
import { useShop } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { money } from "@/lib/demo-data";
import { productImage, type ShopProduct } from "@/lib/shop-data";
import {
  SHOP_CATEGORY_LABELS,
  canBuy,
  defaultSelection,
  deliveryPromise,
  isInStorefront,
  isSelectionValid,
  selectionLabel,
  startingPrice,
  storefrontProducts,
  unitPrice,
  type Selection,
} from "@/lib/shop-storefront";

export const Route = createFileRoute("/shop/$productId")({
  head: () => pageHead("Shop", "Prints, albums and digital downloads from your session."),
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  const { state: shop, ready } = useShop();
  const product = shop.products.find((p) => p.id === productId);

  if (!product || !isInStorefront(product)) {
    if (!ready) return null;
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <p className="display-title text-2xl">This product isn't available</p>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have sold out for the season or been removed.
        </p>
        <Link
          to="/shop"
          className="mt-5 inline-block text-sm font-medium underline-offset-2 hover:underline"
        >
          Browse the shop
        </Link>
      </div>
    );
  }
  // Keyed so the selection resets when moving between products.
  return <ProductView key={product.id} product={product} all={shop.products} />;
}

function ProductView({ product: p, all }: { product: ShopProduct; all: ShopProduct[] }) {
  const [sel, setSel] = useState<Selection>(() => defaultSelection(p));
  const [qty, setQty] = useState(1);
  const cart = useCart();
  const navigate = Route.useNavigate();
  const buyable = canBuy(p);
  const max = maxQuantity(p);
  const inCart = cart.lines.find((l) => l.id === lineKey(p.id, sel))?.quantity ?? 0;
  const room = Math.max(0, max - inCart);
  const canAdd = buyable && isSelectionValid(p, sel) && room > 0;

  const addToCart = () => {
    const quantity = Math.min(qty, room);
    cart.add(p.id, sel, quantity, max);
    const label = selectionLabel(p, sel);
    toast.success(`Added ${quantity} × ${p.name}${label ? ` (${label})` : ""}`, {
      action: { label: "View cart", onClick: () => void navigate({ to: "/shop/cart" }) },
    });
    setQty(1);
  };
  const price = unitPrice(p, sel);
  const related = storefrontProducts(all, { category: p.category })
    .filter((x) => x.id !== p.id)
    .slice(0, 3);
  const variantLabel = p.category === "print" ? "Size" : p.optionName || "Option";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Link to="/shop" className="hover:text-foreground">
          Shop
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/shop" search={{ category: p.category }} className="hover:text-foreground">
          {SHOP_CATEGORY_LABELS[p.category]}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-foreground">{p.name}</span>
      </nav>

      <div className="mt-5 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <div className="md:sticky md:top-20 md:self-start">
          <img
            src={productImage(p.image, 1000, 1250)}
            alt={p.name}
            className={cn("aspect-[4/5] w-full rounded-lg object-cover", !buyable && "opacity-70")}
          />
        </div>

        <div className="min-w-0">
          <h1 className="display-title text-3xl">{p.name}</h1>
          <p className="mt-2 text-xl font-semibold tracking-tight" aria-live="polite">
            {money(price)}
          </p>
          {!buyable ? (
            <p className="mt-2 inline-block rounded bg-muted px-2 py-1 text-xs font-medium">
              Sold out — check back soon
            </p>
          ) : null}
          {p.description ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
          ) : null}

          {p.variants.length ? (
            <ChoiceGroup
              label={variantLabel}
              options={p.variants.map((v) => ({
                id: v.id,
                label: v.name,
                hint: money(v.price),
                disabled: !v.available,
              }))}
              value={sel.variantId}
              onChange={(variantId) => setSel((s) => ({ ...s, variantId }))}
            />
          ) : null}

          {(p.print?.options ?? []).map((o) => (
            <ChoiceGroup
              key={o.id}
              label={o.name}
              options={o.choices.map((c) => ({
                id: c.id,
                label: c.label,
                hint: c.price ? `+${money(c.price)}` : "",
                disabled: false,
              }))}
              value={sel.options[o.id] ?? null}
              onChange={(choice) =>
                setSel((s) => ({ ...s, options: { ...s.options, [o.id]: choice } }))
              }
            />
          ))}

          {buyable ? (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {max > 1 ? (
                <QuantityStepper
                  label="Quantity"
                  value={Math.min(qty, Math.max(1, room))}
                  max={Math.max(1, room)}
                  onChange={setQty}
                />
              ) : null}
              <Button
                size="lg"
                className="h-10 flex-1 sm:flex-none"
                onClick={addToCart}
                disabled={!canAdd}
              >
                <ShoppingBag /> Add to cart · {money(price * Math.min(qty, Math.max(1, room)))}
              </Button>
              {room === 0 && inCart > 0 ? (
                <p className="w-full text-xs text-muted-foreground">
                  You have the most you can order ({max}) in your cart.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 space-y-2.5 border-t pt-5 text-sm">
            <p className="flex items-start gap-2.5">
              {p.category === "digital" ? (
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span>{deliveryPromise(p)}</span>
            </p>
            {p.digital?.printRelease ? (
              <p className="flex items-start gap-2.5">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Includes a print release for personal use</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {related.length ? (
        <section className="mt-14 border-t pt-8">
          <h2 className="display-title text-xl">
            More {SHOP_CATEGORY_LABELS[p.category].toLowerCase()}
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <li key={r.id}>
                <Link to="/shop/$productId" params={{ productId: r.id }} className="group block">
                  <img
                    src={productImage(r.image, 480, 600)}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/5] w-full rounded-lg object-cover"
                  />
                  <p className="mt-2 text-sm font-medium group-hover:underline">{r.name}</p>
                  <p className="text-sm text-muted-foreground">{money(startingPrice(r))}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string; hint: string; disabled: boolean }[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset className="mt-5">
      <legend className="text-xs font-medium">
        {label}
        {value ? (
          <span className="font-normal text-muted-foreground">
            : {options.find((o) => o.id === value)?.label}
          </span>
        ) : null}
      </legend>
      <div role="radiogroup" aria-label={label} className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            disabled={o.disabled}
            onClick={() => onChange(o.id)}
            className={cn(
              "rounded-md border px-3 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-45",
              value === o.id
                ? "border-foreground bg-foreground text-background"
                : "bg-card hover:bg-accent",
            )}
          >
            <span className="block font-medium">{o.label}</span>
            {o.hint || o.disabled ? (
              <span
                className={cn(
                  "block text-[11px]",
                  value === o.id ? "text-background/75" : "text-muted-foreground",
                )}
              >
                {o.disabled ? "Sold out" : o.hint}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
