import { useState, type ReactNode, type RefObject } from "react";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { Braces, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, StatusBadge } from "@/components/kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useDemo } from "@/lib/store";
import type { Contract, ContractSignature, ContractStatus } from "@/lib/contracts-data";
import { CONTRACT_STATUS_LABELS, MERGE_FIELDS, parseBlocks } from "@/lib/contracts";
import { cn } from "@/lib/utils";

const TONE: Record<ContractStatus, string> = {
  draft: "draft",
  sent: "sent",
  viewed: "sent",
  signed: "paid",
  declined: "cancelled",
  void: "archived",
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return <StatusBadge status={TONE[status]} label={CONTRACT_STATUS_LABELS[status]} />;
}

/** Three dots for sent → viewed → signed, so progress reads at a glance in lists. */
export function SignatureProgress({ contract: c }: { contract: Contract }) {
  if (c.status === "draft" || c.status === "void" || c.status === "declined") return null;
  const steps = [
    ["Sent", !!c.sentAt],
    ["Viewed", !!c.viewedAt],
    ["Signed", c.status === "signed"],
  ] as const;
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`Signature progress: ${steps
        .filter(([, d]) => d)
        .map(([l]) => l)
        .join(", ")}`}
    >
      {steps.map(([label, doneStep]) => (
        <span
          key={label}
          title={label}
          className={cn(
            "h-1.5 w-4 rounded-full",
            doneStep ? "bg-success" : "bg-muted-foreground/25",
          )}
        />
      ))}
    </span>
  );
}

/** Render inline text, highlighting any {{field}} that couldn't be filled. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\{\{\s*[\w.]+\s*\}\})/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\{\{/.test(p) ? (
          <mark
            key={i}
            className="rounded bg-warning/20 px-0.5 text-warning"
            title="This field has no value yet"
          >
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}

function SignatureLine({ label, sig }: { label: string; sig?: ContractSignature | undefined }) {
  return (
    <div className="min-w-0">
      <p
        className={cn(
          "h-9 truncate border-b font-display text-2xl italic leading-9",
          !sig && "text-transparent",
        )}
      >
        {sig?.name ?? "—"}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {label}
        {sig
          ? ` · signed ${format(new Date(sig.signedAt), "MMM d, yyyy 'at' h:mm a")}`
          : " · not signed yet"}
      </p>
    </div>
  );
}

export function ContractDocument({
  text,
  contract,
  clientName,
  className,
}: {
  text: string;
  contract?: Pick<Contract, "studioSignature" | "clientSignature" | "status"> | undefined;
  clientName: string;
  className?: string;
}) {
  const blocks = parseBlocks(text);
  return (
    <article
      aria-label="Contract preview"
      className={cn(
        "relative rounded-lg border bg-card px-6 py-6 text-sm leading-relaxed shadow-soft sm:px-8",
        className,
      )}
    >
      {contract?.status === "void" ? (
        <span className="absolute right-5 top-5 rotate-6 rounded border-2 border-muted-foreground/60 px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Void
        </span>
      ) : null}
      {blocks.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          Start writing — your contract appears here.
        </p>
      ) : (
        <div className="space-y-3">
          {blocks.map((b, i) =>
            b.kind === "heading" ? (
              i === 0 ? (
                <h2 key={i} className="display-title text-xl">
                  <Inline text={b.text} />
                </h2>
              ) : (
                <h3 key={i} className="pt-2 text-sm font-semibold">
                  <Inline text={b.text} />
                </h3>
              )
            ) : b.kind === "list" ? (
              <ol key={i} className="list-decimal space-y-1.5 pl-5 marker:text-muted-foreground">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </ol>
            ) : (
              <p key={i}>
                <Inline text={b.text} />
              </p>
            ),
          )}
        </div>
      )}
      <div className="mt-8 grid gap-6 border-t pt-5 sm:grid-cols-2">
        <SignatureLine label="Photographer" sig={contract?.studioSignature} />
        <SignatureLine label={clientName || "Client"} sig={contract?.clientSignature} />
      </div>
    </article>
  );
}

/** Inserts {{field}} at the textarea's cursor. */
export function MergeFieldMenu({
  textareaRef,
  value,
  onChange,
  fields = MERGE_FIELDS,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  value: string;
  onChange: (next: string) => void;
  fields?: { key: string; label: string }[];
}) {
  const insert = (key: string) => {
    const el = textareaRef.current;
    const token = `{{${key}}}`;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + token + value.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="h-8 bg-card text-xs">
          <Braces /> Insert field
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {fields.map((f) => (
          <DropdownMenuItem
            key={f.key}
            onSelect={() => insert(f.key)}
            className="flex justify-between gap-2"
          >
            {f.label}
            <code className="text-[10px] text-muted-foreground">{`{{${f.key}}}`}</code>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Create a draft contract from a template for a client (and project). */
export function NewContractDialog({
  trigger,
  defaultClientId = "",
  defaultProjectId = "",
  defaultTemplateId = "",
}: {
  trigger?: ReactNode;
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultTemplateId?: string;
}) {
  const { state: demo, createContract } = useDemo();
  const goTo = useNavigate();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(defaultClientId);
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [templateId, setTemplateId] = useState(defaultTemplateId);
  const [title, setTitle] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const projects = demo.projects.filter((p) => p.clientId === clientId && !p.archived);
  const template = demo.contractTemplates.find((t) => t.id === templateId);
  const finalTitle = title.trim() || template?.name || "";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setClientId(defaultClientId);
          setProjectId(defaultProjectId);
          setTemplateId(defaultTemplateId || demo.contractTemplates[0]?.id || "");
          setTitle("");
          setSubmitted(false);
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus /> New Contract
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
            if (!clientId || !finalTitle) return;
            const c = createContract({
              title: finalTitle,
              clientId,
              projectId: projectId || undefined,
              templateId: templateId || undefined,
            });
            toast.success("Draft contract created");
            setOpen(false);
            void goTo({ to: "/contracts/$id", params: { id: c.id } });
          }}
        >
          <DialogHeader>
            <DialogTitle className="display-title text-xl">New contract</DialogTitle>
            <DialogDescription>
              Start from a template — merge fields fill in from the client and project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select
              value={clientId}
              onValueChange={(v) => {
                setClientId(v);
                setProjectId("");
              }}
            >
              <SelectTrigger aria-label="Client" aria-invalid={submitted && !clientId}>
                <SelectValue placeholder="Choose a client">
                  {demo.clients.find((c) => c.id === clientId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {demo.clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {submitted && !clientId ? (
              <p className="text-xs text-destructive">Choose a client.</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label>Project</Label>
            <Select
              value={projectId || "none"}
              disabled={!clientId}
              onValueChange={(v) => setProjectId(v === "none" ? "" : v)}
            >
              <SelectTrigger aria-label="Project">
                <SelectValue>
                  {projects.find((p) => p.id === projectId)?.name ?? "No project"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Template</Label>
            <Select
              value={templateId || "blank"}
              onValueChange={(v) => setTemplateId(v === "blank" ? "" : v)}
            >
              <SelectTrigger aria-label="Template">
                <SelectValue>{template?.name ?? "Blank contract"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {demo.contractTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
                <SelectItem value="blank">Blank contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field
            id="nc-title"
            label="Title"
            error={submitted && !finalTitle ? "Give the contract a title." : undefined}
          >
            <Input
              id="nc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={template?.name ?? "e.g. Session agreement"}
            />
          </Field>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create draft</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
