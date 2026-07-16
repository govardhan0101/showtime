# ShowTime — Fail-Safe Checkout Prototype

A static, front-end-only, mocked-data prototype (Vite + React + TypeScript) built to demonstrate one product idea for a case study: a **Fail-Safe Checkout** flow — visible seat-hold countdown timer, predictive "Smart Payment Routing" risk messaging, and automatic recovery on payment failure — contrasted against a "classic" flow that lacks all three.

> **Disclaimer:** Prototype for a product case study — not affiliated with or endorsed by BookMyShow. All data is fictional/illustrative. No real payments, accounts, or APIs are involved.

## The demo device: the Fail-Safe Checkout toggle

A global header toggle (default **ON**) flips the entire checkout experience:

| | Fail-Safe ON | Fail-Safe OFF ("classic") |
|---|---|---|
| Seat-hold timer | Visible countdown (green → amber < 2:00 → red < 0:30) on checkout & payment | No timer anywhere |
| Offers | One sorted list, best offer flagged "Recommended for you" | Same offers split across 3 tabs, no best-offer signal |
| Risk messaging | "Smart Payment Routing" banner suggests switching to UPI when risk is elevated | None |
| Payment failure | Clear message, seats stay held, auto-return to seat selection with selection intact and a fresh hold | Generic "Payment Failed." dead end on the same page |

## Presenting a failure on demand

On the Payment screen, open the gear icon (bottom-right) → **Demo Controls** → arm *Simulate Success / Failure / Timeout* for the next "Pay" tap. Unarmed payments resolve organically with a ~30% simulated failure rate.

## Running locally

```bash
npm install
npm run dev
```

`walkthrough.mjs` is an optional headless end-to-end walkthrough of every acceptance-criteria flow; it needs `npm i -D playwright && npx playwright install chromium` first, plus the dev server running.

## Deployment

Pushed to `main` → GitHub Actions builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`). `dist/404.html` is a copy of `index.html` so deep links work on a static host.
