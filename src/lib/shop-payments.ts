// Payment provider integration points. Checkout calls `startPayment()`; in a
// real deployment the card/PayPal branches call a server endpoint that creates
// a Stripe Checkout Session or PayPal order (secret keys never reach the
// browser) and a webhook marks the order paid. No provider is connected in this
// demo, so those branches report "unavailable" — nothing is ever charged and no
// payment is ever reported as successful.

import type { PaymentMethodId, PaymentSettings } from "./shop-data";

export interface PaymentProvider {
  id: PaymentMethodId;
  name: string;
  description: string;
  /** redirect = hosted payment page; manual = studio confirms payment by hand. */
  kind: "redirect" | "manual";
  /** What a real integration needs, shown to the studio. */
  requires: string[];
}

export const PAYMENT_PROVIDERS: Record<PaymentMethodId, PaymentProvider> = {
  stripe: {
    id: "stripe",
    name: "Card",
    description: "Visa, Mastercard and Amex via Stripe",
    kind: "redirect",
    requires: [
      "A Stripe account connected to the studio (Stripe Connect or API keys)",
      "A server endpoint that creates Checkout Sessions with the secret key",
      "A webhook endpoint that marks orders paid on checkout.session.completed",
    ],
  },
  paypal: {
    id: "paypal",
    name: "PayPal",
    description: "Pay with your PayPal account",
    kind: "redirect",
    requires: [
      "A PayPal business account and REST app credentials",
      "A server endpoint that creates and captures PayPal orders",
      "A webhook for PAYMENT.CAPTURE.COMPLETED",
    ],
  },
  manual: {
    id: "manual",
    name: "Bank transfer (EFT)",
    description: "Pay by bank transfer; your order is processed once payment clears",
    kind: "manual",
    requires: [],
  },
};

/** Card and PayPal need a backend; none is configured in this demo. */
export function isProviderConnected(id: PaymentMethodId): boolean {
  return id === "manual";
}

export function availableMethods(settings: PaymentSettings): PaymentMethodId[] {
  return (Object.keys(PAYMENT_PROVIDERS) as PaymentMethodId[]).filter(
    (id) => id !== "manual" || settings.manualEnabled,
  );
}

export interface PaymentRequest {
  provider: PaymentMethodId;
  orderNumber: string;
  /** Amount in USD, re-priced from the catalog (a server must re-price again). */
  amount: number;
  customerEmail: string;
  returnUrl: string;
  cancelUrl: string;
}

export type PaymentStart =
  /** Hosted payment page — the browser is sent there; payment is confirmed by webhook later. */
  | { status: "redirect"; url: string }
  /** Order is placed unpaid; the client pays by transfer and the studio confirms. */
  | { status: "manual"; instructions: string }
  /** Provider not connected: place no order and charge nothing. */
  | { status: "unavailable"; reason: string };

export async function startPayment(
  req: PaymentRequest,
  settings: PaymentSettings,
): Promise<PaymentStart> {
  const provider = PAYMENT_PROVIDERS[req.provider];
  if (provider.kind === "manual") {
    return settings.manualEnabled
      ? { status: "manual", instructions: settings.manualInstructions }
      : { status: "unavailable", reason: "Bank transfer isn't offered by this studio." };
  }
  // Integration point: POST /api/payments/session { provider, orderNumber, amount, … } → { url }.
  // There is no backend in this demo, so card and PayPal payments can't start.
  return {
    status: "unavailable",
    reason: `${provider.name} payments aren't connected for this store yet, so you haven't been charged and no order was placed.`,
  };
}
