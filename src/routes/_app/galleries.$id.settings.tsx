import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Panel, TabBar, pageHead } from "@/components/kit";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/lib/store";
import { img, type Gallery } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/galleries/$id/settings")({
  head: () =>
    pageHead("Gallery Settings", "Name, privacy, downloads and appearance for this gallery."),
  component: GallerySettings,
});

type Tab = "general" | "privacy" | "downloads" | "appearance";

function GallerySettings() {
  const { id } = Route.useParams();
  const { state: demo } = useDemo();
  const g = demo.galleries.find((x) => x.id === id);
  if (!g) return <EmptyState title="Gallery not found" />;
  // Keyed so the draft resets if the gallery changes underneath.
  return <SettingsForm key={g.id} gallery={g} />;
}

function SettingsForm({ gallery }: { gallery: Gallery }) {
  const { updateGallery } = useDemo();
  const [tab, setTab] = useState<Tab>("general");
  const [draft, setDraft] = useState(gallery);
  const [pickCover, setPickCover] = useState(false);
  const set = (patch: Partial<Gallery>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    if (draft.privacy === "password" && !draft.password) {
      toast.error("Set a password, or make the gallery public.");
      return;
    }
    updateGallery(gallery.id, {
      title: draft.title,
      description: draft.description,
      cover: draft.cover,
      privacy: draft.privacy,
      password: draft.password,
      allowDownloads: draft.allowDownloads,
      allowFavorites: draft.allowFavorites,
      status: draft.status,
    });
    toast.success("Gallery settings saved");
  };

  const privacy = (
    <div className="space-y-3">
      <p className="text-sm font-medium">Privacy</p>
      <RadioGroup
        value={draft.privacy}
        onValueChange={(v) => set({ privacy: v as Gallery["privacy"] })}
        className="gap-3"
      >
        <label className="flex items-center gap-2.5 text-sm">
          <RadioGroupItem value="public" /> Public{" "}
          <span className="text-xs text-muted-foreground">(anyone with the link can view)</span>
        </label>
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center gap-2.5 text-sm">
            <RadioGroupItem value="password" /> Password protected
          </label>
          {draft.privacy === "password" ? (
            <Input
              value={draft.password}
              onChange={(e) => set({ password: e.target.value })}
              placeholder="Set password"
              className="h-8 w-44 text-xs"
            />
          ) : null}
        </div>
      </RadioGroup>
    </div>
  );

  const toggles = (
    <div className="space-y-4">
      <ToggleRow
        label="Allow downloads"
        checked={draft.allowDownloads}
        onChange={(v) => set({ allowDownloads: v })}
      />
      <ToggleRow
        label="Allow favorites"
        checked={draft.allowFavorites}
        onChange={(v) => set({ allowFavorites: v })}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/galleries/$id"
        params={{ id: gallery.id }}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {gallery.title}
      </Link>
      <h1 className="display-title mt-2 text-2xl">Gallery Settings</h1>

      <Panel className="mt-4 p-5">
        <TabBar
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "general", label: "General" },
            { value: "privacy", label: "Privacy" },
            { value: "downloads", label: "Downloads" },
            { value: "appearance", label: "Appearance" },
          ]}
        />

        <div className="mt-5 space-y-5">
          {tab === "general" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="gs-name" className="text-xs">
                  Gallery name
                </Label>
                <Input
                  id="gs-name"
                  value={draft.title}
                  onChange={(e) => set({ title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gs-desc" className="text-xs">
                  Description
                </Label>
                <Textarea
                  id="gs-desc"
                  rows={2}
                  value={draft.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium">Cover image</p>
                <div className="flex items-center gap-3">
                  <img
                    src={img(draft.cover, 200, 140)}
                    alt="Cover"
                    className="h-16 w-24 rounded object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickCover(true)}
                  >
                    Change cover
                  </Button>
                </div>
              </div>
              {privacy}
              {toggles}
            </>
          ) : null}

          {tab === "privacy" ? (
            <>
              {privacy}
              <ToggleRow
                label="Published"
                hint="Drafts are only visible to you."
                checked={draft.status === "published"}
                onChange={(v) => set({ status: v ? "published" : "draft" })}
              />
            </>
          ) : null}

          {tab === "downloads" ? toggles : null}

          {tab === "appearance" ? (
            <div>
              <p className="text-sm font-medium">Cover image</p>
              <p className="text-xs text-muted-foreground">
                Shown at the top of the client gallery.
              </p>
              <CoverGrid
                photos={gallery.photos}
                value={draft.cover}
                onPick={(cover) => set({ cover })}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end">
          <Button size="sm" onClick={save}>
            Save changes
          </Button>
        </div>
      </Panel>

      <Dialog open={pickCover} onOpenChange={setPickCover}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Choose a cover</DialogTitle>
          </DialogHeader>
          <CoverGrid
            photos={gallery.photos}
            value={draft.cover}
            onPick={(cover) => {
              set({ cover });
              setPickCover(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span>
        <span className="block text-sm">{label}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function CoverGrid({
  photos,
  value,
  onPick,
}: {
  photos: string[];
  value: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
      {photos.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPick(p)}
          className={`overflow-hidden rounded ring-offset-2 ring-offset-card ${p === value ? "ring-2 ring-primary" : "hover:opacity-80"}`}
        >
          <img
            src={img(p, 200, 200)}
            alt=""
            className="aspect-square w-full object-cover"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
}
