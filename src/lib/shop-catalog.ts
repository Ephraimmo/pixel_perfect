// Product catalog helpers — URL search validation plus filter/search/sort and
// per-product sales, kept pure so the catalog pages and tests share them.

import { isPaid, type ProductCategory, type ShopOrder, type ShopProduct } from "./shop-data";

export type CatalogType = "all" | "popular" | ProductCategory;
export type CatalogVisibility = "all" | "active" | "hidden";
export type CatalogSort = "name" | "price-asc" | "price-desc" | "best-selling";

export const CATALOG_TYPE_TABS: { value: CatalogType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "popular", label: "Popular" },
  { value: "print", label: "Prints" },
  { value: "digital", label: "Digital" },
  { value: "package", label: "Packages" },
];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  print: "Print",
  digital: "Digital download",
  package: "Package",
};

export const CATALOG_SORT_LABELS: Record<CatalogSort, string> = {
  name: "Name A–Z",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "best-selling": "Best selling",
};

export const VISIBILITY_LABELS: Record<CatalogVisibility, string> = {
  all: "Any visibility",
  active: "Listed",
  hidden: "Hidden",
};

export interface CatalogSearch {
  type?: CatalogType;
  visibility?: CatalogVisibility;
  q?: string;
  sort?: CatalogSort;
}

const isType = (v: unknown): v is CatalogType => CATALOG_TYPE_TABS.some((t) => t.value === v);
const isVisibility = (v: unknown): v is CatalogVisibility =>
  typeof v === "string" && v in VISIBILITY_LABELS;
const isSort = (v: unknown): v is CatalogSort => typeof v === "string" && v in CATALOG_SORT_LABELS;

/** Parse ?type=&visibility=&q=&sort= leniently: unknown values fall back to defaults (omitted). */
export function validateCatalogSearch(raw: Record<string, unknown>): CatalogSearch {
  const out: CatalogSearch = {};
  if (isType(raw["type"]) && raw["type"] !== "all") out.type = raw["type"];
  if (isVisibility(raw["visibility"]) && raw["visibility"] !== "all")
    out.visibility = raw["visibility"];
  if (typeof raw["q"] === "string" && raw["q"].trim()) out.q = raw["q"];
  if (isSort(raw["sort"]) && raw["sort"] !== "name") out.sort = raw["sort"];
  return out;
}

export function countByType(products: ShopProduct[]): Record<CatalogType, number> {
  const counts: Record<CatalogType, number> = {
    all: products.length,
    popular: 0,
    print: 0,
    digital: 0,
    package: 0,
  };
  for (const p of products) {
    counts[p.category] += 1;
    if (p.popular) counts.popular += 1;
  }
  return counts;
}

/** Case-insensitive match on name and category label. */
export function matchesProductQuery(p: ShopProduct, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return p.name.toLowerCase().includes(q) || CATEGORY_LABELS[p.category].toLowerCase().includes(q);
}

/** Paid units sold per product id, across all orders. */
export function unitsSold(orders: ShopOrder[]): Map<string, number> {
  const units = new Map<string, number>();
  for (const o of orders) {
    if (!isPaid(o)) continue;
    for (const i of o.items) units.set(i.productId, (units.get(i.productId) ?? 0) + i.quantity);
  }
  return units;
}

export function filterProducts(
  products: ShopProduct[],
  orders: ShopOrder[],
  { type = "all", visibility = "all", q = "", sort = "name" }: CatalogSearch,
): ShopProduct[] {
  const units = sort === "best-selling" ? unitsSold(orders) : new Map<string, number>();
  const byName = (a: ShopProduct, b: ShopProduct) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
  const compare: Record<CatalogSort, (a: ShopProduct, b: ShopProduct) => number> = {
    name: byName,
    "price-asc": (a, b) => a.price - b.price || byName(a, b),
    "price-desc": (a, b) => b.price - a.price || byName(a, b),
    "best-selling": (a, b) => (units.get(b.id) ?? 0) - (units.get(a.id) ?? 0) || byName(a, b),
  };
  return products
    .filter((p) => type === "all" || (type === "popular" ? p.popular : p.category === type))
    .filter((p) => visibility === "all" || (visibility === "active") === p.active)
    .filter((p) => matchesProductQuery(p, q))
    .sort(compare[sort]);
}

export interface ProductPerformance {
  units: number;
  revenue: number;
  orders: number;
  customers: number;
  lastSold: string | null;
}

/** Paid sales for one product; `orders` lists every order containing it, paid or not. */
export function productPerformance(
  productId: string,
  orders: ShopOrder[],
): ProductPerformance & { orderList: ShopOrder[] } {
  const orderList = orders
    .filter((o) => o.items.some((i) => i.productId === productId))
    .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number));
  const paid = orderList.filter(isPaid);
  let units = 0;
  let revenue = 0;
  for (const o of paid) {
    for (const i of o.items) {
      if (i.productId !== productId) continue;
      units += i.quantity;
      revenue += i.quantity * i.unitPrice;
    }
  }
  return {
    units,
    revenue,
    orders: paid.length,
    customers: new Set(paid.map((o) => o.email)).size,
    lastSold: paid[0]?.date ?? null,
    orderList,
  };
}
