import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  CalendarRange,
  Camera,
  DollarSign,
  Images,
  Plus,
  Sparkles,
  Store,
  UserPlus,
} from "lucide-react";
import { pageHead, PageHeader, SectionCard, StatCard, StatusBadge, Button } from "@/components/kit";
import { useDemo } from "@/lib/store";
import { money, photo, photoWide } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => pageHead("Dashboard", "Today at your studio — galleries, sessions and revenue at a glance"),
  component: Dashboard,
});

function Dashboard() {
  const { state: demo } = useDemo();
  const today = new Date().toISOString().slice(0, 10);

  const published = demo.galleries.filter((g) => g.status === "published").length;
  const revenue = demo.invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const openLeads = demo.leads.filter((l) => l.stage !== "won" && l.stage !== "lost").length;
  const upcoming = demo.sessions.filter((s) => s.status === "scheduled" && s.date >= today).length;
  const photoCount = demo.galleries.reduce((n, g) => n + g.photos.length, 0);

  const clientName = (id: string | null) =>
    demo.clients.find((c) => c.id === id)?.name ?? "Unassigned";

  const recentGalleries = demo.galleries.slice(0, 6);
  const nextSessions = [...demo.sessions]
    .filter((s) => s.status === "scheduled" && s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        title={`Good to see you, Alex`}
        description={`Everything happening across ${demo.studioName} today.`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/studio/leads">
                <UserPlus className="h-4 w-4" /> Review leads
              </Link>
            </Button>
            <Button asChild>
              <Link to="/galleries/new">
                <Plus className="h-4 w-4" /> New gallery
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Published galleries" value={published} sub={`${demo.galleries.length} total · ${photoCount} photos`} icon={Images} />
        <StatCard label="Revenue collected" value={money(revenue)} sub="Paid invoices, all time" icon={DollarSign} />
        <StatCard label="Open leads" value={openLeads} sub="Waiting on a reply" icon={Sparkles} />
        <StatCard label="Upcoming sessions" value={upcoming} sub="Scheduled from today" icon={CalendarRange} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Recent galleries"
          description="Latest deliveries and drafts"
          className="lg:col-span-2"
          contentClassName="p-4"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link to="/galleries">View all</Link>
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {recentGalleries.map((g) => (
              <Link
                key={g.id}
                to="/galleries/$id"
                params={{ id: g.id }}
                className="group photo-card photo-card-hover block"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={photoWide(g.coverSeed, 720, 540)}
                    alt={g.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <span className="absolute left-2 top-2">
                    <StatusBadge status={g.status} />
                  </span>
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate text-sm font-semibold">{g.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {clientName(g.clientId)} · {g.photos.length} photos · {g.views} views
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>

        <div className="flex flex-col gap-6">
          <SectionCard title="Next sessions" contentClassName="p-0">
            {nextSessions.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No sessions coming up — enjoy the calm.</p>
            ) : (
              <ul className="divide-y">
                {nextSessions.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.date} · {s.time} · {s.location}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Latest activity"
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard/activity">All activity</Link>
              </Button>
            }
            contentClassName="p-4"
          >
            <ul className="space-y-3">
              {demo.activity.slice(0, 5).map((a) => (
                <li key={a.id} className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                  <div className="min-w-0">
                    <p className="text-xs leading-relaxed">{a.message}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{new Date(a.time).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Quick actions" contentClassName="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link to="/store"><Store className="h-3.5 w-3.5" /> Store</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link to="/clients"><UserPlus className="h-3.5 w-3.5" /> Add client</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link to="/website"><Sparkles className="h-3.5 w-3.5" /> Website</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link to="/studio/calendar"><CalendarRange className="h-3.5 w-3.5" /> Calendar</Link>
            </Button>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
