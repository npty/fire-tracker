import { Currency } from "./types";

const LOCALES: Record<Currency, string> = { AED: "en-AE", THB: "th-TH", USD: "en-US" };

/** Format an AED amount in the given display currency. */
export function fmtMoney(amountAED: number, currency: Currency, rate: number): string {
  const converted = amountAED * rate;
  return new Intl.NumberFormat(LOCALES[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(converted);
}

/** Compact format for chart axes (e.g. ฿1.2M). */
export function fmtCompact(amountAED: number, currency: Currency, rate: number): string {
  const converted = amountAED * rate;
  const symbol = currency === "AED" ? "AED " : currency === "THB" ? "฿" : "$";
  const abs = Math.abs(converted);
  if (abs >= 1_000_000) return `${symbol}${(converted / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${symbol}${(converted / 1_000).toFixed(0)}K`;
  return `${symbol}${converted.toFixed(0)}`;
}

export function fmtPct(x: number, digits = 1): string {
  return `${x.toFixed(digits)}%`;
}
