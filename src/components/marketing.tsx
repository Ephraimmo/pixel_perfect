import { Link } from "@tanstack/react-router";
import { useDemo } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { photo } from "@/lib/demo-data";

export function MarketingNav() {
  const { state: demo } = useDemo();
  const links = [
    { to: "/features", label: "Features" },
    { to: "/pricing", label: "Pricing" },
    { to: "/templates", label: "Templates" },
  ];
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-display text-lg font-semibold text-primary-foreground">P</span>
          <span className="font-display text-lg font-semibold tracking-tight">Pixora</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-5 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {demo.signedIn ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Open workspace</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Start free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold">Pixora</p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Galleries, booking, store and website — one calm home for your photography business.
          </p>
        </div>
        <div>
          <p className="eyebrow">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/features" className="hover:text-foreground">Features</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link to="/templates" className="hover:text-foreground">Templates</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Try it</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
            <li><Link to="/signup" className="hover:text-foreground">Create account</Link></li>
            <li><Link to="/client-portal" className="hover:text-foreground">Client portal demo</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Sample gallery</p>
          <Link to="/g/$shareSlug" params={{ shareSlug: "mokoena-getting-ready" }} className="mt-3 block">
            <img src={photo("pixora-footer", 320, 200)} alt="Sample gallery cover" className="photo-card aspect-[8/5] w-full object-cover" loading="lazy" />
          </Link>
        </div>
      </div>
      <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Pixora — a demo experience. No real accounts, payments or emails.
      </div>
    </footer>
  );
}
