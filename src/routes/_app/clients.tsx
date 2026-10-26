import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Mail, Plus, Search, Star } from "lucide-react";
import { toast } from "sonner";
import {
  Avatar,
  Button,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  pageHead,
} from "@/components/kit";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useDemo } from "@/lib/store";
import { avatar, formatDate, formatTime } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/clients")({
  head: () => pageHead("Clients", "Your clients and their sessions."),
  component: Clients,
});

type Filter = "all" | "starred" | "booked" | "new";

// Explicit labels so the trigger renders server-side too.
const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  starred: "Starred",
  booked: "With sessions",
  new: "No sessions yet",
};

function Clients() {
  const { state: demo, toggleClientStar } = useDemo();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const q = query.trim().toLowerCase();

  const rows = demo.clients
    .filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    .filter((c) =>
      filter === "starred"
        ? c.starred
        : filter === "booked"
          ? c.sessions > 0
          : filter === "new"
            ? c.sessions === 0
            : true,
    );

  const selected = demo.clients.find((c) => c.id === openId);
  const sessions = demo.sessions.filter((s) => s.clientId === openId);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Clients" actions={<AddClientDialog />} />

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
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="h-9 bg-card text-xs sm:w-36">
            <SelectValue>{FILTER_LABELS[filter]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="starred">Starred</SelectItem>
            <SelectItem value="booked">With sessions</SelectItem>
            <SelectItem value="new">No sessions yet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Panel className="mt-4">
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No clients found" description="Try another search or filter." />
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
              >
                <Avatar src={avatar(c.avatar)} alt="" className="h-9 w-9" />
                <button
                  type="button"
                  onClick={() => setOpenId(c.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {c.name}
                    {c.starred ? <Star className="h-3 w-3 fill-warning text-warning" /> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                </button>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {c.sessions} {c.sessions === 1 ? "session" : "sessions"}
                </span>
                <button
                  type="button"
                  aria-label={c.starred ? "Unstar client" : "Star client"}
                  onClick={() => toggleClientStar(c.id)}
                  className="rounded p-1 text-muted-foreground hover:text-warning"
                >
                  <Star className={cn("h-4 w-4", c.starred && "fill-warning text-warning")} />
                </button>
                <button
                  type="button"
                  aria-label={`Open ${c.name}`}
                  onClick={() => setOpenId(c.id)}
                  className="text-muted-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-sm">
          {selected ? (
            <>
              <SheetHeader className="items-center text-center">
                <Avatar src={avatar(selected.avatar, 160)} alt="" className="h-20 w-20" />
                <SheetTitle className="display-title text-xl">{selected.name}</SheetTitle>
                <a
                  href={`mailto:${selected.email}`}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Mail className="h-3.5 w-3.5" /> {selected.email}
                </a>
              </SheetHeader>
              <div className="px-4">
                <p className="text-sm font-semibold">Sessions</p>
                {sessions.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">No sessions booked yet.</p>
                ) : (
                  <ul className="mt-2 divide-y rounded-md border">
                    {sessions.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-2 px-3 py-2.5"
                      >
                        <div>
                          <p className="text-xs font-medium">{s.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDate(s.date)} · {formatTime(s.start)}
                          </p>
                        </div>
                        <StatusBadge status={s.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function AddClientDialog() {
  const { addClient } = useDemo();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addClient({ name: name.trim(), email: email.trim() });
    toast.success(`${name.trim()} added`);
    setName("");
    setEmail("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="display-title text-xl">Add client</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="ac-name">Full name</Label>
            <Input id="ac-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ac-email">Email</Label>
            <Input
              id="ac-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Add client</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
