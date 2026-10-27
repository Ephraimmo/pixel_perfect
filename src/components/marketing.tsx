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

/** Height the fixed bar occupies (top gap + bar), reserved so content isn't hidden under it. */
const NAV_SPACE = "h-[4.25rem]";

/**
 * Main site navigation: a rounded frosted-glass bar fixed to the top of the
 * window. The current page is underlined; hovering a link shows a lighter line.
 */
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
    <>
      {/* Keeps page content below the fixed bar. */}
      <div aria-hidden className={NAV_SPACE} />
      <header className={cn("fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4", className)}>
        <div
          className={cn(
            "mx-auto flex h-14 max-w-6xl items-center gap-6 rounded-2xl border px-4 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,box-shadow] duration-300",
            "border-white/60 dark:border-white/10",
            scrolled || open
              ? "bg-background/85 shadow-lift"
              : "bg-background/60 shadow-[0_8px_30px_-14px_rgba(40,28,16,0.25)]",
          )}
        >
          <Logo className="text-lg" />

          <nav aria-label="Main" className="mx-auto hidden md:block">
            <ul className="flex items-center gap-8">
              {links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    activeOptions={{ exact: l.exact }}
                    className={cn(
                      "relative inline-block py-1 text-[13px] text-foreground/65 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none",
                      // Underline directly beneath the label.
                      "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-foreground/35 after:transition-transform after:duration-200",
                      "hover:after:scale-x-100 focus-visible:after:scale-x-100",
                      "data-[status=active]:font-medium data-[status=active]:text-foreground data-[status=active]:after:scale-x-100 data-[status=active]:after:bg-foreground",
                    )}
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
              className="hidden bg-card/60 sm:inline-flex"
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
            className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-white/60 bg-background/90 shadow-lift backdrop-blur-xl animate-in fade-in slide-in-from-top-1 md:hidden dark:border-white/10"
          >
            <ul className="py-2">
              {links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    activeOptions={{ exact: l.exact }}
                    className="block border-l-2 border-transparent px-4 py-3 text-sm text-foreground/70 transition-colors hover:border-foreground/30 hover:bg-foreground/[0.03] hover:text-foreground data-[status=active]:border-foreground data-[status=active]:font-medium data-[status=active]:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t px-4 py-3 sm:hidden">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/login">Log in</Link>
              </Button>
            </div>
          </nav>
        ) : null}
      </header>
    </>
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
