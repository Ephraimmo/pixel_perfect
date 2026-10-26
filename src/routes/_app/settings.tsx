import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, Button, PageHeader, Panel, TabBar, pageHead } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDemo } from "@/lib/store";
import { PHOTOS, avatar, formatDate } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  head: () => pageHead("Account Settings", "Profile, branding, billing and security."),
  component: Settings,
});

type Tab = "profile" | "branding" | "billing" | "team" | "security";

const AVATAR_CHOICES = [
  PHOTOS.avatars.karabo,
  PHOTOS.avatars.lerato,
  PHOTOS.avatars.emma,
  PHOTOS.avatars.thabo,
];
const ACCENTS = [
  "oklch(0.3 0.035 165)",
  "oklch(0.32 0.03 250)",
  "oklch(0.45 0.09 40)",
  "oklch(0.25 0.01 70)",
];

function Settings() {
  const { state: demo, updateProfile } = useDemo();
  const [tab, setTab] = useState<Tab>("profile");
  const [draft, setDraft] = useState(demo.profile);
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [twoFactor, setTwoFactor] = useState(false);

  const save = () => {
    if (!draft.name.trim() || !draft.email.includes("@")) {
      toast.error("Enter a name and a valid email.");
      return;
    }
    updateProfile({
      name: draft.name.trim(),
      email: draft.email.trim(),
      studio: draft.studio,
      avatar: draft.avatar,
    });
    toast.success("Settings saved");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Account Settings" />
      <Panel className="p-5">
        <TabBar
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "profile", label: "Profile" },
            { value: "branding", label: "Branding" },
            { value: "billing", label: "Billing" },
            { value: "team", label: "Team" },
            { value: "security", label: "Security" },
          ]}
        />

        <div className="mt-6 space-y-6">
          {tab === "profile" ? (
            <>
              <div className="flex flex-wrap items-center gap-4">
                <Avatar src={avatar(draft.avatar, 160)} alt="" className="h-16 w-16" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{draft.name}</p>
                  <p className="text-xs text-muted-foreground">{draft.email}</p>
                </div>
                <div className="flex items-center gap-1.5" role="group" aria-label="Change photo">
                  <span className="mr-1 text-xs text-muted-foreground">Change photo</span>
                  {AVATAR_CHOICES.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, avatar: a }))}
                      className={cn(
                        "rounded-full ring-offset-2 ring-offset-card",
                        a === draft.avatar ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100",
                      )}
                    >
                      <Avatar src={avatar(a)} alt="Choose photo" className="h-7 w-7" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="st-name">Name</Label>
                  <Input
                    id="st-name"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="st-email">Email</Label>
                  <Input
                    id="st-email"
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  />
                </div>
              </div>
              <PlanRow plan={demo.profile.plan} renews={demo.profile.renews} />
            </>
          ) : null}

          {tab === "branding" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="st-studio">Studio name</Label>
                <Input
                  id="st-studio"
                  value={draft.studio}
                  onChange={(e) => setDraft((d) => ({ ...d, studio: e.target.value }))}
                />
              </div>
              <div>
                <p className="text-sm font-medium">Accent color</p>
                <p className="text-xs text-muted-foreground">
                  Used on your galleries and website buttons.
                </p>
                <div className="mt-3 flex gap-2">
                  {ACCENTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Accent ${c}`}
                      onClick={() => setAccent(c)}
                      style={{ backgroundColor: c }}
                      className={cn(
                        "h-8 w-8 rounded-full ring-offset-2 ring-offset-card",
                        accent === c && "ring-2 ring-foreground",
                      )}
                    />
                  ))}
                </div>
                <div
                  className="mt-4 inline-flex rounded-md px-4 py-2 text-xs font-medium text-white"
                  style={{ backgroundColor: accent }}
                >
                  View Gallery
                </div>
              </div>
            </>
          ) : null}

          {tab === "billing" ? (
            <>
              <PlanRow plan={demo.profile.plan} renews={demo.profile.renews} />
              <div className="rounded-md border p-4 text-sm">
                <p className="font-medium">Payment method</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Visa ending 4242 · expires 08/27
                </p>
              </div>
              <ul className="divide-y rounded-md border text-xs">
                {["Apr 12, 2025", "Mar 12, 2025", "Feb 12, 2025"].map((d) => (
                  <li key={d} className="flex justify-between px-4 py-2.5">
                    <span>{d}</span>
                    <span className="text-muted-foreground">Pro plan · $29.00</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {tab === "team" ? (
            <p className="text-sm text-muted-foreground">
              {demo.team.length} members on your workspace.{" "}
              <Link to="/team" className="font-medium text-foreground underline underline-offset-2">
                Manage team
              </Link>
            </p>
          ) : null}

          {tab === "security" ? (
            <>
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block text-sm">Two-factor authentication</span>
                  <span className="block text-xs text-muted-foreground">
                    Require a code from your phone when logging in.
                  </span>
                </span>
                <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Password reset email sent (demo)")}
              >
                Change password
              </Button>
            </>
          ) : null}
        </div>

        <div className="mt-8 flex justify-end">
          <Button size="sm" onClick={save}>
            Save changes
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function PlanRow({ plan, renews }: { plan: string; renews: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4">
      <div>
        <p className="text-sm font-medium">Plan</p>
        <p className="text-xs text-muted-foreground">
          {plan} · Renews {formatDate(renews)}
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to="/pricing">Change plan</Link>
      </Button>
    </div>
  );
}
