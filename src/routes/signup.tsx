import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { MarketingFooter } from "@/components/marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoNotice } from "@/components/kit";
import { useDemo } from "@/lib/store";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Start free — Pixora" },
      { name: "description", content: "Create your Pixora workspace and try the full demo — galleries, studio CRM, store and website builder." },
      { property: "og:title", content: "Start free — Pixora" },
      { property: "og:description", content: "Create your Pixora workspace and try the full demo." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const { signInDemo } = useDemo();
  const [studioName, setStudioName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    signInDemo();
    void navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-svh flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-0">
        <p className="eyebrow">Get started</p>
        <h1 className="display-title mt-2 text-3xl">Open your demo workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything is pre-loaded with a sample studio — six galleries, real-looking clients, orders and a live pipeline.
        </p>

        <DemoNotice>
          Demo mode: we don't create real accounts or send any email. Your details stay in this browser only.
        </DemoNotice>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="signup-studio">Studio name</Label>
            <Input
              id="signup-studio"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="Naledi Petersen Photography"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              autoComplete="email"
            />
          </div>
          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {creating ? "Setting up the studio…" : "Open the demo workspace"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have the demo open?{" "}
          <Link to="/login" className="font-medium text-clay underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
      <MarketingFooter />
    </div>
  );
}
