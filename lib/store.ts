"use client";

import { useCallback, useEffect, useState } from "react";
import { AppState, Currency, SEED_STATE } from "./types";

const STATE_KEY = "fire-tracker:state:v1";
const CURRENCY_KEY = "fire-tracker:currency:v1";

function loadState(): AppState {
  if (typeof window === "undefined") return SEED_STATE;
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (!raw) return SEED_STATE;
    const parsed = JSON.parse(raw) as AppState;
    if (!Array.isArray(parsed.holdings) || typeof parsed.targets !== "object") return SEED_STATE;
    return { ...SEED_STATE, ...parsed };
  } catch {
    return SEED_STATE;
  }
}

/** Persisted app state (holdings, targets, snapshots) in localStorage. */
export function useAppState() {
  const [state, setState] = useState<AppState>(SEED_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable: app keeps working in memory */
    }
  }, [state, ready]);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    setState((s) => fn(s));
  }, []);

  return { state, update, ready };
}

/** Persisted display currency. */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<Currency>("AED");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CURRENCY_KEY);
      if (raw === "AED" || raw === "THB" || raw === "USD") setCurrencyState(raw);
    } catch {
      /* ignore */
    }
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      window.localStorage.setItem(CURRENCY_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  return { currency, setCurrency };
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
