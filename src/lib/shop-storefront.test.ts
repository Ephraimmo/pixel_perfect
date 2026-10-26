import { describe, expect, it } from "vitest";
import { seedShopState } from "./shop-data";
import {
  canBuy,
  defaultSelection,
  deliveryPromise,
  isSelectionValid,
  selectionLabel,
  startingPrice,
  storefrontProducts,
  unitPrice,
  validateStorefrontSearch,
} from "./shop-storefront";

const { products } = seedShopState();
const get = (id: string) => products.find((p) => p.id === id)!;

describe("storefront browsing", () => {
  it("shows listed, in-window products only", () => {
    const ids = storefrontProducts(products, {}).map((p) => p.id);
    expect(ids).not.toContain("p9"); // hidden & sale ended
    expect(ids).toHaveLength(8);
    const soldOut = { ...get("p7"), inventory: 0 };
    const withSoldOut = storefrontProducts([...products.filter((p) => p.id !== "p7"), soldOut], {});
    expect(withSoldOut.map((p) => p.id)).toContain("p7");
    expect(canBuy(soldOut)).toBe(false);
  });

  it("features bestsellers first, then filters and sorts", () => {
    const featured = storefrontProducts(products, {});
    expect(featured.slice(0, 4).every((p) => p.popular)).toBe(true);
    expect(
      storefrontProducts(products, { category: "digital" })
        .map((p) => p.id)
        .sort(),
    ).toEqual(["p2", "p6"]);
    const cheap = storefrontProducts(products, { sort: "price-asc" }).map(startingPrice);
    expect(cheap).toEqual([...cheap].sort((a, b) => a - b));
    expect(storefrontProducts(products, { q: "linen" }).map((p) => p.id)).toEqual([]); // p9 hidden
    expect(storefrontProducts(products, { q: "album" }).map((p) => p.id)).toContain("p7");
    expect(validateStorefrontSearch({ category: "print", sort: "featured", q: " " })).toEqual({
      category: "print",
    });
  });
});

describe("product selection & price", () => {
  it("defaults to the first size and first choice of each option", () => {
    const canvas = get("p4");
    const sel = defaultSelection(canvas);
    expect(sel).toEqual({ variantId: "p4-12x16", options: { "opt-wrap": "gallery" } });
    expect(unitPrice(canvas, sel)).toBe(160);
    const framed = { variantId: "p4-24x36", options: { "opt-wrap": "float" } };
    expect(unitPrice(canvas, framed)).toBe(425);
    expect(selectionLabel(canvas, framed)).toBe("24x36 · Oak float frame");
    expect(isSelectionValid(canvas, framed)).toBe(true);
    expect(isSelectionValid(canvas, { ...framed, options: {} })).toBe(false);
  });

  it("skips sold-out variants and handles products without variants", () => {
    const album = get("p7");
    const linenOut = {
      ...album,
      variants: album.variants.map((v, i) => ({ ...v, available: i !== 0 })),
    };
    expect(defaultSelection(linenOut).variantId).toBe("p7-leather");
    expect(isSelectionValid(linenOut, { variantId: "p7-linen", options: {} })).toBe(false);
    expect(startingPrice(linenOut)).toBe(560);
    const pkg = get("p3");
    expect(unitPrice(pkg, defaultSelection(pkg))).toBe(1200);
    expect(selectionLabel(pkg, defaultSelection(pkg))).toBe("");
  });

  it("describes delivery for clients", () => {
    expect(deliveryPromise(get("p2"))).toBe(
      "Download link emailed as soon as your payment is confirmed · link valid for 30 days",
    );
    expect(deliveryPromise(get("p4"))).toBe("Printed to order · ships in about 7 working days");
  });
});
