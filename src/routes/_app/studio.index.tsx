import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import { Avatar, EmptyState, PageHeader, Panel, StatusBadge, pageHead } from "@/components/kit";
import { AddSessionDialog, StudioTabs } from "@/components/studio";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemo } from "@/lib/store";
import { avatar, formatDate, formatTime, type SessionStatus } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/studio/")({
  head: () => pageHead("Sessions", "Manage your upcoming shoots and consultations."),
  component: Sessions,
});

function Sessions() {
  const { state: demo, updateSessionStatus } = useDemo();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | SessionStatus>("all");
  const client = (id: string) => demo.clients.find((c) => c.id === id);
  const q = query.trim().toLowerCase();

  const rows = [...demo.sessions]
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .filter((s) => filter === "all" || s.status === filter)
    .filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (client(s.clientId)?.name.toLowerCase().includes(q) ?? false),
    );

  return (
    <div className="mx-auto max-w-5xl">
      <StudioTabs />
      <PageHeader title="Sessions" actions={<AddSessionDialog />} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients..."
            className="h-9 bg-card pl-8 text-xs"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="h-9 bg-card text-xs sm:w-36">
            <SelectValue>
              {filter === "all" ? "All" : filter === "confirmed" ? "Confirmed" : "Pending"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Panel className="mt-4">
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No sessions found" />
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((s) => {
              const c = client(s.clientId);
              return (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                  {c ? <Avatar src={avatar(c.avatar)} alt="" className="h-9 w-9" /> : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c?.name} · {formatDate(s.date)} · {formatTime(s.start)} – {formatTime(s.end)}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label="Session actions"
                      className="rounded p-1 text-muted-foreground hover:bg-accent"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={s.status === "confirmed"}
                        onSelect={() => {
                          updateSessionStatus(s.id, "confirmed");
                          toast.success(`${s.title} confirmed`);
                        }}
                      >
                        Mark confirmed
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={s.status === "pending"}
                        onSelect={() => updateSessionStatus(s.id, "pending")}
                      >
                        Mark pending
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
