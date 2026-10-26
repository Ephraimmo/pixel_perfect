import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Copy, MoreHorizontal, Plus, Search, Shuffle, X } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  TabBar,
  pageHead,
} from "@/components/kit";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { StoreTabs } from "@/components/store-tabs";
import { useShop } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { DEMO_TODAY, formatDate, money } from "@/lib/demo-data";
import type { Coupon, CouponType, ProductCategory } from "@/lib/shop-data";
import {
  COUPON_STATUS_LABELS,
  COUPON_TYPE_LABELS,
  couponStatus,
  couponToForm,
  describeDiscount,
  describeValidity,
  emptyCouponForm,
  evaluateCoupon,
  generateCode,
  validateCouponForm,
  type CouponForm,
  type CouponStatus,
} from "@/lib/shop-coupons";

type StatusFilter = "all" | CouponStatus;
const STATUS_TABS: StatusFilter[] = [
  "all",
  "active",
  "scheduled",
  "expired",
  "used-up",
  "disabled",
];

export const Route = createFileRoute("/_app/store/coupons")({
  head: () => pageHead("Coupons", "Discount codes with validity dates and usage limits."),
  validateSearch: (raw: Record<string, unknown>): { status?: CouponStatus; q?: string } => {
    const out: { status?: CouponStatus; q?: string } = {};
    const status = raw["status"];
    if (
      typeof status === "string" &&
      status !== "all" &&
      STATUS_TABS.includes(status as StatusFilter)
    )
      out.status = status as CouponStatus;
    if (typeof raw["q"] === "string" && raw["q"].trim()) out.q = raw["q"];
    return out;
  },
  component: Coupons,
});

const statusTone: Record<CouponStatus, string> = {
  active: "active",
  scheduled: "shipped",
  expired: "archived",
  "used-up": "pending",
  disabled: "inactive",
};

function Coupons() {
  const { state: shop, toggleCoupon, deleteCoupon } = useShop();
  const { status = "all", q = "" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  const setSearch = (patch: { status?: StatusFilter; q?: string }) =>
    void navigate({
      search: (prev) => {
        const next = { ...prev, ...patch };
        return {
          ...(next.status && next.status !== "all" ? { status: next.status } : {}),
          ...(next.q?.trim() ? { q: next.q } : {}),
        };
      },
      replace: true,
    });

  const withStatus = shop.coupons.map((c) => ({ coupon: c, status: couponStatus(c) }));
  const counts = Object.fromEntries(
    STATUS_TABS.map((s) => [
      s,
      s === "all" ? withStatus.length : withStatus.filter((x) => x.status === s).length,
    ]),
  ) as Record<StatusFilter, number>;
  const needle = q.trim().toLowerCase();
  const rows = withStatus.filter(
    (x) =>
      (status === "all" || x.status === status) &&
      (!needle ||
        x.coupon.code.toLowerCase().includes(needle) ||
        x.coupon.description.toLowerCase().includes(needle)),
  );

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`${code} copied`);
    } catch {
      toast.error("Couldn't copy — select the code and copy it manually.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <StoreTabs />
      <PageHeader
        title="Coupons"
        description={`${counts.active} active ${counts.active === 1 ? "code" : "codes"} · ${shop.coupons.reduce((s, c) => s + c.uses, 0)} redemptions`}
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus /> New coupon
          </Button>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setSearch({ q: e.target.value })}
          placeholder="Search codes"
          aria-label="Search coupons"
          className="h-9 w-full rounded-md border bg-card pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring sm:max-w-xs"
        />
      </div>

      <TabBar
        className="mt-4"
        value={status}
        onChange={(v) => setSearch({ status: v })}
        tabs={STATUS_TABS.map((s) => ({
          value: s,
          label: `${s === "all" ? "All" : COUPON_STATUS_LABELS[s]} (${counts[s]})`,
        }))}
      />

      <Panel className="mt-3">
        {shop.coupons.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No coupons yet"
              description="Create a discount code for a promotion or a thank-you to past clients."
              action={
                <Button size="sm" onClick={() => setEditing("new")}>
                  <Plus /> New coupon
                </Button>
              }
            />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            No {status === "all" ? "" : COUPON_STATUS_LABELS[status].toLowerCase()} coupons
            {needle ? ` match "${q}"` : ""}.
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map(({ coupon: c, status: st }) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0 flex-1 basis-48">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditing(c)}
                      className="font-mono text-sm font-semibold tracking-wide hover:underline"
                    >
                      {c.code}
                    </button>
                    <button
                      type="button"
                      onClick={() => void copy(c.code)}
                      aria-label={`Copy ${c.code}`}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {describeDiscount(c)}
                    {c.minSubtotal !== null ? ` · min. ${money(c.minSubtotal)}` : ""}
                    {c.oncePerCustomer ? " · once per customer" : ""}
                    {c.description ? ` · ${c.description}` : ""}
                  </p>
                </div>
                <p className="w-44 text-xs text-muted-foreground">{describeValidity(c)}</p>
                <UsageMeter uses={c.uses} limit={c.usageLimit} />
                <StatusBadge status={statusTone[st]} label={COUPON_STATUS_LABELS[st]} />
                <div className="ml-auto flex items-center gap-1">
                  <Switch
                    checked={c.active}
                    aria-label={c.active ? `Disable ${c.code}` : `Enable ${c.code}`}
                    onCheckedChange={() => {
                      toggleCoupon(c.id);
                      toast.success(`${c.code} ${c.active ? "disabled" : "enabled"}`);
                    }}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`More actions for ${c.code}`}
                      className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(c)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void copy(c.code)}>
                        Copy code
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={() => setDeleting(c)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <CodeTester coupons={shop.coupons} />

      {editing ? (
        <CouponDialog
          key={editing === "new" ? "new" : editing.id}
          coupon={editing === "new" ? null : editing}
          others={shop.coupons.filter((c) => editing === "new" || c.id !== editing.id)}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Clients won't be able to use this code. To pause it instead, switch it off.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleting) return;
                deleteCoupon(deleting.id);
                toast.success(`${deleting.code} deleted`);
                setDeleting(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UsageMeter({ uses, limit }: { uses: number; limit: number | null }) {
  const pct = limit ? Math.min(100, (uses / limit) * 100) : 0;
  return (
    <div className="w-28 text-[11px] text-muted-foreground">
      <p className="tabular-nums">
        {uses} {limit === null ? "used · no limit" : `/ ${limit} used`}
      </p>
      {limit !== null ? (
        <div
          className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
          role="meter"
          aria-label="Uses"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={uses}
        >
          <div
            className={cn("h-full rounded-full", pct >= 100 ? "bg-warning" : "bg-primary/70")}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function CouponDialog({
  coupon,
  others,
  onClose,
}: {
  coupon: Coupon | null;
  others: Coupon[];
  onClose: () => void;
}) {
  const { createCoupon, updateCoupon } = useShop();
  const [form, setForm] = useState<CouponForm>(coupon ? couponToForm(coupon) : emptyCouponForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof CouponForm>(key: K, value: CouponForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors(({ [key]: _, ...rest }) => rest);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = validateCouponForm(form, others, coupon?.uses ?? 0);
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    if (coupon) {
      updateCoupon(coupon.id, r.coupon);
      toast.success(`${r.coupon.code} saved`);
    } else {
      createCoupon(r.coupon);
      toast.success(`${r.coupon.code} created`);
    }
    onClose();
  };

  const preview = validateCouponForm({ ...form, code: form.code || "PREVIEW" }, [], 0);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle className="display-title text-xl">
              {coupon ? `Edit ${coupon.code}` : "New coupon"}
            </DialogTitle>
            <DialogDescription>
              {preview.ok
                ? describeDiscount(preview.coupon)
                : "Set the discount, dates and limits."}
            </DialogDescription>
          </DialogHeader>

          <F id="cp-code" label="Code" error={errors["code"]}>
            <div className="flex gap-2">
              <Input
                id="cp-code"
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="SUMMER20"
                className="font-mono uppercase"
                aria-invalid={!!errors["code"]}
                autoComplete="off"
              />
              <Button type="button" variant="outline" onClick={() => set("code", generateCode())}>
                <Shuffle /> Generate
              </Button>
            </div>
          </F>
          <F id="cp-desc" label="Internal note (optional)">
            <Input
              id="cp-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="e.g. Instagram giveaway"
            />
          </F>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <F id="cp-type" label="Discount">
              <Select value={form.type} onValueChange={(v) => set("type", v as CouponType)}>
                <SelectTrigger id="cp-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COUPON_TYPE_LABELS) as CouponType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {COUPON_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
            {form.type !== "free-shipping" ? (
              <F
                id="cp-value"
                label={form.type === "percent" ? "Percent off" : "Amount off (USD)"}
                error={errors["value"]}
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {form.type === "percent" ? "%" : "$"}
                  </span>
                  <Input
                    id="cp-value"
                    inputMode="decimal"
                    value={form.value}
                    onChange={(e) => set("value", e.target.value)}
                    className="pl-7"
                    aria-invalid={!!errors["value"]}
                  />
                </div>
              </F>
            ) : null}
          </div>

          <F id="cp-scope" label="Applies to">
            <Select
              value={form.appliesTo}
              onValueChange={(v) => set("appliesTo", v as CouponForm["appliesTo"])}
            >
              <SelectTrigger id="cp-scope" className="sm:w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Entire order</SelectItem>
                {(["print", "digital", "package"] as ProductCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "print"
                      ? "Prints only"
                      : c === "digital"
                        ? "Digital downloads only"
                        : "Packages only"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>

          <div className="space-y-1.5">
            <Check
              id="cp-hasmin"
              label="Minimum order amount"
              checked={form.hasMinimum}
              onChange={(v) => set("hasMinimum", v)}
            />
            {form.hasMinimum ? (
              <div className="relative ml-6 w-36">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  aria-label="Minimum order amount (USD)"
                  inputMode="decimal"
                  value={form.minSubtotal}
                  onChange={(e) => set("minSubtotal", e.target.value)}
                  className="pl-6"
                  aria-invalid={!!errors["minSubtotal"]}
                />
              </div>
            ) : null}
            <Err message={errors["minSubtotal"]} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <F id="cp-start" label="Starts" error={errors["startsOn"]}>
              <Input
                id="cp-start"
                type="date"
                value={form.startsOn}
                onChange={(e) => set("startsOn", e.target.value)}
                aria-invalid={!!errors["startsOn"]}
              />
            </F>
            <F id="cp-end" label="Ends (optional)" error={errors["endsOn"]}>
              <Input
                id="cp-end"
                type="date"
                value={form.endsOn}
                onChange={(e) => set("endsOn", e.target.value)}
                aria-invalid={!!errors["endsOn"]}
              />
            </F>
          </div>

          <div className="space-y-1.5">
            <Check
              id="cp-haslimit"
              label="Limit total uses"
              checked={form.hasLimit}
              onChange={(v) => set("hasLimit", v)}
            />
            {form.hasLimit ? (
              <Input
                aria-label="Total uses allowed"
                inputMode="numeric"
                value={form.usageLimit}
                onChange={(e) => set("usageLimit", e.target.value)}
                className="ml-6 w-36"
                aria-invalid={!!errors["usageLimit"]}
              />
            ) : null}
            <Err message={errors["usageLimit"]} />
            <Check
              id="cp-once"
              label="One use per customer"
              checked={form.oncePerCustomer}
              onChange={(v) => set("oncePerCustomer", v)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
            <Label htmlFor="cp-active">Enabled</Label>
            <Switch
              id="cp-active"
              checked={form.active}
              onCheckedChange={(v) => set("active", v)}
            />
          </div>
          {coupon ? (
            <p className="text-[11px] text-muted-foreground">
              Used {coupon.uses} {coupon.uses === 1 ? "time" : "times"} on paid orders.
            </p>
          ) : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{coupon ? "Save coupon" : "Create coupon"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Try a code against a sample cart to check the rules before sharing it. */
function CodeTester({ coupons }: { coupons: Coupon[] }) {
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("120");
  const [category, setCategory] = useState<ProductCategory>("print");
  const [result, setResult] = useState<ReturnType<typeof evaluateCoupon> | null>(null);

  const test = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = Number(amount) || 0;
    setResult(
      evaluateCoupon(code, coupons, {
        lines: [{ category, amount: subtotal }],
        shipping: category === "digital" ? 0 : 12,
      }),
    );
  };

  return (
    <Panel className="mt-5 p-4">
      <h2 className="text-sm font-semibold">Test a code</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Check how a code behaves on a sample cart, as of today ({formatDate(DEMO_TODAY)}).
      </p>
      <form onSubmit={test} className="mt-3 flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="test-code" className="text-xs">
            Code
          </Label>
          <Input
            id="test-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setResult(null);
            }}
            className="h-9 w-40 font-mono uppercase"
            placeholder="SPRING15"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="test-amount" className="text-xs">
            Cart subtotal
          </Label>
          <Input
            id="test-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setResult(null);
            }}
            className="h-9 w-28"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="test-cat" className="text-xs">
            Items
          </Label>
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v as ProductCategory);
              setResult(null);
            }}
          >
            <SelectTrigger id="test-cat" className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="print">Prints</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="package">Packages</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" variant="outline" size="sm" className="h-9">
          Test
        </Button>
      </form>
      {result ? (
        <p
          role="status"
          className={cn(
            "mt-3 flex items-center gap-1.5 text-xs",
            result.ok ? "text-success" : "text-destructive",
          )}
        >
          {result.ok ? null : <X className="h-3.5 w-3.5" />}
          {result.ok
            ? `${result.coupon.code} applies: ${
                result.freeShipping ? "free shipping" : `${money(result.discount)} off`
              }${result.note ? ` — ${result.note}` : ""}`
            : result.reason}
        </p>
      ) : null}
    </Panel>
  );
}

function F({
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
      <Err message={error} />
    </div>
  );
}

function Err({ message }: { message?: string | undefined }) {
  return message ? (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}

function Check({
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
