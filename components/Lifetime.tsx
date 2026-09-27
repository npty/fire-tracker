"use client";

import { useMemo, useState } from "react";
import { fmtCompact, fmtMoney } from "../lib/format";
import { clamp, maxAnnualWithdrawal, projection, yearsLasting } from "../lib/math";
import type { TabProps } from "../lib/tabs";
import Info from "./Info";

const inputCls =
  "w-full rounded-lg border border-edge bg-ink px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none";
const labelCls = "mb-1 block text-xs font-medium text-slate-400";
const cardCls = "rounded-2xl border border-edge bg-panel p-6";

type Mode = "max" | "runway";

function num(v: string, fallback: number): number {
  const n = parseFloat(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

export default function Lifetime({ state, currency, rate }: TabProps) {
  const [mode, setMode] = useState<Mode>("max");
  const [age, setAge] = useState("34");
  const [horizon, setHorizon] = useState("90");
  const [ret, setRet] = useState("5");
  const [infl, setInfl] = useState("2.5");
  const [includeRestricted, setIncludeRestricted] = useState(false);
  // Monthly spending stored in AED; default ≈ 70,000 THB.
  const [spendAED, setSpendAED] = useState<number>(70000 / 8.99);
  // Target balance left at the horizon age, stored in AED. 0 = spend it all.
  const [endTargetAED, setEndTargetAED] = useState(0);
  // Optional ceiling on monthly withdrawals, stored in AED. 0 = no cap.
  const [capAED, setCapAED] = useState(0);

  const portfolioAED = useMemo(
    () =>
      state.holdings.reduce(
        (sum, h) => sum + (h.restricted && !includeRestricted ? 0 : h.valueAED),
        0
      ),
    [state.holdings, includeRestricted]
  );

  const currentAge = clamp(num(age, 34), 1, 120);
  const horizonAge = clamp(num(horizon, 90), currentAge + 1, 150);
  const r = num(ret, 5) / 100;
  const g = num(infl, 2.5) / 100;
  const nYears = Math.round(horizonAge - currentAge);

  const maxAnnual = useMemo(
    () => maxAnnualWithdrawal(portfolioAED, r, g, nYears, endTargetAED),
    [portfolioAED, r, g, nYears, endTargetAED]
  );

  const annualSpend = spendAED * 12;
  const runwayYears = useMemo(
    () => yearsLasting(portfolioAED, r, g, annualSpend),
    [portfolioAED, r, g, annualSpend]
  );

  // Max mode: cap the withdrawal; anything unwithdrawn stays invested.
  const capAnnual = capAED * 12;
  const capped = mode === "max" && capAnnual > 0 && maxAnnual > capAnnual;
  const projAnnual = mode === "max" ? (capped ? capAnnual : maxAnnual) : annualSpend;
  const rows = useMemo(
    () => projection(portfolioAED, r, g, projAnnual, nYears, Math.round(currentAge)),
    [portfolioAED, r, g, projAnnual, nYears, currentAge]
  );
  const endBalanceAED = rows.length > 0 ? rows[rows.length - 1].endAED : portfolioAED;

  const chart = useMemo(() => {
    const W = 620, H = 250, padL = 8, padB = 26, padT = 30;
    const vals = rows.map((d) => d.endAED * rate);
    const maxV = Math.max(...vals, 1);
    const stepX = rows.length > 1 ? (W - padL * 2) / (rows.length - 1) : 0;
    const pts = rows.map((d, i) => {
      const x = padL + i * stepX;
      const y = padT + (H - padT - padB) * (1 - (d.endAED * rate) / maxV);
      return { x, y, d };
    });
    return { W, H, padL, padB, padT, stepX, pts, maxV, firstAge: rows[0]?.age, lastAge: rows[rows.length - 1]?.age };
  }, [rows, rate]);

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const onChartMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * chart.W;
    const idx = Math.round((x - chart.padL) / chart.stepX);
    setHoverIdx(Math.max(0, Math.min(chart.pts.length - 1, idx)));
  };

  const hoverPt = hoverIdx !== null ? chart.pts[hoverIdx] : null;
  const hoverNearRight = hoverPt !== null && hoverPt.x / chart.W > 0.7;
  const hoverNearTop = hoverPt !== null && hoverPt.y / chart.H < 0.35;

  const spendDisplay = (spendAED * rate).toFixed(0);
  const endTargetDisplay = endTargetAED === 0 ? "" : (endTargetAED * rate).toFixed(0);
  const capDisplay = capAED === 0 ? "" : (capAED * rate).toFixed(0);

  return (
    <div className="space-y-6">
      <section className={cardCls}>
        <h2 className="mb-4 text-lg font-semibold">Lifetime planner</h2>

        <div className="mb-5 flex rounded-lg border border-edge bg-ink p-1" role="group" aria-label="Planner mode">
          <button
            onClick={() => setMode("max")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${mode === "max" ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-edge"}`}
          >
            Max monthly withdrawal
          </button>
          <button
            onClick={() => setMode("runway")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${mode === "runway" ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-edge"}`}
          >
            Runway for my spending
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={labelCls}>Current age</label>
            <input className={inputCls} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Plan until age</label>
            <input className={inputCls} inputMode="numeric" value={horizon} onChange={(e) => setHorizon(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Return % / yr</label>
            <input className={inputCls} inputMode="decimal" value={ret} onChange={(e) => setRet(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Inflation % / yr</label>
            <input className={inputCls} inputMode="decimal" value={infl} onChange={(e) => setInfl(e.target.value)} />
          </div>
        </div>

        {mode === "max" && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Leave at age {Math.round(horizonAge)} ({currency})
                <Info text="Balance you want left when the plan ends. Set to 0 to spend it all." />
              </label>
              <input
                className={inputCls}
                inputMode="decimal"
                placeholder="0"
                value={endTargetDisplay}
                onChange={(e) => {
                  const n = num(e.target.value, NaN);
                  setEndTargetAED(!Number.isNaN(n) && n >= 0 ? n / rate : 0);
                }}
              />
            </div>
            <div>
              <label className={labelCls}>
                Monthly cap ({currency})
                <Info text="Optional ceiling on monthly withdrawals. Anything above the cap stays invested and keeps growing." />
              </label>
              <input
                className={inputCls}
                inputMode="decimal"
                placeholder="No cap"
                value={capDisplay}
                onChange={(e) => {
                  const n = num(e.target.value, NaN);
                  setCapAED(!Number.isNaN(n) && n >= 0 ? n / rate : 0);
                }}
              />
            </div>
          </div>
        )}

        {mode === "runway" && (
          <div className="mt-3 max-w-xs">
            <label className={labelCls}>Monthly spending ({currency})</label>
            <input
              className={inputCls}
              inputMode="decimal"
              value={spendDisplay}
              onChange={(e) => {
                const n = num(e.target.value, NaN);
                if (!Number.isNaN(n) && n >= 0) setSpendAED(n / rate);
              }}
            />
          </div>
        )}

        <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={includeRestricted}
            onChange={(e) => setIncludeRestricted(e.target.checked)}
            className="h-4 w-4 accent-sky-500"
          />
          Include restricted / unvested assets ({fmtMoney(
            state.holdings.filter((h) => h.restricted).reduce((s, h) => s + h.valueAED, 0),
            currency,
            rate
          )})
        </label>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-ink p-4">
            <div className="text-xs text-slate-500">Portfolio used</div>
            <div className="text-xl font-bold">{fmtMoney(portfolioAED, currency, rate)}</div>
          </div>
          {mode === "max" ? (
            <div className="rounded-xl bg-ink p-4 sm:col-span-2">
              <div className="text-xs text-slate-500">
                {capped ? "Monthly withdrawal (capped)" : `Max monthly withdrawal to age ${Math.round(horizonAge)}`}
              </div>
              <div className="text-3xl font-bold text-emerald-400">
                {fmtMoney(projAnnual / 12, currency, rate)}
                <span className="text-base font-normal text-slate-500"> /mo</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {capped
                  ? `Capped. Projected balance at age ${Math.round(horizonAge)}: ${fmtMoney(endBalanceAED, currency, rate)}`
                  : endTargetAED > 0
                    ? `Leaves ${fmtMoney(endTargetAED, currency, rate)} at age ${Math.round(horizonAge)}`
                    : `About ${fmtMoney(projAnnual, currency, rate)} in the first year`}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-ink p-4 sm:col-span-2">
              <div className="text-xs text-slate-500">
                Runway at {fmtMoney(spendAED, currency, rate)}/mo spending
              </div>
              <div className="text-3xl font-bold text-emerald-400">
                {runwayYears === Infinity ? (
                  <>Indefinite</>
                ) : (
                  <>
                    {runwayYears.toFixed(1)}
                    <span className="text-base font-normal text-slate-500"> years (to age {Math.round(currentAge + runwayYears)})</span>
                  </>
                )}
              </div>
              {runwayYears === Infinity && (
                <div className="mt-1 text-xs text-slate-500">Growth outpaces withdrawals at this spending level.</div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className={cardCls}>
        <h2 className="mb-4 text-lg font-semibold">Balance over time</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing to project.</p>
        ) : (
          <div className="relative">
            <svg
              viewBox={`0 0 ${chart.W} ${chart.H}`}
              className="w-full cursor-crosshair"
              role="img"
              aria-label="Projected balance over time"
              onMouseMove={onChartMove}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <defs>
                <linearGradient id="balfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`${chart.padL},${chart.H - chart.padB} ${chart.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} ${chart.W - chart.padL},${chart.H - chart.padB}`}
                fill="url(#balfill)"
              />
              <polyline
                points={chart.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {hoverPt && (
                <g>
                  <line
                    x1={hoverPt.x}
                    y1={chart.padT}
                    x2={hoverPt.x}
                    y2={chart.H - chart.padB}
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <circle cx={hoverPt.x} cy={hoverPt.y} r="4.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
                </g>
              )}
              <text x={chart.padL} y={chart.H - 8} fill="#64748b" fontSize="11">Age {chart.firstAge}</text>
              <text x={chart.W - chart.padL} y={chart.H - 8} fill="#64748b" fontSize="11" textAnchor="end">Age {chart.lastAge}</text>
              <text x={chart.padL} y={16} fill="#64748b" fontSize="11">{fmtCompact(chart.maxV / rate, currency, rate)}</text>
            </svg>
            {hoverPt && (
              <div
                className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-edge bg-ink px-3 py-2 text-xs shadow-xl"
                style={{
                  left: `${(hoverPt.x / chart.W) * 100}%`,
                  top: `${(hoverPt.y / chart.H) * 100}%`,
                  transform: `translate(${hoverNearRight ? "calc(-100% - 14px)" : "14px"}, ${hoverNearTop ? "14px" : "calc(-100% - 14px)"})`,
                }}
              >
                <div className="text-slate-400">Age {hoverPt.d.age}</div>
                <div className="font-semibold text-slate-100">{fmtMoney(hoverPt.d.endAED, currency, rate)}</div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className={cardCls}>
        <h2 className="mb-4 text-lg font-semibold">Year-by-year projection</h2>
        <div className="max-h-96 overflow-auto rounded-xl border border-edge">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="sticky top-0 bg-edge text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left">Age</th>
                <th className="px-3 py-2 text-right">Start</th>
                <th className="px-3 py-2 text-right">
                  Withdrawn
                  <Info text="Taken out to spend that year. Rises with inflation each year." />
                </th>
                <th className="px-3 py-2 text-right">
                  Gains
                  <Info text="Portfolio growth that year at the assumed annual return." />
                </th>
                <th className="px-3 py-2 text-right">End</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.year} className="border-t border-edge/60 odd:bg-ink/40">
                  <td className="px-3 py-1.5">{d.age}</td>
                  <td className="px-3 py-1.5 text-right">{fmtMoney(d.startAED, currency, rate)}</td>
                  <td className="px-3 py-1.5 text-right text-amber-400">-{fmtMoney(d.withdrawalAED, currency, rate)}</td>
                  <td className="px-3 py-1.5 text-right text-emerald-400">+{fmtMoney(d.growthAED, currency, rate)}</td>
                  <td className="px-3 py-1.5 text-right font-medium">{fmtMoney(d.endAED, currency, rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
