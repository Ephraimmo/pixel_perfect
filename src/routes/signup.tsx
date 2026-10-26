import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, SocialButtons } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PHOTOS, img } from "@/lib/demo-data";
import { useDemo } from "@/lib/store";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — Pixora" },
      { name: "description", content: "Join thousands of photographers using Pixora." },
      { property: "og:title", content: "Create your account — Pixora" },
      { property: "og:description", content: "Join thousands of photographers using Pixora." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const { updateProfile } = useDemo();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please accept the Terms of Service to continue.");
      return;
    }
    setBusy(true);
    updateProfile({ name: name.trim().split(" ")[0] || "Karabo", email });
    toast.success("Account created — welcome to Pixora!");
    void navigate({ to: "/dashboard" });
  };

  return (
    <AuthLayout
      image={img(PHOTOS.signupMountains, 1400)}
      overlay={
        <p className="display-title max-w-sm text-4xl leading-tight">
          “The best moments deserve to be beautifully shared.”
        </p>
      }
    >
      <h1 className="display-title text-3xl">Create your account</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Join thousands of photographers using Pixora.
      </p>

      <div className="mt-7">
        <SocialButtons onDone={() => navigate({ to: "/dashboard" })} />
      </div>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        <Input
          placeholder="Full name"
          aria-label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="bg-card"
        />
        <Input
          type="email"
          placeholder="Email address"
          aria-label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-card"
        />
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            className="bg-card pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <label className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
          <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
          <span>
            I agree to the{" "}
            <a href="#" className="text-foreground underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-foreground underline">
              Privacy Policy
            </a>
          </span>
        </label>
        <Button type="submit" className="mt-2 w-full" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-foreground underline underline-offset-2">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
