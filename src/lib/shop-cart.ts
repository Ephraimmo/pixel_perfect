// Cart pricing — turns the client's cart lines into priced items and totals
// using live catalog prices, coupon rules and the store's shipping settings.
// Pure, so the cart page, checkout and tests agree on every number.

import { DEMO_TODAY } from "./demo-data";
import type { Coupon, ShopProduct, StoreSettings } from "./shop-data";
import { evaluateCoupon, type CouponResult } from "./shop-coupons";
import { shippingCost } from "./shop-print";
import {
  canBuy,
  isSelectionValid,
  selectionLabel,
  unitPrice,
  type Selection,
} from "./shop-storefront";

export const MAX_QUANTITY = 20;

export interface CartLine {
  /** Stable key for product + selection, so adding the same thing again merges. */
  id: string;
  productId: string;
  selection: Selection;
  quantity: number;
}

export function lineKey(productId: string, sel: Selection): string {
  const opts = Object.keys(sel.options)
    .sort()
    .map((k) => `${k}=${sel.options[k]}`)
    .join("&");
  return `${productId}|${sel.variantId ?? ""}|${opts}`;
}

/** Most a client can buy in one order: stock, and one of a whole-gallery download or package. */
export function maxQuantity(p: ShopProduct): number {
  let max = MAX_QUANTITY;
  if (p.inventory !== null) max = Math.min(max, p.inventory);
  if (p.category === "package") max = Math.min(max, 1);
  if (p.category === "digital" && p.digital && p.digital.scope !== "single") max = Math.min(max, 1);
  return Math.max(0, max);
}

export const clampQuantity = (q: number, p: ShopProduct) =>
  Math.max(1, Math.min(Math.floor(q) || 1, maxQuantity(p) || 1));

export interface PricedLine {
  line: CartLine;
  product: ShopProduct;
  label: string;
  unitPrice: number;
  total: number;
  maxQuantity: number;
}

export interface UnavailableLine {
  line: CartLine;
  product: ShopProduct | null;
  reason: string;
}

export interface CartTotals {
  items: PricedLine[];
  unavailable: UnavailableLine[];
  count: number;
  subtotal: number;
  /** Subtotal of items that ship (prints & packages). */
  physicalSubtotal: number;
  coupon: CouponResult | null;
  discount: number;
  shipping: number;
  /** Shipping before any free-shipping coupon. */
  shippingBeforeDiscount: number;
  /** How much more to spend for free shipping, or null when not applicable. */
  freeShippingGap: number | null;
  total: number;
  needsShipping: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function priceCart(
  lines: CartLine[],
  ctx: {
    products: ShopProduct[];
    coupons: Coupon[];
    settings: StoreSettings;
    couponCode?: string | null;
    delivery?: "ship" | "pickup";
    customerUses?: number;
    today?: string;
  },
): CartTotals {
  const today = ctx.today ?? DEMO_TODAY;
  const items: PricedLine[] = [];
  const unavailable: UnavailableLine[] = [];
  for (const line of lines) {
    const product = ctx.products.find((p) => p.id === line.productId) ?? null;
    if (!product || !product.active) {
      unavailable.push({ line, product, reason: "No longer available" });
      continue;
    }
    if (!canBuy(product, today)) {
      unavailable.push({ line, product, reason: "Sold out" });
      continue;
    }
    if (!isSelectionValid(product, line.selection)) {
      unavailable.push({ line, product, reason: "This option is no longer available" });
      continue;
    }
    const max = maxQuantity(product);
    const quantity = Math.min(line.quantity, max);
    const price = unitPrice(product, line.selection);
    items.push({
      line: quantity === line.quantity ? line : { ...line, quantity },
      product,
      label: selectionLabel(product, line.selection),
      unitPrice: price,
      total: round2(price * quantity),
      maxQuantity: max,
    });
  }

  const subtotal = round2(items.reduce((s, i) => s + i.total, 0));
  const physicalSubtotal = round2(
    items.filter((i) => i.product.category !== "digital").reduce((s, i) => s + i.total, 0),
  );
  const needsShipping = physicalSubtotal > 0;
  const delivery = ctx.delivery ?? "ship";
  const shippingBeforeDiscount = shippingCost(physicalSubtotal, ctx.settings.shipping, delivery);

  const coupon =
    ctx.couponCode && items.length
      ? evaluateCoupon(ctx.couponCode, ctx.coupons, {
          lines: items.map((i) => ({ category: i.product.category, amount: i.total })),
          shipping: shippingBeforeDiscount,
          ...(ctx.customerUses !== undefined ? { customerUses: ctx.customerUses } : {}),
          today,
        })
      : null;
  const freeShipping = coupon?.ok === true && coupon.freeShipping;
  const discount = coupon?.ok && !coupon.freeShipping ? coupon.discount : 0;
  const shipping = freeShipping ? 0 : shippingBeforeDiscount;
  const { freeOver } = ctx.settings.shipping;
  const freeShippingGap =
    needsShipping && delivery === "ship" && freeOver !== null && shipping > 0
      ? round2(freeOver - physicalSubtotal)
      : null;

  return {
    items,
    unavailable,
    count: items.reduce((s, i) => s + i.line.quantity, 0),
    subtotal,
    physicalSubtotal,
    coupon,
    discount,
    shipping,
    shippingBeforeDiscount,
    freeShippingGap,
    total: round2(Math.max(0, subtotal - discount) + shipping),
    needsShipping,
  };
}
