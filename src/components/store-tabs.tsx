import { SubNav } from "@/components/kit";

export function StoreTabs() {
  return (
    // Scrolls sideways on narrow phones rather than widening the page.
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [&>div]:shrink-0 [&>div]:whitespace-nowrap">
      <SubNav
        items={[
          { to: "/store", label: "Overview", exact: true },
          { to: "/store/products", label: "Products" },
          { to: "/store/orders", label: "Orders" },
          { to: "/store/coupons", label: "Coupons" },
          { to: "/store/reports", label: "Reports" },
          { to: "/store/settings", label: "Settings" },
        ]}
      />
    </div>
  );
}
