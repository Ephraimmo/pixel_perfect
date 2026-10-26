import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, SocialButtons } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PHOTOS, img } from "@/lib/demo-data";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Pixora" },
      { name: "description", content: "Log in to your Pixora account." },
      { property: "og:title", content: "Log in — Pixora" },
      { property: "og:description", content: "Log in to your Pixora account." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("karabo@pixora.com");
  const [password, setPassword] = useState("demo-password");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    void navigate({ to: "/dashboard" });
  };

  return (
    <AuthLayout
      image={img(PHOTOS.loginCoast, 1400)}
      overlay={
        <p className="display-title text-4xl leading-snug">
          Capture
          <br />
          Share
          <br />
          Grow
        </p>
      }
    >
      <h1 className="display-title text-3xl">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Log in to your account.</p>

      <form onSubmit={submit} className="mt-7 space-y-3">
        <Input
          type="email"
          placeholder="Email address"
          aria-label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-card"
        />
        <Input
          type="password"
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-card"
        />
        <div className="flex items-center justify-between pt-1 text-xs">
          <label className="flex items-center gap-2 text-muted-foreground">
            <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />{" "}
            Remember me
          </label>
          <button
            type="button"
            onClick={() => toast.info(`Reset link sent to ${email} (demo)`)}
            className="text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </button>
        </div>
        <Button type="submit" className="mt-2 w-full" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Log in
        </Button>
      </form>

      <div className="mt-5">
        <SocialButtons onDone={() => navigate({ to: "/dashboard" })} />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-foreground underline underline-offset-2">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
