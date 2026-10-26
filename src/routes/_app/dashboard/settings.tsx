import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { pageHead, PageHeader, SectionCard, ConfirmDialog, DemoNotice, Button } from "@/components/kit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDemo } from "@/lib/store";

export const Route = createFileRoute("/_app/dashboard/settings")({
  head: () => pageHead("Workspace settings", "Workspace-level preferences for your Pixora demo"),
  component: DashboardSettings,
});

function DashboardSettings() {
  const { state: demo, resetDemo } = useDemo();
  const [digest, setDigest] = useState(true);
  const [density, setDensity] = useState("comfortable");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Workspace settings"
        description="Workspace-level preferences. Studio details and branding live under Account settings."
      />

      <DemoNotice>
        These settings are part of the demo — they persist in your browser only and don't affect any real service.
      </DemoNotice>

      <SectionCard title="Workspace" description="How the dashboard behaves for you">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="ws-name">Workspace name</Label>
              <p className="text-xs text-muted-foreground">Shown in the sidebar and client-facing pages.</p>
            </div>
            <Input id="ws-name" defaultValue={demo.studioName} className="w-56" readOnly />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="ws-digest">Weekly email digest</Label>
              <p className="text-xs text-muted-foreground">A Monday summary of activity. Demo only — no email is sent.</p>
            </div>
            <Switch id="ws-digest" checked={digest} onCheckedChange={setDigest} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="ws-density">Interface density</Label>
              <p className="text-xs text-muted-foreground">Comfortable is recommended for photography review.</p>
            </div>
            <select
              id="ws-density"
              value={density}
              onChange={(e) => setDensity(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Reset demo data" description="Restore the original sample galleries, clients and orders">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-md text-sm text-muted-foreground">
            Everything you changed while exploring — new galleries, favorites, test orders — is wiped and the seed
            content comes back.
          </p>
          <ConfirmDialog
            trigger={
              <Button variant="destructive">
                <RotateCcw className="h-4 w-4" /> Reset demo data
              </Button>
            }
            title="Reset all demo data?"
            description="Your changes are discarded and the original sample content is restored. This cannot be undone."
            confirmLabel="Reset demo"
            onConfirm={() => {
              resetDemo();
              window.location.reload();
            }}
          />
        </div>
      </SectionCard>
    </div>
  );
}
