import { describe, expect, it } from "vitest";
import { seedShopState } from "./shop-data";
import { clampQuantity, lineKey, maxQuantity, priceCart, type CartLine } from "./shop-cart";
import type { Selection } from "./shop-storefront";

const state = seedShopState();
const get = (id: string) => state.products.find((p) => p.id === id)!;
const line = (productId: string, selection: Selection, quantity: number): CartLine => ({
  id: lineKey(productId, selection),
  productId,
  selection,
  quantity,
});
const ctx = (extra: Partial<Parameters<typeof priceCart>[1]> = {}) => ({
  products: state.products,
  coupons: state.coupons,
  settings: state.settings,
  ...extra,
});

const print8x10 = line("p1", { variantId: "p1-8x10", options: { "opt-paper": "metallic" } }, 2); // (25+4)×2 = 58
const canvasFloat = line("p4", { variantId: "p4-16x20", options: { "opt-wrap": "float" } }, 1); // 210+85 = 295
const download = line("p2", { variantId: null, options: {} }, 3); // 10×3 = 30

describe("cart keys and limits", () => {
  it("keys lines by product and selection regardless of option order", () => {
    expect(lineKey("p4", { variantId: "a", options: { y: "2", x: "1" } })).toBe(
      lineKey("p4", { variantId: "a", options: { x: "1", y: "2" } }),
    );
  });

  it("caps quantity by stock and one-per-order products", () => {
    expect(maxQuantity(get("p1"))).toBe(20);
    expect(maxQuantity(get("p7"))).toBe(1); // package
    expect(maxQuantity(get("p6"))).toBe(1); // whole-gallery download
    expect(maxQuantity({ ...get("p1"), inventory: 3 })).toBe(3);
    expect(clampQuantity(50, get("p1"))).toBe(20);
    expect(clampQuantity(0, get("p1"))).toBe(1);
  });
});

describe("cart totals", () => {
  it("prices lines with variants, add-ons and shipping", () => {
    const t = priceCart([print8x10, download], ctx());
    expect(t.items.map((i) => i.total)).toEqual([58, 30]);
    expect(t).toMatchObject({
      count: 5,
      subtotal: 88,
      physicalSubtotal: 58,
      shipping: 12,
      total: 100,
    });
    expect(t.freeShippingGap).toBe(92);
    expect(t.items[0]!.label).toBe("8x10 · Metallic");
  });

  it("ships free over the threshold, for pickup and for digital-only carts", () => {
    expect(priceCart([canvasFloat], ctx())).toMatchObject({
      subtotal: 295,
      shipping: 0,
      total: 295,
      freeShippingGap: null,
    });
    expect(priceCart([print8x10], ctx({ delivery: "pickup" }))).toMatchObject({
      shipping: 0,
      total: 58,
    });
    expect(priceCart([download], ctx())).toMatchObject({
      needsShipping: false,
      shipping: 0,
      total: 30,
    });
  });

  it("applies coupons to the right items and explains rejections", () => {
    const spring = priceCart([print8x10, download], ctx({ couponCode: "SPRING15" }));
    expect(spring).toMatchObject({ discount: 13.2, shipping: 12, total: 86.8 });
    const free = priceCart(
      [print8x10, line("p5", { variantId: "p5-11x14", options: { "opt-mount": "none" } }, 1)],
      ctx({ couponCode: "FREESHIP" }),
    );
    expect(free).toMatchObject({
      subtotal: 103,
      discount: 0,
      shipping: 0,
      shippingBeforeDiscount: 12,
      total: 103,
    });
    const bad = priceCart([download], ctx({ couponCode: "WELCOME10" }));
    expect(bad.coupon?.ok).toBe(false);
    expect(bad.total).toBe(30);
  });

  it("excludes unavailable items and clamps over-stock quantities", () => {
    const hidden = { ...get("p8"), active: false };
    const lowStock = { ...get("p1"), inventory: 1 };
    const products = state.products.map((p) =>
      p.id === "p8" ? hidden : p.id === "p1" ? lowStock : p,
    );
    const t = priceCart(
      [
        print8x10,
        line("p8", { variantId: "p8-16x20", options: { "opt-finish": "gloss" } }, 1),
        line("gone", { variantId: null, options: {} }, 1),
      ],
      ctx({ products }),
    );
    expect(t.items).toHaveLength(1);
    expect(t.items[0]!.line.quantity).toBe(1);
    expect(t.unavailable.map((u) => u.reason)).toEqual([
      "No longer available",
      "No longer available",
    ]);
    expect(t.subtotal).toBe(29);
    const soldOutVariant = priceCart(
      [line("p4", { variantId: "p4-16x20", options: { "opt-wrap": "float" } }, 1)],
      ctx({
        products: state.products.map((p) =>
          p.id === "p4"
            ? { ...p, variants: p.variants.map((v) => ({ ...v, available: v.id !== "p4-16x20" })) }
            : p,
        ),
      }),
    );
    expect(soldOutVariant.unavailable[0]!.reason).toBe("This option is no longer available");
  });
});
