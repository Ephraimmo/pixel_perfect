import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, EmptyState, PageError, pageHead } from "@/components/kit";
import { InvoiceEditor } from "@/components/invoice-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemo } from "@/lib/store";

export const Route = createFileRoute("/_app/invoices/$id")({
  head: () => pageHead("Invoice", "Edit, send and record payments."),
  component: InvoicePage,
  errorComponent: ({ reset }) => <PageError title="Couldn't load this invoice" reset={reset} />,
});

function InvoicePage() {
  const { id } = Route.useParams();
  const { state: demo, ready } = useDemo();
  const invoice = demo.invoices.find((i) => i.id === id);
  if (!ready)
    return (
      <div
        className="mx-auto max-w-7xl space-y-4"
        aria-busy="true"
        aria-label="Loading invoice"
        role="status"
      >
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  if (!invoice)
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="Invoice not found"
          description="It may have been deleted, or the link is incomplete."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/invoices">View all invoices</Link>
            </Button>
          }
        />
      </div>
    );
  // Keyed so switching invoices (e.g. after Duplicate) starts a fresh editor.
  return <InvoiceEditor key={invoice.id} initial={invoice} isNew={false} />;
}
