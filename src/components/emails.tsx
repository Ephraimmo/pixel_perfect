import { useState, type ReactNode } from "react";
import { AlertTriangle, CalendarClock, FlaskConical, Mail, Send } from "lucide-react";
import { toast } from "sonner";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, nowStamp } from "@/lib/demo-data";
import { addDaysIso } from "@/lib/invoices";
import {
  emailValues,
  fieldLabel,
  missingReason,
  renderEmail,
  validateEmailDraft,
} from "@/lib/emails";
import { cn } from "@/lib/utils";

/** Text with any {{field}} that couldn't be filled highlighted. */
export function Highlighted({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\{\{\s*[\w.]+\s*\}\})/g).map((p, i) =>
        /^\{\{/.test(p) ? (
          <mark key={i} className="rounded bg-warning/20 px-0.5 text-warning">
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}

export function EmailPreview({
  from,
  to,
  subject,
  body,
  className,
}: {
  from: string;
  to: string;
  subject: string;
  body: string;
  className?: string;
}) {
  return (
    <article
      aria-label="Email preview"
      className={cn("overflow-hidden rounded-lg border bg-card shadow-soft", className)}
    >
      <dl className="space-y-1 border-b bg-muted/40 px-4 py-3 text-xs">
        <div className="flex gap-2">
          <dt className="w-12 shrink-0 text-muted-foreground">From</dt>
          <dd className="min-w-0 truncate">{from}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-12 shrink-0 text-muted-foreground">To</dt>
          <dd className="min-w-0 truncate">
            {to || <span className="text-muted-foreground">Choose a recipient</span>}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-12 shrink-0 text-muted-foreground">Subject</dt>
          <dd className="min-w-0 font-medium">
            {subject ? (
              <Highlighted text={subject} />
            ) : (
              <span className="text-muted-foreground">No subject</span>
            )}
          </dd>
        </div>
      </dl>
      <div className="whitespace-pre-wrap break-words px-4 py-4 text-sm leading-relaxed">
        {body ? (
          <Highlighted text={body} />
        ) : (
          <span className="text-muted-foreground">Your message appears here.</span>
        )}
      </div>
    </article>
  );
}

const nowLocal = () => nowStamp().slice(0, 16);

/**
 * Compose and send (or schedule) an email to a client, optionally from a
 * template. Uncontrolled with a trigger, or controlled via `open`.
 */
export function ComposeEmailDialog({
  trigger,
  defaultClientId = "",
  defaultTemplateId = "",
  open: openProp,
  onOpenChange,
}: {
  trigger?: ReactNode;
  defaultClientId?: string;
  defaultTemplateId?: string;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const { state: demo, sendEmail } = useDemo();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const [clientId, setClientId] = useState(defaultClientId);
  const [templateId, setTemplateId] = useState(defaultTemplateId);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<"now" | "later">("now");
  const [scheduleAt, setScheduleAt] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const client = demo.clients.find((c) => c.id === clientId);
  const from = `${demo.profile.name} · ${demo.profile.studio} <${demo.profile.email}>`;

  const fill = (cid: string, tid: string) => {
    const t = demo.emailTemplates.find((x) => x.id === tid);
    if (!t) return;
    const r = renderEmail(t, emailValues(cid, demo, DEMO_TODAY, window.location.origin));
    setSubject(r.subject);
    setBody(r.body);
  };

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setClientId(defaultClientId);
      setTemplateId(defaultTemplateId);
      setSubject("");
      setBody("");
      setMode("now");
      setScheduleAt(`${addDaysIso(DEMO_TODAY, 1)}T09:00`);
      setSubmitted(false);
      if (defaultTemplateId) {
        const t = demo.emailTemplates.find((x) => x.id === defaultTemplateId);
        if (t) {
          const r = renderEmail(
            t,
            emailValues(
              defaultClientId,
              demo,
              DEMO_TODAY,
              typeof window === "undefined" ? undefined : window.location.origin,
            ),
          );
          setSubject(r.subject);
          setBody(r.body);
        }
      }
    }
  }
  const setOpen = (o: boolean) => {
    setOpenState(o);
    onOpenChange?.(o);
  };

  const draft = {
    to: client?.email ?? "",
    subject,
    body,
    scheduleAt: mode === "later" ? scheduleAt : undefined,
  };
  const errors = validateEmailDraft(draft, nowLocal());
  const missing = [
    ...new Set([...`${subject}\n${body}`.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]!)),
  ];
  const shown = (k: keyof typeof errors) => (submitted ? errors[k] : undefined);

  const send = (test: boolean) => {
    setSubmitted(true);
    const e = test
      ? validateEmailDraft({ ...draft, to: demo.profile.email, scheduleAt: undefined }, nowLocal())
      : errors;
    if (Object.keys(e).length) {
      toast.error(test ? "Fix the subject and message first." : "Check the highlighted fields.");
      return;
    }
    sendEmail({
      clientId: test ? "" : clientId,
      to: test ? demo.profile.email : draft.to,
      subject,
      body,
      templateId: templateId || undefined,
      scheduleAt: test ? undefined : draft.scheduleAt,
    });
    toast.success(
      test
        ? `Test sent to ${demo.profile.email}`
        : draft.scheduleAt
          ? `Scheduled for ${new Date(draft.scheduleAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
          : `Email sent to ${client?.name}`,
      { description: "Demo — nothing is actually emailed." },
    );
    if (!test) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[92svh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="display-title text-xl">Send an email</DialogTitle>
          <DialogDescription>
            Pick a template to fill in this client's details, then edit before sending.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 md:grid-cols-2">
          <form
            noValidate
            className="min-w-0 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              send(false);
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>To</Label>
                <Select
                  value={clientId}
                  onValueChange={(v) => {
                    setClientId(v);
                    if (templateId) fill(v, templateId);
                  }}
                >
                  <SelectTrigger aria-label="Recipient" aria-invalid={!!shown("to")}>
                    <SelectValue placeholder="Choose a client">{client?.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {demo.clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {shown("to") ? (
                  <p className="text-xs text-destructive">
                    {clientId ? shown("to") : "Choose a client."}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label>Template</Label>
                <Select
                  value={templateId || "none"}
                  onValueChange={(v) => {
                    const tid = v === "none" ? "" : v;
                    setTemplateId(tid);
                    if (tid) fill(clientId, tid);
                  }}
                >
                  <SelectTrigger aria-label="Template">
                    <SelectValue>
                      {demo.emailTemplates.find((t) => t.id === templateId)?.name ?? "No template"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {demo.emailTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Field id="ce-subject" label="Subject" error={shown("subject")}>
              <Input
                id="ce-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                aria-invalid={!!shown("subject")}
              />
            </Field>
            <Field id="ce-body" label="Message" error={shown("body")}>
              <Textarea
                id="ce-body"
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                aria-invalid={!!shown("body")}
              />
            </Field>
            {missing.length ? (
              <p
                className="flex gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs"
                role="status"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <span>
                  Can't fill{" "}
                  {missing.map((m) => `${fieldLabel(m)} (${missingReason(m)})`).join(", ")}. Edit
                  the text or choose another template.
                </span>
              </p>
            ) : null}
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as "now" | "later")}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id="ce-now" value="now" />
                <Label htmlFor="ce-now" className="font-normal">
                  Send now
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="ce-later" value="later" />
                <Label htmlFor="ce-later" className="font-normal">
                  Schedule
                </Label>
              </div>
            </RadioGroup>
            {mode === "later" ? (
              <Field id="ce-at" label="Send at" error={shown("scheduleAt")}>
                <Input
                  id="ce-at"
                  type="datetime-local"
                  value={scheduleAt}
                  min={nowLocal()}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="max-w-60"
                />
              </Field>
            ) : null}
            <DialogFooter className="gap-2 sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => send(true)}>
                <FlaskConical /> Send test to me
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {mode === "later" ? <CalendarClock /> : <Send />}{" "}
                  {mode === "later" ? "Schedule" : "Send"}
                </Button>
              </div>
            </DialogFooter>
          </form>
          <div className="min-w-0">
            <p className="eyebrow mb-2 flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> Preview
            </p>
            <EmailPreview
              from={from}
              to={client ? `${client.name} <${client.email}>` : ""}
              subject={subject}
              body={body}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
