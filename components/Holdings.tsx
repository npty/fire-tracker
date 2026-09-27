"use client";

import { useState } from "react";
import { BUCKETS, Bucket, Holding } from "../lib/types";
import { uid } from "../lib/store";
import { fmtMoney } from "../lib/format";
import type { TabProps } from "../lib/tabs";
import Info from "./Info";

const inputCls =
  "w-full rounded-lg border border-edge bg-ink px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none";
const btnPrimary =
  "rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50";
const btnGhost =
  "rounded-lg border border-edge bg-panel px-3 py-1.5 text-xs text-slate-300 hover:bg-edge";

function parseNum(v: string): number {
  const n = parseFloat(v.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export default function Holdings({ state, update, currency, rate }: TabProps) {
  const [name, setName] = useState("");
  const [bucket, setBucket] = useState<Bucket>("Cash");
  const [value, setValue] = useState("");
  const [restricted, setRestricted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBucket, setEditBucket] = useState<Bucket>("Cash");
  const [editValue, setEditValue] = useState("");
  const [editRestricted, setEditRestricted] = useState(false);

  const addHolding = () => {
    const v = parseNum(value);
    if (!name.trim() || Number.isNaN(v)) return;
    const holding: Holding = { id: uid(), name: name.trim(), bucket, valueAED: v, restricted: restricted || undefined };
    update((s) => ({ ...s, holdings: [...s.holdings, holding] }));
    setName("");
    setValue("");
    setRestricted(false);
  };

  const startEdit = (h: Holding) => {
    setEditingId(h.id);
    setEditName(h.name);
    setEditBucket(h.bucket);
    setEditValue(String(h.valueAED));
    setEditRestricted(!!h.restricted);
  };

  const saveEdit = () => {
    const v = parseNum(editValue);
    if (!editingId || !editName.trim() || Number.isNaN(v)) return;
    update((s) => ({
      ...s,
      holdings: s.holdings.map((h) =>
        h.id === editingId
          ? { ...h, name: editName.trim(), bucket: editBucket, valueAED: v, restricted: editRestricted || undefined }
          : h
      ),
    }));
    setEditingId(null);
  };

  const remove = (id: string) => {
    if (!window.confirm("Delete this holding?")) return;
    update((s) => ({ ...s, holdings: s.holdings.filter((h) => h.id !== id) }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-edge bg-panel p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Add holding
          <Info text="Values are stored in AED. The currency switcher converts them for display." />
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className={inputCls} placeholder="Name (e.g. IBKR brokerage)" value={name} onChange={(e) => setName(e.target.value)} />
          <select className={inputCls} value={bucket} onChange={(e) => setBucket(e.target.value as Bucket)}>
            {BUCKETS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <input
            className={inputCls}
            placeholder="Value in AED"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={restricted} onChange={(e) => setRestricted(e.target.checked)} className="h-4 w-4 accent-sky-500" />
            Restricted / unvested
          </label>
        </div>
        <button onClick={addHolding} disabled={!name.trim() || Number.isNaN(parseNum(value))} className={`${btnPrimary} mt-4`}>
          Add holding
        </button>
      </section>

      <section className="rounded-2xl border border-edge bg-panel p-6">
        <h2 className="mb-4 text-lg font-semibold">Holdings ({state.holdings.length})</h2>
        {state.holdings.length === 0 && <p className="text-sm text-slate-500">No holdings yet. Add one above.</p>}
        <ul className="space-y-3">
          {state.holdings.map((h) => (
            <li key={h.id} className="rounded-xl border border-edge bg-ink p-4">
              {editingId === h.id ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input className={inputCls} value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <select className={inputCls} value={editBucket} onChange={(e) => setEditBucket(e.target.value as Bucket)}>
                    {BUCKETS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <input className={inputCls} inputMode="decimal" value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="Value in AED" />
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={editRestricted} onChange={(e) => setEditRestricted(e.target.checked)} className="h-4 w-4 accent-sky-500" />
                    Restricted / unvested
                  </label>
                  <div className="flex gap-2 sm:col-span-2">
                    <button onClick={saveEdit} className={btnPrimary}>Save</button>
                    <button onClick={() => setEditingId(null)} className={btnGhost}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {h.name}
                      {h.restricted && (
                        <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-400">
                          restricted
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{h.bucket}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold">{fmtMoney(h.valueAED, currency, rate)}</span>
                    <button onClick={() => startEdit(h)} className={btnGhost}>Edit</button>
                    <button onClick={() => remove(h.id)} className={`${btnGhost} text-red-400 hover:bg-red-500/10`}>Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
