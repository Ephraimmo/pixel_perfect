import { useRef } from "react";
import { Download, FileArchive, Paperclip, X } from "lucide-react";
import { Button } from "@/components/kit";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { DigitalResolution, DigitalScope, DigitalSettings } from "@/lib/shop-data";
import {
  RESOLUTION_LABELS,
  SCOPE_LABELS,
  describeDigital,
  formatBytes,
  type DigitalForm,
} from "@/lib/shop-digital";

/**
 * Download & delivery fields. `withFiles` adds the "Uploaded files" option and file
 * list (per product); store-wide defaults leave it out.
 */
export function DigitalSettingsFields({
  value,
  onChange,
  errors,
  withFiles,
  idPrefix,
}: {
  value: DigitalForm;
  onChange: (patch: Partial<DigitalForm>) => void;
  errors: Record<string, string>;
  withFiles: boolean;
  idPrefix: string;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const scopes = (Object.keys(SCOPE_LABELS) as DigitalScope[]).filter(
    (s) => withFiles || s !== "files",
  );

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">What clients get</legend>
        <RadioGroup
          value={value.scope}
          onValueChange={(v) => onChange({ scope: v as DigitalScope })}
          className={cn("grid gap-2", withFiles ? "sm:grid-cols-3" : "sm:grid-cols-2")}
        >
          {scopes.map((s) => (
            <Label
              key={s}
              htmlFor={id(`scope-${s}`)}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-md border p-3 font-normal transition-colors hover:bg-accent/40",
                value.scope === s && "border-foreground/40 bg-accent/40",
              )}
            >
              <RadioGroupItem id={id(`scope-${s}`)} value={s} className="mt-0.5" />
              <span>
                <span className="block text-xs font-medium">{SCOPE_LABELS[s].label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                  {SCOPE_LABELS[s].description}
                </span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </fieldset>

      {withFiles && value.scope === "files" ? (
        <FileList
          files={value.files}
          error={errors["digital.files"]}
          onChange={(files) => onChange({ files })}
        />
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor={id("resolution")}>Resolution</Label>
          <Select
            value={value.resolution}
            onValueChange={(v) => onChange({ resolution: v as DigitalResolution })}
          >
            <SelectTrigger id={id("resolution")} className="sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RESOLUTION_LABELS) as DigitalResolution[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {RESOLUTION_LABELS[r].label} — {RESOLUTION_LABELS[r].description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div role="group" aria-labelledby={id("delivery-label")} className="space-y-2 border-t pt-4">
        <p id={id("delivery-label")} className="mb-2 text-sm font-medium">
          Delivery
        </p>
        <RadioGroup
          value={value.delivery}
          onValueChange={(v) => onChange({ delivery: v as DigitalForm["delivery"] })}
          className="gap-2.5"
        >
          <div className="flex items-start gap-2.5">
            <RadioGroupItem id={id("instant")} value="instant" className="mt-0.5" />
            <Label htmlFor={id("instant")} className="font-normal">
              <span className="block text-xs font-medium">Instantly after payment</span>
              <span className="block text-[11px] text-muted-foreground">
                The download link is emailed as soon as the payment provider confirms payment.
              </span>
            </Label>
          </div>
          <div className="flex items-start gap-2.5">
            <RadioGroupItem id={id("manual")} value="manual" className="mt-0.5" />
            <Label htmlFor={id("manual")} className="font-normal">
              <span className="block text-xs font-medium">I'll deliver after editing</span>
              <span className="block text-[11px] text-muted-foreground">
                The order waits for you to upload final files, then the client is emailed.
              </span>
            </Label>
          </div>
        </RadioGroup>
        {value.delivery === "manual" ? (
          <InlineNumber
            id={id("manualDays")}
            field="digital.manualDays"
            label="Deliver within"
            unit="days"
            value={value.manualDays}
            onChange={(v) => onChange({ manualDays: v })}
            error={errors["digital.manualDays"]}
          />
        ) : null}
      </div>

      <div className="space-y-3 border-t pt-4">
        <p className="text-sm font-medium">Download access</p>
        <CheckWithNumber
          id={id("limit")}
          field="digital.downloadLimit"
          label="Limit downloads"
          checked={value.limitDownloads}
          onCheck={(v) => onChange({ limitDownloads: v })}
          value={value.downloadLimit}
          onValue={(v) => onChange({ downloadLimit: v })}
          unit="downloads per purchase"
          off="Unlimited downloads"
          error={errors["digital.downloadLimit"]}
        />
        <CheckWithNumber
          id={id("expires")}
          field="digital.expiryDays"
          label="Expire the download link"
          checked={value.expires}
          onCheck={(v) => onChange({ expires: v })}
          value={value.expiryDays}
          onValue={(v) => onChange({ expiryDays: v })}
          unit="days after delivery"
          off="Link never expires"
          error={errors["digital.expiryDays"]}
        />
        <div className="flex items-start justify-between gap-3 pt-1">
          <div>
            <Label htmlFor={id("release")}>Include a print release</Label>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              A PDF letting the client print the photos for personal use.
            </p>
          </div>
          <Switch
            id={id("release")}
            checked={value.printRelease}
            onCheckedChange={(v) => onChange({ printRelease: v })}
          />
        </div>
      </div>
    </div>
  );
}

function InlineNumber({
  id,
  field,
  label,
  unit,
  value,
  onChange,
  error,
}: {
  id: string;
  field: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
}) {
  return (
    <div className="pl-6">
      <div className="flex items-center gap-2 text-xs">
        <Label htmlFor={id} className="font-normal">
          {label}
        </Label>
        <Input
          id={id}
          data-field={field}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-16"
          aria-invalid={!!error}
        />
        <span className="text-muted-foreground">{unit}</span>
      </div>
      {error ? (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CheckWithNumber({
  id,
  field,
  label,
  checked,
  onCheck,
  value,
  onValue,
  unit,
  off,
  error,
}: {
  id: string;
  field: string;
  label: string;
  checked: boolean;
  onCheck: (v: boolean) => void;
  value: string;
  onValue: (v: string) => void;
  unit: string;
  off: string;
  error?: string | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Checkbox id={id} checked={checked} onCheckedChange={(v) => onCheck(v === true)} />
        <Label htmlFor={id}>{label}</Label>
      </div>
      {checked ? (
        <InlineNumber
          id={`${id}-value`}
          field={field}
          label="Allow"
          unit={unit}
          value={value}
          onChange={onValue}
          error={error}
        />
      ) : (
        <p className="pl-6 text-[11px] text-muted-foreground">{off}</p>
      )}
    </div>
  );
}

function FileList({
  files,
  error,
  onChange,
}: {
  files: DigitalForm["files"];
  error?: string | undefined;
  onChange: (files: DigitalForm["files"]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Files</p>
      {files.length ? (
        <ul className="divide-y rounded-md border">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2.5 px-3 py-2 text-xs">
              <FileArchive className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatBytes(f.size)}
              </span>
              <button
                type="button"
                onClick={() => onChange(files.filter((x) => x.id !== f.id))}
                aria-label={`Remove ${f.name}`}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        data-field="digital.files"
        onClick={() => input.current?.click()}
      >
        <Paperclip /> Add files
      </Button>
      <input
        ref={input}
        type="file"
        multiple
        className="hidden"
        aria-label="Add download files"
        onChange={(e) => {
          const picked = [...(e.target.files ?? [])].map((f) => ({
            id: `f-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
            name: f.name,
            size: f.size,
          }));
          e.target.value = "";
          if (picked.length) onChange([...files, ...picked]);
        }}
      />
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Only file names and sizes are recorded in this demo. Delivering real files needs cloud file
        storage that can issue private, expiring download links.
      </p>
    </div>
  );
}

/** Read-only summary for the product detail page. */
export function DigitalSummary({ digital }: { digital: DigitalSettings }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold">
        <Download className="h-3.5 w-3.5" /> Download & delivery
      </p>
      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
        {describeDigital(digital).map((line) => (
          <li key={line}>{line}</li>
        ))}
        {digital.scope === "files"
          ? digital.files.map((f) => (
              <li key={f.id} className="flex items-center gap-1.5">
                <FileArchive className="h-3.5 w-3.5" /> {f.name} · {formatBytes(f.size)}
              </li>
            ))
          : null}
      </ul>
    </div>
  );
}
