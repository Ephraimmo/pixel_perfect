import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/kit";
import { cn } from "@/lib/utils";

export function MarketingNav({ className }: { className?: string }) {
  const links = [
    { to: "/features", label: "Features" },
    { to: "/pricing", label: "Pricing" },
    { to: "/templates", label: "Templates" },
  ];
  return (
    <header className={cn("relative z-30", className)}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo className="text-lg" />
        <nav className="mx-auto hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[13px] text-foreground/75 transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button asChild variant="outline" size="sm" className="bg-card/70">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
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
