import { createFileRoute, Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { FileText, Plus, Search, X } from "lucide-react";
import {
  Button,
  EmptyState,
  ListSkeleton,
  PageError,
  PageHeader,
  TabBar,
  pageHead,
} from "@/components/kit";
import { InvoiceStatusBadge } from "@/components/invoices";
import { Input } from "@/components/ui/input";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, formatDate, money, moneyShort } from "@/lib/demo-data";
import {
  INVOICE_TABS,
  countInvoices,
  daysOverdue,
  filterInvoices,
  invoiceBalance,
  invoiceStats,
  invoiceTotal,
  validateInvoiceSearch,
  type InvoiceSearch,
} from "@/lib/invoices";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/invoices/")({
  head: () => pageHead("Invoices", "Bill clients and track what's been paid."),
  validateSearch: validateInvoiceSearch,
  component: Invoices,
  errorComponent: ({ reset }) => <PageError title="Couldn't load your invoices" reset={reset} />,
});

type SearchPatch = { [K in keyof InvoiceSearch]?: InvoiceSearch[K] | undefined };
const COLS = "md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_7rem_6.5rem_6.5rem_7rem]";

function Invoices() {
  const { state: demo, ready } = useDemo();
  const { tab = "all", q = "" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const update = (patch: SearchPatch) =>
    void navigate({
      search: (prev) => validateInvoiceSearch({ ...prev, ...patch }),
      replace: true,
    });
  const clientName = (id: string) => demo.clients.find((c) => c.id === id)?.name ?? "";
  const counts = countInvoices(demo.invoices, DEMO_TODAY);
  const stats = invoiceStats(demo.invoices, DEMO_TODAY);
  const rows = filterInvoices(demo.invoices, clientName, { tab, q }, DEMO_TODAY);

  let body: ReactNode;
  if (!ready) body = <ListSkeleton label="Loading invoices" />;
  else if (demo.invoices.length === 0)
    body = (
      <EmptyState
        title="No invoices yet"
        description="Create one from scratch or from an accepted quote."
        action={
          <Button asChild size="sm">
            <Link to="/invoices/new">
              <Plus /> Create your first invoice
            </Link>
          </Button>
        }
      />
    );
  else if (rows.length === 0)
    body = (
      <EmptyState
        title={q.trim() ? `No invoices match “${q.trim()}”` : "Nothing here"}
        description={
          tab === "overdue"
            ? "No overdue invoices — nice."
            : "Try another tab, or search by number, client or item."
        }
        action={
          <Button size="sm" variant="outline" onClick={() => update({ q: "", tab: undefined })}>
            Show all invoices
          </Button>
        }
      />
    );
  else
    body = (
      <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
        <div
          className={cn(
            "hidden gap-3 border-b bg-muted/40 px-4 py-2 text-[11px] font-medium text-muted-foreground",
            COLS,
          )}
        >
          <span>Invoice</span>
          <span>Client</span>
          <span>Due</span>
          <span className="text-right">Total</span>
          <span className="text-right">Balance</span>
          <span className="text-right">Status</span>
        </div>
        <ul className="divide-y">
          {rows.map((inv) => {
            const late = daysOverdue(inv, DEMO_TODAY);
            const balance = invoiceBalance(inv);
            return (
              <li key={inv.id}>
                <Link
                  to="/invoices/$id"
                  params={{ id: inv.id }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
                    COLS,
                  )}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{inv.number}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {inv.items[0]?.description ?? "No items"}
                        <span className="md:hidden"> · {clientName(inv.clientId)}</span>
                      </span>
                    </span>
                  </span>
                  <span className="hidden truncate text-xs md:block">
                    {clientName(inv.clientId)}
                  </span>
                  <span
                    className={cn(
                      "hidden text-xs md:block",
                      late ? "font-medium text-rose" : "text-muted-foreground",
                    )}
                  >
                    {formatDate(inv.dueDate)}
                    {late ? <span className="block text-[11px]">{late} days late</span> : null}
                  </span>
                  <span className="hidden text-right text-sm tabular-nums md:block">
                    {money(invoiceTotal(inv))}
                  </span>
                  <span className="text-right text-sm font-semibold tabular-nums">
                    {balance ? money(balance) : "—"}
                  </span>
                  <span className="text-right">
                    <InvoiceStatusBadge invoice={inv} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Invoices"
        description="Bill clients and track what's been paid."
        actions={
          <Button asChild size="sm">
            <Link to="/invoices/new">
              <Plus /> New Invoice
            </Link>
          </Button>
        }
      />
      <dl className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Outstanding"
          value={ready ? moneyShort(stats.outstanding) : "—"}
          sub={ready ? `${stats.outstandingCount} unpaid invoices` : undefined}
        />
        <Stat
          label="Overdue"
          value={ready ? moneyShort(stats.overdue) : "—"}
          sub={ready ? `${stats.overdueCount} past due` : undefined}
          tone={stats.overdueCount ? "rose" : undefined}
        />
        <Stat label="Paid in last 30 days" value={ready ? moneyShort(stats.paidLast30) : "—"} />
      </dl>
      <TabBar
        value={tab}
        onChange={(t) => update({ tab: t })}
        tabs={INVOICE_TABS.map((t) => ({
          value: t.value,
          label: ready ? `${t.label} (${counts[t.value]})` : t.label,
        }))}
      />
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          onChange={(e) => update({ q: e.target.value })}
          onKeyDown={(e) => e.key === "Escape" && update({ q: "" })}
          placeholder="Search number, client or item..."
          aria-label="Search invoices"
          className="h-9 bg-card pl-8 pr-8 text-xs [&::-webkit-search-cancel-button]:hidden"
        />
        {q ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => update({ q: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <div className="mt-4">{body}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: string | undefined;
  tone?: "rose" | undefined;
}) {
  return (
    <div className="rounded-lg border bg-card p-3.5 shadow-soft">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-xl font-semibold tracking-tight tabular-nums",
          tone === "rose" && "text-rose",
        )}
      >
        {value}
      </dd>
      {sub ? <dd className="text-[11px] text-muted-foreground">{sub}</dd> : null}
    </div>
  );
}
