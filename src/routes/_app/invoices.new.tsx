import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageError, pageHead } from "@/components/kit";
import { InvoiceEditor } from "@/components/invoice-editor";
import { newLineId } from "@/components/line-items-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, type DemoState } from "@/lib/demo-data";
import type { Invoice } from "@/lib/crm-data";
import { addDaysIso, nextInvoiceNumber } from "@/lib/invoices";

interface NewInvoiceSearch {
  client?: string;
  project?: string;
  quote?: string;
}

export const Route = createFileRoute("/_app/invoices/new")({
  head: () => pageHead("New Invoice", "Create an invoice with tax, discounts and due dates."),
  // ?client=, ?project= or ?quote= (an accepted quote's items) prefill the invoice.
  validateSearch: (raw: Record<string, unknown>): NewInvoiceSearch => {
    const out: NewInvoiceSearch = {};
    for (const k of ["client", "project", "quote"] as const) {
      const v = raw[k];
      if (typeof v === "string" && /^[\w-]{1,40}$/.test(v)) out[k] = v;
    }
    return out;
  },
  component: NewInvoice,
  errorComponent: ({ reset }) => (
    <PageError title="Couldn't open the invoice editor" reset={reset} />
  ),
});

function draftFor(demo: DemoState, s: NewInvoiceSearch): Invoice {
  const quote = demo.quotes.find((q) => q.id === s.quote && q.clientId);
  const project = demo.projects.find((p) => p.id === (quote?.projectId ?? s.project));
  const clientId =
    quote?.clientId ?? project?.clientId ?? demo.clients.find((c) => c.id === s.client)?.id ?? "";
  return {
    id: `inv-${Date.now().toString(36)}`,
    number: nextInvoiceNumber(demo.invoices),
    clientId,
    projectId: project?.id,
    issueDate: DEMO_TODAY,
    dueDate: addDaysIso(DEMO_TODAY, 14),
    items: quote ? quote.items.map((i) => ({ ...i, id: newLineId() })) : [],
    taxRate: quote?.taxRate ?? 0,
    discount: quote ? { ...quote.discount } : { kind: "percent", value: 0 },
    amountPaid: 0,
    status: "draft",
    notes: quote ? `As per accepted quote ${quote.number}.` : "",
    payments: [],
  };
}

function NewInvoice() {
  const { state: demo, ready } = useDemo();
  const search = Route.useSearch();
  const [draft, setDraft] = useState<Invoice | null>(null);
  if (ready && !draft) setDraft(draftFor(demo, search));
  if (!draft)
    return (
      <div
        className="mx-auto max-w-7xl space-y-4"
        aria-busy="true"
        aria-label="Loading invoice editor"
        role="status"
      >
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_28rem]">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  return <InvoiceEditor initial={draft} isNew />;
}
