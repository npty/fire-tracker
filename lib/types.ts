export const BUCKETS = [
  "Cash",
  "Diversified Equity",
  "Concentrated Equity",
  "Crypto",
  "Employer Equity",
  "Real Estate",
] as const;

export type Bucket = (typeof BUCKETS)[number];

export interface Holding {
  id: string;
  name: string;
  bucket: Bucket;
  /** Value stored in AED (the base currency). */
  valueAED: number;
  /** e.g. unvested employer stock, excluded from conservative scenarios. */
  restricted?: boolean;
}

export interface Snapshot {
  id: string;
  /** ISO date string of the snapshot. */
  date: string;
  netWorthAED: number;
}

export type Targets = Record<Bucket, number>;

export interface AppState {
  holdings: Holding[];
  targets: Targets;
  snapshots: Snapshot[];
}

export type Currency = "AED" | "THB" | "USD";

export const CURRENCIES: Currency[] = ["AED", "THB", "USD"];

const SEED_HOLDINGS: Holding[] = [
  { id: "seed-cash", name: "Cash", bucket: "Cash", valueAED: 840000 },
  { id: "seed-div", name: "Diversified Equity", bucket: "Diversified Equity", valueAED: 420000 },
  { id: "seed-conc", name: "Concentrated Equity", bucket: "Concentrated Equity", valueAED: 376000 },
  { id: "seed-crypto", name: "Crypto", bucket: "Crypto", valueAED: 1619000 },
  { id: "seed-employer", name: "Employer Equity (unvested)", bucket: "Employer Equity", valueAED: 4960000, restricted: true },
  { id: "seed-re", name: "Real Estate", bucket: "Real Estate", valueAED: 1523000 },
];

const SEED_TARGETS: Targets = {
  Cash: 10,
  "Diversified Equity": 45,
  "Concentrated Equity": 10,
  Crypto: 2.5,
  "Employer Equity": 3,
  "Real Estate": 29.5,
};

export const SEED_STATE: AppState = {
  holdings: SEED_HOLDINGS,
  targets: SEED_TARGETS,
  snapshots: [],
};

export const BUCKET_COLORS: Record<Bucket, string> = {
  Cash: "#38bdf8",
  "Diversified Equity": "#34d399",
  "Concentrated Equity": "#a78bfa",
  Crypto: "#fbbf24",
  "Employer Equity": "#f472b6",
  "Real Estate": "#fb7185",
};
