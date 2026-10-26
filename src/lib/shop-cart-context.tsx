// The client's cart — kept in this browser under its own key, separate from the
// studio's store data. Mounted by the /shop layout.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MAX_QUANTITY, lineKey, type CartLine } from "./shop-cart";
import type { Selection } from "./shop-storefront";

const STORAGE_KEY = "pixora-cart-v1";

interface CartState {
  lines: CartLine[];
  couponCode: string | null;
}

const EMPTY: CartState = { lines: [], couponCode: null };

function loadCart(): CartState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartState;
    return Array.isArray(parsed.lines) ? parsed : null;
  } catch {
    return null;
  }
}

export interface CartStore extends CartState {
  ready: boolean;
  /** Adds (or merges into an existing line); `max` caps the merged quantity. */
  add: (productId: string, selection: Selection, quantity: number, max: number) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  /** Put a removed line back where it was (for undo). */
  restore: (line: CartLine, index: number) => void;
  setCouponCode: (code: string | null) => void;
  clear: () => void;
}

const CartContext = createContext<CartStore | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadCart();
    if (saved) setState(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable — the cart simply won't survive a reload
    }
  }, [state, ready]);

  const value = useMemo<CartStore>(
    () => ({
      ...state,
      ready,
      add: (productId, selection, quantity, max) =>
        setState((s) => {
          const id = lineKey(productId, selection);
          const cap = Math.max(1, Math.min(max, MAX_QUANTITY));
          const existing = s.lines.find((l) => l.id === id);
          return {
            ...s,
            lines: existing
              ? s.lines.map((l) =>
                  l.id === id ? { ...l, quantity: Math.min(cap, l.quantity + quantity) } : l,
                )
              : [...s.lines, { id, productId, selection, quantity: Math.min(cap, quantity) }],
          };
        }),
      setQuantity: (lineId, quantity) =>
        setState((s) => ({
          ...s,
          lines: s.lines.map((l) =>
            l.id === lineId ? { ...l, quantity: Math.max(1, Math.min(MAX_QUANTITY, quantity)) } : l,
          ),
        })),
      remove: (lineId) =>
        setState((s) => ({ ...s, lines: s.lines.filter((l) => l.id !== lineId) })),
      restore: (line, index) =>
        setState((s) => {
          if (s.lines.some((l) => l.id === line.id)) return s;
          const lines = [...s.lines];
          lines.splice(Math.min(index, lines.length), 0, line);
          return { ...s, lines };
        }),
      setCouponCode: (couponCode) => setState((s) => ({ ...s, couponCode })),
      clear: () => setState(EMPTY),
    }),
    [state, ready],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartStore {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
