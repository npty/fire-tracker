# 🔥 Fire-tracker

A personal **FIRE (Financial Independence, Retire Early)** wealth tracker built with
Next.js (App Router), TypeScript, and Tailwind CSS. Track your net worth, compare your
actual allocation against target allocations, and model lifetime withdrawal scenarios —
all in one phone-friendly single-page app.

> **Privacy first:** everything is stored in your browser's `localStorage`. There is no
> backend, no account, and no analytics. Your financial data never leaves your device
> (except the public exchange-rate API call described below).

## Features

| Tab | What it does |
|-----|--------------|
| **Overview** | Total net worth plus per-bucket allocation bars showing actual % vs target % with drift indicators (over/under target). |
| **Holdings** | Editable list of holdings — name, bucket, value (AED), optional *restricted/unvested* flag. Add, edit, delete. |
| **Plan** | Editable target allocation percentages per bucket (validated to sum to 100%). Shows per-bucket gap: current vs target value and how much to buy/sell. |
| **Lifetime** | Withdrawal planner with two modes: (a) **max sustainable monthly withdrawal** to a horizon age, given your portfolio; (b) **runway** — how many years a given monthly spend lasts. Includes a year-by-year projection table and a balance-over-time chart. Withdrawals grow with inflation each year. |
| **History** | Monthly net-worth snapshots (auto-saved on your first visit each month, plus a manual *Snapshot now* button), rendered as a line chart and table. |

**Currency switcher** — view everything in AED, THB, or USD. Rates are fetched live
from [open.er-api.com](https://open.er-api.com/v6/latest/AED) (free, no API key),
cached in `localStorage` with a timestamp and attribution, with a manual refresh
button. If you're offline, the app gracefully falls back to the last cached rates
(and ultimately to built-in fallback rates, flagged as stale).

**Keyboard shortcuts** — press `1`–`5` to jump between tabs in order. Keypresses are
ignored while you're typing in an input field. Each tab shows its shortcut hint.

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other commands

```bash
npm run build   # production build (also runs on Vercel)
npm start       # serve the production build locally
npm run typecheck  # strict TypeScript check
```

## How the lifetime math works

Annual model, end-of-year withdrawals:

- Each year the portfolio grows at the nominal return `r`, then you withdraw
  `W·(1+g)^(t-1)` where `W` is the first-year withdrawal and `g` is inflation.
- **Max withdrawal** for `n` years solves `PV·(1+r)^n = W·Σ(1+g)^(t-1)(1+r)^(n-t)`,
  i.e. `W = PV·(r−g) / (1 − q^n)` with `q = (1+g)/(1+r)` (limit case handled when `r ≈ g`).
- **Runway** inverts the same formula; returns *indefinite* when portfolio growth
  permanently outpaces withdrawals.

These are simplified educational projections, not financial advice.

## Deploying to Vercel

This app needs **zero config** on Vercel — no Dockerfile, no `vercel.json`:

1. Push this repo to GitHub (see below).
2. In [Vercel](https://vercel.com), click **Add New → Project** and import the repo.
3. Vercel auto-detects Next.js. Keep the defaults (`npm run build`) and deploy.
4. To use a custom domain (e.g. `fire.npty.online`): in the project go to
   **Settings → Domains**, add the domain, and point your DNS at Vercel
   (an `A`/`CNAME` record as shown by Vercel — or a Cloudflare DNS record with
   proxying if your DNS lives on Cloudflare).

To push to GitHub with the `gh` CLI:

```bash
gh repo create <owner>/fire-tracker --private --source=. --push
```

## Data & privacy notes

- Holdings, targets, snapshots, currency choice, and cached FX rates live in
  `localStorage` under keys prefixed `fire-tracker:`.
- The only network call the app makes is to `open.er-api.com` for exchange rates.
- Clearing browser site data resets the app to its seed defaults.

## Seed defaults

The app ships with editable example figures (AED): Cash 840,000 · Diversified Equity
420,000 · Concentrated Equity 376,000 · Crypto 1,619,000 · Employer Equity 4,960,000
(restricted) · Real Estate 1,523,000 — and targets Cash 10% / Diversified Equity 45% /
Concentrated Equity 10% / Crypto 2.5% / Employer Equity 3% / Real Estate 29.5%.
Replace them with your own numbers on the Holdings and Plan tabs.
