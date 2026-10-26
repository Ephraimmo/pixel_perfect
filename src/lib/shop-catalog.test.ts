import { describe, expect, it } from "vitest";
import { seedShopState, type ShopOrder } from "./shop-data";
import {
  countByType,
  filterProducts,
  productPerformance,
  validateCatalogSearch,
} from "./shop-catalog";

const { products, orders } = seedShopState();

describe("product catalog", () => {
  it("drops unknown or default search params", () => {
    expect(validateCatalogSearch({ type: "print", sort: "price-desc", q: "  " })).toEqual({
      type: "print",
      sort: "price-desc",
    });
    expect(validateCatalogSearch({ type: "nope", visibility: "all", sort: "name" })).toEqual({});
  });

  it("searches by name or type, case-insensitively", () => {
    expect(filterProducts(products, orders, { q: "CANVAS" }).map((p) => p.id)).toEqual(["p4"]);
    const digital = filterProducts(products, orders, { q: "digital" });
    expect(digital.every((p) => p.category === "digital")).toBe(true);
    expect(filterProducts(products, orders, { q: "zzz" })).toEqual([]);
  });

  it("filters by type, popularity and visibility together", () => {
    const counts = countByType(products);
    expect(counts.all).toBe(products.length);
    expect(counts.print + counts.digital + counts.package).toBe(products.length);
    const hiddenPrints = filterProducts(products, orders, { type: "print", visibility: "hidden" });
    expect(hiddenPrints.map((p) => p.name)).toEqual(["Holiday Card Set"]);
    expect(filterProducts(products, orders, { type: "popular" }).every((p) => p.popular)).toBe(
      true,
    );
  });

  it("sorts by price and by units sold", () => {
    const asc = filterProducts(products, orders, { sort: "price-asc" }).map((p) => p.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const best = filterProducts(products, orders, { sort: "best-selling" });
    const units = (id: string) => productPerformance(id, orders).units;
    expect(units(best[0]!.id)).toBeGreaterThanOrEqual(units(best[1]!.id));
  });

  it("counts only paid sales towards product performance", () => {
    const mk = (id: string, status: ShopOrder["status"], email: string): ShopOrder => ({
      id,
      number: `#${id}`,
      customer: "C",
      email,
      phone: "",
      subtotal: 60,
      discount: 0,
      shipping: 0,
      couponCode: null,
      delivery: "ship",
      shippingAddress: null,
      paymentMethod: "manual",
      note: "",
      date: "2025-04-1" + id,
      status,
      total: 50,
      items: [
        { productId: "p1", name: "8x10 Print", quantity: 2, unitPrice: 25 },
        { productId: "p2", name: "Digital Download", quantity: 1, unitPrice: 10 },
      ],
    });
    const perf = productPerformance("p1", [
      mk("1", "paid", "a@x.com"),
      mk("2", "shipped", "a@x.com"),
      mk("3", "pending", "b@x.com"),
    ]);
    expect(perf).toMatchObject({
      units: 4,
      revenue: 100,
      orders: 2,
      customers: 1,
      lastSold: "2025-04-12",
    });
    expect(perf.orderList.map((o) => o.id)).toEqual(["3", "2", "1"]);
  });
});
