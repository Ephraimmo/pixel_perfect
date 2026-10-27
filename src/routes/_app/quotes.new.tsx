import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { addDays } from "date-fns";
import { PageError, pageHead } from "@/components/kit";
import { QuoteEditor } from "@/components/quote-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, type DemoState } from "@/lib/demo-data";
import { DEFAULT_QUOTE_TERMS, type Quote } from "@/lib/quotes-data";
import { dayKey, fromKey } from "@/lib/calendar";
import { CLIENT_TYPE_LABELS } from "@/lib/clients";
import { nextQuoteNumber } from "@/lib/quotes";

interface NewQuoteSearch {
  client?: string;
  lead?: string;
  project?: string;
}

export const Route = createFileRoute("/_app/quotes/new")({
  head: () => pageHead("New Quote", "Build a proposal with line items and a live preview."),
  // ?client=, ?lead= or ?project= prefill the recipient (e.g. from a lead or project page).
  validateSearch: (raw: Record<string, unknown>): NewQuoteSearch => {
    const out: NewQuoteSearch = {};
    for (const k of ["client", "lead", "project"] as const) {
      const v = raw[k];
      if (typeof v === "string" && /^[\w-]{1,40}$/.test(v)) out[k] = v;
    }
    return out;
  },
  component: NewQuote,
  errorComponent: ({ reset }) => <PageError title="Couldn't open the quote editor" reset={reset} />,
});

function draftFor(demo: DemoState, s: NewQuoteSearch): Quote {
  const project = demo.projects.find((p) => p.id === s.project);
  const lead = demo.leads.find((l) => l.id === s.lead);
  const clientId = project?.clientId ?? demo.clients.find((c) => c.id === s.client)?.id;
  return {
    id: `q-${Date.now().toString(36)}`,
    number: nextQuoteNumber(demo.quotes),
    clientId,
    leadId: clientId ? undefined : lead?.id,
    projectId: project?.id,
    title: project?.name ?? (lead ? `${CLIENT_TYPE_LABELS[lead.type]} photography` : ""),
    issueDate: DEMO_TODAY,
    validUntil: dayKey(addDays(fromKey(DEMO_TODAY), 30)),
    items: [],
    taxRate: 0,
    discount: { kind: "percent", value: 0 },
    message: lead
      ? `Hi ${lead.name.split(" ")[0]}, thanks for getting in touch! Here's what I'd suggest.`
      : "",
    terms: DEFAULT_QUOTE_TERMS,
    status: "draft",
  };
}

function NewQuote() {
  const { state: demo, ready } = useDemo();
  const search = Route.useSearch();
  // Built once the saved demo data has loaded, so numbering and prefills are right.
  const [draft, setDraft] = useState<Quote | null>(null);
  if (ready && !draft) setDraft(draftFor(demo, search));

  if (!draft) {
    return (
      <div
        className="mx-auto max-w-7xl space-y-4"
        aria-busy="true"
        aria-label="Loading quote editor"
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
  return <QuoteEditor initial={draft} isNew />;
}
