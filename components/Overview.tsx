"use client";

import { useMemo } from "react";
import { BUCKETS, BUCKET_COLORS, Bucket } from "../lib/types";
import { fmtMoney, fmtPct } from "../lib/format";
import type { TabProps } from "../lib/tabs";

function bucketTotals(state: TabProps["state"]): Record<Bucket, number> {
  const totals = {} as Record<Bucket, number>;
  for (const b of BUCKETS) totals[b] = 0;
  for (const h of state.holdings) {
    if (BUCKETS.includes(h.bucket)) totals[h.bucket] += h.valueAED;
  }
  return totals;
}

export default function Overview({ state, currency, rate }: TabProps) {
  const totals = useMemo(() => bucketTotals(state), [state]);
  const netWorth = useMemo(() => Object.values(totals).reduce((a, b) => a + b, 0), [totals]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-edge bg-panel p-6">
        <div className="text-sm text-slate-400">Total net worth</div>
        <div className="mt-1 text-4xl font-bold tracking-tight">
          {fmtMoney(netWorth, currency, rate)}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {state.holdings.length} holdings · {currency} display
        </div>
      </section>

      <section className="rounded-2xl border border-edge bg-panel p-6">
        <h2 className="mb-4 text-lg font-semibold">Allocation vs target</h2>
        <div className="space-y-5">
          {BUCKETS.map((bucket) => {
            const value = totals[bucket];
            const actualPct = netWorth > 0 ? (value / netWorth) * 100 : 0;
            const targetPct = state.targets[bucket] ?? 0;
            const drift = actualPct - targetPct;
            const color = BUCKET_COLORS[bucket];
            return (
              <div key={bucket}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    {bucket}
                  </span>
                  <span className="text-slate-400">
                    {fmtMoney(value, currency, rate)} · {fmtPct(actualPct)}
                    <span className="text-slate-500"> / target {fmtPct(targetPct)}</span>
                  </span>
                </div>
                <div className="relative h-3 overflow-visible rounded-full bg-edge">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, actualPct)}%`, background: color }}
                  />
                  {/* target marker */}
                  <div
                    className="absolute -top-1 h-5 w-0.5 bg-white/80"
                    style={{ left: `${Math.min(100, Math.max(0, targetPct))}%` }}
                    title={`Target ${fmtPct(targetPct)}`}
                  />
                </div>
                <div className="mt-1 text-xs">
                  {Math.abs(drift) < 0.05 ? (
                    <span className="text-slate-500">On target</span>
                  ) : drift > 0 ? (
                    <span className="text-amber-400">
                      ▲ {fmtPct(drift)} over target ({fmtMoney((drift / 100) * netWorth, currency, rate)} overweight)
                    </span>
                  ) : (
                    <span className="text-sky-400">
                      ▼ {fmtPct(-drift)} under target ({fmtMoney((-drift / 100) * netWorth, currency, rate)} underweight)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          White tick = target allocation. Colored bar = actual.
        </p>
      </section>
    </div>
  );
}
