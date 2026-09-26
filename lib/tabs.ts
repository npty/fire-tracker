import { AppState, Currency } from "./types";
import { FxState } from "./currency";

export const TABS = ["Overview", "Holdings", "Plan", "Lifetime", "History"] as const;
export type TabName = (typeof TABS)[number];

export interface TabProps {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  currency: Currency;
  /** Units of the display currency per 1 AED. */
  rate: number;
  fx: FxState;
}
