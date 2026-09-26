/**
 * Withdrawal math for the lifetime planner.
 *
 * Model: at the end of each year t (t = 1..n) you withdraw W * (1+g)^(t-1),
 * where W is the first-year withdrawal and g is inflation. The portfolio
 * grows at nominal annual return r between withdrawals.
 *
 * End balance: B_n = PV*(1+r)^n - W * S, where
 *   S = sum_{t=1..n} (1+g)^(t-1) * (1+r)^(n-t)
 *     = (1+r)^(n-1) * (1 - q^n) / (1 - q),  q = (1+g)/(1+r)
 */

export interface ProjectionRow {
  year: number; // 1-based
  age: number;
  startAED: number;
  withdrawalAED: number;
  growthAED: number;
  endAED: number;
}

function qOf(r: number, g: number): number {
  return (1 + g) / (1 + r);
}

/**
 * Maximum first-year withdrawal W such that the portfolio lasts exactly n years.
 * Returns the ANNUAL amount; divide by 12 for monthly.
 */
export function maxAnnualWithdrawal(pv: number, r: number, g: number, n: number): number {
  if (pv <= 0 || n <= 0) return 0;
  if (Math.abs(r - g) < 1e-9) {
    return (pv * (1 + r)) / n;
  }
  const q = qOf(r, g);
  return (pv * (r - g)) / (1 - Math.pow(q, n));
}

/**
 * How many years a first-year annual withdrawal W lasts.
 * Returns Infinity when the portfolio grows faster than withdrawals forever.
 *
 * From W = PV*(r-g)/(1-q^n): q^n = 1 - PV*(r-g)/W.
 * When PV*(r-g)/W >= 1 the required W is at/below the perpetual rate PV*(r-g),
 * so the right-hand side is <= 0 and no finite n exists -> Infinity.
 */
export function yearsLasting(pv: number, r: number, g: number, annualW: number): number {
  if (pv <= 0 || annualW <= 0) return 0;
  if (Math.abs(r - g) < 1e-9) {
    return (pv * (1 + r)) / annualW;
  }
  const ratio = (pv * (r - g)) / annualW;
  if (ratio >= 1) return Infinity;
  const q = qOf(r, g);
  return Math.log(1 - ratio) / Math.log(q);
}

/** Year-by-year projection for a fixed first-year annual withdrawal. */
export function projection(
  pv: number,
  r: number,
  g: number,
  annualW: number,
  nYears: number,
  startAge: number
): ProjectionRow[] {
  const rows: ProjectionRow[] = [];
  let balance = pv;
  for (let t = 1; t <= nYears; t++) {
    const withdrawal = annualW * Math.pow(1 + g, t - 1);
    const growth = balance * r;
    const end = Math.max(0, balance + growth - withdrawal);
    rows.push({
      year: t,
      age: startAge + t,
      startAED: balance,
      withdrawalAED: Math.min(withdrawal, balance + growth),
      growthAED: growth,
      endAED: end,
    });
    balance = end;
    if (balance <= 0) break;
  }
  return rows;
}

/** Clamp a number into [min, max]. */
export function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}
