import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Globe,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button, DemoNotice, PageHeader, Panel, TabBar, pageHead } from "@/components/kit";
import { ScrollRow, Segmented, WebsiteTabs } from "@/components/website";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWebsite } from "@/lib/website-store";
import { copyText, publishedLabel, siteUrl } from "@/lib/website";
import {
  REGISTRARS,
  SITE_HOST,
  dnsRecords,
  hostnameError,
  isApex,
  newCustomDomain,
  normalizeHostname,
  subdomainError,
  verifyRecords,
  type CustomDomain,
  type DomainStatus,
} from "@/lib/website-domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/website/domain")({
  head: () =>
    pageHead("Website Domain", "Connect a custom domain and set up DNS for your website."),
  component: DomainSettingsPage,
});

const STATUS: Record<DomainStatus, { label: string; className: string }> = {
  pending: { label: "Waiting for DNS", className: "bg-warning/15 text-warning" },
  verifying: { label: "Checking DNS…", className: "bg-info/12 text-info" },
  connected: { label: "Connected", className: "bg-success/12 text-success" },
  failed: { label: "Records not found", className: "bg-rose/12 text-rose" },
};

async function copy(value: string, what: string) {
  if (await copyText(value)) toast.success(`${what} copied`);
  else toast.error("Couldn't copy — your browser blocked clipboard access.");
}

function DomainSettingsPage() {
  const { site } = useWebsite();
  const custom = site.domain.custom;

  return (
    <div className="mx-auto max-w-5xl">
      <WebsiteTabs />
      <PageHeader title="Domain" description={`Visitors reach your site at ${siteUrl(site)}.`} />
      <div className="space-y-4">
        <SubdomainPanel />
        {custom ? <CustomDomainPanel domain={custom} /> : <AddDomainPanel />}
        <DemoNotice>
          Domains are simulated: nothing is registered and no DNS is checked. A real connection
          needs Pixora's DNS and certificate backend — here, “Check DNS” uses the records you tick
          off below.
        </DemoNotice>
      </div>
    </div>
  );
}

function SubdomainPanel() {
  const { site, update } = useWebsite();
  const [value, setValue] = useState(site.subdomain);
  const next = value.trim().toLowerCase();
  const error = next === site.subdomain ? null : subdomainError(next);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (next === site.subdomain) return;
    if (error) {
      toast.error(error);
      return;
    }
    update(() => ({ subdomain: next }));
    toast.success(`Your Pixora address is now ${next}.${SITE_HOST}`);
  };

  return (
    <Panel className="p-4 sm:p-5">
      <h2 className="text-sm font-medium">Pixora address</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Free and always available
        {site.domain.custom?.status === "connected" && site.domain.custom.primary
          ? " — it redirects to your custom domain."
          : "."}
      </p>
      <form onSubmit={save} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <div
            className={cn(
              "flex items-center rounded-md border bg-card pr-3 text-sm focus-within:ring-1 focus-within:ring-ring",
              error && "border-destructive",
            )}
          >
            <input
              id="subdomain"
              aria-label="Pixora subdomain"
              value={value}
              maxLength={30}
              aria-invalid={!!error}
              onChange={(e) => setValue(e.target.value.toLowerCase())}
              className="h-9 min-w-0 flex-1 bg-transparent px-3 outline-none"
            />
            <span className="shrink-0 text-muted-foreground">.{SITE_HOST}</span>
          </div>
          {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
        </div>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="h-9 bg-card"
          disabled={next === site.subdomain}
        >
          Save address
        </Button>
      </form>
    </Panel>
  );
}

function AddDomainPanel() {
  const { update } = useWebsite();
  const [input, setInput] = useState("");
  const [touched, setTouched] = useState(false);
  const host = normalizeHostname(input);
  const error = hostnameError(host);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (error) return;
    update((s) => ({ domain: { ...s.domain, custom: newCustomDomain(host, new Date()) } }));
    toast.success(`${host} added`, { description: "Now add the DNS records at your registrar." });
  };

  return (
    <Panel className="p-4 sm:p-5">
      <h2 className="text-sm font-medium">Custom domain</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Use a domain you own, like yourstudio.com or photos.yourstudio.com.
      </p>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Label htmlFor="custom-domain" className="sr-only">
            Domain
          </Label>
          <Input
            id="custom-domain"
            value={input}
            placeholder="yourstudio.com"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={touched && !!error}
            onChange={(e) => setInput(e.target.value)}
            onBlur={() => input && setTouched(true)}
            className="h-9"
          />
          {touched && error ? (
            <p className="mt-1 text-xs text-destructive">{error}</p>
          ) : host && host !== input.trim().toLowerCase() && !error ? (
            <p className="mt-1 text-xs text-muted-foreground">We'll use {host}</p>
          ) : null}
        </div>
        <Button type="submit" size="sm" className="h-9">
          <Globe /> Connect domain
        </Button>
      </form>
    </Panel>
  );
}

function CustomDomainPanel({ domain }: { domain: CustomDomain }) {
  const { update } = useWebsite();
  const [registrar, setRegistrar] = useState(REGISTRARS[0]!.id);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [lastCheck, setLastCheck] = useState<ReturnType<typeof verifyRecords> | null>(null);
  const records = dnsRecords(domain.hostname);
  const apex = isApex(domain.hostname);
  const steps = REGISTRARS.find((r) => r.id === registrar)?.steps ?? [];

  const patch = (p: Partial<CustomDomain>) =>
    update((s) =>
      s.domain.custom ? { domain: { ...s.domain, custom: { ...s.domain.custom, ...p } } } : {},
    );

  // Simulated DNS check, then certificate issuing.
  useEffect(() => {
    if (domain.status !== "verifying") return;
    const t = setTimeout(() => {
      const result = verifyRecords(domain);
      setLastCheck(result);
      patch({
        status: result.ok ? "connected" : "failed",
        lastCheckedAt: new Date().toISOString(),
        ssl: result.ok ? "issuing" : "none",
      });
      if (result.ok) toast.success(`${domain.hostname} is connected`);
      else
        toast.error("Some DNS records weren't found yet", {
          description: "DNS changes can take up to 48 hours.",
        });
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain.status]);

  useEffect(() => {
    if (domain.ssl !== "issuing") return;
    const t = setTimeout(() => patch({ ssl: "active" }), 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain.ssl]);

  const toggleAdded = (key: string, on: boolean) =>
    patch({ added: on ? [...domain.added, key] : domain.added.filter((k) => k !== key) });
  const found = (key: string) => lastCheck?.checks.find((c) => c.record.key === key)?.found;
  const status = STATUS[domain.status];

  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <span className="truncate">{domain.hostname}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold",
                status.className,
              )}
            >
              {domain.status === "verifying" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {status.label}
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {apex ? "Root domain" : "Subdomain"} · added{" "}
            {publishedLabel(domain.addedAt, new Date()).toLowerCase()}
            {domain.lastCheckedAt
              ? ` · last checked ${publishedLabel(domain.lastCheckedAt, new Date()).toLowerCase()}`
              : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {domain.status !== "connected" ? (
            <Button
              size="sm"
              disabled={domain.status === "verifying"}
              onClick={() => patch({ status: "verifying" })}
            >
              <RefreshCw className={cn(domain.status === "verifying" && "animate-spin")} />
              {domain.status === "verifying" ? "Checking…" : "Check DNS"}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="bg-card"
            onClick={() => setConfirmRemove(true)}
          >
            <Trash2 /> Remove
          </Button>
        </div>
      </div>

      {domain.status === "connected" ? (
        <ConnectedSettings domain={domain} onChange={patch} />
      ) : (
        <div className="mt-5">
          <h3 className="text-sm font-medium">Add these DNS records</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Sign in where you bought {apex ? domain.hostname : "your domain"}, add each record, then
            tick it off and check DNS.
          </p>

          <div className="mt-3 overflow-x-auto rounded-md border">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Added</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Name / Host</th>
                  <th className="px-3 py-2 font-medium">Value / Points to</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {records.map((r) => {
                  const f = found(r.key);
                  return (
                    <tr key={r.key} data-record={r.key}>
                      <td className="px-3 py-2.5">
                        <Checkbox
                          checked={domain.added.includes(r.key)}
                          onCheckedChange={(v) => toggleAdded(r.key, v === true)}
                          aria-label={`I've added the ${r.type} record for ${r.name}`}
                        />
                      </td>
                      <td className="px-3 py-2.5 font-mono font-semibold">{r.type}</td>
                      <td className="px-3 py-2.5">
                        <CopyValue value={r.name} label={`${r.type} name`} />
                      </td>
                      <td className="px-3 py-2.5">
                        <CopyValue value={r.value} label={`${r.type} value`} />
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{r.purpose}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        {f === undefined ? (
                          <span className="text-muted-foreground">Not checked</span>
                        ) : f ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Found
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose">
                            <AlertTriangle className="h-3.5 w-3.5" /> Not found
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            TTL: use your provider's default (or 1 hour). Remove any other A or CNAME records for
            the same name.
          </p>

          <div className="mt-5">
            <h3 className="text-sm font-medium">Step-by-step for your provider</h3>
            <ScrollRow className="mt-2">
              <TabBar
                value={registrar}
                onChange={setRegistrar}
                tabs={REGISTRARS.map((r) => ({ value: r.id, label: r.label }))}
              />
            </ScrollRow>
            <ol
              className="mt-3 list-decimal space-y-1.5 pl-5 text-xs"
              aria-label={`Steps for ${registrar}`}
            >
              {steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
              <li>Come back here, tick each record and press Check DNS.</li>
            </ol>
          </div>
        </div>
      )}

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {domain.hostname}?</AlertDialogTitle>
            <AlertDialogDescription>
              Your site will only be available at its Pixora address. You can reconnect the domain
              later; remember to remove the DNS records at your registrar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                update((s) => ({ domain: { ...s.domain, custom: null } }));
                toast.success("Custom domain removed");
              }}
            >
              Remove domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  );
}

function ConnectedSettings({
  domain,
  onChange,
}: {
  domain: CustomDomain;
  onChange: (patch: Partial<CustomDomain>) => void;
}) {
  const { site } = useWebsite();
  const apex = isApex(domain.hostname);
  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-xs">
        {domain.ssl === "active" ? (
          <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
        ) : (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        )}
        <span>
          {domain.ssl === "active"
            ? "SSL certificate active — your site loads securely over https."
            : "Issuing your SSL certificate…"}
        </span>
      </div>

      <label className="flex items-center justify-between gap-4">
        <span>
          <span className="block text-sm">Primary domain</span>
          <span className="block text-xs text-muted-foreground">
            {domain.primary
              ? `${site.subdomain}.${SITE_HOST} redirects here.`
              : `Visitors stay on ${site.subdomain}.${SITE_HOST}.`}
          </span>
        </span>
        <Switch
          checked={domain.primary}
          onCheckedChange={(v) => onChange({ primary: v })}
          aria-label="Primary domain"
        />
      </label>

      {apex ? (
        <Segmented
          label="Preferred address"
          value={domain.canonical}
          onChange={(v) => onChange({ canonical: v })}
          options={[
            ["apex", domain.hostname],
            ["www", `www.${domain.hostname}`],
          ]}
        />
      ) : null}

      <label className="flex items-center justify-between gap-4">
        <span>
          <span className="flex items-center gap-1.5 text-sm">
            <Lock className="h-3.5 w-3.5" /> Always use HTTPS
          </span>
          <span className="block text-xs text-muted-foreground">
            Redirect http:// visits to the secure address.
          </span>
        </span>
        <Switch
          checked={domain.forceHttps}
          disabled={domain.ssl !== "active"}
          onCheckedChange={(v) => onChange({ forceHttps: v })}
          aria-label="Always use HTTPS"
        />
      </label>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-success" /> Visitors reach your site at{" "}
        <button
          type="button"
          onClick={() => void copy(`https://${siteUrl(site)}`, "Site link")}
          className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
        >
          {siteUrl(site)} <Copy className="h-3 w-3" />
        </button>
      </p>
    </div>
  );
}

function CopyValue({ value, label }: { value: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => void copy(value, label)}
      title="Copy"
      aria-label={`Copy ${label}: ${value}`}
      className="group inline-flex max-w-full items-center gap-1.5 rounded bg-muted px-1.5 py-0.5 text-left font-mono hover:bg-accent"
    >
      <span className="break-all">{value}</span>
      <Copy className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100" />
    </button>
  );
}
