import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useDemo } from "@/lib/store";
import { img, money, type Product } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/store/")({
  head: () => pageHead("Products", "Prints, digital downloads and packages for sale."),
  component: Products,
});

type Tab = "all" | "popular" | "digital" | "package";

function Products() {
  const { state: demo, toggleProduct } = useDemo();
  const [tab, setTab] = useState<Tab>("all");
  const rows = demo.products.filter((p) =>
    tab === "all" ? true : tab === "popular" ? p.popular : p.category === tab,
  );

  return (
    <div className="mx-auto max-w-5xl">
      <StoreTabs />
      <PageHeader title="Products" actions={<AddProductDialog />} />

      <TabBar
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "all", label: "All" },
          { value: "popular", label: "Popular" },
          { value: "digital", label: "Digital" },
          { value: "package", label: "Packages" },
        ]}
      />

      <Panel className="mt-4">
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No products in this view" />
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <img
                  src={img(p.image, 120, 120)}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{money(p.price)}</p>
                </div>
                <span className="hidden text-xs capitalize text-muted-foreground sm:block">
                  {p.category}
                </span>
                <StatusBadge status={p.active ? "active" : "inactive"} />
                <Switch
                  checked={p.active}
                  aria-label={p.active ? `Deactivate ${p.name}` : `Activate ${p.name}`}
                  onCheckedChange={() => {
                    toggleProduct(p.id);
                    toast.success(`${p.name} ${p.active ? "hidden from" : "listed in"} your store`);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function AddProductDialog() {
  const { addProduct } = useDemo();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<Product["category"]>("print");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(price);
    if (!(amount > 0)) {
      toast.error("Enter a price above zero.");
      return;
    }
    addProduct({ name: name.trim(), price: amount, category });
    toast.success(`${name.trim()} added`);
    setOpen(false);
    setName("");
    setPrice("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="display-title text-xl">New product</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="np-name">Name</Label>
            <Input
              id="np-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 11x14 Fine Art Print"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="np-price">Price (USD)</Label>
              <Input
                id="np-price"
                type="number"
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Product["category"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="print">Print</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="package">Package</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add product</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
