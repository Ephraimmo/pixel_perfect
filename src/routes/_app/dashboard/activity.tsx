import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarRange,
  CreditCard,
  DollarSign,
  Image,
  MessageSquare,
  Settings,
  ShoppingBag,
  UserPlus,
} from "lucide-react";
import { pageHead, PageHeader, SectionCard } from "@/components/kit";
import { useDemo } from "@/lib/store";

export const Route = createFileRoute("/_app/dashboard/activity")({
  head: () => pageHead("Activity", "Everything that has happened in your workspace recently"),
  component: Activity,
});

const kindIcons = {
  gallery: Image,
  client: UserPlus,
  order: ShoppingBag,
  invoice: DollarSign,
  lead: MessageSquare,
  session: CalendarRange,
  system: Settings,
} as const;

const kindLabels = {
  gallery: "Galleries",
  client: "Clients",
  order: "Store",
  invoice: "Billing",
  lead: "Leads",
  session: "Sessions",
  system: "System",
} as const;

function Activity() {
  const { state: demo } = useDemo();

  const grouped = Object.entries(kindLabels).map(([kind, label]) => ({
    kind: kind as keyof typeof kindLabels,
    label,
    items: demo.activity.filter((a) => a.kind === kind),
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Overview"
        title="Activity"
        description="A running log of what happened in your demo workspace. Reset demo data from the account menu to start fresh."
      />
      <div className="space-y-6">
        {grouped.map(({ kind, label, items }) => {
          const Icon = kindIcons[kind];
          return (
            <SectionCard key={kind} title={label} contentClassName="p-0">
              {items.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground">No {label.toLowerCase()} activity yet.</p>
              ) : (
                <ul className="divide-y">
                  {items.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <p className="min-w-0 flex-1 text-sm">{a.message}</p>
                      <p className="shrink-0 text-xs text-muted-foreground">
                        {new Date(a.time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          );
        })}
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5" />
          This log is demo state stored in your browser — nothing here reaches a server.
        </p>
      </div>
    </div>
  );
}
