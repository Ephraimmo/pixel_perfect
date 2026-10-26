import { describe, expect, it } from "vitest";
import { SEED_SETTINGS, migrateShopState, seedShopState } from "./shop-data";
import {
  describeFulfillment,
  margin,
  priceFromCost,
  printToForm,
  shippingCost,
  shippingToForm,
  validatePrintForm,
  validateShippingForm,
} from "./shop-print";
import { emptyProductForm, productToForm, validateProductForm } from "./shop-product-form";

const canvas = seedShopState().products.find((p) => p.id === "p4")!;

describe("print pricing", () => {
  it("prices from lab cost with a markup and shows margin", () => {
    expect(priceFromCost(3.2, 250)).toBe(10.99);
    expect(priceFromCost(52, 300)).toBe(207.99);
    expect(priceFromCost(0.1, 0)).toBe(0.99);
    expect(margin(160, 38)).toEqual({ profit: 122, percent: 76.25 });
    expect(margin(160, null)).toBeNull();
  });

  it("charges flat-rate shipping below the free threshold only", () => {
    const s = SEED_SETTINGS.shipping;
    expect(shippingCost(0, s)).toBe(0); // digital-only
    expect(shippingCost(60, s)).toBe(12);
    expect(shippingCost(150, s)).toBe(0);
    expect(shippingCost(60, s, "pickup")).toBe(0);
    expect(shippingCost(500, { ...s, freeOver: null })).toBe(12);
  });
});

describe("print product form", () => {
  it("requires at least one size and validates lab cost", () => {
    const empty = validateProductForm({ ...emptyProductForm("print"), name: "A2 print" });
    expect(!empty.ok && empty.errors["variants"]).toBe("Add at least one print size.");
    expect(!empty.ok && empty.errors["price"]).toBeUndefined();
    const form = productToForm(canvas);
    form.variants[0]!.cost = "abc";
    const bad = validateProductForm(form);
    expect(!bad.ok && bad.errors["variants.0.cost"]).toBeTruthy();
  });

  it("validates option names, choices and production time", () => {
    const f = printToForm(canvas.print!);
    f.options.push({ id: "o2", name: "edge", choices: [{ id: "c", label: "Only", price: "x" }] });
    f.productionDays = "0";
    const r = validatePrintForm(f);
    expect(Object.keys(r.errors).sort()).toEqual([
      "print.options.1.choices",
      "print.options.1.name",
      "print.productionDays",
    ]);
  });

  it("saves sizes as variants with the option fixed to Size", () => {
    const form = { ...emptyProductForm("print"), name: "Fine art", optionName: "" };
    form.variants = [
      { id: "a", name: "8x10", price: "29", cost: "3.20", sku: "", available: true },
    ];
    const r = validateProductForm(form);
    expect(r.ok && r.product).toMatchObject({
      optionName: "Size",
      price: 29,
      variants: [{ name: "8x10", cost: 3.2 }],
      print: { options: [], fulfillment: SEED_SETTINGS.printDefaults },
      digital: null,
    });
  });

  it("describes fulfillment", () => {
    expect(describeFulfillment(canvas.print!.fulfillment)).toBe(
      "Bay Photo Lab · 7 working days to produce · ships direct to client",
    );
    expect(
      describeFulfillment({ ...canvas.print!.fulfillment, method: "self", productionDays: 1 }),
    ).toBe("Fulfilled by your studio · ships in 1 working day");
  });
});

describe("store shipping settings", () => {
  it("validates rates, free threshold, pickup note and markup", () => {
    const f = {
      ...shippingToForm(SEED_SETTINGS.shipping),
      flatRate: "-1",
      freeOver: "0",
      pickupNote: " ",
    };
    const r = validateShippingForm(f, "abc");
    expect(Object.keys(r.errors).sort()).toEqual([
      "markup",
      "shipping.flatRate",
      "shipping.freeOver",
      "shipping.pickupNote",
    ]);
    const ok = validateShippingForm(
      { ...shippingToForm(SEED_SETTINGS.shipping), freeShipping: false },
      "200",
    );
    expect(ok).toMatchObject({ shipping: { flatRate: 12, freeOver: null }, markupPercent: 200 });
  });

  it("gives v3 print products sizes and fulfillment", () => {
    const v3 = {
      version: 3,
      products: [
        {
          id: "p1",
          name: "8x10",
          category: "print",
          price: 25,
          image: "x",
          active: true,
          popular: true,
          variants: [],
        },
        {
          id: "x9",
          name: "Custom",
          category: "print",
          price: 40,
          image: "x",
          active: true,
          popular: false,
          variants: [],
        },
      ],
      orders: [],
      settings: { ...SEED_SETTINGS, printDefaults: undefined, shipping: undefined },
    };
    const m = migrateShopState(v3)!;
    expect(m.products[0]!.variants.map((v) => v.name)).toEqual(["8x10"]);
    expect(m.products[1]).toMatchObject({
      optionName: "Size",
      variants: [{ name: "Standard", price: 40 }],
    });
    expect(m.products[1]!.print?.fulfillment).toEqual(SEED_SETTINGS.printDefaults);
    expect(m.settings.shipping.flatRate).toBe(12);
  });
});
