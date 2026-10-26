// Print product helpers — lab price list, margins, markup pricing, option and
// fulfillment form validation, and shipping. Pure; no print lab is connected in
// the demo, so lab costs are a sample price list and orders are never submitted.

import type {
  LabId,
  PrintFulfillment,
  PrintOption,
  PrintSettings,
  ShippingSettings,
} from "./shop-data";

export const LABS: Record<LabId, { name: string; region: string }> = {
  whcc: { name: "WHCC", region: "US" },
  "bay-photo": { name: "Bay Photo Lab", region: "US" },
  millers: { name: "Miller's Professional Imaging", region: "US" },
  loxley: { name: "Loxley Colour", region: "UK" },
};

export interface LabSize {
  id: string;
  group: string;
  name: string;
  cost: number;
}

/** Sample lab costs for quick-adding sizes. Real costs come from the lab's price sheet. */
export const LAB_PRICE_LIST: LabSize[] = [
  { id: "photo-4x6", group: "Photo prints", name: "4x6", cost: 0.65 },
  { id: "photo-5x7", group: "Photo prints", name: "5x7", cost: 1.3 },
  { id: "photo-8x10", group: "Photo prints", name: "8x10", cost: 3.2 },
  { id: "photo-11x14", group: "Photo prints", name: "11x14", cost: 7.5 },
  { id: "photo-16x20", group: "Photo prints", name: "16x20", cost: 14 },
  { id: "photo-20x30", group: "Photo prints", name: "20x30", cost: 26 },
  { id: "canvas-12x16", group: "Canvas", name: "12x16", cost: 38 },
  { id: "canvas-16x20", group: "Canvas", name: "16x20", cost: 52 },
  { id: "canvas-24x36", group: "Canvas", name: "24x36", cost: 95 },
  { id: "metal-11x14", group: "Metal", name: "11x14", cost: 41 },
  { id: "metal-16x20", group: "Metal", name: "16x20", cost: 58 },
];

/** Price that marks `cost` up by `percent`, rounded to a whole dollar minus a cent (e.g. 11.99). */
export function priceFromCost(cost: number, percent: number): number {
  const raw = cost * (1 + percent / 100);
  return Math.max(0.99, Math.round(raw) - 0.01);
}

export interface Margin {
  profit: number;
  /** Profit as a share of the price, 0–100. */
  percent: number;
}

export function margin(price: number, cost: number | null): Margin | null {
  if (cost === null || price <= 0) return null;
  const profit = price - cost;
  return { profit, percent: (profit / price) * 100 };
}

export function describeFulfillment(f: PrintFulfillment): string {
  const days = `${f.productionDays} working ${f.productionDays === 1 ? "day" : "days"}`;
  if (f.method === "self") return `Fulfilled by your studio · ships in ${days}`;
  return `${LABS[f.lab].name} · ${days} to produce · ships ${f.shipTo === "client" ? "direct to client" : "to your studio first"}`;
}

/** Shipping for an order's physical items; digital-only orders and pickup ship free. */
export function shippingCost(
  physicalSubtotal: number,
  shipping: ShippingSettings,
  method: "ship" | "pickup" = "ship",
): number {
  if (physicalSubtotal <= 0 || method === "pickup") return 0;
  if (shipping.freeOver !== null && physicalSubtotal >= shipping.freeOver) return 0;
  return shipping.flatRate;
}

// ---------- forms ----------

export interface PrintOptionForm {
  id: string;
  name: string;
  choices: { id: string; label: string; price: string }[];
}

export interface PrintForm {
  options: PrintOptionForm[];
  method: PrintFulfillment["method"];
  lab: LabId;
  productionDays: string;
  shipTo: PrintFulfillment["shipTo"];
}

export function printToForm(p: PrintSettings): PrintForm {
  return {
    options: p.options.map((o) => ({
      id: o.id,
      name: o.name,
      choices: o.choices.map((c) => ({
        id: c.id,
        label: c.label,
        price: c.price ? String(c.price) : "",
      })),
    })),
    method: p.fulfillment.method,
    lab: p.fulfillment.lab,
    productionDays: String(p.fulfillment.productionDays),
    shipTo: p.fulfillment.shipTo,
  };
}

const money = (raw: string, allowZero: boolean): number | null => {
  const t = raw.trim();
  if (allowZero && t === "") return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return (allowZero ? n >= 0 : n > 0) && n <= 100_000 ? n : null;
};

/** Parse an optional lab cost: blank means unknown (null). */
export function parseCost(raw: string): { ok: true; value: number | null } | { ok: false } {
  if (raw.trim() === "") return { ok: true, value: null };
  const n = money(raw, true);
  return n === null ? { ok: false } : { ok: true, value: n };
}

/** Errors are keyed `print.<field>` / `print.options.<i>.<field>`. */
export function validatePrintForm(f: PrintForm): {
  settings: PrintSettings | null;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const names = new Set<string>();
  const options: PrintOption[] = f.options.map((o, i) => {
    const name = o.name.trim();
    if (!name) errors[`print.options.${i}.name`] = "Name this option, e.g. Paper.";
    else if (names.has(name.toLowerCase()))
      errors[`print.options.${i}.name`] = "Each option needs a different name.";
    names.add(name.toLowerCase());
    if (o.choices.length < 2)
      errors[`print.options.${i}.choices`] = "Give clients at least two choices.";
    const labels = new Set<string>();
    const choices = o.choices.map((c, j) => {
      const label = c.label.trim();
      if (!label || labels.has(label.toLowerCase()))
        errors[`print.options.${i}.choices`] ??= "Every choice needs a different, non-empty label.";
      labels.add(label.toLowerCase());
      const price = money(c.price, true);
      if (price === null)
        errors[`print.options.${i}.choices`] ??=
          `Choice ${j + 1}: enter an add-on price like 4 or 4.50, or leave it blank.`;
      return { id: c.id, label, price: price ?? 0 };
    });
    return { id: o.id, name, choices };
  });
  const days = /^\d+$/.test(f.productionDays.trim()) ? Number(f.productionDays) : NaN;
  if (!(days >= 1 && days <= 60))
    errors["print.productionDays"] = "Production takes 1 to 60 working days.";
  if (Object.keys(errors).length) return { settings: null, errors };
  return {
    settings: {
      options,
      fulfillment: { method: f.method, lab: f.lab, productionDays: days, shipTo: f.shipTo },
    },
    errors,
  };
}

export interface ShippingForm {
  flatRate: string;
  freeShipping: boolean;
  freeOver: string;
  localPickup: boolean;
  pickupNote: string;
}

export function shippingToForm(s: ShippingSettings): ShippingForm {
  return {
    flatRate: s.flatRate.toFixed(2),
    freeShipping: s.freeOver !== null,
    freeOver: s.freeOver === null ? "150" : String(s.freeOver),
    localPickup: s.localPickup,
    pickupNote: s.pickupNote,
  };
}

/** Errors are keyed `shipping.<field>` and `markup`. */
export function validateShippingForm(
  f: ShippingForm,
  markup: string,
): {
  shipping: ShippingSettings | null;
  markupPercent: number | null;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const flatRate = money(f.flatRate, true);
  if (flatRate === null)
    errors["shipping.flatRate"] = "Enter a shipping rate like 12 or 12.50 (0 for free).";
  const freeOver = f.freeShipping ? money(f.freeOver, false) : null;
  if (f.freeShipping && freeOver === null)
    errors["shipping.freeOver"] = "Enter the order amount that ships free.";
  if (f.localPickup && !f.pickupNote.trim())
    errors["shipping.pickupNote"] = "Tell clients where and when to collect.";
  const markupPercent =
    /^\d+$/.test(markup.trim()) && Number(markup) <= 2000 ? Number(markup) : null;
  if (markupPercent === null) errors["markup"] = "Use a whole-number markup from 0 to 2000%.";
  if (Object.keys(errors).length) return { shipping: null, markupPercent: null, errors };
  return {
    shipping: {
      flatRate: flatRate ?? 0,
      freeOver,
      localPickup: f.localPickup,
      pickupNote: f.pickupNote.trim(),
    },
    markupPercent,
    errors,
  };
}
