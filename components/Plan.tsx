"use client";

import { useMemo, useState } from "react";
import { BUCKETS, BUCKET_COLORS, Bucket } from "../lib/types";
import { fmtMoney, fmtPct } from "../lib/format";
import type { TabProps } from "../lib/tabs";

const inputCls =
  "w-24 rounded-lg border border-edge bg-ink px-3 py-2 text-sm text-right text-slate-100 focus:border-sky-500 focus:outline-none";

export default function Plan({ state, update, currency, rate }: TabProps) {
  const [draft, setDraft] = useState<Record<Bucket, string> | null>(null);

  const values: Record<Bucket, string> = useMemo(() => {
    if (draft) return draft;
    const v = {} as Record<Bucket, string>;
    for (const b of BUCKETS) v[b] = String(state.targets[b] ?? 0);
    return v;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.targets, draft === null]);

  const parsed = useMemo(() => {
    const p = {} as Record<Bucket, number>;
    let sum = 0;
    let valid = true;
    for (const b of BUCKETS) {
      const n = parseFloat(values[b]);
      if (!Number.isFinite(n) || n < 0 || n > 100) valid = false;
      p[b] = Number.isFinite(n) ? n : 0;
      sum += Number.isFinite(n) ? n : 0;
    }
    return { p, sum, valid: valid && Math.abs(sum - 100) < 0.001 };
  }, [values]);

  const totals = useMemo(() => {
    const t = {} as Record<Bucket, number>;
    for (const b of BUCKETS) t[b] = 0;
    for (const h of state.holdings) if (BUCKETS.includes(h.bucket)) t[h.bucket] += h.valueAED;
    return t;
  }, [state.holdings]);
  const netWorth = Object.values(totals).reduce((a, b) => a + b, 0);

  const save = () => {
    if (!parsed.valid) return;
    update((s) => ({ ...s, targets: { ...parsed.p } }));
    setDraft(null);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-edge bg-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Target allocation</h2>
          <span
            className={`rounded-lg px-3 py-1 text-sm font-medium ${
              parsed.valid ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            }`}
          >
            Sum: {parsed.sum.toFixed(1)}% {parsed.valid ? "✓" : "(must equal 100%)"}
          </span>
        </div>
        <div className="space-y-3">
          {BUCKETS.map((bucket) => {
            const current = totals[bucket];
            const targetPct = parsed.p[bucket] ?? 0;
            const targetAED = (netWorth * targetPct) / 100;
            const gapAED = targetAED - current; // >0 buy, <0 sell
            return (
              <div key={bucket} className="rounded-xl border border-edge bg-ink p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-medium">
                    <span
                      className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: BUCKET_COLORS[bucket] }}
                    />
                    {bucket}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      className={inputCls}
                      inputMode="decimal"
                      aria-label={`${bucket} target percent`}
                      value={values[bucket]}
                      onChange={(e) => setDraft({ ...values, [bucket]: e.target.value })}
                    />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                  <span>
                    Current: <span className="text-slate-200">{fmtMoney(current, currency, rate)}</span>
                  </span>
                  <span>
                    Target: <span className="text-slate-200">{fmtMoney(targetAED, currency, rate)}</span>{" "}
                    ({fmtPct(targetPct)})
                  </span>
                  <span
                    className={gapAED > 0 ? "text-sky-400" : gapAED < 0 ? "text-amber-400" : "text-slate-500"}
                  >
                    {gapAED > 0
                      ? `Buy ${fmtMoney(gapAED, currency, rate)}`
                      : gapAED < 0
                        ? `Sell ${fmtMoney(-gapAED, currency, rate)}`
                        : "Balanced"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={save}
            disabled={!parsed.valid || draft === null}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            Save targets
          </button>
          {draft !== null && (
            <button
              onClick={() => setDraft(null)}
              className="rounded-lg border border-edge px-4 py-2 text-sm text-slate-300 hover:bg-edge"
            >
              Discard
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
