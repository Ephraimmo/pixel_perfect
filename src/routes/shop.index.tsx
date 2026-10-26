import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { pageHead } from "@/components/kit";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemo } from "@/lib/store";
import { useShop } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { PHOTOS, img, money } from "@/lib/demo-data";
import { productImage, type ProductCategory } from "@/lib/shop-data";
import {
  SHOP_CATEGORY_LABELS,
  SHOP_SORT_LABELS,
  canBuy,
  startingPrice,
  storefrontProducts,
  validateStorefrontSearch,
  type ShopSort,
  type StorefrontSearch,
} from "@/lib/shop-storefront";

export const Route = createFileRoute("/shop/")({
  head: () => pageHead("Shop", "Prints, albums and digital downloads from your session."),
  validateSearch: validateStorefrontSearch,
  component: Storefront,
});

function Storefront() {
  const { state: demo } = useDemo();
  const { state: shop } = useShop();
  const { category, sort = "featured", q = "" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const update = (patch: StorefrontSearch) =>
    void navigate({
      search: (prev) => validateStorefrontSearch({ ...prev, ...patch }),
      replace: true,
    });

  const products = storefrontProducts(shop.products, {
    ...(category ? { category } : {}),
    sort,
    q,
  });
  const total = storefrontProducts(shop.products, {}).length;

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img
          src={img(PHOTOS.lakeBanner, 1600, 520)}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/30 to-black/10" />
        <div className="mx-auto max-w-6xl px-4 py-14 text-white sm:px-6 sm:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/80">
            {demo.profile.studio}
          </p>
          <h1 className="display-title mt-2 max-w-xl text-3xl sm:text-4xl">
            Keep your photos close — in print, in albums and on every device
          </h1>
          <p className="mt-3 max-w-lg text-sm text-white/85">
            Professionally printed and finished by hand, or delivered as full-resolution downloads.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div
            role="group"
            aria-label="Category"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0"
          >
            <Chip
              active={!category}
              onClick={() =>
                void navigate({
                  search: ({ category: _, ...rest }) => validateStorefrontSearch(rest),
                  replace: true,
                })
              }
            >
              All
            </Chip>
            {(Object.keys(SHOP_CATEGORY_LABELS) as ProductCategory[]).map((c) => (
              <Chip key={c} active={category === c} onClick={() => update({ category: c })}>
                {SHOP_CATEGORY_LABELS[c]}
              </Chip>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 md:w-56 md:flex-none">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={q}
                onChange={(e) => update({ q: e.target.value })}
                placeholder="Search the shop"
                aria-label="Search the shop"
                className="h-9 w-full rounded-md border bg-card pl-8 pr-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
              />
              {q ? (
                <button
                  type="button"
                  onClick={() => update({ q: "" })}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <Select value={sort} onValueChange={(v) => update({ sort: v as ShopSort })}>
              <SelectTrigger className="h-9 w-44 bg-card text-xs" aria-label="Sort by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SHOP_SORT_LABELS) as ShopSort[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SHOP_SORT_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">
          {products.length === total
            ? `${total} products`
            : `${products.length} of ${total} products`}
        </p>

        {products.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed px-6 py-16 text-center">
            <p className="display-title text-lg">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {q ? `No products match "${q}".` : "Check back soon for new prints and collections."}
            </p>
            {q || category ? (
              <button
                type="button"
                onClick={() => void navigate({ search: {}, replace: true })}
                className="mt-4 text-sm font-medium underline-offset-2 hover:underline"
              >
                Show all products
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
            {products.map((p) => {
              const soldOut = !canBuy(p);
              return (
                <li key={p.id}>
                  <Link to="/shop/$productId" params={{ productId: p.id }} className="group block">
                    <div className="relative overflow-hidden rounded-lg bg-muted">
                      <img
                        src={productImage(p.image, 720, 900)}
                        alt=""
                        loading="lazy"
                        className={cn(
                          "aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]",
                          soldOut && "opacity-60",
                        )}
                      />
                      <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                        {soldOut ? <Tag>Sold out</Tag> : p.popular ? <Tag>Bestseller</Tag> : null}
                        {p.category === "digital" ? <Tag>Instant download</Tag> : null}
                      </div>
                    </div>
                    <p className="mt-2.5 text-sm font-medium group-hover:underline">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.variants.filter((v) => v.available).length > 1 ? "From " : ""}
                      {money(startingPrice(p))}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-colors",
        active ? "border-foreground bg-foreground text-background" : "bg-card hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-card/95 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-soft">
      {children}
    </span>
  );
}
