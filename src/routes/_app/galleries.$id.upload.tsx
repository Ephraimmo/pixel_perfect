import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, CloudUpload, X } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Panel, pageHead } from "@/components/kit";
import { Progress } from "@/components/ui/progress";
import { useDemo } from "@/lib/store";
import { PHOTOS, img } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/galleries/$id/upload")({
  head: () => pageHead("Upload Photos", "Add photos to your gallery."),
  component: UploadPhotos,
});

interface QueueItem {
  id: string;
  name: string;
  sizeMb: number;
  progress: number;
  photos: number; // photos this file adds to the gallery
  thumb: string;
}

// Earlier files from this batch that finished before the screen opened.
const ALREADY_UPLOADED = 11;
const MAX_FILE_MB = 50;

const initialQueue: QueueItem[] = [
  {
    id: "q1",
    name: "wedding-photos.zip",
    sizeMb: 248,
    progress: 53,
    photos: 10,
    thumb: PHOTOS.wedding[0],
  },
  {
    id: "q2",
    name: "couple-portrait.jpg",
    sizeMb: 8.3,
    progress: 100,
    photos: 1,
    thumb: PHOTOS.wedding[1],
  },
  {
    id: "q3",
    name: "reception.jpg",
    sizeMb: 14.5,
    progress: 100,
    photos: 1,
    thumb: PHOTOS.wedding[2],
  },
  { id: "q4", name: "details.jpg", sizeMb: 6.1, progress: 0, photos: 1, thumb: PHOTOS.wedding[11] },
];

function UploadPhotos() {
  const { id } = Route.useParams();
  const { state: demo, addPhotos } = useDemo();
  const g = demo.galleries.find((x) => x.id === id);
  // A brand-new gallery starts empty; existing ones open mid-upload.
  const [fresh] = useState(() => !g || g.photos.length === 0);
  const [queue, setQueue] = useState<QueueItem[]>(() => (fresh ? [] : initialQueue));
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reported = useRef(new Set(initialQueue.filter((q) => q.progress >= 100).map((q) => q.id)));

  const active = queue.some((q) => q.progress < 100);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      setQueue((items) => {
        // Upload one file at a time, like a real queue.
        const next = items.find((q) => q.progress < 100);
        if (!next) return items;
        const step = Math.max(2, 40 / Math.sqrt(next.sizeMb));
        return items.map((q) =>
          q === next ? { ...q, progress: Math.min(100, q.progress + step) } : q,
        );
      });
    }, 250);
    return () => clearInterval(t);
  }, [active]);

  useEffect(() => {
    for (const q of queue) {
      if (q.progress >= 100 && !reported.current.has(q.id)) {
        reported.current.add(q.id);
        addPhotos(id, q.photos);
      }
    }
    if (queue.length > 0 && !active && reported.current.size > 2)
      toast.success("All photos uploaded");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, active]);

  if (!g) return <EmptyState title="Gallery not found" />;

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files).filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);
    if (accepted.length < files.length)
      toast.error(`Some files exceed ${MAX_FILE_MB}MB and were skipped.`);
    setQueue((items) => [
      ...items,
      ...accepted.map((f, i) => ({
        id: `f-${Date.now()}-${i}`,
        name: f.name,
        sizeMb: Math.max(0.1, +(f.size / 1024 / 1024).toFixed(1)),
        progress: 0,
        photos: 1,
        thumb: PHOTOS.wedding[(items.length + i) % PHOTOS.wedding.length] ?? g.cover,
      })),
    ]);
  };

  const base = fresh ? 0 : ALREADY_UPLOADED;
  const done = base + queue.filter((q) => q.progress >= 100).reduce((n, q) => n + q.photos, 0);
  const total = base + queue.reduce((n, q) => n + q.photos, 0);
  const current = queue.find((q) => q.progress < 100);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/galleries/$id"
        params={{ id }}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {g.title}
      </Link>
      <h1 className="display-title mt-2 text-2xl">Upload Photos</h1>

      <Panel className="mt-4 p-5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`flex w-full flex-col items-center rounded-lg border border-dashed px-6 py-10 text-center transition-colors ${
            dragging ? "border-primary bg-primary/5" : "hover:bg-accent/40"
          }`}
        >
          <CloudUpload className="h-8 w-8 text-foreground/70" strokeWidth={1.5} />
          <p className="mt-3 text-sm">Drag and drop your photos here</p>
          <p className="text-sm">
            or <span className="underline underline-offset-2">click to browse</span>
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Supports JPG, PNG, HEIC, up to {MAX_FILE_MB}MB each
          </p>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.zip"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />

        {queue.length > 0 ? (
          <>
            <p className="mt-6 text-sm font-medium">
              {active ? `Uploading ${done} of ${total}` : `Uploaded ${total} of ${total}`}
            </p>
            <ul className="mt-3 space-y-3">
              {queue.map((q) => (
                <li key={q.id} className="flex items-center gap-3">
                  <img
                    src={img(q.thumb, 80, 80)}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate">{q.name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {q.progress >= 100
                          ? `${q.sizeMb} MB`
                          : q === current && q.progress > 0
                            ? `${Math.round(q.progress)}%`
                            : "Uploading..."}
                      </span>
                    </div>
                    {q.progress < 100 && q.progress > 0 ? (
                      <Progress value={q.progress} className="mt-1.5 h-1" />
                    ) : null}
                  </div>
                  {q.progress >= 100 ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <button
                      type="button"
                      aria-label={`Cancel ${q.name}`}
                      onClick={() => setQueue((items) => items.filter((x) => x.id !== q.id))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button asChild size="sm" variant={active ? "outline" : "default"}>
            <Link to="/galleries/$id" params={{ id }}>
              {active ? "Back to gallery" : "Done"}
            </Link>
          </Button>
        </div>
      </Panel>
    </div>
  );
}
