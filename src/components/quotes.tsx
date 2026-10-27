import { format } from "date-fns";
import { Check } from "lucide-react";
import { StatusBadge } from "@/components/kit";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, money } from "@/lib/demo-data";
import type { LineItem } from "@/lib/crm-data";
import type { Quote } from "@/lib/quotes-data";
import { fromKey } from "@/lib/calendar";
import {
  invoiceDiscount,
  invoiceSubtotal,
  invoiceTax,
  invoiceTotal,
  lineTotal,
} from "@/lib/invoices";
import { isOpen } from "@/lib/leads";
import { QUOTE_STATUS_LABELS, quoteDisplayStatus, quoteRecipient } from "@/lib/quotes";
import { cn } from "@/lib/utils";

const QUOTE_TONE: Record<string, string> = {
  draft: "draft",
  sent: "sent",
  accepted: "paid",
  declined: "cancelled",
  expired: "archived",
};

export function QuoteStatusBadge({ quote }: { quote: Quote }) {
  const status = quoteDisplayStatus(quote, DEMO_TODAY);
  return <StatusBadge status={QUOTE_TONE[status] ?? "draft"} label={QUOTE_STATUS_LABELS[status]} />;
}

/** Encode the recipient as "client:<id>" / "lead:<id>" for a single select. */
export const recipientKey = (q: Pick<Quote, "clientId" | "leadId">) =>
  q.clientId ? `client:${q.clientId}` : q.leadId ? `lead:${q.leadId}` : "";

export function RecipientSelect({
  value,
  onChange,
  invalid,
  disabled,
}: {
  value: string;
  onChange: (v: { clientId?: string | undefined; leadId?: string | undefined }) => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const { state: demo } = useDemo();
  const leads = demo.leads.filter((l) => isOpen(l) && !l.clientId);
  const [kind, id] = value.split(":");
  const label =
    kind === "client"
      ? demo.clients.find((c) => c.id === id)?.name
      : demo.leads.find((l) => l.id === id)?.name;
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(v) => {
        const [k, x] = v.split(":");
        onChange(k === "client" ? { clientId: x } : { leadId: x });
      }}
    >
      <SelectTrigger id="qe-recipient" aria-label="Quote for" aria-invalid={invalid}>
        <SelectValue placeholder="Choose a client or lead">
          {label ? (
            <span>
              {label}
              {kind === "lead" ? (
                <span className="ml-1.5 text-xs text-muted-foreground">(lead)</span>
              ) : null}
            </span>
          ) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Clients</SelectLabel>
          {demo.clients.map((c) => (
            <SelectItem key={c.id} value={`client:${c.id}`}>
              {c.name}
            </SelectItem>
          ))}
        </SelectGroup>
        {leads.length ? (
          <SelectGroup>
            <SelectLabel>Open leads</SelectLabel>
            {leads.map((l) => (
              <SelectItem key={l.id} value={`lead:${l.id}`}>
                {l.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : null}
      </SelectContent>
    </Select>
  );
}

/** The quote as the client sees it. Totals use the shared invoice math. */
export function QuoteDocument({ quote: q, className }: { quote: Quote; className?: string }) {
  const { state: demo } = useDemo();
  const to = quoteRecipient(q, demo.clients, demo.leads);
  const status = quoteDisplayStatus(q, DEMO_TODAY);
  const items: LineItem[] = q.items.filter((i) => i.description.trim() || i.unitPrice);
  const safe = {
    ...q,
    items: items.map((i) => ({
      ...i,
      quantity: Number.isFinite(i.quantity) ? i.quantity : 0,
      unitPrice: Number.isFinite(i.unitPrice) ? i.unitPrice : 0,
    })),
  };
  const discount = invoiceDiscount(safe);
  const tax = invoiceTax(safe);
  const date = (d: string) => (d ? format(fromKey(d), "MMM d, yyyy") : "—");

  return (
    <article
      aria-label="Quote preview"
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-soft",
        className,
      )}
    >
      {status === "accepted" || status === "declined" || status === "expired" ? (
        <span
          className={cn(
            "absolute right-5 top-5 rotate-6 rounded border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-widest",
            status === "accepted"
              ? "border-success text-success"
              : "border-muted-foreground/60 text-muted-foreground",
          )}
        >
          {QUOTE_STATUS_LABELS[status]}
        </span>
      ) : null}
      <div className="border-b bg-sand/40 px-6 py-5">
        <p className="display-title text-xl">{demo.profile.studio}</p>
        <p className="text-xs text-muted-foreground">{demo.profile.email}</p>
      </div>
      <div className="space-y-5 px-6 py-5 text-sm">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="eyebrow">Quote for</p>
            <p className="mt-1 font-medium">{to?.name ?? "Choose a recipient"}</p>
            {to?.email ? <p className="text-xs text-muted-foreground">{to.email}</p> : null}
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-xs">
            <dt className="text-muted-foreground">Quote</dt>
            <dd className="text-right font-medium">{q.number}</dd>
            <dt className="text-muted-foreground">Issued</dt>
            <dd className="text-right">{date(q.issueDate)}</dd>
            <dt className="text-muted-foreground">Valid until</dt>
            <dd className="text-right">{date(q.validUntil)}</dd>
          </dl>
        </div>

        <div>
          <h3 className="display-title text-lg">{q.title || "Untitled quote"}</h3>
          {q.message ? (
            <p className="mt-1.5 whitespace-pre-wrap text-muted-foreground">{q.message}</p>
          ) : null}
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-2 font-medium">Description</th>
              <th className="w-12 py-2 text-right font-medium">Qty</th>
              <th className="w-20 py-2 text-right font-medium">Price</th>
              <th className="w-24 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {safe.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-muted-foreground">
                  No line items yet
                </td>
              </tr>
            ) : (
              safe.items.map((i) => (
                <tr key={i.id} className="border-b border-dashed">
                  <td className="py-2 pr-2">
                    {i.description || <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="py-2 text-right tabular-nums">{i.quantity}</td>
                  <td className="py-2 text-right tabular-nums">{money(i.unitPrice)}</td>
                  <td className="py-2 text-right tabular-nums">{money(lineTotal(i))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <dl className="ml-auto w-full max-w-60 space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{money(invoiceSubtotal(safe))}</dd>
          </div>
          {discount ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Discount{q.discount.kind === "percent" ? ` (${q.discount.value}%)` : ""}
              </dt>
              <dd className="tabular-nums">−{money(discount)}</dd>
            </div>
          ) : null}
          {q.taxRate ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tax ({q.taxRate}%)</dt>
              <dd className="tabular-nums">{money(tax)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t pt-1.5 text-sm font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(invoiceTotal(safe))}</dd>
          </div>
        </dl>

        {q.terms ? (
          <div className="rounded-md bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Terms</p>
            <p className="whitespace-pre-wrap">{q.terms}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <p className="text-[11px] text-muted-foreground">Client view · demo preview</p>
          <span
            aria-hidden
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground opacity-80"
          >
            <Check className="h-3.5 w-3.5" /> Accept quote
          </span>
        </div>
      </div>
    </article>
  );
}
