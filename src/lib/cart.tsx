// Demo cart — separate from the main store so checkout works from both the
// storefront and the client portal without touching demo state shape.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

const CART_KEY = "pixora-cart-v1";

interface CartStore {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  total: () => number;
}

const CartContext = createContext<CartStore | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // ignore malformed carts
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable — cart won't persist
    }
  }, [items, ready]);

  const value = useMemo<CartStore>(
    () => ({
      items,
      add: (item, qty = 1) =>
        setItems((prev) => {
          const existing = prev.find((i) => i.productId === item.productId);
          if (existing) {
            return prev.map((i) => (i.productId === item.productId ? { ...i, qty: i.qty + qty } : i));
          }
          return [...prev, { ...item, qty }];
        }),
      setQty: (productId, qty) =>
        setItems((prev) =>
          qty <= 0 ? prev.filter((i) => i.productId !== productId) : prev.map((i) => (i.productId === productId ? { ...i, qty } : i)),
        ),
      remove: (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId)),
      clear: () => setItems([]),
      total: () => items.reduce((s, i) => s + i.qty * i.price, 0),
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartStore {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
