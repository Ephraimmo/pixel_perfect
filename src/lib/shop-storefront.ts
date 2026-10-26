// Client-facing storefront helpers — which products are on sale, browse
// filters, and pricing a product with a chosen size/variant and print options.
// Pure, so the storefront, cart and tests share one pricing rule.

import { DEMO_TODAY } from "./demo-data";
import {
  availability,
  type ProductCategory,
  type ProductVariant,
  type ShopProduct,
} from "./shop-data";

export type ShopSort = "featured" | "price-asc" | "price-desc" | "name";

export const SHOP_SORT_LABELS: Record<ShopSort, string> = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name",
};

export const SHOP_CATEGORY_LABELS: Record<ProductCategory, string> = {
  print: "Prints",
  digital: "Digital",
  package: "Packages",
};

export interface StorefrontSearch {
  category?: ProductCategory;
  sort?: ShopSort;
  q?: string;
}

export function validateStorefrontSearch(raw: Record<string, unknown>): StorefrontSearch {
  const out: StorefrontSearch = {};
  const c = raw["category"];
  if (typeof c === "string" && c in SHOP_CATEGORY_LABELS) out.category = c as ProductCategory;
  const s = raw["sort"];
  if (typeof s === "string" && s in SHOP_SORT_LABELS && s !== "featured") out.sort = s as ShopSort;
  if (typeof raw["q"] === "string" && raw["q"].trim()) out.q = raw["q"];
  return out;
}

/** Listed and still within its sale window (sold-out products stay visible, marked). */
export function isInStorefront(p: ShopProduct, today = DEMO_TODAY): boolean {
  const a = availability(p, today);
  return a === "available" || a === "sold-out";
}

export function canBuy(p: ShopProduct, today = DEMO_TODAY): boolean {
  return availability(p, today) === "available";
}

/** Lowest price among variants still for sale (or the base price). */
export function startingPrice(p: ShopProduct): number {
  const prices = p.variants.filter((v) => v.available).map((v) => v.price);
  return prices.length ? Math.min(...prices) : p.price;
}

export function storefrontProducts(
  products: ShopProduct[],
  { category, sort = "featured", q = "" }: StorefrontSearch,
  today = DEMO_TODAY,
): ShopProduct[] {
  const needle = q.trim().toLowerCase();
  const byName = (a: ShopProduct, b: ShopProduct) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
  const compare: Record<ShopSort, (a: ShopProduct, b: ShopProduct) => number> = {
    featured: (a, b) =>
      Number(b.popular) - Number(a.popular) ||
      Number(canBuy(b, today)) - Number(canBuy(a, today)) ||
      byName(a, b),
    "price-asc": (a, b) => startingPrice(a) - startingPrice(b) || byName(a, b),
    "price-desc": (a, b) => startingPrice(b) - startingPrice(a) || byName(a, b),
    name: byName,
  };
  return products
    .filter((p) => isInStorefront(p, today))
    .filter((p) => !category || p.category === category)
    .filter(
      (p) =>
        !needle ||
        p.name.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle),
    )
    .sort(compare[sort]);
}

// ---------- selection & price ----------

export interface Selection {
  variantId: string | null;
  /** Print option id → chosen choice id. */
  options: Record<string, string>;
}

export function defaultSelection(p: ShopProduct): Selection {
  const variant = p.variants.find((v) => v.available) ?? null;
  const options: Record<string, string> = {};
  for (const o of p.print?.options ?? []) if (o.choices[0]) options[o.id] = o.choices[0].id;
  return { variantId: variant?.id ?? null, options };
}

export function selectedVariant(p: ShopProduct, sel: Selection): ProductVariant | null {
  return p.variants.find((v) => v.id === sel.variantId) ?? null;
}

/** Price of one item with the chosen variant and option add-ons. */
export function unitPrice(p: ShopProduct, sel: Selection): number {
  const base = selectedVariant(p, sel)?.price ?? p.price;
  const addOns = (p.print?.options ?? []).reduce((sum, o) => {
    const choice = o.choices.find((c) => c.id === sel.options[o.id]);
    return sum + (choice?.price ?? 0);
  }, 0);
  return Math.round((base + addOns) * 100) / 100;
}

/** e.g. "16x20 · Oak float frame" — what the client picked, for cart lines. */
export function selectionLabel(p: ShopProduct, sel: Selection): string {
  const parts: string[] = [];
  const v = selectedVariant(p, sel);
  if (v) parts.push(v.name);
  for (const o of p.print?.options ?? []) {
    const choice = o.choices.find((c) => c.id === sel.options[o.id]);
    if (choice) parts.push(choice.label);
  }
  return parts.join(" · ");
}

/** A selection is complete when a for-sale variant (if any) and every option are chosen. */
export function isSelectionValid(p: ShopProduct, sel: Selection): boolean {
  if (p.variants.length) {
    const v = selectedVariant(p, sel);
    if (!v || !v.available) return false;
  }
  return (p.print?.options ?? []).every((o) => o.choices.some((c) => c.id === sel.options[o.id]));
}

/** Plain-language delivery promise shown to clients. */
export function deliveryPromise(p: ShopProduct): string {
  if (p.category === "digital" && p.digital) {
    const when =
      p.digital.delivery === "instant"
        ? "Download link emailed as soon as your payment is confirmed"
        : `Delivered by email within ${p.digital.manualDays} days`;
    const expiry = p.digital.expiryDays ? ` · link valid for ${p.digital.expiryDays} days` : "";
    return `${when}${expiry}`;
  }
  if (p.category === "print" && p.print) {
    const days =
      p.print.fulfillment.productionDays + (p.print.fulfillment.shipTo === "studio" ? 2 : 0);
    return `Printed to order · ships in about ${days} working days`;
  }
  return "Your photographer will be in touch to schedule delivery";
}
