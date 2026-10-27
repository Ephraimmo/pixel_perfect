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
import { QuoteStatusBadge } from "@/components/quotes";
import { Input } from "@/components/ui/input";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, formatDate, money, moneyShort } from "@/lib/demo-data";
import type { Quote } from "@/lib/quotes-data";
import { invoiceTotal } from "@/lib/invoices";
import {
  QUOTE_TABS,
  acceptanceRate,
  countQuotes,
  filterQuotes,
  openQuoteValue,
  quoteRecipient,
  validateQuoteSearch,
  type QuoteSearch,
} from "@/lib/quotes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/quotes/")({
  head: () => pageHead("Quotes", "Proposals for clients and leads."),
  validateSearch: validateQuoteSearch,
  component: Quotes,
  errorComponent: ({ reset }) => <PageError title="Couldn't load your quotes" reset={reset} />,
});

type SearchPatch = { [K in keyof QuoteSearch]?: QuoteSearch[K] | undefined };
const COLS = "md:grid md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_6.5rem_6.5rem_6.5rem]";

function Quotes() {
  const { state: demo, ready } = useDemo();
  const { tab = "all", q = "" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const update = (patch: SearchPatch) =>
    void navigate({ search: (prev) => validateQuoteSearch({ ...prev, ...patch }), replace: true });

  const name = (x: Quote) => quoteRecipient(x, demo.clients, demo.leads)?.name ?? "";
  const counts = countQuotes(demo.quotes, DEMO_TODAY);
  const rows = filterQuotes(demo.quotes, name, { tab, q }, DEMO_TODAY);
  const rate = acceptanceRate(demo.quotes);

  let body: ReactNode;
  if (!ready) body = <ListSkeleton label="Loading quotes" />;
  else if (demo.quotes.length === 0)
    body = (
      <EmptyState
        title="No quotes yet"
        description="Send a proposal with line items, a discount and your terms — clients and leads both work."
        action={
          <Button asChild size="sm">
            <Link to="/quotes/new">
              <Plus /> Create your first quote
            </Link>
          </Button>
        }
      />
    );
  else if (rows.length === 0)
    body = (
      <EmptyState
        title={
          q.trim()
            ? `No quotes match “${q.trim()}”`
            : `No ${QUOTE_TABS.find((t) => t.value === tab)?.label.toLowerCase()} quotes`
        }
        description="Search by quote number, title or who it's for."
        action={
          <Button size="sm" variant="outline" onClick={() => update({ q: "", tab: undefined })}>
            Show all quotes
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
          <span>Quote</span>
          <span>For</span>
          <span>Valid until</span>
          <span className="text-right">Total</span>
          <span className="text-right">Status</span>
        </div>
        <ul className="divide-y">
          {rows.map((x) => {
            const to = quoteRecipient(x, demo.clients, demo.leads);
            return (
              <li key={x.id}>
                <Link
                  to="/quotes/$id"
                  params={{ id: x.id }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
                    COLS,
                  )}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{x.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {x.number} · issued {formatDate(x.issueDate)}
                        <span className="md:hidden"> · {to?.name}</span>
                      </span>
                    </span>
                  </span>
                  <span className="hidden min-w-0 text-xs md:block">
                    <span className="block truncate">{to?.name ?? "—"}</span>
                    {to?.kind === "lead" ? (
                      <span className="text-[11px] text-muted-foreground">Lead</span>
                    ) : null}
                  </span>
                  <span className="hidden text-xs text-muted-foreground md:block">
                    {formatDate(x.validUntil)}
                  </span>
                  <span className="text-right text-sm font-semibold tabular-nums">
                    {money(invoiceTotal(x))}
                  </span>
                  <span className="text-right">
                    <QuoteStatusBadge quote={x} />
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
        title="Quotes"
        description={
          ready
            ? `${moneyShort(openQuoteValue(demo.quotes, DEMO_TODAY))} awaiting a reply · ${rate === null ? "no answers yet" : `${rate}% accepted`}`
            : "Proposals for clients and leads."
        }
        actions={
          <Button asChild size="sm">
            <Link to="/quotes/new">
              <Plus /> New Quote
            </Link>
          </Button>
        }
      />
      <TabBar
        value={tab}
        onChange={(t) => update({ tab: t })}
        tabs={QUOTE_TABS.map((t) => ({
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
          placeholder="Search number, title or name..."
          aria-label="Search quotes"
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
