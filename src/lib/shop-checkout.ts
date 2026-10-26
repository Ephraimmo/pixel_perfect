// Checkout form — customer details and delivery validation, and turning a
// priced cart into an order awaiting payment. Pure; payment itself goes
// through shop-payments.

import { DEMO_TODAY } from "./demo-data";
import {
  isPaid,
  type Address,
  type DeliveryMethod,
  type OrderItem,
  type PaymentMethodId,
  type ShopOrder,
} from "./shop-data";
import type { CartTotals } from "./shop-cart";

export interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  delivery: Exclude<DeliveryMethod, "digital">;
  address: Address;
  note: string;
  paymentMethod: PaymentMethodId;
  acceptTerms: boolean;
}

export const COUNTRIES = ["South Africa", "Botswana", "Namibia", "United Kingdom", "United States"];

export function emptyCheckoutForm(paymentMethod: PaymentMethodId): CheckoutForm {
  return {
    name: "",
    email: "",
    phone: "",
    delivery: "ship",
    address: {
      line1: "",
      line2: "",
      city: "",
      region: "",
      postalCode: "",
      country: "South Africa",
    },
    note: "",
    paymentMethod,
    acceptTerms: false,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Errors keyed by field (`address.city` for address fields). */
export function validateCheckout(f: CheckoutForm, needsShipping: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  if (f.name.trim().length < 2) e["name"] = "Enter your full name.";
  if (!EMAIL_RE.test(f.email.trim()))
    e["email"] = "Enter a valid email — your receipt and downloads go here.";
  if (f.phone.trim() && !/^\+?[\d\s()-]{7,20}$/.test(f.phone.trim()))
    e["phone"] = "Enter a valid phone number, or leave it blank.";
  if (needsShipping && f.delivery === "ship") {
    const a = f.address;
    if (!a.line1.trim()) e["address.line1"] = "Enter your street address.";
    if (!a.city.trim()) e["address.city"] = "Enter your city or town.";
    if (!a.postalCode.trim()) e["address.postalCode"] = "Enter your postal code.";
    else if (!/^[A-Za-z0-9 -]{3,10}$/.test(a.postalCode.trim()))
      e["address.postalCode"] = "Enter a valid postal code.";
    if (!a.country) e["address.country"] = "Choose your country.";
  }
  if (f.note.length > 500) e["note"] = "Keep the note under 500 characters.";
  if (!f.acceptTerms) e["acceptTerms"] = "Please accept the terms to continue.";
  return e;
}

/** Next sequential order number, e.g. "#1069". */
export function nextOrderNumber(orders: Pick<ShopOrder, "number">[]): string {
  const max = orders.reduce((m, o) => Math.max(m, Number(o.number.replace(/\D/g, "")) || 0), 1000);
  return `#${max + 1}`;
}

/** Paid redemptions of `code` by this email (for once-per-customer coupons). */
export function customerCouponUses(
  orders: ShopOrder[],
  email: string,
  code: string | null,
): number {
  if (!code) return 0;
  const who = email.trim().toLowerCase();
  return orders.filter((o) => isPaid(o) && o.couponCode === code && o.email.toLowerCase() === who)
    .length;
}

/** The order recorded for a manual (bank transfer) checkout — always awaiting payment. */
export function buildPendingOrder(
  f: CheckoutForm,
  totals: CartTotals,
  ctx: { id: string; number: string; today?: string },
): ShopOrder {
  const items: OrderItem[] = totals.items.map((i) => ({
    productId: i.product.id,
    name: i.product.name,
    ...(i.label ? { variant: i.label } : {}),
    quantity: i.line.quantity,
    unitPrice: i.unitPrice,
  }));
  const delivery: DeliveryMethod = totals.needsShipping ? f.delivery : "digital";
  const trimmed = Object.fromEntries(
    Object.entries(f.address).map(([k, v]) => [k, v.trim()]),
  ) as unknown as Address;
  return {
    id: ctx.id,
    number: ctx.number,
    customer: f.name.trim(),
    email: f.email.trim().toLowerCase(),
    phone: f.phone.trim(),
    date: ctx.today ?? DEMO_TODAY,
    status: "pending",
    items,
    subtotal: totals.subtotal,
    discount:
      totals.discount +
      (totals.coupon?.ok && totals.coupon.freeShipping ? totals.shippingBeforeDiscount : 0),
    shipping: totals.shippingBeforeDiscount,
    total: totals.total,
    couponCode: totals.coupon?.ok ? totals.coupon.coupon.code : null,
    delivery,
    shippingAddress: delivery === "ship" ? trimmed : null,
    paymentMethod: f.paymentMethod,
    note: f.note.trim(),
  };
}
