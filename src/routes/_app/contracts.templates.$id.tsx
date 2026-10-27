import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Field, PageError, pageHead } from "@/components/kit";
import { ContractDocument, MergeFieldMenu, NewContractDialog } from "@/components/contracts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY } from "@/lib/demo-data";
import type { ContractTemplate } from "@/lib/contracts-data";
import { MERGE_FIELDS, fieldsIn, renderMerge, type MergeContext } from "@/lib/contracts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/contracts/templates/$id")({
  head: () => pageHead("Contract Template", "Edit a reusable contract with merge fields."),
  component: TemplatePage,
  errorComponent: ({ reset }) => <PageError title="Couldn't load this template" reset={reset} />,
});

const STARTER = `## Agreement title

This agreement is between {{studio.name}} and {{client.name}} for {{project.name}}.

## Terms

1. The fee is {{project.value}}, with a deposit of {{deposit}} due on signing.
2. Images are delivered by {{project.dueDate}}.`;

function TemplatePage() {
  const { id } = Route.useParams();
  const { state: demo, ready } = useDemo();
  const [fresh] = useState<ContractTemplate>(() => ({
    id: `tpl-${Date.now().toString(36)}`,
    name: "",
    description: "",
    body: STARTER,
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
        <Skeleton className="h-[28rem] rounded-lg" />
      </div>
    );
  const template = id === "new" ? fresh : demo.contractTemplates.find((t) => t.id === id);
  if (!template)
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="Template not found"
          description="It may have been deleted."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/contracts" search={{ view: "templates" }}>
                View templates
              </Link>
            </Button>
          }
        />
      </div>
    );
  return <TemplateEditor key={template.id} template={template} isNew={id === "new"} />;
}

function TemplateEditor({ template: t, isNew }: { template: ContractTemplate; isNew: boolean }) {
  const {
    state: demo,
    saveContractTemplate,
    deleteContractTemplate,
    restoreContractTemplate,
  } = useDemo();
  const goTo = useNavigate();
  const [name, setName] = useState(t.name);
  const [description, setDescription] = useState(t.description);
  const [body, setBody] = useState(t.body);
  const [submitted, setSubmitted] = useState(false);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const dirty = isNew || name !== t.name || description !== t.description || body !== t.body;
  const unknown = fieldsIn(body).filter((f) => !MERGE_FIELDS.some((m) => m.key === f));
  const used = demo.contracts.filter((c) => c.templateId === t.id).length;

  // Sample data so every field shows filled in.
  const sample: MergeContext = {
    client: { name: "Alex Morgan", email: "alex@example.com" },
    studio: { name: demo.profile.studio, email: demo.profile.email },
    project: { name: "Morgan & Lee Wedding", value: 3500, dueDate: "2025-10-30" },
    firstSession: { date: "2025-09-13" },
    today: DEMO_TODAY,
  };

  const save = () => {
    setSubmitted(true);
    if (!name.trim() || !body.trim()) return;
    const next = {
      ...t,
      name: name.trim(),
      description: description.trim(),
      body,
      updatedAt: DEMO_TODAY,
    };
    saveContractTemplate(next);
    toast.success(isNew ? "Template created" : "Template saved");
    if (isNew)
      void goTo({ to: "/contracts/templates/$id", params: { id: next.id }, replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/contracts"
        search={{ view: "templates" }}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Templates
      </Link>
      <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="display-title text-2xl">{isNew ? "New template" : t.name}</h1>
          {!isNew ? (
            <p className="text-sm text-muted-foreground">
              Used by {used} {used === 1 ? "contract" : "contracts"} — editing doesn't change
              contracts already created.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  deleteContractTemplate(t.id);
                  void goTo({ to: "/contracts", search: { view: "templates" } });
                  toast("Template deleted", {
                    action: { label: "Undo", onClick: () => restoreContractTemplate(t) },
                  });
                }}
              >
                <Trash2 /> Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-card"
                onClick={() => {
                  const copy = {
                    ...t,
                    id: `tpl-${Date.now().toString(36)}`,
                    name: `${t.name} (copy)`,
                    updatedAt: DEMO_TODAY,
                  };
                  saveContractTemplate(copy);
                  toast.success("Template duplicated");
                  void goTo({ to: "/contracts/templates/$id", params: { id: copy.id } });
                }}
              >
                <Copy /> Duplicate
              </Button>
              <NewContractDialog
                defaultTemplateId={t.id}
                trigger={
                  <Button size="sm" variant="outline" className="bg-card">
                    Use template
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
          <Field
            id="tp-name"
            label="Template name"
            required
            error={submitted && !name.trim() ? "Name the template." : undefined}
          >
            <Input
              id="tp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Elopement Agreement"
            />
          </Field>
          <Field id="tp-desc" label="Description">
            <Input
              id="tp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When to use it"
            />
          </Field>
          <div className="space-y-1.5">
            <div className="flex items-end justify-between gap-2">
              <Label htmlFor="tp-body">Template text</Label>
              <MergeFieldMenu textareaRef={textarea} value={body} onChange={setBody} />
            </div>
            <Textarea
              id="tp-body"
              ref={textarea}
              rows={22}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="font-mono text-xs leading-relaxed"
              aria-invalid={submitted && !body.trim()}
            />
            {submitted && !body.trim() ? (
              <p className="text-xs text-destructive">The template is empty.</p>
            ) : null}
            {unknown.length ? (
              <p className="text-xs text-warning" role="status">
                Unknown field{unknown.length > 1 ? "s" : ""}:{" "}
                {unknown.map((u) => `{{${u}}}`).join(", ")} — it will stay as typed.
              </p>
            ) : null}
          </div>
        </section>
        <div
          className={cn(
            "min-w-0 lg:sticky lg:top-20 lg:self-start",
            view === "edit" && "max-lg:hidden",
          )}
        >
          <p className="eyebrow mb-2">Preview with sample client</p>
          <ContractDocument text={renderMerge(body, sample).text} clientName="Alex Morgan" />
        </div>
      </div>
    </div>
  );
}
