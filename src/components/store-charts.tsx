import { useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Panel } from "@/components/kit";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { money } from "@/lib/demo-data";
import type { RevenuePoint } from "@/lib/shop-data";

/** KPI tile with a signed change against the previous period. */
export function StatTile({
  label,
  value,
  change,
  caption,
}: {
  label: string;
  value: string;
  change: number | null;
  caption: string;
}) {
  const up = change !== null && change >= 0;
  return (
    <div className="rounded-lg border bg-card p-4 shadow-soft">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 flex items-center gap-1 text-xs">
        {change === null ? (
          <span className="text-muted-foreground">No prior sales to compare</span>
        ) : (
          <>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                up ? "text-success" : "text-rose",
              )}
            >
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {up ? "+" : "−"}
              {Math.abs(change).toFixed(0)}%
            </span>
            <span className="text-muted-foreground">{caption}</span>
          </>
        )}
      </p>
    </div>
  );
}

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function RevenueChart({ series, weekly }: { series: RevenuePoint[]; weekly: boolean }) {
  const [asTable, setAsTable] = useState(false);
  const empty = series.every((p) => p.revenue === 0);

  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Paid revenue</h2>
          <p className="text-[11px] text-muted-foreground">{weekly ? "Per week" : "Per day"}</p>
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {asTable ? "View chart" : "View as table"}
        </button>
      </div>

      {empty ? (
        <p className="py-16 text-center text-xs text-muted-foreground">
          No paid sales in this period.
        </p>
      ) : asTable ? (
        <div className="mt-3 max-h-60 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 border-b bg-card text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">{weekly ? "Week of" : "Date"}</th>
                <th className="py-2 text-right font-medium">Orders</th>
                <th className="py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y tabular-nums">
              {series.map((p) => (
                <tr key={p.date}>
                  <td className="py-1.5">{p.label}</td>
                  <td className="py-1.5 text-right">{p.orders}</td>
                  <td className="py-1.5 text-right">{money(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="mt-3 aspect-auto h-60 w-full">
          <BarChart data={series} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={18}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) => compactMoney(v)}
            />
            <ChartTooltip
              cursor={{ fill: "var(--accent)", opacity: 0.6 }}
              content={<RevenueTooltip weekly={weekly} />}
            />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      )}
    </Panel>
  );
}

function RevenueTooltip({
  active,
  payload,
  weekly,
}: {
  active?: boolean;
  payload?: { payload: RevenuePoint }[];
  weekly: boolean;
}) {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-lift">
      <p className="text-[11px] text-muted-foreground">
        {weekly ? `Week of ${point.label}` : point.label}
      </p>
      <p className="mt-0.5 flex items-center gap-2 font-semibold tabular-nums">
        <span className="h-0.5 w-3 rounded bg-[var(--color-revenue)]" aria-hidden />
        {money(point.revenue)}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {point.orders} paid {point.orders === 1 ? "order" : "orders"}
      </p>
    </div>
  );
}

function compactMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
