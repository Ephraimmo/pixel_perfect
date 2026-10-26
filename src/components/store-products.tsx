import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button, StatusBadge } from "@/components/kit";
import { AVAILABILITY_LABELS, availability } from "@/lib/shop-data";

/** Opens the full product editor. */
export function AddProductButton({ variant = "default" }: { variant?: "default" | "outline" }) {
  return (
    <Button size="sm" variant={variant} asChild>
      <Link to="/store/products/new">
        <Plus /> Add Product
      </Link>
    </Button>
  );
}

/** Listed / Hidden / Sold out / Sale ended, from the product's availability settings. */
export function AvailabilityBadge({ product }: { product: Parameters<typeof availability>[0] }) {
  const status = availability(product);
  return (
    <StatusBadge
      status={status === "available" ? "active" : status === "hidden" ? "inactive" : "pending"}
      label={AVAILABILITY_LABELS[status]}
    />
  );
}
