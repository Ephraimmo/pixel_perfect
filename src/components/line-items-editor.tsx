import { ListPlus, Plus, X } from "lucide-react";
import { Button, Field } from "@/components/kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { money } from "@/lib/demo-data";
import type { Invoice, LineItem } from "@/lib/crm-data";
import { PRICE_LIST } from "@/lib/quotes-data";
import {
  invoiceDiscount,
  invoiceSubtotal,
  invoiceTax,
  invoiceTotal,
  lineTotal,
} from "@/lib/invoices";
import { parseAmount } from "@/lib/quotes";
import { cn } from "@/lib/utils";

/** A line item as typed: numbers stay strings until saved so typing "1." works. */
export interface EditLine {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

/** The money fields shared by quotes and invoices, in editable (string) form. */
export interface PricingFields {
  lines: EditLine[];
  taxRate: string;
  discountKind: "percent" | "amount";
  discountValue: string;
}

type Priced = Pick<Invoice, "items" | "taxRate" | "discount">;

export const newLineId = () => `li-${Math.random().toString(36).slice(2, 8)}`;

export function toPricingFields(doc: Priced): PricingFields {
  return {
    lines: doc.items.map((i) => ({
      id: i.id,
      description: i.description,
      quantity: String(i.quantity),
      unitPrice: String(i.unitPrice),
    })),
    taxRate: String(doc.taxRate),
    discountKind: doc.discount.kind,
    discountValue: String(doc.discount.value),
  };
}

/** Blank discount/tax mean none; anything else must parse (validation flags NaN). */
export function fromPricingFields(f: PricingFields): Priced {
  return {
    items: f.lines.map((l): LineItem => ({
      id: l.id,
      description: l.description,
      quantity: parseAmount(l.quantity),
      unitPrice: parseAmount(l.unitPrice),
    })),
    taxRate: f.taxRate.trim() === "" ? 0 : parseAmount(f.taxRate),
    discount: {
      kind: f.discountKind,
      value: f.discountValue.trim() === "" ? 0 : parseAmount(f.discountValue),
    },
  };
}

export function LineItemsSection({
  value,
  onChange,
  idPrefix,
  itemsError,
  lineError,
  discountError,
  taxError,
  totalsLabel,
}: {
  value: PricingFields;
  onChange: (patch: Partial<PricingFields>) => void;
  idPrefix: string;
  itemsError?: string | undefined;
  lineError?: (id: string) => string | undefined;
  discountError?: string | undefined;
  taxError?: string | undefined;
  totalsLabel: string;
}) {
  const setLine = (id: string, patch: Partial<EditLine>) =>
    onChange({ lines: value.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  return (
    <section className="rounded-lg border bg-card p-4 shadow-soft" aria-label="Line items">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Line items</h2>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" variant="outline" className="h-8 bg-card text-xs">
                <ListPlus /> Price list
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 w-72 overflow-y-auto">
              {PRICE_LIST.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onSelect={() =>
                    onChange({
                      lines: [
                        ...value.lines,
                        {
                          id: newLineId(),
                          description: p.name,
                          quantity: "1",
                          unitPrice: String(p.price),
                        },
                      ],
                    })
                  }
                  className="flex justify-between gap-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{p.name}</span>
                    <span className="text-[11px] text-muted-foreground">{p.unit}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">{money(p.price)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 bg-card text-xs"
            onClick={() =>
              onChange({
                lines: [
                  ...value.lines,
                  { id: newLineId(), description: "", quantity: "1", unitPrice: "" },
                ],
              })
            }
          >
            <Plus /> Add line
          </Button>
        </div>
      </div>
      {itemsError ? <p className="mt-2 text-xs text-destructive">{itemsError}</p> : null}
      {value.lines.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          No items yet — add one from your price list or type your own.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="hidden grid-cols-[minmax(0,1fr)_4.5rem_6.5rem_6rem_2rem] gap-2 px-1 text-[11px] font-medium text-muted-foreground sm:grid">
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Unit price</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          {value.lines.map((l, idx) => {
            const q = parseAmount(l.quantity);
            const p = parseAmount(l.unitPrice);
            const amount =
              Number.isFinite(q) && Number.isFinite(p)
                ? lineTotal({ ...l, quantity: q, unitPrice: p })
                : 0;
            const e = lineError?.(l.id);
            return (
              <div key={l.id}>
                <div className="grid grid-cols-[minmax(0,1fr)_2rem] gap-2 rounded-md border p-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_6.5rem_6rem_2rem] sm:border-0 sm:p-0">
                  <Input
                    aria-label={`Line ${idx + 1} description`}
                    value={l.description}
                    onChange={(ev) => setLine(l.id, { description: ev.target.value })}
                    placeholder="Description"
                    aria-invalid={!!e}
                    className="h-8 text-xs"
                  />
                  <button
                    type="button"
                    aria-label={`Remove line ${idx + 1}`}
                    onClick={() => onChange({ lines: value.lines.filter((x) => x.id !== l.id) })}
                    className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground sm:order-last"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="col-span-2 grid grid-cols-3 gap-2 sm:col-span-1 sm:contents">
                    <Input
                      aria-label={`Line ${idx + 1} quantity`}
                      inputMode="decimal"
                      value={l.quantity}
                      onChange={(ev) => setLine(l.id, { quantity: ev.target.value })}
                      className="h-8 text-right text-xs tabular-nums"
                    />
                    <Input
                      aria-label={`Line ${idx + 1} unit price`}
                      inputMode="decimal"
                      value={l.unitPrice}
                      onChange={(ev) => setLine(l.id, { unitPrice: ev.target.value })}
                      placeholder="0.00"
                      className="h-8 text-right text-xs tabular-nums"
                    />
                    <span className="flex h-8 items-center justify-end text-xs font-medium tabular-nums">
                      {money(amount)}
                    </span>
                  </div>
                </div>
                {e ? <p className="mt-1 px-1 text-xs text-destructive">{e}</p> : null}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-discount`}>Discount</Label>
            <div className="flex gap-2">
              <div
                className="inline-flex shrink-0 rounded-md border p-0.5 text-xs"
                role="group"
                aria-label="Discount type"
              >
                {(["percent", "amount"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={value.discountKind === k}
                    onClick={() => onChange({ discountKind: k })}
                    className={cn(
                      "rounded px-2.5",
                      value.discountKind === k ? "bg-accent font-medium" : "text-muted-foreground",
                    )}
                  >
                    {k === "percent" ? "%" : "$"}
                  </button>
                ))}
              </div>
              <Input
                id={`${idPrefix}-discount`}
                inputMode="decimal"
                value={value.discountValue}
                onChange={(e) => onChange({ discountValue: e.target.value })}
                className="h-8 text-xs"
                aria-invalid={!!discountError}
              />
            </div>
            {discountError ? <p className="text-xs text-destructive">{discountError}</p> : null}
          </div>
          <Field id={`${idPrefix}-tax`} label="Tax rate (%)" error={taxError}>
            <Input
              id={`${idPrefix}-tax`}
              inputMode="decimal"
              value={value.taxRate}
              onChange={(e) => onChange({ taxRate: e.target.value })}
              className="h-8 text-xs"
              aria-invalid={!!taxError}
            />
          </Field>
        </div>
        <TotalsCard doc={fromPricingFields(value)} label={totalsLabel} />
      </div>
    </section>
  );
}

/** Subtotal / discount / tax / total for whatever has been typed so far. */
export function TotalsCard({ doc, label }: { doc: Priced; label: string }) {
  const ok = doc.items.every((i) => Number.isFinite(i.quantity) && Number.isFinite(i.unitPrice));
  const valid = Number.isFinite(doc.discount.value) && Number.isFinite(doc.taxRate);
  const s: Priced = {
    items: ok ? doc.items : [],
    discount: valid ? doc.discount : { kind: "amount", value: 0 },
    taxRate: valid ? doc.taxRate : 0,
  };
  return (
    <dl className="space-y-1.5 self-end rounded-md bg-muted/40 p-3 text-xs" aria-label={label}>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="tabular-nums">{money(invoiceSubtotal(s))}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Discount</dt>
        <dd className="tabular-nums">−{money(invoiceDiscount(s))}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Tax</dt>
        <dd className="tabular-nums">{money(invoiceTax(s))}</dd>
      </div>
      <div className="flex justify-between border-t pt-1.5 text-sm font-semibold">
        <dt>Total</dt>
        <dd className="tabular-nums">{money(invoiceTotal(s))}</dd>
      </div>
      {!ok || !valid ? (
        <p className="text-[11px] text-warning">Some amounts aren't numbers yet.</p>
      ) : null}
    </dl>
  );
}
