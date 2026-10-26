import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { EmptyState, PageHeader, pageHead } from "@/components/kit";
import { StoreTabs } from "@/components/store-tabs";
import { ProductEditor } from "@/components/store-product-editor";
import { useShop } from "@/lib/shop";

export const Route = createFileRoute("/_app/store/products/$id/edit")({
  head: () =>
    pageHead("Edit product", "Edit a product's details, price, variants and availability."),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const { state: shop, ready } = useShop();
  const product = shop.products.find((p) => p.id === id);

  return (
    <div className="mx-auto max-w-5xl">
      <StoreTabs />
      <div className="mb-4">
        <Link
          to="/store/products/$id"
          params={{ id }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {product ? product.name : "Products"}
        </Link>
      </div>
      {!ready ? null : product ? (
        <>
          <PageHeader title="Edit product" />
          {/* Keyed so saved state reloaded from storage re-seeds the form. */}
          <ProductEditor key={product.id} product={product} />
        </>
      ) : (
        <EmptyState
          title="Product not found"
          description="It may have been deleted, or the link is out of date."
          action={
            <Link
              to="/store/products"
              className="text-sm font-medium underline-offset-2 hover:underline"
            >
              Back to products
            </Link>
          }
        />
      )}
    </div>
  );
}
