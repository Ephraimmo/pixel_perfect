// Coupon helpers — status from validity dates and usage limits, discount
// calculation for a cart, and the create/edit form. Pure, so the coupon admin,
// the cart and tests share one set of rules.

import { DEMO_TODAY, formatDate, money } from "./demo-data";
import type { Coupon, CouponType, ProductCategory } from "./shop-data";

export type CouponStatus = "active" | "scheduled" | "expired" | "used-up" | "disabled";

export const COUPON_STATUS_LABELS: Record<CouponStatus, string> = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  "used-up": "Used up",
  disabled: "Disabled",
};

export const COUPON_TYPE_LABELS: Record<CouponType, string> = {
  percent: "Percentage off",
  fixed: "Fixed amount off",
  "free-shipping": "Free shipping",
};

const SCOPE_LABELS: Record<Coupon["appliesTo"], string> = {
  all: "",
  print: " prints",
  digital: " digital downloads",
  package: " packages",
};

export function couponStatus(c: Coupon, today = DEMO_TODAY): CouponStatus {
  if (!c.active) return "disabled";
  if (c.endsOn && c.endsOn < today) return "expired";
  if (c.usageLimit !== null && c.uses >= c.usageLimit) return "used-up";
  if (c.startsOn && c.startsOn > today) return "scheduled";
  return "active";
}

/** e.g. "15% off", "$10 off prints", "Free shipping on prints". */
export function describeDiscount(c: Pick<Coupon, "type" | "value" | "appliesTo">): string {
  const scope = SCOPE_LABELS[c.appliesTo];
  if (c.type === "free-shipping") return `Free shipping${scope ? ` on${scope}` : ""}`;
  const amount = c.type === "percent" ? `${c.value}%` : money(c.value).replace(/\.00$/, "");
  return `${amount} off${scope ? scope : ""}`;
}

export function describeValidity(c: Pick<Coupon, "startsOn" | "endsOn">): string {
  if (c.startsOn && c.endsOn) return `${formatDate(c.startsOn)} – ${formatDate(c.endsOn)}`;
  if (c.startsOn) return `From ${formatDate(c.startsOn)}`;
  if (c.endsOn) return `Until ${formatDate(c.endsOn)}`;
  return "No end date";
}

export const normalizeCode = (code: string) => code.trim().toUpperCase();

// ---------- applying a coupon ----------

export interface CouponCart {
  lines: { category: ProductCategory; amount: number }[];
  /** Shipping before any coupon. */
  shipping: number;
  /** Earlier paid redemptions of this code by the same customer, if known. */
  customerUses?: number;
  today?: string;
}

export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number; freeShipping: boolean; note?: string }
  | { ok: false; reason: string };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Check a code against a cart; reasons are written for the client to read. */
export function evaluateCoupon(code: string, coupons: Coupon[], cart: CouponCart): CouponResult {
  const wanted = normalizeCode(code);
  if (!wanted) return { ok: false, reason: "Enter a discount code." };
  const c = coupons.find((x) => x.code === wanted);
  if (!c) return { ok: false, reason: `"${wanted}" isn't a valid code.` };
  const status = couponStatus(c, cart.today);
  if (status === "disabled") return { ok: false, reason: `${c.code} isn't available right now.` };
  if (status === "expired")
    return { ok: false, reason: `${c.code} expired on ${formatDate(c.endsOn!)}.` };
  if (status === "used-up") return { ok: false, reason: `${c.code} has reached its usage limit.` };
  if (status === "scheduled")
    return { ok: false, reason: `${c.code} starts on ${formatDate(c.startsOn!)}.` };
  if (c.oncePerCustomer && (cart.customerUses ?? 0) > 0)
    return { ok: false, reason: `${c.code} can only be used once per customer.` };

  const qualifying = cart.lines
    .filter((l) => c.appliesTo === "all" || l.category === c.appliesTo)
    .reduce((s, l) => s + l.amount, 0);
  if (qualifying <= 0)
    return { ok: false, reason: `${c.code} only applies to${SCOPE_LABELS[c.appliesTo]}.` };
  if (c.minSubtotal !== null && qualifying < c.minSubtotal) {
    const what = c.appliesTo === "all" ? "orders" : SCOPE_LABELS[c.appliesTo].trim();
    return {
      ok: false,
      reason: `${c.code} needs ${money(c.minSubtotal)} or more of ${what} — add ${money(c.minSubtotal - qualifying)} more.`,
    };
  }

  if (c.type === "free-shipping") {
    return cart.shipping > 0
      ? { ok: true, coupon: c, discount: cart.shipping, freeShipping: true }
      : {
          ok: true,
          coupon: c,
          discount: 0,
          freeShipping: true,
          note: "Shipping is already free on this order.",
        };
  }
  const discount =
    c.type === "percent" ? round2((qualifying * c.value) / 100) : Math.min(c.value, qualifying);
  return { ok: true, coupon: c, discount, freeShipping: false };
}

// ---------- form ----------

export interface CouponForm {
  code: string;
  description: string;
  type: CouponType;
  value: string;
  appliesTo: Coupon["appliesTo"];
  hasMinimum: boolean;
  minSubtotal: string;
  startsOn: string;
  endsOn: string;
  hasLimit: boolean;
  usageLimit: string;
  oncePerCustomer: boolean;
  active: boolean;
}

export function emptyCouponForm(): CouponForm {
  return {
    code: "",
    description: "",
    type: "percent",
    value: "10",
    appliesTo: "all",
    hasMinimum: false,
    minSubtotal: "",
    startsOn: DEMO_TODAY,
    endsOn: "",
    hasLimit: false,
    usageLimit: "",
    oncePerCustomer: false,
    active: true,
  };
}

export function couponToForm(c: Coupon): CouponForm {
  return {
    code: c.code,
    description: c.description,
    type: c.type,
    value: c.type === "free-shipping" ? "" : String(c.value),
    appliesTo: c.appliesTo,
    hasMinimum: c.minSubtotal !== null,
    minSubtotal: c.minSubtotal === null ? "" : String(c.minSubtotal),
    startsOn: c.startsOn ?? "",
    endsOn: c.endsOn ?? "",
    hasLimit: c.usageLimit !== null,
    usageLimit: c.usageLimit === null ? "" : String(c.usageLimit),
    oncePerCustomer: c.oncePerCustomer,
    active: c.active,
  };
}

export type CouponInput = Omit<Coupon, "id" | "uses" | "createdAt">;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

export function validateCouponForm(
  f: CouponForm,
  others: Coupon[],
  uses = 0,
): { ok: true; coupon: CouponInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const code = normalizeCode(f.code);
  if (!/^[A-Z0-9_-]{3,20}$/.test(code))
    errors["code"] = "Use 3–20 letters, numbers, dashes or underscores.";
  else if (others.some((c) => c.code === code))
    errors["code"] = `${code} is already used by another coupon.`;

  let value = 0;
  if (f.type === "percent") {
    value = /^\d+$/.test(f.value.trim()) ? Number(f.value) : NaN;
    if (!(value >= 1 && value <= 100)) errors["value"] = "Enter a whole percentage from 1 to 100.";
  } else if (f.type === "fixed") {
    value = AMOUNT_RE.test(f.value.trim()) ? Number(f.value) : NaN;
    if (!(value > 0 && value <= 10_000)) errors["value"] = "Enter an amount like 10 or 12.50.";
  }

  let minSubtotal: number | null = null;
  if (f.hasMinimum) {
    minSubtotal = AMOUNT_RE.test(f.minSubtotal.trim()) ? Number(f.minSubtotal) : NaN;
    if (!(minSubtotal > 0)) errors["minSubtotal"] = "Enter the minimum order amount.";
  }
  if (f.type === "fixed" && minSubtotal !== null && value > minSubtotal && !errors["minSubtotal"])
    errors["value"] ??= "The discount can't be more than the minimum order.";

  const startsOn = f.startsOn.trim() || null;
  const endsOn = f.endsOn.trim() || null;
  if (startsOn && !DATE_RE.test(startsOn)) errors["startsOn"] = "Pick a valid start date.";
  if (endsOn && !DATE_RE.test(endsOn)) errors["endsOn"] = "Pick a valid end date.";
  if (startsOn && endsOn && !errors["startsOn"] && !errors["endsOn"] && endsOn < startsOn)
    errors["endsOn"] = "The end date must be on or after the start date.";

  let usageLimit: number | null = null;
  if (f.hasLimit) {
    usageLimit = /^\d+$/.test(f.usageLimit.trim()) ? Number(f.usageLimit) : NaN;
    if (!(usageLimit >= 1 && usageLimit <= 100_000)) errors["usageLimit"] = "Allow at least 1 use.";
    else if (usageLimit < uses)
      errors["usageLimit"] =
        `This code has already been used ${uses} times; the limit can't be lower.`;
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    coupon: {
      code,
      description: f.description.trim(),
      type: f.type,
      value: f.type === "free-shipping" ? 0 : value,
      appliesTo: f.appliesTo,
      minSubtotal,
      startsOn,
      endsOn,
      usageLimit,
      oncePerCustomer: f.oncePerCustomer,
      active: f.active,
    },
  };
}

/** Readable random code, e.g. "PIX-7KQ2XW" (no 0/O or 1/I). */
export function generateCode(prefix = "PIX", random = Math.random): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(random() * alphabet.length)];
  return `${prefix}-${out}`;
}
