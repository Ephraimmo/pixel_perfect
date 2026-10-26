import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader, pageHead } from "@/components/kit";
import { StoreTabs } from "@/components/store-tabs";
import { ProductEditor } from "@/components/store-product-editor";
import { useShop } from "@/lib/shop";

export const Route = createFileRoute("/_app/store/products/new")({
  head: () => pageHead("New product", "Add a print, digital download or package to your store."),
  component: NewProduct,
});

function NewProduct() {
  const { ready } = useShop();
  return (
    <div className="mx-auto max-w-5xl">
      <StoreTabs />
      <div className="mb-4">
        <Link
          to="/store/products"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Products
        </Link>
      </div>
      <PageHeader title="New product" />
      {/* Wait for saved store settings so the form starts from the studio's delivery defaults. */}
      {ready ? <ProductEditor /> : null}
    </div>
  );
}
