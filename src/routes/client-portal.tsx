import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronRight,
  Images,
  MessageSquare,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/kit";
import { useDemo } from "@/lib/store";
import { PHOTOS, formatDate, formatTime, img } from "@/lib/demo-data";

export const Route = createFileRoute("/client-portal")({
  head: () => ({
    meta: [
      { title: "Client Portal — Pixora" },
      { name: "description", content: "Your photos, bookings and more — all in one place." },
    ],
  }),
  component: ClientPortal,
});

function ClientPortal() {
  const { state: demo } = useDemo();
  const published = demo.galleries.filter((g) => g.status === "published");
  const bookings = demo.sessions.filter((s) => s.clientId === "c1");
  const next = bookings[0];

  const items: {
    icon: LucideIcon;
    title: string;
    sub: string;
    galleryId?: string | undefined;
    msg?: string;
  }[] = [
    {
      icon: Images,
      title: "My Galleries",
      sub: `${published.length} galleries`,
      galleryId: published[0]?.id,
    },
    {
      icon: CalendarDays,
      title: "My Bookings",
      sub: `${bookings.length} upcoming`,
      msg: next
        ? `Next: ${next.title} · ${formatDate(next.date)}, ${formatTime(next.start)}`
        : "No upcoming bookings",
    },
    {
      icon: Receipt,
      title: "My Invoices",
      sub: "1 invoice",
      msg: "Invoice #1042 · $1,200.00 · Paid",
    },
    {
      icon: MessageSquare,
      title: "Messages",
      sub: "2 unread",
      msg: `${demo.profile.name}: Your sneak peeks are ready!`,
    },
  ];

  return (
    <div className="min-h-svh bg-background">
      <div className="relative h-56 overflow-hidden">
        <img
          src={img(PHOTOS.portalHeader, 1600, 500)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-3xl flex-col justify-between px-4 py-5 sm:px-6">
          <Logo className="text-base" />
          <div className="pb-4">
            <h1 className="display-title text-3xl">Welcome back, Sarah!</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your photos, bookings and more — all in one place.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
        <ul className="divide-y rounded-lg border bg-card shadow-soft">
          {items.map((i) => {
            const body = (
              <>
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent">
                  <i.icon className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{i.title}</span>
                  <span className="block text-xs text-muted-foreground">{i.sub}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </>
            );
            return (
              <li key={i.title}>
                {i.galleryId ? (
                  <Link
                    to="/g/$id"
                    params={{ id: i.galleryId }}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent/40"
                  >
                    {body}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => toast(i.title, { description: i.msg })}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-accent/40"
                  >
                    {body}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
