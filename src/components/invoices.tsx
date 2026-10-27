import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button, Field, StatusBadge } from "@/components/kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, money } from "@/lib/demo-data";
import type { Invoice, PaymentMethod } from "@/lib/crm-data";
import { fromKey } from "@/lib/calendar";
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  invoiceBalance,
  invoiceDiscount,
  invoiceDisplayStatus,
  invoiceSubtotal,
  invoiceTax,
  invoiceTotal,
  lineTotal,
  validatePayment,
} from "@/lib/invoices";
import { parseAmount } from "@/lib/quotes";
import { cn } from "@/lib/utils";

export function InvoiceStatusBadge({ invoice }: { invoice: Invoice }) {
  const s = invoiceDisplayStatus(invoice, DEMO_TODAY);
  return <StatusBadge status={s} label={INVOICE_STATUS_LABELS[s]} />;
}

const date = (d: string | undefined) => (d ? format(fromKey(d.slice(0, 10)), "MMM d, yyyy") : "—");

/** The invoice as the client sees it. */
export function InvoiceDocument({
  invoice: inv,
  className,
}: {
  invoice: Invoice;
  className?: string;
}) {
  const { state: demo } = useDemo();
  const client = demo.clients.find((c) => c.id === inv.clientId);
  const status = invoiceDisplayStatus(inv, DEMO_TODAY);
  const items = inv.items.map((i) => ({
    ...i,
    quantity: Number.isFinite(i.quantity) ? i.quantity : 0,
    unitPrice: Number.isFinite(i.unitPrice) ? i.unitPrice : 0,
  }));
  const safe = {
    ...inv,
    items,
    taxRate: Number.isFinite(inv.taxRate) ? inv.taxRate : 0,
    discount: Number.isFinite(inv.discount.value)
      ? inv.discount
      : { kind: "amount" as const, value: 0 },
  };
  const total = invoiceTotal(safe);
  const discount = invoiceDiscount(safe);
  const tax = invoiceTax(safe);
  const balance = inv.status === "draft" ? total : invoiceBalance(safe);
  const stamp =
    status === "paid"
      ? "Paid"
      : status === "void"
        ? "Void"
        : status === "overdue"
          ? "Overdue"
          : null;

  return (
    <article
      aria-label="Invoice preview"
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-soft",
        className,
      )}
    >
      {stamp ? (
        <span
          className={cn(
            "absolute right-5 top-5 rotate-6 rounded border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-widest",
            stamp === "Paid"
              ? "border-success text-success"
              : stamp === "Overdue"
                ? "border-rose text-rose"
                : "border-muted-foreground/60 text-muted-foreground",
          )}
        >
          {stamp}
        </span>
      ) : null}
      <div className="border-b bg-sand/40 px-6 py-5">
        <p className="display-title text-xl">{demo.profile.studio}</p>
        <p className="text-xs text-muted-foreground">{demo.profile.email}</p>
      </div>
      <div className="space-y-5 px-6 py-5 text-sm">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="eyebrow">Bill to</p>
            <p className="mt-1 font-medium">{client?.name ?? "Choose a client"}</p>
            {client ? (
              <p className="text-xs text-muted-foreground">
                {[client.company, client.email].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-xs">
            <dt className="text-muted-foreground">Invoice</dt>
            <dd className="text-right font-medium">{inv.number}</dd>
            <dt className="text-muted-foreground">Issued</dt>
            <dd className="text-right">{date(inv.issueDate)}</dd>
            <dt className="text-muted-foreground">Due</dt>
            <dd className={cn("text-right", status === "overdue" && "font-semibold text-rose")}>
              {date(inv.dueDate)}
            </dd>
          </dl>
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
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-muted-foreground">
                  No line items yet
                </td>
              </tr>
            ) : (
              items.map((i) => (
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

        <dl className="ml-auto w-full max-w-64 space-y-1 text-xs">
          <Row label="Subtotal" value={money(invoiceSubtotal(safe))} />
          {discount ? (
            <Row
              label={`Discount${safe.discount.kind === "percent" ? ` (${safe.discount.value}%)` : ""}`}
              value={`−${money(discount)}`}
            />
          ) : null}
          {safe.taxRate ? <Row label={`Tax (${safe.taxRate}%)`} value={money(tax)} /> : null}
          <div className="flex justify-between border-t pt-1.5 text-sm font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(total)}</dd>
          </div>
          {inv.amountPaid ? <Row label="Paid" value={`−${money(inv.amountPaid)}`} /> : null}
          {inv.status !== "void" ? (
            <div className="flex justify-between rounded bg-muted/60 px-2 py-1.5 text-sm font-semibold">
              <dt>Amount due</dt>
              <dd className="tabular-nums">{money(balance)}</dd>
            </div>
          ) : null}
        </dl>

        {inv.payments?.length ? (
          <div>
            <p className="eyebrow mb-1.5">Payments received</p>
            <ul className="space-y-1 text-xs">
              {inv.payments.map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    {date(p.date)} · {PAYMENT_METHOD_LABELS[p.method]}
                    {p.note ? ` · ${p.note}` : ""}
                  </span>
                  <span className="tabular-nums">{money(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {inv.notes ? (
          <p className="whitespace-pre-wrap text-xs text-muted-foreground">{inv.notes}</p>
        ) : null}
        <div className="rounded-md bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <p className="mb-0.5 font-semibold text-foreground">How to pay</p>
          Card via the payment link in your email, or EFT to {demo.profile.studio} using reference{" "}
          <span className="font-medium text-foreground">{inv.number}</span>. Demo — no real payment
          details.
        </div>
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

export function RecordPaymentDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { recordPayment } = useDemo();
  const balance = invoiceBalance(invoice);
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(DEMO_TODAY);
  const [method, setMethod] = useState<PaymentMethod>("eft");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setAmount(balance.toFixed(2));
      setPaidOn(DEMO_TODAY);
      setMethod("eft");
      setNote("");
      setSubmitted(false);
    }
  }
  const value = parseAmount(amount);
  const error = validatePayment(value, invoice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
            if (error || !paidOn) return;
            recordPayment(invoice.id, { amount: value, date: paidOn, method, note: note.trim() });
            const rest = Math.round((balance - value) * 100) / 100;
            toast.success(
              rest > 0
                ? `${money(value)} recorded — ${money(rest)} still due`
                : `${invoice.number} paid in full`,
            );
            onOpenChange(false);
          }}
        >
          <DialogHeader>
            <DialogTitle className="display-title text-xl">Record a payment</DialogTitle>
            <DialogDescription>
              {invoice.number} · {money(balance)} outstanding. Part-payments are fine.
            </DialogDescription>
          </DialogHeader>
          <Field id="rp-amount" label="Amount ($)" required error={submitted ? error : undefined}>
            <Input
              id="rp-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={submitted && !!error}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="rp-date" label="Paid on">
              <Input
                id="rp-date"
                type="date"
                value={paidOn}
                max={DEMO_TODAY}
                onChange={(e) => setPaidOn(e.target.value)}
              />
            </Field>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger aria-label="Payment method">
                  <SelectValue>{PAYMENT_METHOD_LABELS[method]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Field id="rp-note" label="Note">
            <Input
              id="rp-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Deposit"
            />
          </Field>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Record payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
