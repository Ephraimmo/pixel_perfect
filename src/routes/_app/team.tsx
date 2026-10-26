import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Button, PageHeader, Panel, StatusBadge, TabBar, pageHead } from "@/components/kit";
import { DropboxIcon, GoogleIcon } from "@/components/brand-icons";
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
import { useDemo } from "@/lib/store";
import { avatar, type TeamMember } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/team")({
  head: () =>
    pageHead("Team & Integrations", "Invite your team and connect the tools you already use."),
  component: Team,
});

type Tab = "members" | "pending" | "roles";

const ROLE_INFO: Record<TeamMember["role"], string> = {
  Owner: "Full access, including billing and team management.",
  Editor: "Manage galleries, clients, store and website.",
  Assistant: "Upload photos and manage sessions.",
  Viewer: "Read-only access to galleries and the calendar.",
};

function Team() {
  const { state: demo, toggleIntegration } = useDemo();
  const [tab, setTab] = useState<Tab>("members");
  const members = demo.team.filter((m) =>
    tab === "pending" ? m.status === "pending" : m.status === "active",
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Team Members" actions={<InviteDialog />} />

      <TabBar
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "members", label: "Members" },
          {
            value: "pending",
            label: `Pending (${demo.team.filter((m) => m.status === "pending").length})`,
          },
          { value: "roles", label: "Roles" },
        ]}
      />

      <Panel className="mt-4">
        {tab === "roles" ? (
          <ul className="divide-y">
            {(Object.keys(ROLE_INFO) as TeamMember["role"][]).map((r) => (
              <li key={r} className="px-4 py-3">
                <p className="text-sm font-medium">{r}</p>
                <p className="text-xs text-muted-foreground">{ROLE_INFO[r]}</p>
              </li>
            ))}
          </ul>
        ) : members.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No pending invitations.
          </p>
        ) : (
          <ul className="divide-y">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar src={avatar(m.avatar)} alt="" className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.role} · {m.email}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <h2 className="display-title mt-8 text-xl">Integrations</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {demo.integrations.map((i) => (
          <Panel key={i.id} className="flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background">
              {i.id === "google" ? <GoogleIcon /> : <DropboxIcon className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{i.name}</p>
              <p className={`text-xs ${i.connected ? "text-success" : "text-muted-foreground"}`}>
                {i.connected ? "Connected" : i.description}
              </p>
            </div>
            <Button
              size="sm"
              variant={i.connected ? "outline" : "default"}
              onClick={() => {
                toggleIntegration(i.id);
                toast.success(`${i.name} ${i.connected ? "disconnected" : "connected"} (demo)`);
              }}
            >
              {i.connected ? "Disconnect" : "Connect"}
            </Button>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function InviteDialog() {
  const { inviteMember } = useDemo();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamMember["role"]>("Editor");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMember({ name: name.trim(), email: email.trim(), role });
    toast.success(`Invitation sent to ${email.trim()} (demo — no email is sent)`);
    setOpen(false);
    setName("");
    setEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="display-title text-xl">Invite a team member</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="im-name">Name</Label>
            <Input id="im-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="im-email">Email</Label>
            <Input
              id="im-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as TeamMember["role"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["Editor", "Assistant", "Viewer"] as const).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{ROLE_INFO[role]}</p>
          </div>
          <DialogFooter>
            <Button type="submit">Send invite</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
