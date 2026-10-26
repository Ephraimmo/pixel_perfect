// Pixora store state — React context over local commerce demo state, persisted
// to localStorage under its own key. No backend or payment provider is
// connected; actions here only change demo data and the UI says so.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEMO_TODAY } from "./demo-data";
import {
  migrateShopState,
  seedShopState,
  type Coupon,
  type ShopOrder,
  type ShopProduct,
  type ShopState,
  type StoreSettings,
} from "./shop-data";
import type { ProductInput } from "./shop-product-form";
import type { CouponInput } from "./shop-coupons";

const STORAGE_KEY = "pixora-shop-v1";

function loadState(): ShopState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrateShopState(JSON.parse(raw));
  } catch {
    return null;
  }
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export interface ShopStore {
  state: ShopState;
  /** False until saved store state has been read from localStorage. */
  ready: boolean;
  resetShop: () => void;
  createProduct: (input: ProductInput) => ShopProduct;
  updateProduct: (id: string, input: ProductInput) => void;
  deleteProduct: (id: string) => void;
  toggleProduct: (id: string) => void;
  updateOrderStatus: (id: string, status: ShopOrder["status"]) => void;
  updateSettings: (settings: StoreSettings) => void;
  createCoupon: (input: CouponInput) => Coupon;
  updateCoupon: (id: string, input: CouponInput) => void;
  toggleCoupon: (id: string) => void;
  deleteCoupon: (id: string) => void;
  /** Records an order placed at checkout. Orders are never created as paid. */
  placeOrder: (order: ShopOrder) => void;
}

const ShopContext = createContext<ShopStore | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ShopState>(() => seedShopState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) setState(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full or unavailable — store demo state simply won't persist
    }
  }, [state, ready]);

  const value = useMemo<ShopStore>(() => {
    const patch = <K extends "products" | "orders" | "coupons">(
      key: K,
      id: string,
      change: (item: ShopState[K][number]) => Partial<ShopState[K][number]>,
    ) =>
      setState((s) => ({
        ...s,
        [key]: (s[key] as ShopState[K][number][]).map((item) =>
          item.id === id ? { ...item, ...change(item) } : item,
        ),
      }));

    return {
      state,
      ready,
      resetShop: () => setState(seedShopState()),
      createProduct: (input) => {
        const product: ShopProduct = { ...input, id: uid("p") };
        setState((s) => ({ ...s, products: [...s.products, product] }));
        return product;
      },
      updateProduct: (id, input) => patch("products", id, () => input),
      deleteProduct: (id) =>
        setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) })),
      toggleProduct: (id) => patch("products", id, (p) => ({ active: !p.active })),
      updateOrderStatus: (id, status) =>
        setState((s) => {
          const order = s.orders.find((o) => o.id === id);
          if (!order || order.status === status) return s;
          const orders = s.orders.map((o) => (o.id === id ? { ...o, status } : o));
          // Payment recorded: count the coupon redemption and take items out of tracked stock.
          if (order.status !== "pending" || status !== "paid") return { ...s, orders };
          const sold = new Map<string, number>();
          for (const i of order.items)
            sold.set(i.productId, (sold.get(i.productId) ?? 0) + i.quantity);
          return {
            ...s,
            orders,
            coupons: s.coupons.map((c) =>
              c.code === order.couponCode ? { ...c, uses: c.uses + 1 } : c,
            ),
            products: s.products.map((p) =>
              p.inventory !== null && sold.has(p.id)
                ? { ...p, inventory: Math.max(0, p.inventory - (sold.get(p.id) ?? 0)) }
                : p,
            ),
          };
        }),
      updateSettings: (settings) => setState((s) => ({ ...s, settings })),
      createCoupon: (input) => {
        const coupon: Coupon = { ...input, id: uid("cp"), uses: 0, createdAt: DEMO_TODAY };
        setState((s) => ({ ...s, coupons: [coupon, ...s.coupons] }));
        return coupon;
      },
      updateCoupon: (id, input) => patch("coupons", id, () => input),
      toggleCoupon: (id) => patch("coupons", id, (c) => ({ active: !c.active })),
      deleteCoupon: (id) =>
        setState((s) => ({ ...s, coupons: s.coupons.filter((c) => c.id !== id) })),
      placeOrder: (order) =>
        setState((s) => ({ ...s, orders: [{ ...order, status: "pending" }, ...s.orders] })),
    };
  }, [state, ready]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopStore {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside <ShopProvider>");
  return ctx;
}
