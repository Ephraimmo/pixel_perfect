import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Field, PageError, pageHead } from "@/components/kit";
import { MergeFieldMenu } from "@/components/contracts";
import { ComposeEmailDialog, EmailPreview } from "@/components/emails";
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
import type { EmailCategory, EmailTemplate } from "@/lib/emails-data";
import {
  EMAIL_CATEGORY_LABELS,
  EMAIL_FIELDS,
  emailValues,
  fieldLabel,
  missingReason,
  renderEmail,
  validateTemplateDraft,
} from "@/lib/emails";

export const Route = createFileRoute("/_app/emails/$id")({
  head: () => pageHead("Email Template", "Edit and preview a reusable email."),
  component: TemplatePage,
  errorComponent: ({ reset }) => <PageError title="Couldn't load this template" reset={reset} />,
});

function TemplatePage() {
  const { id } = Route.useParams();
  const { state: demo, ready } = useDemo();
  const [fresh] = useState<EmailTemplate>(() => ({
    id: `et-${Date.now().toString(36)}`,
    name: "",
    category: "follow-up",
    subject: "",
    body: "Hi {{client.firstName}},\n\n\n\n{{photographer.name}}",
    updatedAt: DEMO_TODAY,
  }));
  if (!ready)
    return (
      <div
        className="mx-auto max-w-6xl space-y-4"
        aria-busy="true"
        aria-label="Loading template"
        role="status"
      >
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  const template = id === "new" ? fresh : demo.emailTemplates.find((t) => t.id === id);
  if (!template)
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="Template not found"
          description="It may have been deleted."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/emails">View templates</Link>
            </Button>
          }
        />
      </div>
    );
  return <Editor key={template.id} template={template} isNew={id === "new"} />;
}

function Editor({ template: t, isNew }: { template: EmailTemplate; isNew: boolean }) {
  const { state: demo, saveEmailTemplate, deleteEmailTemplate, restoreEmailTemplate } = useDemo();
  const goTo = useNavigate();
  const [name, setName] = useState(t.name);
  const [category, setCategory] = useState<EmailCategory>(t.category);
  const [subject, setSubject] = useState(t.subject);
  const [body, setBody] = useState(t.body);
  const [previewAs, setPreviewAs] = useState(demo.clients[0]?.id ?? "");
  const [submitted, setSubmitted] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const errors = validateTemplateDraft({ name, subject, body });
  const dirty =
    isNew || name !== t.name || category !== t.category || subject !== t.subject || body !== t.body;
  const client = demo.clients.find((c) => c.id === previewAs);
  const rendered = renderEmail(
    { subject, body },
    emailValues(
      previewAs,
      demo,
      DEMO_TODAY,
      typeof window === "undefined" ? undefined : window.location.origin,
    ),
  );

  const save = () => {
    setSubmitted(true);
    if (errors.name || errors.subject || errors.body) return;
    const next = {
      ...t,
      name: name.trim(),
      category,
      subject: subject.trim(),
      body,
      updatedAt: DEMO_TODAY,
    };
    saveEmailTemplate(next);
    toast.success(isNew ? "Template created" : "Template saved");
    if (isNew) void goTo({ to: "/emails/$id", params: { id: next.id }, replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/emails"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Email templates
      </Link>
      <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="display-title text-2xl">{isNew ? "New email template" : t.name}</h1>
          {dirty && !isNew ? <span className="text-xs text-warning">Unsaved changes</span> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  deleteEmailTemplate(t.id);
                  void goTo({ to: "/emails" });
                  toast("Template deleted", {
                    action: { label: "Undo", onClick: () => restoreEmailTemplate(t) },
                  });
                }}
              >
                <Trash2 /> Delete
              </Button>
              <ComposeEmailDialog
                defaultTemplateId={t.id}
                defaultClientId={previewAs}
                trigger={
                  <Button size="sm" variant="outline" className="bg-card" disabled={dirty}>
                    <Send /> Send with this template
                  </Button>
                }
              />
            </>
          ) : null}
          <Button size="sm" onClick={save} disabled={!dirty}>
            {isNew ? "Create template" : dirty ? "Save template" : "Saved"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0 space-y-4 rounded-lg border bg-card p-4 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <Field
              id="et-name"
              label="Template name"
              required
              error={submitted ? errors.name : undefined}
            >
              <Input
                id="et-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Album proofs ready"
              />
            </Field>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as EmailCategory)}>
                <SelectTrigger aria-label="Category">
                  <SelectValue>{EMAIL_CATEGORY_LABELS[category]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EMAIL_CATEGORY_LABELS) as EmailCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {EMAIL_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-end justify-between gap-2">
              <Label htmlFor="et-subject">
                Subject <span className="text-muted-foreground">*</span>
              </Label>
              <MergeFieldMenu
                textareaRef={subjectRef}
                value={subject}
                onChange={setSubject}
                fields={EMAIL_FIELDS}
              />
            </div>
            <Input
              id="et-subject"
              ref={subjectRef}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              aria-invalid={submitted && !!errors.subject}
            />
            {submitted && errors.subject ? (
              <p className="text-xs text-destructive">{errors.subject}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-end justify-between gap-2">
              <Label htmlFor="et-body">
                Message <span className="text-muted-foreground">*</span>
              </Label>
              <MergeFieldMenu
                textareaRef={bodyRef}
                value={body}
                onChange={setBody}
                fields={EMAIL_FIELDS}
              />
            </div>
            <Textarea
              id="et-body"
              ref={bodyRef}
              rows={14}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-invalid={submitted && !!errors.body}
            />
            {submitted && errors.body ? (
              <p className="text-xs text-destructive">{errors.body}</p>
            ) : null}
          </div>
          {errors.unknown.length ? (
            <p className="text-xs text-warning" role="status">
              Unknown field{errors.unknown.length > 1 ? "s" : ""}:{" "}
              {errors.unknown.map((u) => `{{${u}}}`).join(", ")} — they'll be sent as typed.
            </p>
          ) : null}
        </section>
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow">Preview as</p>
            <Select value={previewAs} onValueChange={setPreviewAs}>
              <SelectTrigger className="h-8 w-48 bg-card text-xs" aria-label="Preview as client">
                <SelectValue>{client?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {demo.clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <EmailPreview
            from={`${demo.profile.name} · ${demo.profile.studio} <${demo.profile.email}>`}
            to={client ? `${client.name} <${client.email}>` : ""}
            subject={rendered.subject}
            body={rendered.body}
          />
          {rendered.missing.length ? (
            <p className="mt-2 text-xs text-muted-foreground" role="status">
              For {client?.name}:{" "}
              {rendered.missing.map((m) => `${fieldLabel(m)} — ${missingReason(m)}`).join("; ")}.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
