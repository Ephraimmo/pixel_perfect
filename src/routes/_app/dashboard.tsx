import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUp } from "lucide-react";
import { Avatar, Panel, pageHead } from "@/components/kit";
import { useDemo } from "@/lib/store";
<<<<<<< HEAD
import { DEMO_TODAY, avatar, img, moneyShort } from "@/lib/demo-data";
import { leadTrend } from "@/lib/leads";
=======
import { avatar, img, moneyShort } from "@/lib/demo-data";
>>>>>>> origin/main

export const Route = createFileRoute("/_app/dashboard")({
  head: () => pageHead("Dashboard", "Here's what's happening with your business today."),
  component: Dashboard,
});

// Session and invoice revenue booked outside the store this month.
const BASE_REVENUE = 3485;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const { state: demo } = useDemo();
  const paid = demo.orders.filter((o) => o.status === "paid" || o.status === "shipped");
  const revenue = BASE_REVENUE + paid.reduce((s, o) => s + o.total, 0);
  const upcoming = demo.sessions.filter((s) => s.status === "confirmed").length;
<<<<<<< HEAD
  const leads = leadTrend(demo.leads, DEMO_TODAY);
=======
>>>>>>> origin/main

  const stats = [
    {
      label: "Total Revenue",
      value: moneyShort(revenue),
      sub: (
        <>
          <Up /> 12% <span className="text-muted-foreground">from last 30 days</span>
        </>
      ),
      to: "/store/orders",
    },
    {
      label: "Upcoming Sessions",
      value: upcoming,
      sub: <span className="text-muted-foreground">Next: 2:00 PM</span>,
      to: "/studio",
    },
    {
      label: "Pending Invoices",
      value: 3,
      sub: <span className="text-muted-foreground">{moneyShort(1240)}</span>,
      to: "/store/orders",
    },
    {
      label: "New Leads",
<<<<<<< HEAD
      value: leads.current,
      sub:
        leads.change === null ? (
          <span className="text-muted-foreground">Last 30 days</span>
        ) : (
          <>
            {leads.change >= 0 ? <Up /> : "↓"} {Math.abs(leads.change)}%
          </>
        ),
      to: "/leads",
=======
      value: 8,
      sub: (
        <>
          <Up /> 33%
        </>
      ),
      to: "/clients",
>>>>>>> origin/main
    },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="display-title text-2xl">
        {greeting()}, {demo.profile.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Here's what's happening with your business today.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="rounded-lg border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift"
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight">{s.value}</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success">{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_17rem]">
        <Panel className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Galleries</h2>
            <Link to="/galleries" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {demo.galleries.slice(0, 3).map((g) => (
              <Link key={g.id} to="/galleries/$id" params={{ id: g.id }} className="group block">
                <div className="overflow-hidden rounded-md">
                  <img
                    src={img(g.cover, 480, 360)}
                    alt={g.title}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <p className="mt-2 truncate text-xs font-medium">{g.shortTitle}</p>
                <p className="text-[11px] text-muted-foreground">
                  {g.photoCount} photos · {g.updated}
                </p>
              </Link>
            ))}
          </div>

          <h2 className="mt-6 text-sm font-semibold">Activities</h2>
          <ul className="mt-2 divide-y">
            {demo.activity.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <Avatar src={avatar(a.avatar)} alt="" className="h-7 w-7" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{a.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{a.detail}</p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{a.time}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="h-fit p-4">
          <h2 className="text-sm font-semibold">Activity Feed</h2>
          <ul className="mt-3 space-y-4">
            {demo.activity.slice(0, 2).map((a) => (
              <li key={a.id} className="flex gap-2.5">
                <Avatar src={avatar(a.avatar)} alt="" className="h-7 w-7" />
                <div className="min-w-0">
                  <p className="text-xs font-medium">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t pt-4">
            <p className="text-xs font-medium">Next session</p>
            {demo.sessions.slice(0, 1).map((s) => (
              <Link
                key={s.id}
                to="/studio/calendar"
                className="mt-2 block rounded-md bg-info/10 px-3 py-2 text-xs hover:bg-info/15"
              >
                <span className="font-medium text-info">{s.title}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {s.note} · {s.location}
                </span>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Up() {
  return <ArrowUp className="h-3 w-3" />;
}
