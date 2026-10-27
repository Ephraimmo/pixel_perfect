import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  Ban,
  Check,
  Eye,
  PenLine,
  RotateCcw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Field, PageError, Panel, pageHead } from "@/components/kit";
import {
  ContractDocument,
  ContractStatusBadge,
  MergeFieldMenu,
  SignatureProgress,
} from "@/components/contracts";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY } from "@/lib/demo-data";
import type { Contract } from "@/lib/contracts-data";
import {
  MERGE_FIELDS,
  contractContext,
  daysWaiting,
  isContractEditable,
  renderMerge,
  signatureMatches,
} from "@/lib/contracts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/contracts/$id")({
  head: () => pageHead("Contract", "Edit, preview and track signatures."),
  component: ContractPage,
  errorComponent: ({ reset }) => <PageError title="Couldn't load this contract" reset={reset} />,
});

const fieldLabel = (key: string) => MERGE_FIELDS.find((f) => f.key === key)?.label ?? key;
const stamp = (iso: string) => format(new Date(iso), "MMM d, yyyy 'at' h:mm a");

function ContractPage() {
  const { id } = Route.useParams();
  const { state: demo, ready } = useDemo();
  const contract = demo.contracts.find((c) => c.id === id);

  if (!ready)
    return (
      <div
        className="mx-auto max-w-6xl space-y-4"
        aria-busy="true"
        aria-label="Loading contract"
        role="status"
      >
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[28rem] rounded-lg" />
          <Skeleton className="h-[28rem] rounded-lg" />
        </div>
      </div>
    );
  if (!contract)
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="Contract not found"
          description="It may have been deleted, or the link is incomplete."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/contracts">View all contracts</Link>
            </Button>
          }
        />
      </div>
    );
  return <ContractView key={contract.id} contract={contract} />;
}

function ContractView({ contract: c }: { contract: Contract }) {
  const {
    state: demo,
    updateContract,
    sendContract,
    deleteContract,
    restoreContract,
    reviseContract,
  } = useDemo();
  const goTo = useNavigate();
  const client = demo.clients.find((x) => x.id === c.clientId);
  const project = demo.projects.find((p) => p.id === c.projectId);
  const editable = isContractEditable(c);
  const [title, setTitle] = useState(c.title);
  const [body, setBody] = useState(c.body);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const dirty = editable && (title !== c.title || body !== c.body);
  const ctx = contractContext(c, demo, DEMO_TODAY);
  const merged = renderMerge(editable ? body : c.body, ctx);
  const shownText = !editable && c.sentBody ? c.sentBody : merged.text;

  const save = () => {
    if (!title.trim()) {
      toast.error("Give the contract a title.");
      return false;
    }
    updateContract(c.id, { title: title.trim(), body });
    return true;
  };

  const send = () => {
    if (!body.trim()) {
      toast.error("The contract is empty.");
      return;
    }
    if (merged.missing.length) {
      toast.error("Some fields have no value yet", {
        description: merged.missing.map(fieldLabel).join(", "),
      });
      return;
    }
    if (!save()) return;
    sendContract(c.id, merged.text);
    toast.success(`Sent to ${client?.name ?? "the client"} for signature`, {
      description: "You countersigned as the photographer. Demo — no email is sent.",
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/contracts"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Contracts
      </Link>
      <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="display-title text-2xl">{c.title}</h1>
            <ContractStatusBadge status={c.status} />
            {dirty ? <span className="text-xs text-warning">Unsaved changes</span> : null}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {client ? (
              <Link to="/clients/$id" params={{ id: client.id }} className="hover:underline">
                {client.name}
              </Link>
            ) : (
              "Unknown client"
            )}
            {project ? (
              <>
                {" · "}
                <Link to="/projects/$id" params={{ id: project.id }} className="hover:underline">
                  {project.name}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        {editable ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                deleteContract(c.id);
                void goTo({ to: "/contracts" });
                toast("Draft deleted", {
                  action: { label: "Undo", onClick: () => restoreContract(c) },
                });
              }}
            >
              <Trash2 /> Delete
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-card"
              disabled={!dirty}
              onClick={() => save() && toast.success("Draft saved")}
            >
              {dirty ? "Save draft" : "Saved"}
            </Button>
            <Button size="sm" onClick={send}>
              <Send /> Send for signature
            </Button>
          </div>
        ) : null}
      </div>

      {editable ? (
        <>
          <div
            className="mb-3 inline-flex rounded-md border bg-card p-0.5 text-xs lg:hidden"
            role="group"
            aria-label="Editor view"
          >
            {(["edit", "preview"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded px-3 py-1 capitalize",
                  view === v ? "bg-accent font-medium" : "text-muted-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <section
              className={cn(
                "min-w-0 space-y-4 rounded-lg border bg-card p-4 shadow-soft",
                view === "preview" && "max-lg:hidden",
              )}
            >
              <Field id="ct-title" label="Title" required>
                <Input id="ct-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <div className="space-y-1.5">
                <Label>Project</Label>
                <Select
                  value={c.projectId ?? "none"}
                  onValueChange={(v) =>
                    updateContract(c.id, { projectId: v === "none" ? undefined : v })
                  }
                >
                  <SelectTrigger aria-label="Project">
                    <SelectValue>{project?.name ?? "No project"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {demo.projects
                      .filter((p) => p.clientId === c.clientId)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-end justify-between gap-2">
                  <Label htmlFor="ct-body">Contract text</Label>
                  <MergeFieldMenu textareaRef={textarea} value={body} onChange={setBody} />
                </div>
                <Textarea
                  id="ct-body"
                  ref={textarea}
                  rows={22}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="font-mono text-xs leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Use <code>## </code> for headings and <code>1. </code> for numbered clauses.
                </p>
              </div>
              {merged.missing.length ? (
                <p
                  className="flex gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs"
                  role="status"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                  <span>
                    No value yet for: {merged.missing.map(fieldLabel).join(", ")}.
                    {merged.missing.some((m) => m.startsWith("project.") || m === "deposit")
                      ? " Link a project to fill these in."
                      : merged.missing.includes("session.date")
                        ? " Book a session for this client first."
                        : ""}
                  </span>
                </p>
              ) : null}
            </section>
            <div
              className={cn(
                "min-w-0 lg:sticky lg:top-20 lg:self-start",
                view === "edit" && "max-lg:hidden",
              )}
            >
              <p className="eyebrow mb-2">Client preview</p>
              <ContractDocument text={shownText} contract={c} clientName={client?.name ?? ""} />
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <ContractDocument text={shownText} contract={c} clientName={client?.name ?? ""} />
          <SignaturePanel
            contract={c}
            clientName={client?.name ?? "the client"}
            onRevise={() => reviseContract(c.id)}
          />
        </div>
      )}
    </div>
  );
}

function SignaturePanel({
  contract: c,
  clientName,
  onRevise,
}: {
  contract: Contract;
  clientName: string;
  onRevise: () => void;
}) {
  const { markContractViewed, remindContract, voidContract } = useDemo();
  const [dialog, setDialog] = useState<"sign" | "decline" | null>(null);
  const waiting = daysWaiting(c, DEMO_TODAY);
  const awaiting = c.status === "sent" || c.status === "viewed";

  const steps: { label: string; detail?: string | undefined; done: boolean; tone?: "rose" }[] = [
    {
      label: "Sent & countersigned",
      detail: c.sentAt ? `${stamp(c.sentAt)} by ${c.studioSignature?.name ?? "you"}` : undefined,
      done: !!c.sentAt,
    },
    {
      label: "Viewed by client",
      detail: c.viewedAt ? stamp(c.viewedAt) : undefined,
      done: !!c.viewedAt,
    },
    c.status === "declined"
      ? { label: "Declined", detail: c.declineReason, done: true, tone: "rose" }
      : c.status === "void"
        ? { label: "Voided", detail: "No longer valid", done: true, tone: "rose" }
        : {
            label: "Signed by client",
            detail: c.clientSignature
              ? `${stamp(c.clientSignature.signedAt)} as “${c.clientSignature.name}”`
              : undefined,
            done: c.status === "signed",
          },
  ];

  return (
    <aside className="space-y-4">
      <Panel className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Signature status</h2>
          <SignatureProgress contract={c} />
        </div>
        {awaiting && waiting !== null ? (
          <p
            className={cn(
              "mt-1 text-xs",
              waiting >= 5 ? "font-medium text-warning" : "text-muted-foreground",
            )}
          >
            Waiting on {clientName} for {waiting} {waiting === 1 ? "day" : "days"}
            {c.remindedAt ? ` · reminded ${format(new Date(c.remindedAt), "MMM d")}` : ""}
          </p>
        ) : null}
        <ol className="mt-4 space-y-4 border-l pl-4">
          {steps.map((s) => (
            <li key={s.label} className="relative text-xs">
              <span
                className={cn(
                  "absolute -left-[1.45rem] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-card",
                  s.done
                    ? s.tone === "rose"
                      ? "bg-rose text-white"
                      : "bg-success text-white"
                    : "border bg-card",
                )}
              >
                {s.done ? (
                  s.tone === "rose" ? (
                    <X className="h-2.5 w-2.5" />
                  ) : (
                    <Check className="h-2.5 w-2.5" />
                  )
                ) : null}
              </span>
              <p className={cn("font-medium", !s.done && "text-muted-foreground")}>{s.label}</p>
              {s.detail ? <p className="text-muted-foreground">{s.detail}</p> : null}
            </li>
          ))}
        </ol>
      </Panel>

      {awaiting ? (
        <Panel className="space-y-2 p-4">
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start bg-card"
            onClick={() => {
              remindContract(c.id);
              toast.success(`Reminder sent to ${clientName}`, {
                description: "Demo — no email is sent.",
              });
            }}
          >
            <BellRing /> Send reminder
          </Button>
          <div className="rounded-md border border-dashed p-3">
            <p className="text-[11px] font-medium text-muted-foreground">Client actions (demo)</p>
            <div className="mt-2 space-y-2">
              {c.status === "sent" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start bg-card"
                  onClick={() => {
                    markContractViewed(c.id);
                    toast(`${clientName} opened the contract`);
                  }}
                >
                  <Eye /> Client opens contract
                </Button>
              ) : null}
              <Button size="sm" className="w-full justify-start" onClick={() => setDialog("sign")}>
                <PenLine /> Client signs
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setDialog("decline")}
              >
                <X /> Client declines
              </Button>
            </div>
          </div>
        </Panel>
      ) : null}

      {c.status !== "signed" ? (
        <Panel className="space-y-2 p-4">
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start bg-card"
            onClick={() => {
              onRevise();
              toast("Back to draft — the client's link no longer works until you resend.");
            }}
          >
            <RotateCcw /> Revise &amp; resend
          </Button>
          {c.status !== "void" ? (
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                voidContract(c.id);
                toast("Contract voided");
              }}
            >
              <Ban /> Void contract
            </Button>
          ) : null}
        </Panel>
      ) : (
        <p className="rounded-md bg-success/10 px-3 py-2 text-xs text-success">
          Fully signed — this is the final record and can't be edited.
        </p>
      )}

      <SignDialog
        contract={c}
        clientName={clientName}
        open={dialog === "sign"}
        onClose={() => setDialog(null)}
      />
      <DeclineDialog contract={c} open={dialog === "decline"} onClose={() => setDialog(null)} />
    </aside>
  );
}

function SignDialog({
  contract: c,
  clientName,
  open,
  onClose,
}: {
  contract: Contract;
  clientName: string;
  open: boolean;
  onClose: () => void;
}) {
  const { signContract } = useDemo();
  const [typed, setTyped] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const nameOk = signatureMatches(typed, clientName);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
        else {
          setTyped("");
          setAgree(false);
          setSubmitted(false);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
            if (!nameOk || !agree) return;
            // Matching ignores case and spacing, so record the name as it appears on the contract.
            signContract(c.id, clientName);
            toast.success("Contract signed", { description: `${clientName} signed ${c.title}.` });
            onClose();
          }}
        >
          <DialogHeader>
            <DialogTitle className="display-title text-xl">Sign as {clientName}</DialogTitle>
            <DialogDescription>
              Demo of the client's signing step: type their full name to sign electronically.
            </DialogDescription>
          </DialogHeader>
          <Field
            id="sg-name"
            label="Full name"
            required
            error={
              submitted && !nameOk
                ? `Type “${clientName}” exactly as it appears on the contract.`
                : undefined
            }
          >
            <Input
              id="sg-name"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
            />
          </Field>
          <div className="flex h-14 items-end rounded-md border bg-muted/30 px-3 pb-2">
            <span className="truncate font-display text-3xl italic">{typed || " "}</span>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={agree}
              onCheckedChange={(v) => setAgree(v === true)}
              className="mt-0.5"
            />
            <span>I have read the agreement and agree to sign it electronically.</span>
          </label>
          {submitted && !agree ? (
            <p className="-mt-2 text-xs text-destructive">Please confirm you agree.</p>
          ) : null}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <PenLine /> Sign contract
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeclineDialog({
  contract: c,
  open,
  onClose,
}: {
  contract: Contract;
  open: boolean;
  onClose: () => void;
}) {
  const { declineContract } = useDemo();
  const [reason, setReason] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
        else setReason("");
      }}
    >
      <DialogContent className="max-w-md">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const r = reason.trim() || "No reason given";
            declineContract(c.id, r);
            toast(`${c.title} declined`, { description: r });
            onClose();
          }}
        >
          <DialogHeader>
            <DialogTitle className="display-title text-xl">Client declines</DialogTitle>
            <DialogDescription>Record why, so you can revise and resend.</DialogDescription>
          </DialogHeader>
          <Field id="dc-reason" label="Reason">
            <Textarea
              id="dc-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Wants a shorter licence period"
            />
          </Field>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive">
              Record decline
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
