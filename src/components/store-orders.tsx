import { StatusBadge } from "@/components/kit";
import { ORDER_STATUS_LABELS, type ShopOrderStatus } from "@/lib/shop-data";

// Map order statuses onto the kit's badge tones.
const TONE: Record<ShopOrderStatus, string> = {
  pending: "pending",
  paid: "paid",
  processing: "processing",
  shipped: "shipped",
  delivered: "active",
  cancelled: "archived",
};

export function OrderStatusBadge({ status }: { status: ShopOrderStatus }) {
  return <StatusBadge status={TONE[status]} label={ORDER_STATUS_LABELS[status]} />;
}
