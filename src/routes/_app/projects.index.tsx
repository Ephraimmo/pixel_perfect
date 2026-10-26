import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button, EmptyState, PageError, PageHeader, TabBar, pageHead } from "@/components/kit";
import { NewProjectButton, ProjectCard } from "@/components/projects";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, moneyShort } from "@/lib/demo-data";
import {
  PROJECT_SORT_LABELS,
  PROJECT_TABS,
  countProjects,
  filterProjects,
  isOverdue,
  validateProjectSearch,
  type ProjectSearch,
  type ProjectSort,
} from "@/lib/projects";

export const Route = createFileRoute("/_app/projects/")({
  head: () => pageHead("Projects", "Every job with its client, sessions, galleries and invoices."),
  validateSearch: validateProjectSearch,
  component: Projects,
  errorComponent: ({ reset }) => <PageError title="Couldn't load your projects" reset={reset} />,
});

type SearchPatch = { [K in keyof ProjectSearch]?: ProjectSearch[K] | undefined };

function Projects() {
  const { state: demo, ready } = useDemo();
  const { tab = "active", q = "", sort = "due" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const goTo = useNavigate();
  const update = (patch: SearchPatch) =>
    void navigate({
      search: (prev) => validateProjectSearch({ ...prev, ...patch }),
      replace: true,
    });

  const clientName = (id: string) => demo.clients.find((c) => c.id === id)?.name ?? "";
  const counts = countProjects(demo.projects);
  const rows = filterProjects(demo.projects, clientName, { tab, q, sort });
  const active = demo.projects.filter((p) => !p.archived && p.status !== "completed");
  const overdue = active.filter((p) => isOverdue(p, DEMO_TODAY)).length;

  let body: ReactNode;
  if (!ready) {
    body = (
      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
        aria-label="Loading projects"
        role="status"
      >
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-44 rounded-lg" />
        ))}
      </div>
    );
  } else if (demo.projects.length === 0) {
    body = (
      <EmptyState
        title="No projects yet"
        description="Create a project for each job to keep its sessions, galleries, invoices and to-dos together."
        action={
          <NewProjectButton
            label="Create your first project"
            onSaved={(p) => void goTo({ to: "/projects/$id", params: { id: p.id } })}
          />
        }
      />
    );
  } else if (rows.length === 0) {
    body = q.trim() ? (
      <EmptyState
        title={`No projects match “${q.trim()}”`}
        description="Search by project or client name."
        action={
          <Button size="sm" variant="outline" onClick={() => update({ q: "" })}>
            Clear search
          </Button>
        }
      />
    ) : (
      <EmptyState
        title={
          tab === "archived"
            ? "Nothing archived"
            : tab === "completed"
              ? "No completed projects yet"
              : "No active projects"
        }
        description={
          tab === "archived"
            ? "Archive finished projects to keep this list tidy."
            : "Projects move here as you work through them."
        }
      />
    );
  } else {
    body = (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((p) => (
          <li key={p.id}>
            <ProjectCard project={p} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Projects"
        description={
          ready
            ? `${active.length} active · ${moneyShort(active.reduce((s, p) => s + p.value, 0))} in progress${overdue ? ` · ${overdue} overdue` : ""}`
            : "Every job with its client, sessions, galleries and invoices."
        }
        actions={
          <NewProjectButton
            onSaved={(p) => void goTo({ to: "/projects/$id", params: { id: p.id } })}
          />
        }
      />

      <TabBar
        value={tab}
        onChange={(t) => update({ tab: t })}
        tabs={PROJECT_TABS.map((t) => ({
          value: t.value,
          label: ready ? `${t.label} (${counts[t.value]})` : t.label,
        }))}
      />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            onKeyDown={(e) => e.key === "Escape" && update({ q: "" })}
            placeholder="Search projects or clients..."
            aria-label="Search projects"
            className="h-9 bg-card pl-8 pr-8 text-xs [&::-webkit-search-cancel-button]:hidden"
          />
          {q ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => update({ q: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <Select value={sort} onValueChange={(v) => update({ sort: v as ProjectSort })}>
          <SelectTrigger className="h-9 bg-card text-xs sm:w-44" aria-label="Sort projects">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue>{PROJECT_SORT_LABELS[sort]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PROJECT_SORT_LABELS) as ProjectSort[]).map((s) => (
              <SelectItem key={s} value={s}>
                {PROJECT_SORT_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">{body}</div>
    </div>
  );
}
