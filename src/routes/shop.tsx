import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Aperture, ShoppingBag } from "lucide-react";
import { useDemo } from "@/lib/store";
import { CartProvider, useCart } from "@/lib/shop-cart-context";

export const Route = createFileRoute("/shop")({
  component: ShopLayout,
});

/** Client-facing chrome for the studio's storefront. */
function ShopLayout() {
  return (
    <CartProvider>
      <ShopChrome />
    </CartProvider>
  );
}

function ShopChrome() {
  const { state: demo } = useDemo();
  const { lines } = useCart();
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/shop" className="inline-flex min-w-0 items-center gap-2 text-foreground">
            <Aperture className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            <span className="truncate font-display text-base font-medium tracking-tight">
              {demo.profile.studio}
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-xs" aria-label="Shop">
            <Link
              to="/shop"
              activeOptions={{ exact: true, includeSearch: false }}
              className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-accent"
              activeProps={{ className: "bg-accent !text-foreground" }}
            >
              Shop
            </Link>
            <Link
              to="/shop/cart"
              className="relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-accent"
              activeProps={{ className: "bg-accent !text-foreground" }}
              aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="max-sm:hidden">Cart</span>
              {count > 0 ? (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background tabular-nums">
                  {count}
                </span>
              ) : null}
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {demo.profile.studio} · Questions?{" "}
            <a href={`mailto:${demo.profile.email}`} className="underline-offset-2 hover:underline">
              {demo.profile.email}
            </a>
          </p>
          <p>Store powered by Pixora</p>
        </div>
      </footer>
    </div>
  );
}
