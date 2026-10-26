import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { WebsiteProvider, useWebsite } from "@/lib/website-store";

export const Route = createFileRoute("/_app/website")({
  component: WebsiteLayout,
});

function WebsiteLayout() {
  return (
    <WebsiteProvider>
      <WebsiteOutlet />
    </WebsiteProvider>
  );
}

// Website pages show dates and saved drafts from localStorage, so render them
// only once that state has loaded (avoids a server/client mismatch flash).
function WebsiteOutlet() {
  const { ready } = useWebsite();
  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl space-y-4" aria-busy="true">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  // inline-size containment: long unwrapped text (truncated titles, scaled
  // previews) can't widen the app shell past the viewport.
  return (
    <div className="[contain:inline-size]">
      <Outlet />
    </div>
  );
}
