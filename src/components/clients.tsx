import { useState, type ReactNode } from "react";
import { Button, Field } from "@/components/kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useDemo, type NewClientInput } from "@/lib/store";
import type { Client, ClientSource, ClientType } from "@/lib/demo-data";
import {
  CLIENT_NAME_MAX,
  CLIENT_SOURCE_LABELS,
  CLIENT_TYPE_LABELS,
  parseTags,
  validateClientForm,
  type ClientFormErrors,
} from "@/lib/clients";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  company: "",
  city: "",
  type: "portrait" as ClientType,
  source: "website" as ClientSource,
  tags: "",
};

const formFrom = (c: Client): typeof EMPTY_FORM => ({
  name: c.name,
  email: c.email,
  phone: c.phone,
  company: c.company,
  city: c.city,
  type: c.type,
  source: c.source,
  tags: c.tags.join(", "),
});

/** Add a client, or edit one when `client` is given. */
export function ClientFormDialog({
  client,
  trigger,
  onSaved,
}: {
  client?: Client | undefined;
  trigger: ReactNode;
  onSaved: (c: Client) => void;
}) {
  const { state: demo, addClient, updateClient } = useDemo();
  const editing = !!client;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const errors: ClientFormErrors = validateClientForm(form, demo.clients, client?.id);
  // Show field errors once the user has tried to submit; a duplicate email shows right away.
  const visible = (k: keyof ClientFormErrors) =>
    submitted || (k === "email" && errors.email?.includes("already")) ? errors[k] : undefined;
  const describe = (k: keyof ClientFormErrors) =>
    visible(k) ? { "aria-invalid": true, "aria-describedby": `cf-${k}-error` } : {};

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    const input: NewClientInput = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      company: form.company.trim(),
      city: form.city.trim(),
      type: form.type,
      source: form.source,
      tags: parseTags(form.tags),
    };
    if (client) {
      updateClient(client.id, input);
      onSaved({ ...client, ...input });
    } else {
      onSaved(addClient(input));
    }
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setForm(client ? formFrom(client) : EMPTY_FORM);
          setSubmitted(false);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle className="display-title text-xl">
              {editing ? "Edit contact details" : "Add client"}
            </DialogTitle>
            <DialogDescription>
              Saved to this browser's demo data — nothing is sent to the client.
            </DialogDescription>
          </DialogHeader>

          <Field id="cf-name" label="Full name" required error={visible("name")}>
            <Input
              id="cf-name"
              autoFocus
              maxLength={CLIENT_NAME_MAX}
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Naledi Mokoena"
              {...describe("name")}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="cf-email" label="Email" required error={visible("email")}>
              <Input
                id="cf-email"
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) => set({ email: e.target.value })}
                placeholder="name@example.com"
                {...describe("email")}
              />
            </Field>
            <Field id="cf-phone" label="Phone" error={visible("phone")}>
              <Input
                id="cf-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value })}
                placeholder="(555) 010-0000"
                {...describe("phone")}
              />
            </Field>
            <Field id="cf-company" label="Company">
              <Input
                id="cf-company"
                value={form.company}
                onChange={(e) => set({ company: e.target.value })}
                placeholder="Optional"
              />
            </Field>
            <Field id="cf-city" label="City">
              <Input
                id="cf-city"
                value={form.city}
                onChange={(e) => set({ city: e.target.value })}
                placeholder="e.g. Cape Town"
              />
            </Field>
            <div className="space-y-1.5">
              <Label>Client type</Label>
              <Select value={form.type} onValueChange={(v) => set({ type: v as ClientType })}>
                <SelectTrigger aria-label="Client type">
                  <SelectValue>{CLIENT_TYPE_LABELS[form.type]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CLIENT_TYPE_LABELS) as ClientType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {CLIENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>How they found you</Label>
              <Select value={form.source} onValueChange={(v) => set({ source: v as ClientSource })}>
                <SelectTrigger aria-label="Lead source">
                  <SelectValue>{CLIENT_SOURCE_LABELS[form.source]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CLIENT_SOURCE_LABELS) as ClientSource[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {CLIENT_SOURCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Field id="cf-tags" label="Tags">
            <Input
              id="cf-tags"
              value={form.tags}
              onChange={(e) => set({ tags: e.target.value })}
              placeholder="Comma separated, e.g. Wedding 2025, Album"
            />
          </Field>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save changes" : "Add client"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
