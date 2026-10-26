import { describe, expect, it } from "vitest";
import { SEED_SETTINGS, seedShopState } from "./shop-data";
import { lineKey, priceCart } from "./shop-cart";
import {
  buildPendingOrder,
  customerCouponUses,
  emptyCheckoutForm,
  nextOrderNumber,
  validateCheckout,
  type CheckoutForm,
} from "./shop-checkout";
import { availableMethods, isProviderConnected, startPayment } from "./shop-payments";

const state = seedShopState();
const filled = (patch: Partial<CheckoutForm> = {}): CheckoutForm => ({
  ...emptyCheckoutForm("manual"),
  name: "Naledi Dube",
  email: "Naledi@Example.com ",
  phone: "+27 82 555 0100",
  address: {
    line1: "5 Long Street",
    line2: "",
    city: "Cape Town",
    region: "Western Cape",
    postalCode: "8001",
    country: "South Africa",
  },
  acceptTerms: true,
  ...patch,
});
const sel = { variantId: "p1-8x10", options: { "opt-paper": "lustre" } };
const lines = [{ id: lineKey("p1", sel), productId: "p1", selection: sel, quantity: 2 }];

describe("checkout validation", () => {
  it("requires contact details, terms and — when shipping — an address", () => {
    const e = validateCheckout(emptyCheckoutForm("manual"), true);
    expect(Object.keys(e).sort()).toEqual([
      "acceptTerms",
      "address.city",
      "address.line1",
      "address.postalCode",
      "email",
      "name",
    ]);
    expect(validateCheckout(filled(), true)).toEqual({});
    expect(
      validateCheckout(
        filled({ delivery: "pickup", address: { ...filled().address, line1: "" } }),
        true,
      ),
    ).toEqual({});
    expect(
      validateCheckout(filled({ address: { ...filled().address, line1: "" } }), false),
    ).toEqual({});
    expect(validateCheckout(filled({ phone: "call me" }), true)["phone"]).toBeTruthy();
  });

  it("numbers orders sequentially and counts paid coupon uses per customer", () => {
    expect(nextOrderNumber([{ number: "#1004" }, { number: "#1068" }])).toBe("#1069");
    expect(nextOrderNumber([])).toBe("#1001");
    const orders = state.orders.filter(
      (o) => o.couponCode === "SPRING15" && o.status !== "pending",
    );
    const someone = orders[0]!;
    expect(
      customerCouponUses(state.orders, someone.email.toUpperCase(), "SPRING15"),
    ).toBeGreaterThan(0);
    expect(customerCouponUses(state.orders, "new@client.com", "SPRING15")).toBe(0);
  });
});

describe("placing an order", () => {
  it("records a pending order with the priced breakdown", () => {
    const totals = priceCart(lines, { ...state, couponCode: "SPRING15" });
    const order = buildPendingOrder(filled(), totals, {
      id: "o-new",
      number: "#1100",
      today: "2025-04-20",
    });
    expect(order).toMatchObject({
      status: "pending",
      email: "naledi@example.com",
      subtotal: 50,
      discount: 7.5,
      shipping: 12,
      total: 54.5,
      couponCode: "SPRING15",
      delivery: "ship",
      paymentMethod: "manual",
      items: [{ productId: "p1", variant: "8x10 · Lustre", quantity: 2, unitPrice: 25 }],
    });
    expect(order.total).toBeCloseTo(order.subtotal - order.discount + order.shipping, 2);
  });

  it("folds a free-shipping coupon into the discount so totals still add up", () => {
    const big = [
      { ...lines[0]!, quantity: 3 },
      {
        id: "x",
        productId: "p5",
        selection: { variantId: "p5-11x14", options: { "opt-mount": "none" } },
        quantity: 1,
      },
    ];
    const totals = priceCart(big, { ...state, couponCode: "FREESHIP" });
    const order = buildPendingOrder(filled(), totals, { id: "o", number: "#1" });
    expect(order).toMatchObject({ subtotal: 120, shipping: 12, discount: 12, total: 120 });
  });

  it("stores pickup and digital orders without an address", () => {
    const pickup = buildPendingOrder(
      filled({ delivery: "pickup" }),
      priceCart(lines, { ...state, delivery: "pickup" }),
      { id: "o", number: "#1" },
    );
    expect(pickup).toMatchObject({ delivery: "pickup", shippingAddress: null, shipping: 0 });
    const dl = [
      { id: "d", productId: "p2", selection: { variantId: null, options: {} }, quantity: 1 },
    ];
    const digital = buildPendingOrder(filled(), priceCart(dl, state), { id: "o", number: "#1" });
    expect(digital).toMatchObject({ delivery: "digital", shippingAddress: null, total: 10 });
  });
});

describe("payment providers", () => {
  const req = {
    orderNumber: "#1100",
    amount: 54.5,
    customerEmail: "a@b.co",
    returnUrl: "/r",
    cancelUrl: "/c",
  };

  it("never reports card or PayPal payments as successful without a provider", async () => {
    for (const provider of ["stripe", "paypal"] as const) {
      expect(isProviderConnected(provider)).toBe(false);
      const r = await startPayment({ ...req, provider }, SEED_SETTINGS.payments);
      expect(r.status).toBe("unavailable");
    }
  });

  it("offers bank transfer only when the studio enables it", async () => {
    expect(
      await startPayment({ ...req, provider: "manual" }, SEED_SETTINGS.payments),
    ).toMatchObject({ status: "manual" });
    const off = { ...SEED_SETTINGS.payments, manualEnabled: false };
    expect(availableMethods(off)).toEqual(["stripe", "paypal"]);
    expect((await startPayment({ ...req, provider: "manual" }, off)).status).toBe("unavailable");
  });
});
