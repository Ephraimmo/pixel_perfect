import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { addDays } from "date-fns";
import {
  ArrowLeft,
  Receipt,
  Check,
  Copy,
  MoreHorizontal,
  RotateCcw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button, Field } from "@/components/kit";
import {
  LineItemsSection,
  fromPricingFields,
  newLineId,
  toPricingFields,
  type PricingFields,
} from "@/components/line-items-editor";
import {
  QuoteDocument,
  QuoteStatusBadge,
  RecipientSelect,
  recipientKey,
} from "@/components/quotes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { DEMO_TODAY } from "@/lib/demo-data";
import { type Quote } from "@/lib/quotes-data";
import { dayKey, fromKey } from "@/lib/calendar";
import {
  hasQuoteErrors,
  isQuoteLocked,
  nextQuoteNumber,
  quoteDisplayStatus,
  quoteRecipient,
  validateQuote,
} from "@/lib/quotes";
import { cn } from "@/lib/utils";

type EditState = Omit<Quote, "items" | "taxRate" | "discount"> & PricingFields;

const toEdit = (q: Quote): EditState => {
  const { items, taxRate, discount, ...rest } = q;
  return { ...rest, ...toPricingFields({ items, taxRate, discount }) };
};

const toQuote = (e: EditState): Quote => {
  const { lines, taxRate, discountKind, discountValue, ...rest } = e;
  return { ...rest, ...fromPricingFields({ lines, taxRate, discountKind, discountValue }) };
};

/** Editor + live client preview for a quote (new or saved). */
export function QuoteEditor({ initial, isNew }: { initial: Quote; isNew: boolean }) {
  const { state: demo, saveQuote, setQuoteStatus, deleteQuote, restoreQuote } = useDemo();
  const goTo = useNavigate();
  const [form, setForm] = useState<EditState>(() => toEdit(initial));
  const [attempt, setAttempt] = useState<"save" | "send" | null>(null);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const set = (patch: Partial<EditState>) => setForm((f) => ({ ...f, ...patch }));

  // Re-sync when the stored quote changes (status actions, undo) and nothing is being edited.
  const [synced, setSynced] = useState(initial);
  const quote = toQuote(form);
  // Normalise both sides through the same conversion so key order and absent keys don't count.
  const dirty = isNew || JSON.stringify(quote) !== JSON.stringify(toQuote(toEdit(synced)));
  if (!dirty && initial !== synced) {
    setSynced(initial);
    setForm(toEdit(initial));
  } else if (dirty && initial.status !== synced.status) {
    setSynced(initial);
    set({ status: initial.status, respondedAt: initial.respondedAt });
  }

  const errors = validateQuote(quote);
  const draftErrors = { recipient: errors.recipient, title: errors.title };
  const shown = attempt === "send" ? errors : attempt === "save" ? draftErrors : {};
  const locked = isQuoteLocked(initial) && !isNew;
  const status = quoteDisplayStatus(initial, DEMO_TODAY);
  const recipient = quoteRecipient(quote, demo.clients, demo.leads);
  const projects = demo.projects.filter((p) => p.clientId === quote.clientId);

  const persist = (q: Quote) => {
    saveQuote(q);
    setSynced(q);
    if (isNew) void goTo({ to: "/quotes/$id", params: { id: q.id }, replace: true });
  };

  const save = () => {
    setAttempt("save");
    if (draftErrors.recipient || draftErrors.title) return;
    persist(quote);
    toast.success(isNew ? `${quote.number} saved as a draft` : "Quote saved");
  };

  const send = () => {
    setAttempt("send");
    if (hasQuoteErrors(errors)) {
      toast.error("Fix the highlighted fields before sending.");
      return;
    }
    if (quote.validUntil < DEMO_TODAY) {
      toast.error("The valid-until date has passed — extend it before sending.");
      return;
    }
    persist({ ...quote, status: "draft" });
    setQuoteStatus(quote.id, "sent");
    toast.success(`${quote.number} sent to ${recipient?.name ?? "the client"}`, {
      description: quote.leadId
        ? "Lead moved to Proposal sent. Demo — no email is sent."
        : "Demo — no email is sent.",
    });
  };

  const duplicate = () => {
    const copy: Quote = {
      ...quote,
      id: `q-${Date.now().toString(36)}`,
      number: nextQuoteNumber(demo.quotes),
      status: "draft",
      respondedAt: undefined,
      issueDate: DEMO_TODAY,
      validUntil: dayKey(addDays(fromKey(DEMO_TODAY), 30)),
      items: quote.items.map((i) => ({ ...i, id: newLineId() })),
    };
    saveQuote(copy);
    toast.success(`Duplicated as ${copy.number}`);
    void goTo({ to: "/quotes/$id", params: { id: copy.id } });
  };

  const remove = () => {
    deleteQuote(initial.id);
    void goTo({ to: "/quotes" });
    toast("Quote deleted", {
      description: initial.number,
      action: { label: "Undo", onClick: () => restoreQuote(initial) },
    });
  };

  const err = (k: keyof typeof errors) =>
    (shown as Record<string, unknown>)[k] as string | undefined;
  const lineErr = (id: string) => (attempt === "send" ? errors.lines?.[id] : undefined);

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {locked ? (
        <>
          {initial.status === "accepted" && initial.clientId ? (
            <Button asChild size="sm">
              <Link to="/invoices/new" search={{ quote: initial.id }}>
                <Receipt /> Create invoice
              </Link>
            </Button>
          ) : null}
          <Button size="sm" variant="outline" className="bg-card" onClick={duplicate}>
            <Copy /> Duplicate
          </Button>
        </>
      ) : (
        <>
          {!isNew && initial.status === "sent" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="bg-card"
                onClick={() => {
                  setQuoteStatus(initial.id, "accepted");
                  toast.success(`${initial.number} marked accepted`);
                }}
              >
                <Check /> Accepted
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-card"
                onClick={() => {
                  setQuoteStatus(initial.id, "declined");
                  toast(`${initial.number} marked declined`);
                }}
              >
                <X /> Declined
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="outline" className="bg-card" onClick={save} disabled={!dirty}>
            {isNew ? "Save draft" : dirty ? "Save changes" : "Saved"}
          </Button>
          {initial.status === "draft" || isNew || status === "expired" ? (
            <Button size="sm" onClick={send}>
              <Send /> {status === "expired" ? "Send again" : "Send to client"}
            </Button>
          ) : null}
          {!isNew && initial.status === "sent" ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setQuoteStatus(initial.id, "draft");
                toast("Moved back to draft for revision");
              }}
            >
              <RotateCcw /> Revise
            </Button>
          ) : null}
        </>
      )}
      {!isNew ? (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" aria-label="More quote actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {!locked ? (
              <DropdownMenuItem onSelect={duplicate}>
                <Copy className="h-4 w-4" /> Duplicate
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={remove}>
              <Trash2 className="h-4 w-4" /> Delete quote
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        to="/quotes"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Quotes
      </Link>
      <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="display-title text-2xl">{isNew ? "New quote" : quote.number}</h1>
            {!isNew ? <QuoteStatusBadge quote={initial} /> : null}
            {dirty && !isNew ? <span className="text-xs text-warning">Unsaved changes</span> : null}
          </div>
          {recipient ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              For {recipient.name}
              {recipient.kind === "lead" ? " (lead)" : ""}
            </p>
          ) : null}
        </div>
        {actions}
      </div>

      {status === "expired" && !isNew ? (
        <p
          className="mb-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs"
          role="status"
        >
          This quote expired on its valid-until date. Extend the date and send it again, or
          duplicate it.
        </p>
      ) : null}
      {locked ? (
        <p className="mb-4 rounded-md border bg-muted/40 px-3 py-2 text-xs" role="status">
          {initial.status === "accepted" ? "Accepted" : "Declined"} by the client — it's kept
          exactly as they saw it. Duplicate it to make a new version.
        </p>
      ) : null}

      {!locked ? (
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
      ) : null}

      <div className={cn("grid gap-6", !locked && "lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]")}>
        {!locked ? (
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
                  <Label htmlFor="qe-recipient">
                    Quote for <span className="text-muted-foreground">*</span>
                  </Label>
                  <RecipientSelect
                    value={recipientKey(form)}
                    invalid={!!err("recipient")}
                    onChange={(r) =>
                      set({ clientId: r.clientId, leadId: r.leadId, projectId: undefined })
                    }
                  />
                  {err("recipient") ? (
                    <p className="text-xs text-destructive">{err("recipient")}</p>
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
                          (form.clientId
                            ? projects.length
                              ? "No project"
                              : "Client has no projects"
                            : "Clients only")}
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
              </div>
              <Field id="qe-title" label="Title" required error={err("title")}>
                <Input
                  id="qe-title"
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="e.g. Wedding collection — Gold"
                  aria-invalid={!!err("title")}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="qe-issue" label="Issue date">
                  <Input
                    id="qe-issue"
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => set({ issueDate: e.target.value })}
                  />
                </Field>
                <Field id="qe-valid" label="Valid until" error={err("validUntil")}>
                  <Input
                    id="qe-valid"
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => set({ validUntil: e.target.value })}
                    aria-invalid={!!err("validUntil")}
                  />
                </Field>
              </div>
              <Field id="qe-message" label="Message to client">
                <Textarea
                  id="qe-message"
                  rows={3}
                  value={form.message}
                  onChange={(e) => set({ message: e.target.value })}
                />
              </Field>
            </section>

            <LineItemsSection
              value={form}
              onChange={set}
              idPrefix="qe"
              itemsError={err("items")}
              lineError={lineErr}
              discountError={err("discount")}
              taxError={err("taxRate")}
              totalsLabel="Quote totals"
            />

            <section className="rounded-lg border bg-card p-4 shadow-soft">
              <Field id="qe-terms" label="Terms">
                <Textarea
                  id="qe-terms"
                  rows={3}
                  value={form.terms}
                  onChange={(e) => set({ terms: e.target.value })}
                />
              </Field>
            </section>
          </form>
        ) : null}

        <div
          className={cn(
            "min-w-0",
            !locked && "lg:sticky lg:top-20 lg:self-start",
            !locked && view === "edit" && "max-lg:hidden",
          )}
        >
          <p className="eyebrow mb-2">Client preview</p>
          <QuoteDocument
            quote={locked ? initial : quote}
            className={cn(locked && "mx-auto max-w-2xl")}
          />
        </div>
      </div>
    </div>
  );
}
