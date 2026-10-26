// Product editor form model — string inputs as typed, converted to a product
// only when every field validates. Pure so the editor and its tests share it.

import { PHOTOS } from "./demo-data";
import {
  SEED_SETTINGS,
  defaultPrintSettings,
  type ProductCategory,
  type ShopProduct,
  type StoreSettings,
} from "./shop-data";
import { digitalToForm, validateDigitalForm, type DigitalForm } from "./shop-digital";
import { parseCost, printToForm, validatePrintForm, type PrintForm } from "./shop-print";

export const PRODUCT_NAME_MAX = 80;
export const PRODUCT_DESCRIPTION_MAX = 1000;
export const PRODUCT_PRICE_MAX = 100_000;

export interface VariantForm {
  id: string;
  name: string;
  price: string;
  /** Lab cost; blank = unknown. Shown for print sizes. */
  cost: string;
  sku: string;
  available: boolean;
}

export interface ProductForm {
  name: string;
  description: string;
  category: ProductCategory;
  image: string;
  price: string;
  active: boolean;
  popular: boolean;
  optionName: string;
  variants: VariantForm[];
  trackInventory: boolean;
  inventory: string;
  hasEndDate: boolean;
  availableUntil: string;
  /** Kept for every type so switching type back and forth loses nothing; saved only for digital. */
  digital: DigitalForm;
  /** Print options & fulfillment; saved only for prints, whose sizes are the variants. */
  print: PrintForm;
}

export type ProductInput = Omit<ShopProduct, "id">;

/** Field → message. Variant fields are keyed `variants.<index>.<field>`. */
export type ProductFormErrors = Record<string, string>;

export function emptyProductForm(
  category: ProductCategory = "print",
  settings: StoreSettings = SEED_SETTINGS,
): ProductForm {
  return {
    name: "",
    description: "",
    category,
    image: PHOTOS.wedding[5],
    price: "",
    active: true,
    popular: false,
    optionName: "",
    variants: [],
    trackInventory: false,
    inventory: "",
    hasEndDate: false,
    availableUntil: "",
    digital: digitalToForm(settings.digitalDefaults),
    print: printToForm(defaultPrintSettings(settings)),
  };
}

export function productToForm(
  p: ShopProduct,
  settings: StoreSettings = SEED_SETTINGS,
): ProductForm {
  return {
    name: p.name,
    description: p.description,
    category: p.category,
    image: p.image,
    price: String(p.price),
    active: p.active,
    popular: p.popular,
    optionName: p.optionName,
    variants: p.variants.map((v) => ({
      ...v,
      price: String(v.price),
      cost: v.cost === null ? "" : String(v.cost),
    })),
    trackInventory: p.inventory !== null,
    inventory: p.inventory === null ? "" : String(p.inventory),
    hasEndDate: p.availableUntil !== null,
    availableUntil: p.availableUntil ?? "",
    digital: digitalToForm(p.digital ?? settings.digitalDefaults),
    print: printToForm(p.print ?? defaultPrintSettings(settings)),
  };
}

const parsePrice = (raw: string): number | null => {
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) return null;
  const n = Number(raw);
  return n > 0 && n <= PRODUCT_PRICE_MAX ? n : null;
};

const PRICE_ERROR = `Enter a price between $0.01 and $${PRODUCT_PRICE_MAX.toLocaleString("en-US")}, e.g. 45 or 45.50.`;

export function validateProductForm(
  form: ProductForm,
): { ok: true; product: ProductInput } | { ok: false; errors: ProductFormErrors } {
  const errors: ProductFormErrors = {};
  const name = form.name.trim();
  if (!name) errors["name"] = "Give the product a name.";
  else if (name.length > PRODUCT_NAME_MAX)
    errors["name"] = `Keep the name under ${PRODUCT_NAME_MAX} characters.`;
  if (form.description.length > PRODUCT_DESCRIPTION_MAX)
    errors["description"] = `Keep the description under ${PRODUCT_DESCRIPTION_MAX} characters.`;
  if (!form.image) errors["image"] = "Choose a product image.";

  const hasVariants = form.variants.length > 0;
  const basePrice = parsePrice(form.price);
  if (!hasVariants && form.category !== "print" && basePrice === null)
    errors["price"] = PRICE_ERROR;

  const seen = new Set<string>();
  const variants = form.variants.map((v, i) => {
    const vName = v.name.trim();
    const key = vName.toLowerCase();
    if (!vName) errors[`variants.${i}.name`] = "Name this variant.";
    else if (seen.has(key)) errors[`variants.${i}.name`] = "Each variant needs a different name.";
    seen.add(key);
    const price = parsePrice(v.price);
    if (price === null) errors[`variants.${i}.price`] = "Enter a price above zero.";
    const cost = parseCost(v.cost);
    if (!cost.ok) errors[`variants.${i}.cost`] = "Enter the lab cost like 3.20, or leave it blank.";
    return {
      id: v.id,
      name: vName,
      price: price ?? 0,
      cost: cost.ok ? cost.value : null,
      sku: v.sku.trim(),
      available: v.available,
    };
  });
  const isPrint = form.category === "print";
  if (isPrint && !hasVariants) errors["variants"] = "Add at least one print size.";
  if (hasVariants && !isPrint && !form.optionName.trim())
    errors["optionName"] = "Say what the variants differ by, e.g. Size.";
  if (hasVariants && !variants.some((v) => v.available))
    errors["variants"] = "At least one variant must be available, or the product can't be bought.";

  let inventory: number | null = null;
  if (form.trackInventory) {
    const raw = form.inventory.trim();
    if (!/^\d+$/.test(raw) || Number(raw) > 100_000)
      errors["inventory"] = "Enter a whole number of items in stock (0 or more).";
    else inventory = Number(raw);
  }

  let availableUntil: string | null = null;
  if (form.hasEndDate) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(form.availableUntil) ||
      Number.isNaN(Date.parse(form.availableUntil))
    )
      errors["availableUntil"] = "Pick the last day this product can be bought.";
    else availableUntil = form.availableUntil;
  }

  const digital =
    form.category === "digital"
      ? validateDigitalForm(form.digital, { requireFiles: true })
      : { settings: null, errors: {} };
  Object.assign(errors, digital.errors);
  const print = isPrint ? validatePrintForm(form.print) : { settings: null, errors: {} };
  Object.assign(errors, print.errors);

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    product: {
      name,
      description: form.description.trim(),
      category: form.category,
      image: form.image,
      // With variants, the listed price is the cheapest variant.
      price: hasVariants ? Math.min(...variants.map((v) => v.price)) : basePrice!,
      active: form.active,
      popular: form.popular,
      // Print sizes are the variants, so their option is always "Size".
      optionName: isPrint ? "Size" : hasVariants ? form.optionName.trim() : "",
      variants,
      inventory,
      availableUntil,
      digital: digital.settings,
      print: print.settings,
    },
  };
}

/** Images a studio can pick for a product in the demo (their own gallery photos). */
export const PRODUCT_IMAGE_CHOICES: string[] = [
  ...new Set([...PHOTOS.wedding.slice(0, 12), ...PHOTOS.family, ...PHOTOS.travel]),
];
