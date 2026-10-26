import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { money } from "@/lib/demo-data";
import type { LabId, PrintSettings, ProductVariant } from "@/lib/shop-data";
import {
  LABS,
  LAB_PRICE_LIST,
  describeFulfillment,
  margin,
  type LabSize,
  type PrintForm,
  type PrintOptionForm,
} from "@/lib/shop-print";

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Options such as Paper or Mounting, each with priced choices. */
export function PrintOptionsFields({
  options,
  onChange,
  errors,
}: {
  options: PrintOptionForm[];
  onChange: (options: PrintOptionForm[]) => void;
  errors: Record<string, string>;
}) {
  const patch = (i: number, next: Partial<PrintOptionForm>) =>
    onChange(options.map((o, j) => (j === i ? { ...o, ...next } : o)));

  return (
    <div className="space-y-3">
      {options.map((o, i) => {
        const n = i + 1;
        const error = errors[`print.options.${i}.name`] ?? errors[`print.options.${i}.choices`];
        return (
          <div key={o.id} className="rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Input
                data-field={`print.options.${i}.name`}
                value={o.name}
                onChange={(e) => patch(i, { name: e.target.value })}
                placeholder="Option name, e.g. Paper"
                aria-label={`Option ${n} name`}
                aria-invalid={!!errors[`print.options.${i}.name`]}
                className="h-8 sm:w-60"
              />
              <button
                type="button"
                onClick={() => onChange(options.filter((_, j) => j !== i))}
                aria-label={`Remove option ${n}`}
                className="ml-auto rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <ul className="mt-2 space-y-1.5">
              {o.choices.map((c, j) => (
                <li key={c.id} className="flex items-center gap-2">
                  <Input
                    value={c.label}
                    onChange={(e) =>
                      patch(i, {
                        choices: o.choices.map((x, k) =>
                          k === j ? { ...x, label: e.target.value } : x,
                        ),
                      })
                    }
                    placeholder="Choice, e.g. Matte"
                    aria-label={`Option ${n} choice ${j + 1}`}
                    className="h-8 min-w-0 flex-1"
                  />
                  <div className="relative w-28 shrink-0">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      +$
                    </span>
                    <Input
                      inputMode="decimal"
                      value={c.price}
                      onChange={(e) =>
                        patch(i, {
                          choices: o.choices.map((x, k) =>
                            k === j ? { ...x, price: e.target.value } : x,
                          ),
                        })
                      }
                      placeholder="0"
                      aria-label={`Option ${n} choice ${j + 1} add-on price`}
                      className="h-8 pl-7"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => patch(i, { choices: o.choices.filter((_, k) => k !== j) })}
                    aria-label={`Remove option ${n} choice ${j + 1}`}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() =>
                patch(i, { choices: [...o.choices, { id: newId("c"), label: "", price: "" }] })
              }
              className="mt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              + Add choice
            </button>
            {error ? (
              <p className="mt-1 text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() =>
          onChange([
            ...options,
            {
              id: newId("opt"),
              name: "",
              choices: [
                { id: newId("c"), label: "", price: "" },
                { id: newId("c"), label: "", price: "" },
              ],
            },
          ])
        }
      >
        <Plus /> Add option
      </Button>
      <p className="text-[11px] text-muted-foreground">
        The first choice is the default. Add-on prices are added to the size price at checkout.
      </p>
    </div>
  );
}

/** How a print product is produced and shipped. */
export function FulfillmentFields({
  value,
  onChange,
  errors,
  idPrefix,
}: {
  value: Pick<PrintForm, "method" | "lab" | "productionDays" | "shipTo">;
  onChange: (patch: Partial<PrintForm>) => void;
  errors: Record<string, string>;
  idPrefix: string;
}) {
  const id = (n: string) => `${idPrefix}-${n}`;
  return (
    <div className="space-y-4">
      <RadioGroup
        value={value.method}
        onValueChange={(v) => onChange({ method: v as PrintForm["method"] })}
        className="grid gap-2 sm:grid-cols-2"
        aria-label="Fulfillment method"
      >
        {(
          [
            ["lab", "Print lab", "A professional lab prints and ships the order."],
            ["self", "My studio", "You print or pack the order yourself."],
          ] as const
        ).map(([v, label, description]) => (
          <Label
            key={v}
            htmlFor={id(`method-${v}`)}
            className="flex cursor-pointer items-start gap-2.5 rounded-md border p-3 font-normal hover:bg-accent/40"
          >
            <RadioGroupItem id={id(`method-${v}`)} value={v} className="mt-0.5" />
            <span>
              <span className="block text-xs font-medium">{label}</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">{description}</span>
            </span>
          </Label>
        ))}
      </RadioGroup>

      <div className="grid gap-3 sm:grid-cols-2">
        {value.method === "lab" ? (
          <div className="space-y-1.5">
            <Label htmlFor={id("lab")}>Lab</Label>
            <Select value={value.lab} onValueChange={(v) => onChange({ lab: v as LabId })}>
              <SelectTrigger id={id("lab")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(LABS) as LabId[]).map((l) => (
                  <SelectItem key={l} value={l}>
                    {LABS[l].name} ({LABS[l].region})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor={id("days")}>Production time (working days)</Label>
          <Input
            id={id("days")}
            data-field="print.productionDays"
            inputMode="numeric"
            value={value.productionDays}
            onChange={(e) => onChange({ productionDays: e.target.value })}
            aria-invalid={!!errors["print.productionDays"]}
            className="sm:w-28"
          />
          {errors["print.productionDays"] ? (
            <p className="text-xs text-destructive" role="alert">
              {errors["print.productionDays"]}
            </p>
          ) : null}
        </div>
      </div>

      {value.method === "lab" ? (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Ship to</p>
          <RadioGroup
            value={value.shipTo}
            onValueChange={(v) => onChange({ shipTo: v as PrintForm["shipTo"] })}
            className="gap-2"
            aria-label="Ship to"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id={id("client")} value="client" />
              <Label htmlFor={id("client")} className="font-normal">
                Direct to the client (drop-ship)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id={id("studio")} value="studio" />
              <Label htmlFor={id("studio")} className="font-normal">
                My studio first, so I can inspect it
              </Label>
            </div>
          </RadioGroup>
        </div>
      ) : null}
    </div>
  );
}

/** Pick a size from the lab price list; adds it with cost and a marked-up price. */
export function LabSizePicker({ onPick }: { onPick: (size: LabSize) => void }) {
  const [value, setValue] = useState("");
  const groups = [...new Set(LAB_PRICE_LIST.map((s) => s.group))];
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const size = LAB_PRICE_LIST.find((s) => s.id === v);
        if (size) onPick(size);
        setValue("");
      }}
    >
      <SelectTrigger className="h-8 w-auto gap-2 text-xs" aria-label="Add size from lab price list">
        <SelectValue placeholder="Add from lab price list" />
      </SelectTrigger>
      <SelectContent>
        {groups.map((g) => (
          <SelectGroup key={g}>
            <SelectLabel>{g}</SelectLabel>
            {LAB_PRICE_LIST.filter((s) => s.group === g).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} — cost {money(s.cost)}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

/** "Price from lab cost": set every size with a known cost to cost + markup. */
export function MarkupTool({
  defaultPercent,
  disabled,
  onApply,
}: {
  defaultPercent: number;
  disabled: boolean;
  onApply: (percent: number) => void;
}) {
  const [percent, setPercent] = useState(String(defaultPercent));
  const n = Number(percent);
  const valid = /^\d+$/.test(percent) && n >= 0 && n <= 2000;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs">
      <Label htmlFor="markup" className="font-normal">
        Price from lab cost +
      </Label>
      <Input
        id="markup"
        inputMode="numeric"
        value={percent}
        onChange={(e) => setPercent(e.target.value)}
        className="h-7 w-16 bg-card text-xs"
        aria-invalid={!valid}
      />
      <span className="text-muted-foreground">% markup</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 bg-card text-xs"
        disabled={disabled || !valid}
        onClick={() => onApply(n)}
      >
        Apply to sizes
      </Button>
    </div>
  );
}

export function MarginText({ price, cost }: { price: string; cost: string }) {
  const m =
    /^\d+(\.\d{1,2})?$/.test(price) && /^\d+(\.\d{1,2})?$/.test(cost)
      ? margin(Number(price), Number(cost))
      : null;
  if (!m) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={m.profit < 0 ? "text-destructive" : "text-muted-foreground"}>
      {money(m.profit)} · {m.percent.toFixed(0)}%
    </span>
  );
}

/** Read-only summary for the product detail page. */
export function PrintSummary({ print, sizes }: { print: PrintSettings; sizes: ProductVariant[] }) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="border-b bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Size</th>
              <th className="px-3 py-2 text-right font-medium">Price</th>
              <th className="px-3 py-2 text-right font-medium">Lab cost</th>
              <th className="px-3 py-2 text-right font-medium">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y tabular-nums">
            {sizes.map((s) => {
              const m = margin(s.price, s.cost);
              return (
                <tr key={s.id} className={s.available ? "" : "text-muted-foreground"}>
                  <td className="px-3 py-2">
                    {s.name}
                    {s.available ? null : <span className="ml-1.5 text-[11px]">· unavailable</span>}
                  </td>
                  <td className="px-3 py-2 text-right">{money(s.price)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {s.cost === null ? "—" : money(s.cost)}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {m ? `${money(m.profit)} · ${m.percent.toFixed(0)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {print.options.length ? (
        <ul className="space-y-1 text-xs">
          {print.options.map((o) => (
            <li key={o.id}>
              <span className="font-medium">{o.name}:</span>{" "}
              <span className="text-muted-foreground">
                {o.choices
                  .map((c) => (c.price ? `${c.label} (+${money(c.price)})` : c.label))
                  .join(", ")}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs text-muted-foreground">{describeFulfillment(print.fulfillment)}</p>
    </div>
  );
}
