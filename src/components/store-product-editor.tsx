import { useRef, useState, type ReactNode } from "react";
import { useBlocker, useNavigate } from "@tanstack/react-router";
import { ImagePlus, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button, Panel } from "@/components/kit";
import { AvailabilityBadge } from "@/components/store-products";
import { DigitalSettingsFields } from "@/components/store-digital";
import {
  FulfillmentFields,
  LabSizePicker,
  MarginText,
  MarkupTool,
  PrintOptionsFields,
} from "@/components/store-print";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useShop } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { img } from "@/lib/demo-data";
import { productImage, type ProductCategory, type ShopProduct } from "@/lib/shop-data";
import { CATEGORY_LABELS } from "@/lib/shop-catalog";
import {
  PRODUCT_DESCRIPTION_MAX,
  PRODUCT_IMAGE_CHOICES,
  PRODUCT_NAME_MAX,
  emptyProductForm,
  productToForm,
  validateProductForm,
  type ProductForm,
  type ProductFormErrors,
  type VariantForm,
} from "@/lib/shop-product-form";
import { parseCost, priceFromCost } from "@/lib/shop-print";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Create (no product) or edit an existing product. */
export function ProductEditor({ product }: { product?: ShopProduct }) {
  const { state: shop, createProduct, updateProduct, deleteProduct } = useShop();
  const navigate = useNavigate();
  const initial = useRef(
    product ? productToForm(product, shop.settings) : emptyProductForm("print", shop.settings),
  );
  const [form, setForm] = useState<ProductForm>(initial.current);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const leaving = useRef(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial.current);
  const blocker = useBlocker({
    shouldBlockFn: () => dirty && !leaving.current,
    enableBeforeUnload: () => dirty && !leaving.current,
    withResolver: true,
  });

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors(({ [key]: _, ...rest }) => rest);
  };
  const setVariant = (i: number, patch: Partial<VariantForm>) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)),
    }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[`variants.${i}.${k}`];
      delete next["variants"];
      return next;
    });
  };
  const setDigital = (patch: Partial<ProductForm["digital"]>) => {
    setForm((f) => ({ ...f, digital: { ...f.digital, ...patch } }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[`digital.${k}`];
      if ("limitDownloads" in patch) delete next["digital.downloadLimit"];
      if ("expires" in patch) delete next["digital.expiryDays"];
      if ("delivery" in patch) delete next["digital.manualDays"];
      if ("scope" in patch) delete next["digital.files"];
      return next;
    });
  };
  const setPrint = (patch: Partial<ProductForm["print"]>) => {
    setForm((f) => ({ ...f, print: { ...f.print, ...patch } }));
    setErrors((e) =>
      Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith("print."))),
    );
  };
  const addVariant = (preset: Partial<VariantForm> = {}) => {
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        {
          id: `v-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
          name: "",
          // A new variant starts at the current price so the studio only edits the difference.
          price: f.variants.at(-1)?.price ?? f.price,
          cost: "",
          sku: "",
          available: true,
          ...preset,
        },
      ],
    }));
    setErrors(({ variants: _, ...rest }) => rest);
  };
  const applyMarkup = (percent: number) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v) => {
        const cost = parseCost(v.cost);
        return cost.ok && cost.value !== null
          ? { ...v, price: priceFromCost(cost.value, percent).toFixed(2) }
          : v;
      }),
    }));
    toast.success(`Prices set to lab cost + ${percent}%`);
  };
  const isPrint = form.category === "print";
  const removeVariant = (i: number) => {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, j) => j !== i) }));
    // Variant error keys are positional, so drop them all rather than shift them.
    setErrors((e) =>
      Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith("variants"))),
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateProductForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      const count = Object.keys(result.errors).length;
      toast.error(`Check ${count} ${count === 1 ? "field" : "fields"} before saving.`);
      const first = Object.keys(result.errors)[0];
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus(),
      );
      return;
    }
    leaving.current = true;
    if (product) {
      updateProduct(product.id, result.product);
      toast.success(`${result.product.name} saved`);
      void navigate({ to: "/store/products/$id", params: { id: product.id } });
    } else {
      const created = createProduct(result.product);
      toast.success(`${created.name} created`);
      void navigate({ to: "/store/products/$id", params: { id: created.id } });
    }
  };

  const cancel = () =>
    void navigate(
      product
        ? { to: "/store/products/$id", params: { id: product.id } }
        : { to: "/store/products" },
    );

  const preview = validateProductForm(form);
  const availabilityPreview = {
    active: form.active,
    inventory: form.trackInventory && /^\d+$/.test(form.inventory) ? Number(form.inventory) : null,
    availableUntil: form.hasEndDate && form.availableUntil ? form.availableUntil : null,
    variants: form.variants.map((v) => ({ ...v, price: 0, cost: null })),
  };

  return (
    <form onSubmit={submit} noValidate className="pb-20 sm:pb-0">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-5">
          <Section title="Details">
            <Field
              id="name"
              label="Name"
              error={errors["name"]}
              hint={`${form.name.trim().length}/${PRODUCT_NAME_MAX}`}
            >
              <Input
                id="name"
                data-field="name"
                value={form.name}
                maxLength={PRODUCT_NAME_MAX + 20}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. 11x14 Fine Art Print"
                aria-invalid={!!errors["name"]}
              />
            </Field>
            <Field
              id="description"
              label="Description"
              error={errors["description"]}
              hint={`${form.description.length}/${PRODUCT_DESCRIPTION_MAX}`}
            >
              <Textarea
                id="description"
                data-field="description"
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Paper, finish, sizes, what's included — what a client needs to decide."
                aria-invalid={!!errors["description"]}
              />
            </Field>
            <Field id="category" label="Product type">
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as ProductCategory)}
              >
                <SelectTrigger id="category" className="sm:w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Section>

          <Section title="Image">
            <ImageField
              value={form.image}
              error={errors["image"]}
              onChange={(v) => set("image", v)}
            />
          </Section>

          {form.category === "digital" ? (
            <Section
              title="Download & delivery"
              description="How clients receive this product after paying. New digital products start from your store's delivery defaults."
            >
              <DigitalSettingsFields
                idPrefix="pe"
                value={form.digital}
                onChange={setDigital}
                errors={errors}
                withFiles
              />
            </Section>
          ) : null}

          {isPrint ? (
            <>
              <Section
                title="Print sizes & pricing"
                description="Clients choose a size; add your lab cost to see the margin on each."
              >
                {form.variants.length ? (
                  <div className="space-y-3">
                    <div
                      className={cn(
                        "hidden gap-2 text-[11px] font-medium text-muted-foreground sm:grid",
                        PRINT_COLS,
                      )}
                    >
                      <span>Size</span>
                      <span>Price</span>
                      <span>Lab cost</span>
                      <span>Margin</span>
                      <span>SKU</span>
                      <span>Sell</span>
                      <span />
                    </div>
                    {form.variants.map((v, i) => (
                      <VariantRow
                        key={v.id}
                        index={i}
                        variant={v}
                        errors={errors}
                        print
                        onChange={(patch) => setVariant(i, patch)}
                        onRemove={() => removeVariant(i)}
                      />
                    ))}
                  </div>
                ) : null}
                {errors["variants"] ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors["variants"]}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addVariant()}
                    data-field="variants"
                  >
                    <Plus /> Add size
                  </Button>
                  <LabSizePicker
                    onPick={(size) =>
                      addVariant({
                        name: size.name,
                        cost: size.cost.toFixed(2),
                        price: priceFromCost(size.cost, shop.settings.markupPercent).toFixed(2),
                      })
                    }
                  />
                </div>
                <MarkupTool
                  defaultPercent={shop.settings.markupPercent}
                  disabled={!form.variants.some((v) => v.cost.trim())}
                  onApply={applyMarkup}
                />
              </Section>

              <Section
                title="Print options"
                description="Extra choices such as paper, finish or mounting, each with an optional add-on price."
              >
                <PrintOptionsFields
                  options={form.print.options}
                  onChange={(options) => setPrint({ options })}
                  errors={errors}
                />
              </Section>

              <Section
                title="Fulfillment"
                description="Who produces this print and where it ships."
              >
                <FulfillmentFields
                  idPrefix="pe-ful"
                  value={form.print}
                  onChange={setPrint}
                  errors={errors}
                />
              </Section>
            </>
          ) : (
            <Section
              title="Pricing & variants"
              description="Add variants when clients choose between options such as size or cover."
            >
              {form.variants.length === 0 ? (
                <Field id="price" label="Price (USD)" error={errors["price"]}>
                  <MoneyInput
                    id="price"
                    value={form.price}
                    onChange={(v) => set("price", v)}
                    invalid={!!errors["price"]}
                  />
                </Field>
              ) : (
                <>
                  <Field id="optionName" label="Variants differ by" error={errors["optionName"]}>
                    <Input
                      id="optionName"
                      data-field="optionName"
                      value={form.optionName}
                      onChange={(e) => set("optionName", e.target.value)}
                      placeholder="Size, Cover, Paper…"
                      className="sm:w-60"
                      aria-invalid={!!errors["optionName"]}
                    />
                  </Field>
                  <div className="space-y-3">
                    <div className="hidden grid-cols-[1fr_7rem_7rem_4.5rem_2rem] gap-2 text-[11px] font-medium text-muted-foreground sm:grid">
                      <span>Variant</span>
                      <span>Price</span>
                      <span>SKU</span>
                      <span>In stock</span>
                      <span />
                    </div>
                    {form.variants.map((v, i) => (
                      <VariantRow
                        key={v.id}
                        index={i}
                        variant={v}
                        errors={errors}
                        onChange={(patch) => setVariant(i, patch)}
                        onRemove={() => removeVariant(i)}
                      />
                    ))}
                    {errors["variants"] ? (
                      <p className="text-xs text-destructive" role="alert">
                        {errors["variants"]}
                      </p>
                    ) : null}
                    <p className="text-[11px] text-muted-foreground">
                      The storefront shows the lowest available variant price as "from" pricing.
                    </p>
                  </div>
                </>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => addVariant()}>
                <Plus /> {form.variants.length ? "Add variant" : "Add variants"}
              </Button>
            </Section>
          )}
        </div>

        <div className="min-w-0 space-y-5">
          <Section title="Availability">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status in store</span>
              <AvailabilityBadge product={availabilityPreview} />
            </div>
            <ToggleRow
              id="active"
              label="Listed in store"
              description="Hidden products stay in your catalog but clients can't see them."
              checked={form.active}
              onChange={(v) => set("active", v)}
            />
            <ToggleRow
              id="popular"
              label="Feature as popular"
              description="Shown first and badged in your storefront."
              checked={form.popular}
              onChange={(v) => set("popular", v)}
            />
            <div className="space-y-2 border-t pt-4">
              <CheckRow
                id="trackInventory"
                label="Track inventory"
                checked={form.trackInventory}
                onChange={(v) => set("trackInventory", v)}
              />
              {form.trackInventory ? (
                <Field id="inventory" label="Items in stock" error={errors["inventory"]}>
                  <Input
                    id="inventory"
                    data-field="inventory"
                    inputMode="numeric"
                    value={form.inventory}
                    onChange={(e) => set("inventory", e.target.value)}
                    placeholder="0"
                    aria-invalid={!!errors["inventory"]}
                  />
                </Field>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Unlimited — right for made-to-order prints and downloads.
                </p>
              )}
            </div>
            <div className="space-y-2 border-t pt-4">
              <CheckRow
                id="hasEndDate"
                label="Stop selling on a date"
                checked={form.hasEndDate}
                onChange={(v) => set("hasEndDate", v)}
              />
              {form.hasEndDate ? (
                <Field id="availableUntil" label="Last day to buy" error={errors["availableUntil"]}>
                  <Input
                    id="availableUntil"
                    data-field="availableUntil"
                    type="date"
                    value={form.availableUntil}
                    onChange={(e) => set("availableUntil", e.target.value)}
                    aria-invalid={!!errors["availableUntil"]}
                  />
                </Field>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  For seasonal offers like holiday cards or mini sessions.
                </p>
              )}
            </div>
          </Section>

          <div className="fixed inset-x-0 bottom-0 z-10 flex gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
            <Button type="submit" className="flex-1" disabled={!dirty && !!product}>
              {product ? "Save changes" : "Create product"}
            </Button>
            <Button type="button" variant="outline" onClick={cancel}>
              Cancel
            </Button>
          </div>
          {!preview.ok && Object.keys(errors).length === 0 && dirty ? (
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              Fill in the required fields to save.
            </p>
          ) : null}

          {product ? (
            <DeleteProduct
              name={product.name}
              onConfirm={() => {
                leaving.current = true;
                deleteProduct(product.id);
                toast.success(`${product.name} deleted`);
                void navigate({ to: "/store/products" });
              }}
            />
          ) : null}
        </div>
      </div>

      <AlertDialog open={blocker.status === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your edits to this product haven't been saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Panel className="space-y-4 p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </Panel>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {hint ? (
          <span className="text-[11px] tabular-nums text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function MoneyInput({
  id,
  value,
  onChange,
  invalid,
  label,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
  label?: string;
}) {
  return (
    <div className="relative sm:w-40">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        $
      </span>
      <Input
        id={id}
        data-field={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="pl-6"
        aria-invalid={invalid}
        aria-label={label}
      />
    </div>
  );
}

const PRINT_COLS = "sm:grid-cols-[1fr_5.5rem_5.5rem_6.5rem_5.5rem_3rem_2rem]";

function VariantRow({
  index,
  variant,
  errors,
  print = false,
  onChange,
  onRemove,
}: {
  index: number;
  variant: VariantForm;
  errors: ProductFormErrors;
  print?: boolean;
  onChange: (patch: Partial<VariantForm>) => void;
  onRemove: () => void;
}) {
  const nameKey = `variants.${index}.name`;
  const priceKey = `variants.${index}.price`;
  const costKey = `variants.${index}.cost`;
  const n = index + 1;
  const noun = print ? "Size" : "Variant";
  return (
    <div className="rounded-md border p-3 sm:border-0 sm:p-0">
      <div
        className={cn(
          "grid grid-cols-2 gap-2 sm:items-center",
          print ? PRINT_COLS : "sm:grid-cols-[1fr_7rem_7rem_4.5rem_2rem]",
        )}
      >
        <Input
          data-field={nameKey}
          value={variant.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={print ? "e.g. 11x14" : "e.g. 16x20"}
          aria-label={`${noun} ${n} name`}
          aria-invalid={!!errors[nameKey]}
          className="col-span-2 sm:col-span-1"
        />
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <Input
            data-field={priceKey}
            inputMode="decimal"
            value={variant.price}
            onChange={(e) => onChange({ price: e.target.value })}
            placeholder="0.00"
            className="pl-6"
            aria-label={`${noun} ${n} price`}
            aria-invalid={!!errors[priceKey]}
          />
        </div>
        {print ? (
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                data-field={costKey}
                inputMode="decimal"
                value={variant.cost}
                onChange={(e) => onChange({ cost: e.target.value })}
                placeholder="Cost"
                className="pl-6"
                aria-label={`${noun} ${n} lab cost`}
                aria-invalid={!!errors[costKey]}
              />
            </div>
            <p className="self-center text-[11px] tabular-nums" aria-label={`${noun} ${n} margin`}>
              <span className="text-muted-foreground sm:hidden">Margin </span>
              <MarginText price={variant.price} cost={variant.cost} />
            </p>
          </>
        ) : null}
        <Input
          value={variant.sku}
          onChange={(e) => onChange({ sku: e.target.value })}
          placeholder="SKU"
          aria-label={`${noun} ${n} SKU`}
        />
        <div className="flex items-center gap-2">
          <Switch
            checked={variant.available}
            onCheckedChange={(v) => onChange({ available: v })}
            aria-label={`${noun} ${n} ${print ? "for sale" : "in stock"}`}
          />
          <span className="text-[11px] text-muted-foreground sm:hidden">
            {print ? "For sale" : "In stock"}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${noun.toLowerCase()} ${n}`}
          className="justify-self-end rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {errors[nameKey] || errors[priceKey] || errors[costKey] ? (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {errors[nameKey] ?? errors[priceKey] ?? errors[costKey]}
        </p>
      ) : null}
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function CheckRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}

function ImageField({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string | undefined;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("That file isn't an image. Choose a JPEG, PNG or WebP.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Images must be under 15 MB.");
      return;
    }
    try {
      onChange(await downscale(file, 1200));
      toast.success("Image added");
    } catch {
      toast.error("We couldn't read that image. Try a different file.");
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <img
        src={productImage(value, 480, 360)}
        alt="Product preview"
        className="aspect-[4/3] w-full rounded-md border object-cover sm:w-48"
      />
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" data-field="image">
                <ImagePlus /> Choose from galleries
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="display-title text-xl">Choose an image</DialogTitle>
                <DialogDescription>Photos from your galleries.</DialogDescription>
              </DialogHeader>
              <div className="grid max-h-[60vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                {PRODUCT_IMAGE_CHOICES.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onChange(id);
                      setOpen(false);
                    }}
                    aria-label="Use this photo"
                    aria-pressed={value === id}
                    className={cn(
                      "overflow-hidden rounded-md ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      value === id && "ring-2 ring-foreground",
                    )}
                  >
                    <img
                      src={img(id, 240, 240)}
                      alt=""
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload /> Upload
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Upload product image"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void upload(file);
            }}
          />
        </div>
        <p className="max-w-xs text-[11px] leading-relaxed text-muted-foreground">
          Uploads are resized and kept in this browser only — publishing them to clients needs file
          storage, which isn't connected in this demo.
        </p>
        {error ? (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DeleteProduct({ name, onConfirm }: { name: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button type="button" className="text-xs text-destructive hover:underline">
          Delete product
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            It will be removed from your catalog and storefront. Past orders keep their line items.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Resize an image file to fit `max` px and re-encode as JPEG, so it fits in local storage. */
function downscale(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable image"));
    };
    image.src = url;
  });
}
