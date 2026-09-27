"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Currency } from "./types";

const FX_KEY = "fire-tracker:fx:v1";
const FX_URL = "https://open.er-api.com/v6/latest/AED";
const ATTRIBUTION = "Exchange rates by open.er-api.com";

interface FxCache {
  rates: Record<string, number>;
  fetchedAt: string; // ISO
}

interface ApiResponse {
  result?: string;
  rates?: Record<string, number>;
  time_last_update_utc?: string;
}

function readCache(): FxCache | null {
  try {
    const raw = window.localStorage.getItem(FX_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FxCache;
    if (!parsed.rates || typeof parsed.rates["THB"] !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export interface FxState {
  /** Units of the currency per 1 AED. */
  rates: Record<Currency, number>;
  fetchedAt: string | null;
  loading: boolean;
  stale: boolean;
  error: string | null;
  refresh: () => void;
  /** Convert an AED amount into the display currency. */
  convert: (amountAED: number, to: Currency) => number;
  attribution: string;
}

const FALLBACK_RATES: Record<Currency, number> = { AED: 1, THB: 8.99, USD: 0.2723 };

/**
 * Live FX rates (per AED) from open.er-api.com, cached in localStorage.
 * Falls back to the last cached rates (or static fallback rates) when offline.
 */
export function useFx(): FxState {
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK_RATES);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(() => {
    if (inFlight.current || typeof window === "undefined") return;
    inFlight.current = true;
    setLoading(true);
    setError(null);

    const cached = readCache();
    if (cached) {
      setRates({ AED: 1, THB: cached.rates["THB"], USD: cached.rates["USD"] });
      setFetchedAt(cached.fetchedAt);
    }

    fetch(FX_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ApiResponse>;
      })
      .then((data) => {
        if (data.result !== "success" || !data.rates) throw new Error("Bad API response");
        const next = { AED: 1, THB: data.rates["THB"], USD: data.rates["USD"] };
        if (!next.THB || !next.USD) throw new Error("Missing rates");
        const at = data.time_last_update_utc
          ? new Date(data.time_last_update_utc).toISOString()
          : new Date().toISOString();
        setRates(next);
        setFetchedAt(at);
        setStale(false);
        try {
          window.localStorage.setItem(FX_KEY, JSON.stringify({ rates: next, fetchedAt: at } satisfies FxCache));
        } catch {
          /* ignore */
        }
      })
      .catch((e: unknown) => {
        // Graceful fallback: keep cached (or static) rates, flag as stale.
        setStale(true);
        setError(e instanceof Error ? e.message : "Rate fetch failed");
      })
      .finally(() => {
        inFlight.current = false;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const convert = useCallback(
    (amountAED: number, to: Currency) => amountAED * (rates[to] ?? 1),
    [rates]
  );

  return { rates, fetchedAt, loading, stale, error, refresh, convert, attribution: ATTRIBUTION };
}
