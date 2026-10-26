import { SubNav } from "@/components/kit";

export function StoreTabs() {
  return (
    <SubNav
      items={[
        { to: "/store", label: "Products", exact: true },
        { to: "/store/orders", label: "Orders" },
      ]}
    />
  );
}
