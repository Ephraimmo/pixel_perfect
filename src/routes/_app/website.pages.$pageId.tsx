import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  GripVertical,
  Monitor,
  MoreHorizontal,
  Plus,
  Smartphone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Panel, pageHead } from "@/components/kit";
import { SectionForm } from "@/components/website-editor";
import { PublishButton } from "@/components/website-publish";
import { ScaledFrame, SiteRenderer } from "@/components/website-renderer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWebsite } from "@/lib/website-store";
import { hasUnpublishedChanges } from "@/lib/website";
import {
  SECTION_KIND_LABEL,
  blankSection,
  moveItem,
  pagePath,
  uid,
  type SectionKind,
  type SiteSection,
} from "@/lib/website-pages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/website/pages/$pageId")({
  head: () => pageHead("Edit Page", "Edit the text, images, buttons and order of page sections."),
  component: SectionEditor,
});

const ADDABLE: SectionKind[] = [
  "hero",
  "text",
  "gallery",
  "portfolio",
  "blog",
  "pricing",
  "testimonial",
  "contact",
  "cta",
];

function SectionEditor() {
  const { pageId } = Route.useParams();
  const navigate = useNavigate();
  const { site, update } = useWebsite();
  const page = site.pages.find((p) => p.id === pageId);
  const [selectedId, setSelectedId] = useState<string | null>(page?.sections[0]?.id ?? null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (!page) {
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="Page not found"
          description="It may have been deleted."
          action={
            <Button asChild size="sm">
              <Link to="/website/pages">Back to pages</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const sections = page.sections;
  const selected = sections.find((s) => s.id === selectedId) ?? sections[0] ?? null;

  const setSections = (fn: (list: SiteSection[]) => SiteSection[]) =>
    update((s) => ({
      pages: s.pages.map((p) => (p.id === page.id ? { ...p, sections: fn(p.sections) } : p)),
    }));
  const patchSection = (id: string, patch: Partial<SiteSection>) =>
    setSections((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const move = (id: string, to: number) => setSections((list) => moveItem(list, id, to));

  const addSection = (kind: SectionKind) => {
    const section = blankSection(kind);
    const at = selected ? sections.findIndex((x) => x.id === selected.id) + 1 : sections.length;
    setSections((list) => [...list.slice(0, at), section, ...list.slice(at)]);
    setSelectedId(section.id);
    toast.success(`${SECTION_KIND_LABEL[kind]} section added`);
  };

  const duplicate = (section: SiteSection) => {
    const copy = { ...section, id: uid("sec") };
    setSections((list) => {
      const at = list.findIndex((x) => x.id === section.id) + 1;
      return [...list.slice(0, at), copy, ...list.slice(at)];
    });
    setSelectedId(copy.id);
  };

  const remove = (section: SiteSection) => {
    const i = sections.findIndex((x) => x.id === section.id);
    const neighbour = sections[i + 1] ?? sections[i - 1] ?? null;
    setSections((list) => list.filter((x) => x.id !== section.id));
    setSelectedId(neighbour?.id ?? null);
    toast.success(`${SECTION_KIND_LABEL[section.kind]} section removed`, {
      action: {
        label: "Undo",
        onClick: () =>
          setSections((list) => {
            if (list.some((x) => x.id === section.id)) return list;
            return [...list.slice(0, i), section, ...list.slice(i)];
          }),
      },
    });
  };

  const endDrag = () => {
    setDragId(null);
    setOverIndex(null);
  };

  const addMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <Plus /> Add section
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs">Insert after selected</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ADDABLE.map((k) => (
          <DropdownMenuItem key={k} onSelect={() => addSection(k)}>
            {SECTION_KIND_LABEL[k]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        to="/website/pages"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Pages
      </Link>
      <div className="mt-2 flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="display-title truncate text-2xl">{page.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {pagePath(page)} ·{" "}
            {hasUnpublishedChanges(site) ? "Draft saved — not published yet" : "Published"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {addMenu}
          <PublishButton />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Panel>
            <p className="border-b px-4 py-2.5 text-xs font-medium">Sections ({sections.length})</p>
            {sections.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                No sections yet — add one to get started.
              </p>
            ) : (
              <ul aria-label="Sections" onDragLeave={() => setOverIndex(null)}>
                {sections.map((s, i) => (
                  <li
                    key={s.id}
                    draggable
                    onDragStart={(e) => {
                      setDragId(s.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", s.id);
                    }}
                    onDragOver={(e) => {
                      if (!dragId) return;
                      e.preventDefault();
                      setOverIndex(i);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragId) move(dragId, i);
                      endDrag();
                    }}
                    onDragEnd={endDrag}
                    className={cn(
                      "flex items-center gap-2 border-b px-2 py-2 last:border-b-0",
                      selected?.id === s.id && "bg-accent",
                      dragId === s.id && "opacity-50",
                      overIndex === i && dragId !== s.id && "bg-accent/60",
                    )}
                  >
                    <GripVertical
                      className="hidden h-4 w-4 shrink-0 cursor-grab text-muted-foreground sm:block"
                      aria-hidden
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      aria-current={selected?.id === s.id ? "true" : undefined}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {SECTION_KIND_LABEL[s.kind]}
                      </span>
                      <span className="block truncate text-sm">{s.heading || "Untitled"}</span>
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={i === 0}
                      onClick={() => move(s.id, i - 1)}
                      aria-label={`Move ${SECTION_KIND_LABEL[s.kind]} section ${i + 1} up`}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={i === sections.length - 1}
                      onClick={() => move(s.id, i + 1)}
                      aria-label={`Move ${SECTION_KIND_LABEL[s.kind]} section ${i + 1} down`}
                    >
                      <ArrowDown />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          aria-label={`Actions for section ${i + 1}`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => duplicate(s)}>
                          <Copy /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => remove(s)}
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {selected ? (
            <Panel className="p-4">
              <p className="mb-4 text-sm font-medium">
                Edit {SECTION_KIND_LABEL[selected.kind].toLowerCase()}
              </p>
              <SectionForm
                key={selected.id}
                section={selected}
                pages={site.pages}
                onChange={(patch) => patchSection(selected.id, patch)}
              />
            </Panel>
          ) : null}
        </div>

        <Panel className="h-fit overflow-hidden lg:sticky lg:top-4">
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
            <p className="text-xs font-medium">Live preview</p>
            <div
              className="inline-flex rounded-md border p-0.5"
              role="group"
              aria-label="Preview size"
            >
              {(
                [
                  ["desktop", Monitor, "Desktop"],
                  ["mobile", Smartphone, "Mobile"],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={device === value}
                  aria-label={`${label} preview`}
                  onClick={() => setDevice(value)}
                  className={cn(
                    "rounded px-2 py-1",
                    device === value ? "bg-accent text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
          <div data-preview-scroll className="max-h-[75svh] overflow-y-auto bg-muted/40 p-3">
            <div className={cn("mx-auto", device === "mobile" && "max-w-[390px]")}>
              <ScaledFrame
                width={device === "mobile" ? 390 : 1200}
                className="rounded border bg-white shadow-soft"
              >
                <SiteRenderer
                  site={site}
                  page={page}
                  selectedId={selected?.id ?? null}
                  onSelectSection={setSelectedId}
                  onNavigate={(id) =>
                    void navigate({ to: "/website/pages/$pageId", params: { pageId: id } })
                  }
                />
              </ScaledFrame>
            </div>
          </div>
          <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
            Click a section in the preview to edit it.
          </p>
        </Panel>
      </div>
    </div>
  );
}
