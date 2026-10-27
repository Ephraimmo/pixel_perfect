import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, EmptyState, PageError, pageHead } from "@/components/kit";
import { QuoteEditor } from "@/components/quote-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemo } from "@/lib/store";

export const Route = createFileRoute("/_app/quotes/$id")({
  head: () => pageHead("Quote", "Edit, preview and send this quote."),
  component: QuotePage,
  errorComponent: ({ reset }) => <PageError title="Couldn't load this quote" reset={reset} />,
});

function QuotePage() {
  const { id } = Route.useParams();
  const { state: demo, ready } = useDemo();
  const quote = demo.quotes.find((q) => q.id === id);

  if (!ready) {
    return (
      <div
        className="mx-auto max-w-7xl space-y-4"
        aria-busy="true"
        aria-label="Loading quote"
        role="status"
      >
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_28rem]">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }
  if (!quote) {
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="Quote not found"
          description="It may have been deleted, or the link is incomplete."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/quotes">View all quotes</Link>
            </Button>
          }
        />
      </div>
    );
  }
  // Keyed so switching between quotes (e.g. after Duplicate) starts a fresh editor.
  return <QuoteEditor key={quote.id} initial={quote} isNew={false} />;
}
