import { describe, expect, it } from "vitest";
import {
  SHOP_STATE_VERSION,
  availability,
  fromPrice,
  migrateShopState,
  seedShopState,
} from "./shop-data";
import {
  emptyProductForm,
  productToForm,
  validateProductForm,
  type ProductForm,
} from "./shop-product-form";

const form = (patch: Partial<ProductForm>): ProductForm => ({
  ...emptyProductForm("package"),
  ...patch,
});
const variant = (name: string, price: string, available = true) => ({
  id: `v-${name}`,
  name,
  price,
  cost: "",
  sku: "",
  available,
});

describe("product editor validation", () => {
  it("requires a name and a sensible price", () => {
    const r = validateProductForm(form({ name: " ", price: "abc" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["name", "price"]);
    expect(validateProductForm(form({ name: "A", price: "0" })).ok).toBe(false);
    expect(validateProductForm(form({ name: "A", price: "12.345" })).ok).toBe(false);
    const ok = validateProductForm(form({ name: "  A4 Print ", price: "45.50" }));
    expect(ok.ok && ok.product).toMatchObject({ name: "A4 Print", price: 45.5, inventory: null });
  });

  it("validates variants and prices the product from its cheapest variant", () => {
    const bad = validateProductForm(
      form({ name: "Canvas", variants: [variant("16x20", "210"), variant("16X20", "x")] }),
    );
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.errors["optionName"]).toBeTruthy();
      expect(bad.errors["variants.1.name"]).toMatch(/different name/);
      expect(bad.errors["variants.1.price"]).toBeTruthy();
    }
    const allOut = validateProductForm(
      form({ name: "Canvas", optionName: "Size", variants: [variant("S", "10", false)] }),
    );
    expect(!allOut.ok && allOut.errors["variants"]).toBeTruthy();
    const good = validateProductForm(
      form({
        name: "Canvas",
        optionName: "Size",
        price: "",
        variants: [variant("L", "340"), variant("S", "160")],
      }),
    );
    expect(good.ok && good.product.price).toBe(160);
  });

  it("checks inventory and end date only when switched on", () => {
    expect(validateProductForm(form({ name: "A", price: "5", inventory: "x" })).ok).toBe(true);
    const r = validateProductForm(
      form({ name: "A", price: "5", trackInventory: true, inventory: "-1", hasEndDate: true }),
    );
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(["availableUntil", "inventory"]);
    const ok = validateProductForm(
      form({
        name: "A",
        price: "5",
        trackInventory: true,
        inventory: "0",
        hasEndDate: true,
        availableUntil: "2025-12-01",
      }),
    );
    expect(ok.ok && ok.product).toMatchObject({ inventory: 0, availableUntil: "2025-12-01" });
  });

  it("round-trips a seeded product through the form unchanged", () => {
    for (const p of seedShopState().products) {
      const r = validateProductForm(productToForm(p));
      const { id, ...rest } = p;
      expect(r.ok && r.product).toEqual(rest);
    }
  });
});

describe("product availability", () => {
  const base = seedShopState().products.find((p) => p.id === "p4")!;
  it("derives status from listing, stock, end date and variants", () => {
    expect(availability(base, "2025-04-20")).toBe("available");
    expect(availability({ ...base, active: false })).toBe("hidden");
    expect(availability({ ...base, inventory: 0 })).toBe("sold-out");
    expect(availability({ ...base, availableUntil: "2025-04-19" }, "2025-04-20")).toBe("ended");
    expect(
      availability({ ...base, variants: base.variants.map((v) => ({ ...v, available: false })) }),
    ).toBe("sold-out");
    expect(fromPrice(base)).toBe(160);
  });

  it("upgrades v1 saved state without losing edits", () => {
    const v1 = {
      version: 1,
      products: [
        {
          id: "p4",
          name: "My Canvas",
          category: "print",
          popular: false,
          price: 99,
          image: "x",
          active: true,
        },
      ],
      orders: [],
    };
    const migrated = migrateShopState(v1)!;
    expect(migrated.version).toBe(SHOP_STATE_VERSION);
    expect(migrated.products[0]).toMatchObject({
      name: "My Canvas",
      price: 99,
      optionName: "Size",
    });
    expect(migrated.products[0]!.variants).toHaveLength(3);
    expect(migrateShopState({ version: 99, products: [], orders: [] })).toBeNull();
  });
});
