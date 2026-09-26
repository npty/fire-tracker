"use client";

import { useMemo } from "react";
import { uid } from "../lib/store";
import { fmtCompact, fmtMoney } from "../lib/format";
import type { TabProps } from "../lib/tabs";

export default function History({ state, update, currency, rate }: TabProps) {
  const snapshots = useMemo(
    () => [...state.snapshots].sort((a, b) => a.date.localeCompare(b.date)),
    [state.snapshots]
  );

  const netWorthAED = state.holdings.reduce((s, h) => s + h.valueAED, 0);

  const snapshotNow = () => {
    update((s) => ({
      ...s,
      snapshots: [...s.snapshots, { id: uid(), date: new Date().toISOString(), netWorthAED }],
    }));
  };

  const remove = (id: string) => {
    if (!window.confirm("Delete this snapshot?")) return;
    update((s) => ({ ...s, snapshots: s.snapshots.filter((x) => x.id !== id) }));
  };

  const chart = useMemo(() => {
    const W = 620, H = 230, padL = 8, padB = 26, padT = 14;
    if (snapshots.length === 0) return null;
    const vals = snapshots.map((s) => s.netWorthAED * rate);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const span = Math.max(maxV - minV, 1);
    const stepX = snapshots.length > 1 ? (W - padL * 2) / (snapshots.length - 1) : 0;
    const pts = snapshots
      .map((s, i) => {
        const x = padL + i * stepX;
        const y = padT + (H - padT - padB) * (1 - (s.netWorthAED * rate - minV) / span);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    return { W, H, padB, padL, pts, minV, maxV };
  }, [snapshots, rate]);

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const change = first && last ? last.netWorthAED - first.netWorthAED : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-edge bg-panel p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Net worth history</h2>
            <p className="text-xs text-slate-500">
              Auto-snapshot on your first visit each month, plus manual snapshots anytime.
            </p>
          </div>
          <button
            onClick={snapshotNow}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            📸 Snapshot now
          </button>
        </div>

        {snapshots.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-ink p-4">
              <div className="text-xs text-slate-500">Latest</div>
              <div className="text-xl font-bold">{fmtMoney(last.netWorthAED, currency, rate)}</div>
            </div>
            <div className="rounded-xl bg-ink p-4">
              <div className="text-xs text-slate-500">Since first snapshot</div>
              <div className={`text-xl font-bold ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {change >= 0 ? "+" : ""}{fmtMoney(change, currency, rate)}
              </div>
            </div>
            <div className="rounded-xl bg-ink p-4">
              <div className="text-xs text-slate-500">Snapshots</div>
              <div className="text-xl font-bold">{snapshots.length}</div>
            </div>
          </div>
        )}

        {chart ? (
          <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="w-full" role="img" aria-label="Net worth over time">
            <defs>
              <linearGradient id="nwfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={`${chart.padL},${chart.H - chart.padB} ${chart.pts} ${chart.W - chart.padL},${chart.H - chart.padB}`}
              fill="url(#nwfill)"
            />
            <polyline points={chart.pts} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinejoin="round" />
            {snapshots.map((s, i) => {
              const stepX = snapshots.length > 1 ? (chart.W - chart.padL * 2) / (snapshots.length - 1) : 0;
              const span = Math.max(chart.maxV - chart.minV, 1);
              const x = chart.padL + i * stepX;
              const y = 14 + (chart.H - 14 - chart.padB) * (1 - (s.netWorthAED * rate - chart.minV) / span);
              return <circle key={s.id} cx={x} cy={y} r="3.5" fill="#34d399" />;
            })}
            <text x={chart.padL} y={chart.H - 8} fill="#64748b" fontSize="11">
              {snapshots[0].date.slice(0, 7)}
            </text>
            <text x={chart.W - chart.padL} y={chart.H - 8} fill="#64748b" fontSize="11" textAnchor="end">
              {snapshots[snapshots.length - 1].date.slice(0, 7)}
            </text>
            <text x={chart.padL} y={16} fill="#64748b" fontSize="11">
              {fmtCompact(chart.maxV / rate, currency, rate)}
            </text>
          </svg>
        ) : (
          <p className="text-sm text-slate-500">No snapshots yet.</p>
        )}
      </section>

      {snapshots.length > 0 && (
        <section className="rounded-2xl border border-edge bg-panel p-6">
          <h2 className="mb-4 text-lg font-semibold">Snapshots</h2>
          <div className="overflow-auto rounded-xl border border-edge">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-edge text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Net worth</th>
                  <th className="px-3 py-2 text-right">Change</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {[...snapshots].reverse().map((s, i, arr) => {
                  const prev = arr[i + 1];
                  const delta = prev ? s.netWorthAED - prev.netWorthAED : 0;
                  return (
                    <tr key={s.id} className="border-t border-edge/60 odd:bg-ink/40">
                      <td className="px-3 py-1.5">
                        {new Date(s.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium">{fmtMoney(s.netWorthAED, currency, rate)}</td>
                      <td className={`px-3 py-1.5 text-right ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {prev ? `${delta >= 0 ? "+" : ""}${fmtMoney(delta, currency, rate)}` : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button
                          onClick={() => remove(s.id)}
                          className="rounded border border-edge px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
