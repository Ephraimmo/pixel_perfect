import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { FileSignature, Plus, Search, X } from "lucide-react";
import {
  Button,
  EmptyState,
  ListSkeleton,
  PageError,
  PageHeader,
  TabBar,
  pageHead,
} from "@/components/kit";
import { ContractStatusBadge, NewContractDialog, SignatureProgress } from "@/components/contracts";
import { Input } from "@/components/ui/input";
import { useDemo } from "@/lib/store";
import { DEMO_TODAY, formatDate } from "@/lib/demo-data";
import {
  CONTRACT_TABS,
  countContracts,
  daysWaiting,
  filterContracts,
  validateContractSearch,
  type ContractSearch,
} from "@/lib/contracts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/contracts/")({
  head: () => pageHead("Contracts", "Agreements, templates and signature status."),
  validateSearch: validateContractSearch,
  component: Contracts,
  errorComponent: ({ reset }) => <PageError title="Couldn't load your contracts" reset={reset} />,
});

type SearchPatch = { [K in keyof ContractSearch]?: ContractSearch[K] | undefined };

function Contracts() {
  const { state: demo, ready } = useDemo();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const update = (patch: SearchPatch) =>
    void navigate({
      search: (prev) => validateContractSearch({ ...prev, ...patch }),
      replace: true,
    });
  const view = search.view ?? "contracts";
  const counts = countContracts(demo.contracts);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Contracts"
        description={
          ready
            ? `${counts.awaiting} awaiting signature · ${counts.signed} signed`
            : "Agreements, templates and signature status."
        }
        actions={view === "templates" ? <TemplateButton /> : <NewContractDialog />}
      />
      <div
        className="mb-5 inline-flex gap-1 rounded-lg border bg-card p-1"
        role="group"
        aria-label="Contracts view"
      >
        {(
          [
            ["contracts", "Contracts"],
            ["templates", "Templates"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() =>
              update({ view: v === "templates" ? "templates" : undefined, tab: undefined, q: "" })
            }
            className={cn(
              "rounded-md px-3 py-1.5 text-xs transition-colors",
              view === v
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "templates" ? (
        <Templates ready={ready} />
      ) : (
        <ContractList search={search} update={update} ready={ready} />
      )}
    </div>
  );
}

function TemplateButton() {
  const goTo = useNavigate();
  return (
    <Button
      size="sm"
      onClick={() => void goTo({ to: "/contracts/templates/$id", params: { id: "new" } })}
    >
      <Plus /> New Template
    </Button>
  );
}

function ContractList({
  search,
  update,
  ready,
}: {
  search: ContractSearch;
  update: (p: SearchPatch) => void;
  ready: boolean;
}) {
  const { state: demo } = useDemo();
  const { tab = "all", q = "" } = search;
  const clientName = (id: string) => demo.clients.find((c) => c.id === id)?.name ?? "";
  const counts = countContracts(demo.contracts);
  const rows = filterContracts(demo.contracts, clientName, { tab, q });

  let body: ReactNode;
  if (!ready) body = <ListSkeleton label="Loading contracts" />;
  else if (demo.contracts.length === 0)
    body = (
      <EmptyState
        title="No contracts yet"
        description="Create one from a template — client and project details fill in automatically."
        action={
          <NewContractDialog
            trigger={
              <Button size="sm">
                <Plus /> Create your first contract
              </Button>
            }
          />
        }
      />
    );
  else if (rows.length === 0)
    body = (
      <EmptyState
        title={q.trim() ? `No contracts match “${q.trim()}”` : "Nothing here"}
        description="Try another tab, or search by title or client."
        action={
          <Button size="sm" variant="outline" onClick={() => update({ q: "", tab: undefined })}>
            Show all contracts
          </Button>
        }
      />
    );
  else
    body = (
      <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-soft">
        {rows.map((c) => {
          const waiting = daysWaiting(c, DEMO_TODAY);
          return (
            <li key={c.id}>
              <Link
                to="/contracts/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
              >
                <FileSignature className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {clientName(c.clientId)} ·{" "}
                    {c.status === "signed" && c.clientSignature
                      ? `signed ${formatDate(c.clientSignature.signedAt.slice(0, 10))}`
                      : c.sentAt
                        ? `sent ${formatDate(c.sentAt.slice(0, 10))}`
                        : `created ${formatDate(c.createdAt)}`}
                  </span>
                </span>
                {waiting !== null ? (
                  <span
                    className={cn(
                      "hidden text-[11px] sm:inline",
                      waiting >= 5 ? "font-medium text-warning" : "text-muted-foreground",
                    )}
                  >
                    {waiting === 0
                      ? "Sent today"
                      : `Waiting ${waiting} ${waiting === 1 ? "day" : "days"}`}
                  </span>
                ) : null}
                <span className="hidden sm:inline">
                  <SignatureProgress contract={c} />
                </span>
                <ContractStatusBadge status={c.status} />
              </Link>
            </li>
          );
        })}
      </ul>
    );

  return (
    <>
      <TabBar
        value={tab}
        onChange={(t) => update({ tab: t })}
        tabs={CONTRACT_TABS.map((t) => ({
          value: t.value,
          label: ready ? `${t.label} (${counts[t.value]})` : t.label,
        }))}
      />
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          onChange={(e) => update({ q: e.target.value })}
          onKeyDown={(e) => e.key === "Escape" && update({ q: "" })}
          placeholder="Search title or client..."
          aria-label="Search contracts"
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
      <div className="mt-4">{body}</div>
    </>
  );
}

function Templates({ ready }: { ready: boolean }) {
  const { state: demo } = useDemo();
  if (!ready) return <ListSkeleton label="Loading templates" rows={3} />;
  if (demo.contractTemplates.length === 0)
    return (
      <EmptyState
        title="No templates"
        description="Templates are reusable contracts with merge fields like {{client.name}}."
        action={<TemplateButton />}
      />
    );
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {demo.contractTemplates.map((t) => {
        const used = demo.contracts.filter((c) => c.templateId === t.id).length;
        return (
          <li key={t.id} className="flex flex-col rounded-lg border bg-card p-4 shadow-soft">
            <p className="text-sm font-semibold">{t.name}</p>
            <p className="mt-1 flex-1 text-xs text-muted-foreground">{t.description}</p>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Updated {formatDate(t.updatedAt)} · used {used} {used === 1 ? "time" : "times"}
            </p>
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm" variant="outline" className="h-8 bg-card text-xs">
                <Link to="/contracts/templates/$id" params={{ id: t.id }}>
                  Edit template
                </Link>
              </Button>
              <NewContractDialog
                defaultTemplateId={t.id}
                trigger={
                  <Button size="sm" className="h-8 text-xs">
                    Use template
                  </Button>
                }
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
