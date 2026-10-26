import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Monitor, Smartphone } from "lucide-react";
import { Button, DemoNotice, EmptyState, StatusBadge, pageHead } from "@/components/kit";
import { ScaledFrame, SiteRenderer } from "@/components/website-renderer";
import { useWebsite } from "@/lib/website-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/website/blog/$postId/preview")({
  head: () => pageHead("Post Preview", "Preview a blog post as visitors will see it."),
  component: PostPreview,
});

type Device = "desktop" | "mobile";

function PostPreview() {
  const { postId } = Route.useParams();
  const { site } = useWebsite();
  const [device, setDevice] = useState<Device>("desktop");
  const post = site.posts.find((p) => p.id === postId);
  // Show the post inside the blog page's chrome (menu highlight), or the homepage's.
  const page = site.pages.find((p) => p.sections.some((s) => s.kind === "blog")) ?? site.pages[0];

  if (!post || !page) {
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="Post not found"
          action={
            <Button asChild size="sm">
              <Link to="/website/blog">Back to blog</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/website/blog/$postId"
            params={{ postId: post.id }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to editor
          </Link>
          <h1 className="display-title mt-1 flex items-center gap-2 truncate text-xl">
            Preview <StatusBadge status={post.status} />
          </h1>
        </div>
        <div
          className="inline-flex rounded-md border bg-card p-0.5"
          role="group"
          aria-label="Preview size"
        >
          {(
            [
              ["desktop", Monitor, "Desktop"],
              ["mobile", Smartphone, "Mobile"],
            ] as const
          ).map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={device === value}
              onClick={() => setDevice(value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs",
                device === value
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {post.status === "draft" ? (
        <div className="mb-4">
          <DemoNotice>
            This post is a draft — visitors won't see it until you publish the post and then your
            website.
          </DemoNotice>
        </div>
      ) : null}

      <div className="rounded-lg border bg-muted/40 p-3 sm:p-5">
        <div className={cn("mx-auto", device === "mobile" && "max-w-[390px]")}>
          <ScaledFrame
            width={device === "mobile" ? 390 : 1280}
            className="rounded border bg-white shadow-soft"
          >
            <SiteRenderer site={site} page={page} post={post} />
          </ScaledFrame>
        </div>
      </div>
    </div>
  );
}
