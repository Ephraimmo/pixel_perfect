import { describe, expect, it } from "vitest";
import { seedShopState, type Coupon } from "./shop-data";
import {
  couponStatus,
  couponToForm,
  describeDiscount,
  emptyCouponForm,
  evaluateCoupon,
  generateCode,
  validateCouponForm,
  type CouponCart,
} from "./shop-coupons";

const { coupons } = seedShopState();
const byCode = (code: string) => coupons.find((c) => c.code === code)!;
const cart = (
  amount: number,
  category: "print" | "digital" | "package" = "print",
  shipping = 12,
) => ({
  lines: [{ category, amount }],
  shipping,
  today: "2025-04-20",
});

describe("coupon status", () => {
  it("derives status from enabled flag, dates and usage", () => {
    expect(couponStatus(byCode("SPRING15"), "2025-04-20")).toBe("active");
    expect(couponStatus(byCode("SPRING15"), "2025-05-01")).toBe("expired");
    expect(couponStatus(byCode("MOTHERSDAY"), "2025-04-20")).toBe("scheduled");
    expect(couponStatus(byCode("HOLIDAY24"), "2025-04-20")).toBe("expired");
    expect(couponStatus(byCode("VIP50"), "2025-04-20")).toBe("used-up");
    expect(couponStatus({ ...byCode("WELCOME10"), active: false })).toBe("disabled");
    expect(describeDiscount(byCode("FREESHIP"))).toBe("Free shipping on prints");
    expect(describeDiscount(byCode("WELCOME10"))).toBe("$10 off");
  });
});

describe("applying coupons", () => {
  it("calculates percentage, fixed and free-shipping discounts", () => {
    expect(evaluateCoupon(" spring15 ", coupons, cart(120))).toMatchObject({
      ok: true,
      discount: 18,
    });
    expect(evaluateCoupon("WELCOME10", coupons, cart(60))).toMatchObject({
      ok: true,
      discount: 10,
    });
    expect(evaluateCoupon("FREESHIP", coupons, cart(80))).toMatchObject({
      ok: true,
      discount: 12,
      freeShipping: true,
    });
    expect(evaluateCoupon("FREESHIP", coupons, cart(200, "print", 0))).toMatchObject({
      ok: true,
      discount: 0,
    });
  });

  it("explains why a code can't be used", () => {
    const reason = (code: string, c: CouponCart = cart(120)) => {
      const r = evaluateCoupon(code, coupons, c);
      return r.ok ? "" : r.reason;
    };
    expect(reason("")).toBe("Enter a discount code.");
    expect(reason("NOPE")).toBe('"NOPE" isn\'t a valid code.');
    expect(reason("HOLIDAY24")).toBe("HOLIDAY24 expired on Dec 31, 2024.");
    expect(reason("MOTHERSDAY")).toBe("MOTHERSDAY starts on May 1, 2025.");
    expect(reason("VIP50")).toBe("VIP50 has reached its usage limit.");
    expect(reason("WELCOME10", cart(30))).toBe(
      "WELCOME10 needs $50.00 or more of orders — add $20.00 more.",
    );
    expect(reason("FREESHIP", cart(100, "digital", 0))).toBe("FREESHIP only applies to prints.");
    expect(reason("WELCOME10", { ...cart(80), customerUses: 1 })).toBe(
      "WELCOME10 can only be used once per customer.",
    );
  });

  it("only discounts qualifying items and never more than they cost", () => {
    const scoped: Coupon = {
      ...byCode("WELCOME10"),
      appliesTo: "digital",
      minSubtotal: null,
      value: 50,
    };
    const r = evaluateCoupon("WELCOME10", [scoped], {
      lines: [
        { category: "print", amount: 100 },
        { category: "digital", amount: 20 },
      ],
      shipping: 12,
      today: "2025-04-20",
    });
    expect(r).toMatchObject({ ok: true, discount: 20 });
  });
});

describe("coupon form", () => {
  it("validates code, value, dates and limits", () => {
    const r = validateCouponForm(
      {
        ...emptyCouponForm(),
        code: "spring15",
        value: "150",
        startsOn: "2025-05-10",
        endsOn: "2025-05-01",
      },
      coupons,
    );
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(["code", "endsOn", "value"]);
    const fixed = validateCouponForm(
      {
        ...emptyCouponForm(),
        code: "BIG",
        type: "fixed",
        value: "80",
        hasMinimum: true,
        minSubtotal: "50",
      },
      coupons,
    );
    expect(!fixed.ok && fixed.errors["value"]).toMatch(/can't be more than the minimum/);
    const limit = validateCouponForm(
      { ...couponToForm(byCode("SPRING15")), usageLimit: "10" },
      [],
      23,
    );
    expect(!limit.ok && limit.errors["usageLimit"]).toMatch(/already been used 23 times/);
  });

  it("round-trips seeded coupons and normalises codes", () => {
    for (const c of coupons) {
      const r = validateCouponForm(couponToForm(c), [], c.uses);
      const { id, uses, createdAt, ...rest } = c;
      expect(r.ok && r.coupon).toEqual(rest);
    }
    const r = validateCouponForm(
      { ...emptyCouponForm(), code: " summer-24 ", type: "free-shipping", value: "" },
      coupons,
    );
    expect(r.ok && r.coupon).toMatchObject({ code: "SUMMER-24", value: 0 });
    expect(generateCode("PIX", () => 0)).toBe("PIX-AAAAAA");
    expect(generateCode()).toMatch(/^PIX-[A-HJ-NP-Z2-9]{6}$/);
  });
});
