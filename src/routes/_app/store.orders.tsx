import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, StatusBadge, TabBar, pageHead } from "@/components/kit";
import { StoreTabs } from "@/components/store-tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDemo } from "@/lib/store";
import { formatDate, money, type OrderStatus } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/store/orders")({
  head: () => pageHead("Orders", "Store orders from your clients."),
  component: Orders,
});

const STATUSES: OrderStatus[] = ["pending", "processing", "paid", "shipped"];

function Orders() {
  const { state: demo, updateOrderStatus } = useDemo();
  const [tab, setTab] = useState<"all" | OrderStatus>("all");
  const rows = demo.orders.filter((o) => tab === "all" || o.status === tab);
  const total = rows.reduce((s, o) => s + o.total, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <StoreTabs />
      <PageHeader title="Orders" description={`${rows.length} orders · ${money(total)}`} />

      <TabBar
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "all" as const, label: "All" },
          ...STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
        ]}
      />

      <Panel className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead className="border-b text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Order #</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-accent/40">
                <td className="px-4 py-3 font-medium">{o.number}</td>
                <td className="px-4 py-3">{o.customer}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(o.date)}</td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex items-center gap-1 rounded"
                      aria-label={`Change status of ${o.number}`}
                    >
                      <StatusBadge status={o.status} />
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel className="text-xs">Update status</DropdownMenuLabel>
                      {STATUSES.map((s) => (
                        <DropdownMenuItem
                          key={s}
                          disabled={s === o.status}
                          className="capitalize"
                          onSelect={() => {
                            updateOrderStatus(o.id, s);
                            toast.success(`${o.number} marked ${s}`);
                          }}
                        >
                          {s}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
                <td className="px-4 py-3 text-right font-medium">{money(o.total)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No {tab} orders.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
