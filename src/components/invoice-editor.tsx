import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ban,
  BellRing,
  CircleCheck,
  Copy,
  CreditCard,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button, Field, Panel } from "@/components/kit";
import { InvoiceDocument, InvoiceStatusBadge, RecordPaymentDialog } from "@/components/invoices";
import {
  LineItemsSection,
  fromPricingFields,
  newLineId,
  toPricingFields,
  type PricingFields,
} from "@/components/line-items-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, formatDate, money } from "@/lib/demo-data";
import type { Invoice } from "@/lib/crm-data";
import {
  PAYMENT_TERMS,
  addDaysIso,
  daysOverdue,
  invoiceBalance,
  invoiceDisplayStatus,
  invoiceTotal,
  nextInvoiceNumber,
  validateInvoice,
} from "@/lib/invoices";
import { cn } from "@/lib/utils";

type EditState = Omit<Invoice, "items" | "taxRate" | "discount"> & PricingFields;

const toEdit = (inv: Invoice): EditState => {
  const { items, taxRate, discount, ...rest } = inv;
  return { ...rest, ...toPricingFields({ items, taxRate, discount }) };
};
const toInvoice = (e: EditState): Invoice => {
  const { lines, taxRate, discountKind, discountValue, ...rest } = e;
  return { ...rest, ...fromPricingFields({ lines, taxRate, discountKind, discountValue }) };
};

/** Draft editor with live preview; sent invoices show the document and payment actions. */
export function InvoiceEditor({ initial, isNew }: { initial: Invoice; isNew: boolean }) {
  const { state: demo, saveInvoice, sendInvoice, deleteInvoice, restoreInvoice } = useDemo();
  const goTo = useNavigate();
  const [form, setForm] = useState<EditState>(() => toEdit(initial));
  const [attempted, setAttempted] = useState(false);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const set = (patch: Partial<EditState>) => setForm((f) => ({ ...f, ...patch }));

  const editable = isNew || initial.status === "draft";
  const invoice = toInvoice(form);
  const [synced, setSynced] = useState(initial);
  const dirty = isNew || JSON.stringify(invoice) !== JSON.stringify(toInvoice(toEdit(synced)));
  if (!dirty && initial !== synced) {
    setSynced(initial);
    setForm(toEdit(initial));
  }

  const errors = validateInvoice(invoice);
  const shown = attempted ? errors : {};
  const client = demo.clients.find((c) => c.id === invoice.clientId);
  const projects = demo.projects.filter((p) => p.clientId === invoice.clientId);

  const persist = (inv: Invoice) => {
    saveInvoice(inv);
    setSynced(inv);
    if (isNew) void goTo({ to: "/invoices/$id", params: { id: inv.id }, replace: true });
  };
  const save = () => {
    setAttempted(true);
    if (!invoice.clientId) {
      toast.error("Choose a client before saving.");
      return;
    }
    persist(invoice);
    toast.success(isNew ? `${invoice.number} saved as a draft` : "Invoice saved");
  };
  const send = () => {
    setAttempted(true);
    if (Object.keys(errors).length) {
      toast.error("Fix the highlighted fields before sending.");
      return;
    }
    persist({ ...invoice, status: "draft" });
    sendInvoice(invoice.id);
    toast.success(`${invoice.number} sent to ${client?.name}`, {
      description: "Demo — no email is sent.",
    });
  };

  if (!editable) return <IssuedInvoice invoice={initial} />;

  return (
    <div className="mx-auto max-w-7xl">
      <BackLink />
      <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="display-title text-2xl">{isNew ? "New invoice" : invoice.number}</h1>
          {!isNew ? <InvoiceStatusBadge invoice={initial} /> : null}
          {dirty && !isNew ? <span className="text-xs text-warning">Unsaved changes</span> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                deleteInvoice(initial.id);
                void goTo({ to: "/invoices" });
                toast("Draft deleted", {
                  action: { label: "Undo", onClick: () => restoreInvoice(initial) },
                });
              }}
            >
              <Trash2 /> Delete
            </Button>
          ) : null}
          <Button size="sm" variant="outline" className="bg-card" onClick={save} disabled={!dirty}>
            {isNew ? "Save draft" : dirty ? "Save changes" : "Saved"}
          </Button>
          <Button size="sm" onClick={send}>
            <Send /> Send invoice
          </Button>
        </div>
      </div>

      <div
        className="mb-3 inline-flex rounded-md border bg-card p-0.5 text-xs lg:hidden"
        role="group"
        aria-label="Editor view"
      >
        {(["edit", "preview"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={cn(
              "rounded px-3 py-1 capitalize",
              view === v ? "bg-accent font-medium" : "text-muted-foreground",
            )}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className={cn("min-w-0 space-y-5", view === "preview" && "max-lg:hidden")}
        >
          <section className="space-y-4 rounded-lg border bg-card p-4 shadow-soft">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>
                  Client <span className="text-muted-foreground">*</span>
                </Label>
                <Select
                  value={form.clientId}
                  onValueChange={(v) => set({ clientId: v, projectId: undefined })}
                >
                  <SelectTrigger aria-label="Client" aria-invalid={!!shown.clientId}>
                    <SelectValue placeholder="Choose a client">{client?.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {demo.clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {shown.clientId ? (
                  <p className="text-xs text-destructive">{shown.clientId}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label>Project</Label>
                <Select
                  value={form.projectId ?? "none"}
                  disabled={!form.clientId || projects.length === 0}
                  onValueChange={(v) => set({ projectId: v === "none" ? undefined : v })}
                >
                  <SelectTrigger aria-label="Project">
                    <SelectValue>
                      {projects.find((p) => p.id === form.projectId)?.name ??
                        (projects.length ? "No project" : "—")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field id="ie-issue" label="Issue date">
                <Input
                  id="ie-issue"
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => set({ issueDate: e.target.value })}
                />
              </Field>
              <Field id="ie-due" label="Due date" required error={shown.dueDate}>
                <Input
                  id="ie-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set({ dueDate: e.target.value })}
                  aria-invalid={!!shown.dueDate}
                />
              </Field>
            </div>
            <div
              className="flex flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Payment terms"
            >
              <span className="text-xs text-muted-foreground">Terms:</span>
              {PAYMENT_TERMS.map((t) => {
                const due = addDaysIso(form.issueDate || DEMO_TODAY, t.days);
                return (
                  <button
                    key={t.label}
                    type="button"
                    aria-pressed={form.dueDate === due}
                    onClick={() => set({ dueDate: due })}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px]",
                      form.dueDate === due
                        ? "border-foreground bg-accent font-medium"
                        : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </section>

          <LineItemsSection
            value={form}
            onChange={set}
            idPrefix="ie"
            itemsError={shown.items}
            lineError={(id) => shown.lines?.[id]}
            discountError={shown.discount}
            taxError={shown.taxRate}
            totalsLabel="Invoice totals"
          />

          <section className="rounded-lg border bg-card p-4 shadow-soft">
            <Field id="ie-notes" label="Notes to client">
              <Textarea
                id="ie-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => set({ notes: e.target.value })}
                placeholder="e.g. Thank you for your business!"
              />
            </Field>
          </section>
        </form>
        <div
          className={cn(
            "min-w-0 lg:sticky lg:top-20 lg:self-start",
            view === "edit" && "max-lg:hidden",
          )}
        >
          <p className="eyebrow mb-2">Client preview</p>
          <InvoiceDocument invoice={invoice} />
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/invoices"
      className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Invoices
    </Link>
  );
}

/** A sent, paid or void invoice: the document plus payment actions. */
function IssuedInvoice({ invoice: inv }: { invoice: Invoice }) {
  const {
    state: demo,
    markInvoicePaid,
    remindInvoice,
    voidInvoice,
    revertInvoiceToDraft,
    saveInvoice,
  } = useDemo();
  const goTo = useNavigate();
  const [paying, setPaying] = useState(false);
  const client = demo.clients.find((c) => c.id === inv.clientId);
  const project = demo.projects.find((p) => p.id === inv.projectId);
  const status = invoiceDisplayStatus(inv, DEMO_TODAY);
  const balance = invoiceBalance(inv);
  const late = daysOverdue(inv, DEMO_TODAY);
  const open = status === "sent" || status === "partial" || status === "overdue";

  const duplicate = () => {
    const copy: Invoice = {
      ...inv,
      id: `inv-${Date.now().toString(36)}`,
      number: nextInvoiceNumber(demo.invoices),
      status: "draft",
      issueDate: DEMO_TODAY,
      dueDate: addDaysIso(DEMO_TODAY, 14),
      amountPaid: 0,
      payments: [],
      paidDate: undefined,
      remindedAt: undefined,
      items: inv.items.map((i) => ({ ...i, id: newLineId() })),
    };
    saveInvoice(copy);
    toast.success(`Duplicated as ${copy.number}`);
    void goTo({ to: "/invoices/$id", params: { id: copy.id } });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink />
      <div className="flex flex-col gap-1 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="display-title text-2xl">{inv.number}</h1>
          <InvoiceStatusBadge invoice={inv} />
        </div>
        <p className="text-sm text-muted-foreground">
          {client ? (
            <Link
              to="/clients/$id"
              params={{ id: client.id }}
              search={{ tab: "invoices" }}
              className="hover:underline"
            >
              {client.name}
            </Link>
          ) : null}
          {project ? (
            <>
              {" · "}
              <Link to="/projects/$id" params={{ id: project.id }} className="hover:underline">
                {project.name}
              </Link>
            </>
          ) : null}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <InvoiceDocument invoice={inv} />
        <aside className="space-y-4">
          <Panel className="p-4">
            <h2 className="text-sm font-semibold">Payment</h2>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="tabular-nums">{money(invoiceTotal(inv))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="tabular-nums">{money(inv.amountPaid)}</dd>
              </div>
              <div className="flex justify-between border-t pt-1.5 text-sm font-semibold">
                <dt>Balance</dt>
                <dd className="tabular-nums">{money(balance)}</dd>
              </div>
            </dl>
            {late ? (
              <p className="mt-2 text-xs font-medium text-rose">
                {late} {late === 1 ? "day" : "days"} overdue (due {formatDate(inv.dueDate)})
              </p>
            ) : open ? (
              <p className="mt-2 text-xs text-muted-foreground">Due {formatDate(inv.dueDate)}</p>
            ) : null}
            {inv.remindedAt ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Last reminder {formatDate(inv.remindedAt.slice(0, 10))}
              </p>
            ) : null}
          </Panel>

          {open ? (
            <Panel className="space-y-2 p-4">
              <Button size="sm" className="w-full justify-start" onClick={() => setPaying(true)}>
                <CreditCard /> Record payment
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start bg-card"
                onClick={() => {
                  markInvoicePaid(inv.id);
                  toast.success(`${inv.number} marked paid in full`);
                }}
              >
                <CircleCheck /> Mark paid in full
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start bg-card"
                onClick={() => {
                  remindInvoice(inv.id);
                  toast.success(`Reminder sent to ${client?.name}`, {
                    description: "Demo — no email is sent.",
                  });
                }}
              >
                <BellRing /> Send reminder
              </Button>
              {!inv.payments?.length && !inv.amountPaid ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    revertInvoiceToDraft(inv.id);
                    toast("Back to draft so you can edit it");
                  }}
                >
                  <RotateCcw /> Edit (back to draft)
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  voidInvoice(inv.id);
                  toast("Invoice voided");
                }}
              >
                <Ban /> Void invoice
              </Button>
            </Panel>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start bg-card"
            onClick={duplicate}
          >
            <Copy /> Duplicate as new draft
          </Button>
        </aside>
      </div>
      <RecordPaymentDialog invoice={inv} open={paying} onOpenChange={setPaying} />
    </div>
  );
}
