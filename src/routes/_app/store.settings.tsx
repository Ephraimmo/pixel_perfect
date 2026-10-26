import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type ReactNode } from "react";
import { CreditCard, Mail, Plug } from "lucide-react";
import { toast } from "sonner";
import { Button, DemoNotice, PageHeader, Panel, pageHead } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { StoreTabs } from "@/components/store-tabs";
import { DigitalSettingsFields } from "@/components/store-digital";
import { FulfillmentFields } from "@/components/store-print";
import { useShop } from "@/lib/shop";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY } from "@/lib/demo-data";
import {
  addDays,
  type DeliveryEmail,
  type PaymentMethodId,
  type PaymentSettings,
  type StoreSettings,
} from "@/lib/shop-data";
import { PAYMENT_PROVIDERS } from "@/lib/shop-payments";
import {
  EMAIL_PLACEHOLDERS,
  digitalToForm,
  renderDeliveryEmail,
  validateDeliveryEmail,
  validateDigitalForm,
  type DigitalForm,
} from "@/lib/shop-digital";
import {
  LABS,
  printToForm,
  shippingToForm,
  validatePrintForm,
  validateShippingForm,
  type PrintForm,
  type ShippingForm,
} from "@/lib/shop-print";

export const Route = createFileRoute("/_app/store/settings")({
  head: () =>
    pageHead("Store settings", "Digital delivery, print fulfillment and shipping for your store."),
  component: StoreSettingsPage,
});

function StoreSettingsPage() {
  const { state: shop, ready } = useShop();
  return (
    <div className="mx-auto max-w-5xl">
      <StoreTabs />
      <PageHeader
        title="Store settings"
        description="How products are delivered and shipped to clients after they pay."
      />
      {/* Keyed on readiness so the form re-seeds once saved settings load. */}
      {ready ? <SettingsForm key="ready" settings={shop.settings} /> : null}
    </div>
  );
}

function SettingsForm({ settings }: { settings: StoreSettings }) {
  const { updateSettings } = useShop();
  const { state: demo } = useDemo();
  const initial = useRef({
    digital: digitalToForm(settings.digitalDefaults),
    email: settings.deliveryEmail,
    fulfillment: printToForm({ options: [], fulfillment: settings.printDefaults }),
    shipping: shippingToForm(settings.shipping),
    markup: String(settings.markupPercent),
    payments: settings.payments,
  });
  const [digital, setDigital] = useState<DigitalForm>(initial.current.digital);
  const [email, setEmail] = useState<DeliveryEmail>(initial.current.email);
  const [fulfillment, setFulfillment] = useState<PrintForm>(initial.current.fulfillment);
  const [shipping, setShipping] = useState<ShippingForm>(initial.current.shipping);
  const [markup, setMarkup] = useState(initial.current.markup);
  const [payments, setPayments] = useState<PaymentSettings>(initial.current.payments);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const current = { digital, email, fulfillment, shipping, markup, payments };
  const dirty = JSON.stringify(current) !== JSON.stringify(initial.current);
  const patchShipping = (patch: Partial<ShippingForm>) => {
    setShipping((s) => ({ ...s, ...patch }));
    setErrors((e) =>
      Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith("shipping."))),
    );
  };

  const patchEmail = (patch: Partial<DeliveryEmail>) => {
    setEmail((e) => ({ ...e, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k];
      return next;
    });
  };

  const insertPlaceholder = (token: string) => {
    const el = bodyRef.current;
    const at = el?.selectionStart ?? email.body.length;
    const end = el?.selectionEnd ?? at;
    patchEmail({ body: email.body.slice(0, at) + token + email.body.slice(end) });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + token.length, at + token.length);
    });
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const d = validateDigitalForm(digital, { requireFiles: false });
    const f = validatePrintForm(fulfillment);
    const sh = validateShippingForm(shipping, markup);
    const all = { ...d.errors, ...validateDeliveryEmail(email), ...f.errors, ...sh.errors };
    if (payments.manualEnabled && !payments.manualInstructions.trim())
      all["payments.manualInstructions"] = "Add your bank details so clients know how to pay.";
    if (
      !d.settings ||
      !f.settings ||
      !sh.shipping ||
      sh.markupPercent === null ||
      Object.keys(all).length
    ) {
      setErrors(all);
      toast.error("Check the highlighted fields before saving.");
      return;
    }
    const { files: _files, ...digitalDefaults } = d.settings;
    const next: StoreSettings = {
      digitalDefaults,
      deliveryEmail: {
        senderName: email.senderName.trim(),
        replyTo: email.replyTo.trim(),
        subject: email.subject.trim(),
        body: email.body,
      },
      printDefaults: f.settings.fulfillment,
      markupPercent: sh.markupPercent,
      shipping: sh.shipping,
      payments: { ...payments, manualInstructions: payments.manualInstructions.trim() },
    };
    updateSettings(next);
    initial.current = { ...current, email: next.deliveryEmail };
    setEmail(next.deliveryEmail);
    toast.success("Store settings saved");
  };

  const expiryDays =
    digital.expires && /^\d+$/.test(digital.expiryDays) ? Number(digital.expiryDays) : null;
  const preview = renderDeliveryEmail(email, {
    clientName: "Sarah",
    productName: "Full Gallery Download",
    studioName: demo.profile.studio,
    downloadLink: "https://karabo.pixora.app/d/7Kq2xW",
    expiresOn: expiryDays === null ? null : addDays(DEMO_TODAY, expiryDays),
  });

  return (
    <form onSubmit={save} noValidate className="space-y-5 pb-20 sm:pb-0">
      <Section
        title="Digital delivery defaults"
        description="New digital products start with these settings. You can still change them per product."
      >
        <DigitalSettingsFields
          idPrefix="defaults"
          value={digital}
          onChange={(patch) => {
            setDigital((d) => ({ ...d, ...patch }));
            setErrors({});
          }}
          errors={errors}
          withFiles={false}
        />
      </Section>

      <Section
        title="Download email"
        description="Sent to the client with their private download link once their files are ready."
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="min-w-0 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="senderName" label="Sender name" error={errors["senderName"]}>
                <Input
                  id="senderName"
                  value={email.senderName}
                  onChange={(e) => patchEmail({ senderName: e.target.value })}
                  aria-invalid={!!errors["senderName"]}
                />
              </Field>
              <Field id="replyTo" label="Reply-to email" error={errors["replyTo"]}>
                <Input
                  id="replyTo"
                  type="email"
                  value={email.replyTo}
                  onChange={(e) => patchEmail({ replyTo: e.target.value })}
                  aria-invalid={!!errors["replyTo"]}
                />
              </Field>
            </div>
            <Field id="subject" label="Subject" error={errors["subject"]}>
              <Input
                id="subject"
                value={email.subject}
                onChange={(e) => patchEmail({ subject: e.target.value })}
                aria-invalid={!!errors["subject"]}
              />
            </Field>
            <Field id="body" label="Message" error={errors["body"]}>
              <Textarea
                id="body"
                ref={bodyRef}
                rows={9}
                value={email.body}
                onChange={(e) => patchEmail({ body: e.target.value })}
                aria-invalid={!!errors["body"]}
                className="font-mono text-xs"
              />
            </Field>
            <div>
              <p className="text-[11px] text-muted-foreground">Insert a placeholder:</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {EMAIL_PLACEHOLDERS.map((p) => (
                  <button
                    key={p.token}
                    type="button"
                    title={p.description}
                    onClick={() => insertPlaceholder(p.token)}
                    className="rounded border bg-card px-1.5 py-0.5 font-mono text-[11px] hover:bg-accent"
                  >
                    {p.token}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <p className="mb-1.5 text-xs font-medium">Preview</p>
            <div
              className="overflow-hidden rounded-lg border bg-background"
              aria-label="Email preview"
            >
              <div className="space-y-0.5 border-b bg-muted/40 px-4 py-3 text-[11px] text-muted-foreground">
                <p>
                  From: <span className="text-foreground">{email.senderName || "—"}</span>
                </p>
                <p>
                  To: <span className="text-foreground">sarah@sarahmitchell.com</span>
                </p>
                <p className="flex items-center gap-1.5 pt-1 text-sm font-medium text-foreground">
                  <Mail className="h-3.5 w-3.5" /> {preview.subject || "(no subject)"}
                </p>
              </div>
              <p className="whitespace-pre-wrap break-words px-4 py-4 text-sm leading-relaxed">
                {preview.body}
              </p>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Sample client and order for the preview.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Print fulfillment & shipping"
        description="Defaults for new print products, and what clients pay to ship physical orders."
      >
        <div className="flex items-start gap-3 rounded-md border border-dashed p-3">
          <Plug className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="text-xs">
            <p className="font-medium">
              {fulfillment.method === "lab" ? LABS[fulfillment.lab].name : "Print lab"} account ·
              not connected
            </p>
            <p className="mt-0.5 text-muted-foreground">
              Connecting a lab account (API credentials from the lab) would let paid orders be
              submitted for printing automatically. Until then, place lab orders yourself from the
              order page.
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Default fulfillment</p>
          <FulfillmentFields
            idPrefix="def-ful"
            value={fulfillment}
            onChange={(patch) => {
              setFulfillment((f) => ({ ...f, ...patch }));
              setErrors(({ "print.productionDays": _, ...rest }) => rest);
            }}
            errors={errors}
          />
        </div>

        <div className="space-y-1.5 border-t pt-4">
          <Label htmlFor="markup">Default markup on lab cost</Label>
          <div className="flex items-center gap-2 text-xs">
            <Input
              id="markup"
              inputMode="numeric"
              value={markup}
              onChange={(e) => {
                setMarkup(e.target.value);
                setErrors(({ markup: _, ...rest }) => rest);
              }}
              className="w-24"
              aria-invalid={!!errors["markup"]}
            />
            <span className="text-muted-foreground">
              % — e.g. a $3.20 lab print sells for about $
              {(3.2 * (1 + (Number(markup) || 0) / 100)).toFixed(0)}
            </span>
          </div>
          <FieldError message={errors["markup"]} />
        </div>

        <div className="space-y-4 border-t pt-4">
          <p className="text-sm font-medium">Shipping</p>
          <div className="space-y-1.5">
            <Label htmlFor="flatRate">Flat rate per order</Label>
            <div className="relative w-32">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="flatRate"
                inputMode="decimal"
                value={shipping.flatRate}
                onChange={(e) => patchShipping({ flatRate: e.target.value })}
                className="pl-6"
                aria-invalid={!!errors["shipping.flatRate"]}
              />
            </div>
            <FieldError message={errors["shipping.flatRate"]} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Checkbox
                id="freeShipping"
                checked={shipping.freeShipping}
                onCheckedChange={(v) => patchShipping({ freeShipping: v === true })}
              />
              <Label htmlFor="freeShipping">Free shipping on larger orders</Label>
            </div>
            {shipping.freeShipping ? (
              <div className="flex items-center gap-2 pl-6 text-xs">
                <Label htmlFor="freeOver" className="font-normal">
                  Orders of
                </Label>
                <div className="relative w-28">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="freeOver"
                    inputMode="decimal"
                    value={shipping.freeOver}
                    onChange={(e) => patchShipping({ freeOver: e.target.value })}
                    className="h-8 pl-6"
                    aria-invalid={!!errors["shipping.freeOver"]}
                  />
                </div>
                <span className="text-muted-foreground">or more ship free</span>
              </div>
            ) : null}
            <div className="pl-6">
              <FieldError message={errors["shipping.freeOver"]} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label htmlFor="localPickup">Local pickup</Label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Clients can collect from your studio at no charge.
                </p>
              </div>
              <Switch
                id="localPickup"
                checked={shipping.localPickup}
                onCheckedChange={(v) => patchShipping({ localPickup: v })}
              />
            </div>
            {shipping.localPickup ? (
              <div className="space-y-1.5">
                <Label htmlFor="pickupNote">Pickup instructions</Label>
                <Input
                  id="pickupNote"
                  value={shipping.pickupNote}
                  onChange={(e) => patchShipping({ pickupNote: e.target.value })}
                  aria-invalid={!!errors["shipping.pickupNote"]}
                />
                <FieldError message={errors["shipping.pickupNote"]} />
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      <Section
        title="Payments"
        description="How clients pay at checkout. Orders are only marked paid once payment is confirmed."
      >
        <ul className="divide-y rounded-md border">
          {(["stripe", "paypal"] as PaymentMethodId[]).map((id) => {
            const p = PAYMENT_PROVIDERS[id];
            return (
              <li
                key={id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex items-start gap-2.5">
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="text-xs">
                    <p className="text-sm font-medium">
                      {id === "stripe" ? "Stripe (cards)" : "PayPal"}{" "}
                      <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Not connected
                      </span>
                    </p>
                    <p className="mt-1 text-muted-foreground">Needs:</p>
                    <ul className="ml-4 list-disc text-muted-foreground">
                      {p.requires.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled
                  title="Requires a server — not available in this demo"
                  className="shrink-0"
                >
                  Connect
                </Button>
              </li>
            );
          })}
          <li className="space-y-3 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label htmlFor="manualEnabled">Bank transfer (EFT)</Label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Orders wait as "Awaiting payment" until you confirm the transfer arrived.
                </p>
              </div>
              <Switch
                id="manualEnabled"
                checked={payments.manualEnabled}
                onCheckedChange={(v) => setPayments((p) => ({ ...p, manualEnabled: v }))}
              />
            </div>
            {payments.manualEnabled ? (
              <div className="space-y-1.5">
                <Label htmlFor="manualInstructions">Payment instructions shown to clients</Label>
                <Textarea
                  id="manualInstructions"
                  rows={5}
                  value={payments.manualInstructions}
                  onChange={(e) => {
                    setPayments((p) => ({ ...p, manualInstructions: e.target.value }));
                    setErrors(({ "payments.manualInstructions": _, ...rest }) => rest);
                  }}
                  aria-invalid={!!errors["payments.manualInstructions"]}
                  className="text-xs"
                />
                <FieldError message={errors["payments.manualInstructions"]} />
              </div>
            ) : null}
          </li>
        </ul>
      </Section>

      <DemoNotice>
        Delivery isn't live in this demo: sending this email needs a transactional email service
        (e.g. Resend or Postmark), and real download links need cloud file storage that issues
        private, expiring links. Settings are saved in this browser.
      </DemoNotice>

      <div className="fixed inset-x-0 bottom-0 z-10 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" disabled={!dirty}>
          Save settings
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Panel className="space-y-4 p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </Panel>
  );
}

function FieldError({ message }: { message?: string | undefined }) {
  return message ? (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
