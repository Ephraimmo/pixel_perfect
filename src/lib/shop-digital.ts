// Digital download settings — labels, summaries, the delivery email template
// and form validation. Pure; there is no file storage or email service in the
// demo, so nothing here creates real download links or sends mail.

import { formatDate } from "./demo-data";
import type {
  DeliveryEmail,
  DigitalFile,
  DigitalResolution,
  DigitalScope,
  DigitalSettings,
} from "./shop-data";

export const SCOPE_LABELS: Record<DigitalScope, { label: string; description: string }> = {
  single: {
    label: "One photo",
    description: "The client picks a photo from their gallery at checkout.",
  },
  gallery: { label: "Whole gallery", description: "Every edited photo in the client's gallery." },
  files: {
    label: "Uploaded files",
    description: "Files you upload, e.g. a slideshow or preset pack.",
  },
};

export const RESOLUTION_LABELS: Record<DigitalResolution, { label: string; description: string }> =
  {
    original: { label: "Original", description: "Full resolution, as exported" },
    high: { label: "High (4000px)", description: "Prints up to 16x20" },
    web: { label: "Web (2048px)", description: "Social media and screens" },
  };

/** Short phrases describing how a digital product is delivered. */
export function describeDigital(d: DigitalSettings): string[] {
  return [
    `${SCOPE_LABELS[d.scope].label} · ${RESOLUTION_LABELS[d.resolution].label} resolution`,
    d.delivery === "instant"
      ? "Download link emailed as soon as payment clears"
      : `Delivered by you within ${d.manualDays} ${d.manualDays === 1 ? "day" : "days"}`,
    `${d.downloadLimit === null ? "Unlimited downloads" : `${d.downloadLimit} ${d.downloadLimit === 1 ? "download" : "downloads"} per purchase`} · ${
      d.expiryDays === null ? "link never expires" : `link expires after ${d.expiryDays} days`
    }`,
    d.printRelease ? "Includes a personal-use print release" : "No print release",
  ];
}

export const EMAIL_PLACEHOLDERS = [
  { token: "{client_name}", description: "Client's first name" },
  { token: "{product_name}", description: "What they bought" },
  { token: "{download_link}", description: "Their private download link" },
  { token: "{expiry}", description: "When the link expires" },
  { token: "{studio_name}", description: "Your studio name" },
] as const;

export interface EmailVars {
  clientName: string;
  productName: string;
  studioName: string;
  downloadLink: string;
  /** ISO date the link expires, or null for never. */
  expiresOn: string | null;
}

/** Fill the template's placeholders; unknown {tokens} are left as typed. */
export function renderDeliveryEmail(email: DeliveryEmail, vars: EmailVars) {
  const values: Record<string, string> = {
    "{client_name}": vars.clientName,
    "{product_name}": vars.productName,
    "{studio_name}": vars.studioName,
    "{download_link}": vars.downloadLink,
    "{expiry}": vars.expiresOn
      ? `This link expires on ${formatDate(vars.expiresOn)}.`
      : "This link doesn't expire.",
  };
  const fill = (text: string) => text.replace(/\{[a-z_]+\}/g, (t) => values[t] ?? t);
  return { subject: fill(email.subject), body: fill(email.body) };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

// ---------- form ----------

export interface DigitalForm {
  scope: DigitalScope;
  resolution: DigitalResolution;
  limitDownloads: boolean;
  downloadLimit: string;
  expires: boolean;
  expiryDays: string;
  delivery: "instant" | "manual";
  manualDays: string;
  printRelease: boolean;
  files: DigitalFile[];
}

export function digitalToForm(d: DigitalSettings | Omit<DigitalSettings, "files">): DigitalForm {
  return {
    scope: d.scope,
    resolution: d.resolution,
    limitDownloads: d.downloadLimit !== null,
    downloadLimit: d.downloadLimit === null ? "3" : String(d.downloadLimit),
    expires: d.expiryDays !== null,
    expiryDays: d.expiryDays === null ? "30" : String(d.expiryDays),
    delivery: d.delivery,
    manualDays: String(d.manualDays),
    printRelease: d.printRelease,
    files: "files" in d ? d.files : [],
  };
}

const wholeIn = (raw: string, min: number, max: number): number | null => {
  if (!/^\d+$/.test(raw.trim())) return null;
  const n = Number(raw);
  return n >= min && n <= max ? n : null;
};

/** Errors are keyed `digital.<field>` so they sit alongside the product form's. */
export function validateDigitalForm(
  f: DigitalForm,
  { requireFiles }: { requireFiles: boolean },
): { settings: DigitalSettings | null; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const downloadLimit = f.limitDownloads ? wholeIn(f.downloadLimit, 1, 100) : null;
  if (f.limitDownloads && downloadLimit === null)
    errors["digital.downloadLimit"] = "Allow between 1 and 100 downloads.";
  const expiryDays = f.expires ? wholeIn(f.expiryDays, 1, 365) : null;
  if (f.expires && expiryDays === null)
    errors["digital.expiryDays"] = "Links can stay valid for 1 to 365 days.";
  const manualDays =
    f.delivery === "manual" ? wholeIn(f.manualDays, 1, 60) : Number(f.manualDays) || 7;
  if (f.delivery === "manual" && manualDays === null)
    errors["digital.manualDays"] = "Promise delivery within 1 to 60 days.";
  if (requireFiles && f.scope === "files" && f.files.length === 0)
    errors["digital.files"] = "Add at least one file for clients to download.";
  if (Object.keys(errors).length) return { settings: null, errors };
  return {
    settings: {
      scope: f.scope,
      resolution: f.resolution,
      downloadLimit,
      expiryDays,
      delivery: f.delivery,
      manualDays: manualDays ?? 7,
      printRelease: f.printRelease,
      files: f.scope === "files" ? f.files : [],
    },
    errors,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateDeliveryEmail(e: DeliveryEmail): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!e.senderName.trim()) errors["senderName"] = "Add the name clients will see.";
  if (!EMAIL_RE.test(e.replyTo.trim())) errors["replyTo"] = "Enter a valid email address.";
  if (!e.subject.trim()) errors["subject"] = "Add a subject line.";
  if (!e.body.includes("{download_link}"))
    errors["body"] = "Include {download_link} so clients can get their files.";
  return errors;
}
