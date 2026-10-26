import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Search, X } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  TabBar,
  pageHead,
} from "@/components/kit";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StoreTabs } from "@/components/store-tabs";
import { AddProductButton, AvailabilityBadge } from "@/components/store-products";
import { useShop } from "@/lib/shop";
import { money } from "@/lib/demo-data";
import { fromPrice, productImage } from "@/lib/shop-data";
import {
  CATALOG_SORT_LABELS,
  CATALOG_TYPE_TABS,
  CATEGORY_LABELS,
  VISIBILITY_LABELS,
  countByType,
  filterProducts,
  unitsSold,
  validateCatalogSearch,
  type CatalogSearch,
  type CatalogSort,
  type CatalogVisibility,
} from "@/lib/shop-catalog";

export const Route = createFileRoute("/_app/store/products/")({
  head: () => pageHead("Products", "Prints, digital downloads and packages for sale."),
  // Filters live in the URL so they survive opening a product and coming back.
  validateSearch: validateCatalogSearch,
  component: Products,
});

function Products() {
  const { state: shop, toggleProduct } = useShop();
  const { type = "all", visibility = "all", q = "", sort = "name" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const update = (patch: CatalogSearch) =>
    void navigate({
      search: (prev) => validateCatalogSearch({ ...prev, ...patch }),
      replace: true,
    });

  const counts = countByType(shop.products);
  const sold = unitsSold(shop.orders);
  const rows = filterProducts(shop.products, shop.orders, { type, visibility, q, sort });
  const filtered = type !== "all" || visibility !== "all" || q.trim() !== "";
  const listed = shop.products.filter((p) => p.active).length;

  return (
    <div className="mx-auto max-w-5xl">
      <StoreTabs />
      <PageHeader
        title="Products"
        description={`${shop.products.length} products · ${listed} listed in your store`}
        actions={<AddProductButton />}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Search products"
            aria-label="Search products"
            className="h-9 w-full rounded-md border bg-card pl-8 pr-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
          />
          {q ? (
            <button
              type="button"
              onClick={() => update({ q: "" })}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select
            value={visibility}
            onValueChange={(v) => update({ visibility: v as CatalogVisibility })}
          >
            <SelectTrigger className="h-9 bg-card text-xs sm:w-36" aria-label="Visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => update({ sort: v as CatalogSort })}>
            <SelectTrigger className="h-9 bg-card text-xs sm:w-44" aria-label="Sort products">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATALOG_SORT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <TabBar
        className="mt-4"
        value={type}
        onChange={(v) => update({ type: v })}
        tabs={CATALOG_TYPE_TABS.map((t) => ({
          value: t.value,
          label: `${t.label} (${counts[t.value]})`,
        }))}
      />

      {filtered ? (
        <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
          Showing {rows.length} of {shop.products.length} products
          {" · "}
          <button
            type="button"
            className="underline-offset-2 hover:text-foreground hover:underline"
            onClick={() =>
              void navigate({ search: sort === "name" ? {} : { sort }, replace: true })
            }
          >
            Clear filters
          </button>
        </p>
      ) : null}

      <Panel className="mt-3">
        {shop.products.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No products yet"
              description="Add prints, digital downloads or packages for clients to buy."
              action={<AddProductButton />}
            />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No products match"
              description={q ? `Nothing matches "${q}" with these filters.` : "Try another filter."}
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void navigate({ search: {}, replace: true })}
                >
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <Link
                  to="/store/products/$id"
                  params={{ id: p.id }}
                  className="group flex min-w-0 flex-1 items-center gap-3"
                >
                  <img
                    src={productImage(p.image, 120, 120)}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded object-cover"
                    loading="lazy"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium group-hover:underline">
                        {p.name}
                      </span>
                      {p.popular ? (
                        <span className="hidden sm:inline-flex">
                          <StatusBadge status="popular" label="Popular" />
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {p.variants.length ? `From ${money(fromPrice(p))}` : money(p.price)}
                      <span className="sm:hidden"> · {CATEGORY_LABELS[p.category]}</span>
                    </span>
                  </span>
                  <span className="hidden w-28 text-xs text-muted-foreground sm:block">
                    {CATEGORY_LABELS[p.category]}
                  </span>
                  <span className="hidden w-16 text-right text-xs tabular-nums text-muted-foreground md:block">
                    {sold.get(p.id) ?? 0} sold
                  </span>
                </Link>
                <AvailabilityBadge product={p} />
                <Switch
                  checked={p.active}
                  aria-label={p.active ? `Hide ${p.name}` : `List ${p.name}`}
                  onCheckedChange={() => {
                    toggleProduct(p.id);
                    toast.success(`${p.name} ${p.active ? "hidden from" : "listed in"} your store`);
                  }}
                />
                <Link
                  to="/store/products/$id"
                  params={{ id: p.id }}
                  aria-label={`Open ${p.name}`}
                  className="hidden text-muted-foreground hover:text-foreground sm:block"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
