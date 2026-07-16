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

## How to demo

**Easiest: the built-in guided tour.** Click **▶ Demo Tour** (bottom-left, on every page — first-time visitors also get a prompt). It's a 15-step scripted tour that drives the app itself: it books seats, starts the hold, walks through the unified offers and fee transparency, triggers Smart Payment Routing, forces a payment failure, shows the automatic recovery with the same seats intact, then flips to classic (OFF) mode and repeats the failure to show the dead end. Presenters just press **Next**.

**Manual demo script** (if you'd rather drive):
1. Toggle **ON** → pick a movie → showtime → select 2 seats → Proceed. Point out the hold timer on Checkout.
2. Show the single offer list with the "Recommended for you" pick; apply it.
3. On Payment, select **Net Banking** → the Smart Payment Routing banner appears; switch to UPI.
4. Open the gear (bottom-right) → arm **Simulate Failure** → Pay. Watch the recovery message and the auto-return to seat selection with your seats still held.
5. Flip the toggle **OFF**, repeat: tabbed offers, no timer, and the same forced failure now dead-ends with a generic message.

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
