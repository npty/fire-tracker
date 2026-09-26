"use client";

import { useEffect, useMemo, useState } from "react";
import { AppState, CURRENCIES, Currency } from "../lib/types";
import { TABS, TabName, TabProps } from "../lib/tabs";
import { monthKey, uid, useAppState, useCurrency } from "../lib/store";
import { useFx } from "../lib/currency";
import Overview from "../components/Overview";
import Holdings from "../components/Holdings";
import Plan from "../components/Plan";
import Lifetime from "../components/Lifetime";
import History from "../components/History";

function netWorthAED(state: AppState): number {
  return state.holdings.reduce((sum, h) => sum + h.valueAED, 0);
}

export default function Home() {
  const { state, update, ready } = useAppState();
  const { currency, setCurrency } = useCurrency();
  const fx = useFx();
  const [tab, setTab] = useState<TabName>("Overview");

  const rate = fx.rates[currency] ?? 1;

  // Keyboard shortcuts: 1-5 switch tabs. Ignored while typing in inputs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) {
        return;
      }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= TABS.length) setTab(TABS[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Auto-snapshot: one net-worth snapshot per calendar month, on first visit.
  useEffect(() => {
    if (!ready) return;
    const key = monthKey();
    const has = state.snapshots.some((s) => s.date.slice(0, 7) === key);
    if (!has) {
      const nw = netWorthAED(state);
      update((s) => ({
        ...s,
        snapshots: [...s.snapshots, { id: uid(), date: new Date().toISOString(), netWorthAED: nw }],
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const tabProps: TabProps = useMemo(
    () => ({ state, update, currency, rate, fx }),
    [state, update, currency, rate, fx]
  );

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            🔥 Fire-tracker
          </h1>
          <p className="text-sm text-slate-400">
            Net worth, allocation & lifetime withdrawal planning — data never leaves your browser.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-edge bg-panel p-1" role="group" aria-label="Display currency">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  currency === c ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-edge"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={() => fx.refresh()}
            disabled={fx.loading}
            title="Refresh exchange rates"
            className="rounded-lg border border-edge bg-panel px-3 py-1.5 text-sm text-slate-300 hover:bg-edge disabled:opacity-50"
          >
            {fx.loading ? "…" : "⟳ Rates"}
          </button>
        </div>
      </header>

      <div className="mb-2 text-xs text-slate-500">
        {fx.fetchedAt ? (
          <>
            Rates {fx.stale ? "(stale/offline) " : ""}updated{" "}
            {new Date(fx.fetchedAt).toLocaleString()} · {fx.attribution}
          </>
        ) : (
          <>Using fallback rates · {fx.attribution}</>
        )}
        {fx.error && <span className="text-amber-400"> — {fx.error}</span>}
      </div>

      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-edge bg-panel p-1" role="tablist">
        {TABS.map((name, i) => (
          <button
            key={name}
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              tab === name ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-edge"
            }`}
          >
            {name}
            <kbd className="rounded border border-white/20 bg-black/20 px-1.5 py-0.5 text-[10px] font-mono">
              {i + 1}
            </kbd>
          </button>
        ))}
      </nav>

      <main>
        {tab === "Overview" && <Overview {...tabProps} />}
        {tab === "Holdings" && <Holdings {...tabProps} />}
        {tab === "Plan" && <Plan {...tabProps} />}
        {tab === "Lifetime" && <Lifetime {...tabProps} />}
        {tab === "History" && <History {...tabProps} />}
      </main>

      <footer className="mt-10 border-t border-edge pt-4 text-xs text-slate-500">
        Press <kbd className="rounded border border-edge px-1 font-mono">1</kbd>–
        <kbd className="rounded border border-edge px-1 font-mono">5</kbd> to switch tabs.
        Educational projections only — not financial advice.
      </footer>
    </div>
  );
}
