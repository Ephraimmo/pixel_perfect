import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Heart, LayoutGrid, Lock } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDemo } from "@/lib/store";
import type { Gallery } from "@/lib/demo-data";

/** Chrome for the client-facing gallery pages, with a password gate when required. */
export function ClientGalleryShell({
  id,
  children,
}: {
  id: string;
  children: (g: Gallery) => ReactNode;
}) {
  const { state: demo } = useDemo();
  const g = demo.galleries.find((x) => x.id === id);
  const [unlocked, setUnlocked] = useState(false);
  const [attempt, setAttempt] = useState("");

  if (!g || g.status === "draft") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 bg-background px-4 text-center">
        <p className="display-title text-2xl">This gallery isn't available</p>
        <p className="text-sm text-muted-foreground">Ask your photographer for an updated link.</p>
      </div>
    );
  }

  const locked = g.privacy === "password" && !unlocked;

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo className="text-base" to="/" />
          <nav className="ml-auto flex items-center gap-1 text-xs">
            <Link
              to="/g/$id"
              params={{ id: g.id }}
              activeOptions={{ exact: true }}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-accent"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Gallery
            </Link>
            <Link
              to="/g/$id/downloads"
              params={{ id: g.id }}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-accent"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              <Heart className="h-3.5 w-3.5" /> Favorites & Downloads
            </Link>
          </nav>
        </div>
      </header>

      {locked ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (attempt === g.password) setUnlocked(true);
            else toast.error("That password isn't right.");
          }}
          className="mx-auto mt-24 max-w-xs px-4 text-center"
        >
          <Lock className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="display-title mt-3 text-2xl">{g.shortTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">This gallery is password protected.</p>
          <Input
            type="password"
            value={attempt}
            onChange={(e) => setAttempt(e.target.value)}
            placeholder="Password"
            className="mt-5 bg-card"
            autoFocus
          />
          <Button type="submit" className="mt-3 w-full">
            View gallery
          </Button>
          <p className="mt-3 text-[11px] text-muted-foreground">Demo hint: “{g.password}”</p>
        </form>
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children(g)}</main>
      )}
    </div>
  );
}

/** Simulated zip download — demo files only. */
export function fakeDownload(name: string) {
  const id = toast.loading(`Preparing ${name}…`);
  setTimeout(() => toast.success(`${name} is ready (demo — no file is saved)`, { id }), 1400);
}
