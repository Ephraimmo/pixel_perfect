import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/kit";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home", exact: true },
  { to: "/features", label: "Features", exact: false },
  { to: "/pricing", label: "Pricing", exact: false },
  { to: "/templates", label: "Templates", exact: false },
] as const;

/** Main site navigation: a frosted-glass bar that stays on top while scrolling. */
export function MarketingNav({ className }: { className?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu after navigating, and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={cn("sticky top-0 z-40 px-3 pt-3 sm:px-4", className)}>
      <div
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center gap-4 rounded-2xl border px-3 transition-[background-color,box-shadow] duration-300 sm:px-4",
          "border-white/60 bg-background/55 shadow-[0_8px_30px_-14px_rgba(40,28,16,0.25)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10",
          scrolled && "bg-background/80 shadow-lift",
        )}
      >
        <Logo className="text-lg" />

        <nav aria-label="Main" className="mx-auto hidden md:block">
          <ul className="flex items-center gap-1 rounded-full border border-white/70 bg-white/40 p-1 shadow-inner shadow-black/[0.03] backdrop-blur-md dark:border-white/10 dark:bg-white/5">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  activeOptions={{ exact: l.exact }}
                  className="block rounded-full px-4 py-1.5 text-[13px] text-foreground/70 transition-colors hover:bg-white/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/10"
                  activeProps={{
                    className:
                      "bg-card !text-foreground font-medium shadow-sm ring-1 ring-black/5 hover:bg-card",
                  }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden border-white/70 bg-white/50 backdrop-blur-md hover:bg-white/80 sm:inline-flex dark:border-white/10 dark:bg-white/5"
          >
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/signup">Get Started</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="marketing-mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open ? (
        <nav
          id="marketing-mobile-menu"
          aria-label="Main"
          className="mx-auto mt-2 max-w-6xl rounded-2xl border border-white/60 bg-background/85 p-2 shadow-lift backdrop-blur-xl animate-in fade-in slide-in-from-top-2 md:hidden dark:border-white/10"
        >
          <ul className="space-y-0.5">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  activeOptions={{ exact: l.exact }}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-foreground/75 transition-colors hover:bg-white/60 hover:text-foreground dark:hover:bg-white/10"
                  activeProps={{
                    className: "bg-card !text-foreground font-medium shadow-sm ring-1 ring-black/5",
                  }}
                >
                  {({ isActive }) => (
                    <>
                      {l.label}
                      {isActive ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-clay" aria-hidden />
                      ) : null}
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t pt-2 sm:hidden">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/login">Log in</Link>
            </Button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <Logo className="text-sm" />
        <p>© {new Date().getFullYear()} Pixora. Demo experience — no real accounts or payments.</p>
      </div>
    </footer>
  );
}
