import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { MarketingFooter } from "@/components/marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import { useDemo } from "@/lib/store";
import { photoWide } from "@/lib/demo-data";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Pixora" },
      { name: "description", content: "Sign in to your Pixora workspace. In this demo, any details open the full sample studio." },
      { property: "og:title", content: "Sign in — Pixora" },
      { property: "og:description", content: "Sign in to your Pixora workspace. Demo mode — no real accounts." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: photoWide("pixora-login", 1600, 1000) },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: photoWide("pixora-login", 1600, 1000) },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { signInDemo } = useDemo();
  const [email, setEmail] = useState("alex@pixora.studio");
  const [password, setPassword] = useState("demo-only");
  const [signingIn, setSigningIn] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    signInDemo();
    void navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <p className="eyebrow">Welcome back</p>
          <h1 className="display-title mt-2 text-3xl">Sign in to Pixora</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Demo mode: no real accounts exist. Any email opens the sample studio workspace.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={signingIn}>
              {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {signingIn ? "Opening the studio…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="font-medium text-clay underline-offset-4 hover:underline">
              Create a demo account
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <img
          src={photoWide("pixora-login", 1200, 1600)}
          alt="A quiet studio workspace"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
