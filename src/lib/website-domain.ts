// Website domains — the free pixora.site address and an optional custom
// domain, with the DNS records a photographer must add at their registrar.
// There is no DNS backend: verification is simulated from the checklist the
// photographer ticks off (see verifyRecords).

export const SITE_HOST = "pixora.site";
/** Target for CNAME records (demo value). */
export const CNAME_TARGET = `sites.${SITE_HOST}`;
/** Address for apex A records (documentation-range IP: this is demo data). */
export const APEX_IP = "198.51.100.24";

export type DomainStatus = "pending" | "verifying" | "connected" | "failed";

export interface CustomDomain {
  hostname: string;
  status: DomainStatus;
  addedAt: string; // ISO
  lastCheckedAt: string | null; // ISO
  /** Record keys the photographer says they've added at their registrar. */
  added: string[];
  /** Serve the site on this domain (the pixora.site address redirects to it). */
  primary: boolean;
  /** Which form visitors are sent to. */
  canonical: "apex" | "www";
  forceHttps: boolean;
  ssl: "none" | "issuing" | "active";
}

export interface DomainSettings {
  custom: CustomDomain | null;
}

export const RESERVED_SUBDOMAINS = [
  "www",
  "app",
  "admin",
  "api",
  "mail",
  "help",
  "sites",
  "pixora",
];
/** Demo stand-in for addresses other photographers already use. */
export const TAKEN_SUBDOMAINS = ["studio", "photos", "wedding", "weddings", "portraits"];

export function subdomainError(sub: string): string | null {
  if (sub.length < 3) return "Use at least 3 characters.";
  if (sub.length > 30) return "Use 30 characters or fewer.";
  if (!/^[a-z0-9-]+$/.test(sub)) return "Use lowercase letters, numbers and hyphens only.";
  if (sub.startsWith("-") || sub.endsWith("-")) return "Can't start or end with a hyphen.";
  if (RESERVED_SUBDOMAINS.includes(sub)) return "That address is reserved.";
  if (TAKEN_SUBDOMAINS.includes(sub)) return "That address is already taken.";
  return null;
}

/** Turn whatever was pasted ("https://www.Example.com/about") into a bare hostname. */
export function normalizeHostname(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

export function hostnameError(host: string): string | null {
  if (!host) return "Enter your domain, like yourstudio.com.";
  if (host.length > 253) return "That domain is too long.";
  const labels = host.split(".");
  if (labels.length < 2) return "Include the ending, like .com or .co.za.";
  if (labels.some((l) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(l))) {
    return "Domains use letters, numbers, hyphens and dots only.";
  }
  if (!/^[a-z]{2,}$/.test(labels[labels.length - 1]!)) return "That ending doesn't look right.";
  if (host === SITE_HOST || host.endsWith(`.${SITE_HOST}`)) {
    return "That's a Pixora address — change it under Pixora address instead.";
  }
  return null;
}

/** Common two-part endings, so "studio.co.za" counts as a root domain. */
const TWO_PART_SUFFIXES = [
  "co.za",
  "org.za",
  "co.uk",
  "org.uk",
  "com.au",
  "net.au",
  "co.nz",
  "com.br",
  "co.in",
];

/** The registrable root of a hostname, e.g. "www.studio.co.za" → "studio.co.za". */
export function rootDomain(host: string): string {
  const labels = host.split(".");
  const suffix2 = labels.slice(-2).join(".");
  const take = TWO_PART_SUFFIXES.includes(suffix2) ? 3 : 2;
  return labels.slice(-take).join(".");
}

/** A root domain (studio.com) rather than a subdomain (photos.studio.com). */
export function isApex(host: string): boolean {
  return rootDomain(host) === host;
}

/** Stable per-domain verification token (demo — a backend would issue this). */
export function verificationToken(host: string): string {
  let h = 2166136261;
  for (const ch of host) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return `pixora-verify=${(h >>> 0).toString(36)}${host.length.toString(36)}`;
}

export interface DnsRecord {
  /** Stable key for the checklist. */
  key: string;
  type: "A" | "CNAME" | "TXT";
  /** Host/name field as most registrars expect it (relative to the root domain). */
  name: string;
  value: string;
  purpose: string;
}

export function dnsRecords(host: string): DnsRecord[] {
  const root = rootDomain(host);
  const relative = host === root ? "@" : host.slice(0, -(root.length + 1));
  const verifyName = relative === "@" ? "_pixora" : `_pixora.${relative}`;
  const records: DnsRecord[] = [];
  if (relative === "@") {
    records.push(
      { key: "a", type: "A", name: "@", value: APEX_IP, purpose: `Points ${host} to Pixora` },
      {
        key: "www",
        type: "CNAME",
        name: "www",
        value: CNAME_TARGET,
        purpose: `Points www.${host} to Pixora`,
      },
    );
  } else {
    records.push({
      key: "cname",
      type: "CNAME",
      name: relative,
      value: CNAME_TARGET,
      purpose: `Points ${host} to Pixora`,
    });
  }
  records.push({
    key: "txt",
    type: "TXT",
    name: verifyName,
    value: verificationToken(host),
    purpose: "Proves you own the domain",
  });
  return records;
}

export function newCustomDomain(host: string, now: Date): CustomDomain {
  return {
    hostname: host,
    status: "pending",
    addedAt: now.toISOString(),
    lastCheckedAt: null,
    added: [],
    primary: true,
    canonical: "apex",
    forceHttps: true,
    ssl: "none",
  };
}

export interface RecordCheck {
  record: DnsRecord;
  found: boolean;
}

/** Simulated DNS lookup: a record is "found" if it's ticked on the checklist. */
export function verifyRecords(d: CustomDomain): { checks: RecordCheck[]; ok: boolean } {
  const checks = dnsRecords(d.hostname).map((record) => ({
    record,
    found: d.added.includes(record.key),
  }));
  return { checks, ok: checks.every((c) => c.found) };
}

/** The address visitors use: the custom domain once connected and primary. */
export function publicHost(subdomain: string, domain: DomainSettings | undefined): string {
  const c = domain?.custom;
  if (c && c.status === "connected" && c.primary) {
    return c.canonical === "www" && isApex(c.hostname) ? `www.${c.hostname}` : c.hostname;
  }
  return `${subdomain}.${SITE_HOST}`;
}

export const REGISTRARS: { id: string; label: string; steps: string[] }[] = [
  {
    id: "cloudflare",
    label: "Cloudflare",
    steps: [
      "Open your domain in the Cloudflare dashboard and go to DNS → Records.",
      "Click Add record for each record below.",
      "Set Proxy status to “DNS only” (grey cloud) so Pixora can issue your certificate.",
    ],
  },
  {
    id: "godaddy",
    label: "GoDaddy",
    steps: [
      "Go to My Products, find your domain and choose DNS.",
      "Delete any existing A record for @ (it points to GoDaddy's parking page).",
      "Click Add New Record for each record below. Leave TTL as the default.",
    ],
  },
  {
    id: "namecheap",
    label: "Namecheap",
    steps: [
      "Go to Domain List → Manage → Advanced DNS.",
      "Remove the default URL Redirect and parking records.",
      "Click Add New Record for each record below. Use “@” for the root.",
    ],
  },
  {
    id: "squarespace",
    label: "Squarespace / Google",
    steps: [
      "Open Domains, choose your domain, then DNS → DNS settings.",
      "Under Custom records, add each record below.",
      "Remove Squarespace's default records for @ and www if they conflict.",
    ],
  },
  {
    id: "other",
    label: "Other",
    steps: [
      "Sign in where you bought your domain and find the DNS or Name server settings.",
      "Add each record below exactly as shown. Some providers want the full name (e.g. www.yourstudio.com) instead of “www”.",
      "Changes usually appear within an hour but can take up to 48 hours.",
    ],
  },
];
