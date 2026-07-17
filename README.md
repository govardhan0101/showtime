# ShowTime — Retention-Strategy Prototype (Fail-Safe Checkout + Booking Agent)

A static, front-end-only, mocked-data prototype (Vite + React + TypeScript) that puts a BookMyShow retention strategy on screen: turning repeat users into default users by cutting booking effort and turning payment failures into second transactions.

> **Disclaimer:** Prototype for a product case study — not affiliated with or endorsed by BookMyShow. All data is fictional/illustrative. No real payments, accounts, AI, or APIs are involved.

## What's implemented, mapped to the strategy

| Strategy item | In the prototype |
|---|---|
| **Flagship: Conversational Booking Agent** | **✨ Ask** in the header — one sentence ("Book 2 recliner seats for Mortal Kombat 2 tonight") → keyword-matched movie/showtime/seats, hold placed the moment a match is found, one editable checkout screen. Ambiguous requests get one clarifying question with suggestions. |
| **Must-have: Failure Recovery & Win-Back** | Fail-safe payment flow (visible hold timer, auto-recovery with seats intact), upfront refund-timeline promise in every failure message, and a **win-back card on Home** that resumes an abandoned booking after a dead-end failure. |
| **Must-have: Transparent Checkout & Offer-Matching** | Fee-inclusive running total from seat selection onward, itemised ₹35 fee with plain-language tooltip, single offer list with the best offer auto-flagged "Recommended for you". |
| **Should-have: QuickBook** | On every movie page — confirm group size with one tap, everything else pre-filled (tonight's show, adjacent Gold seats), manual fallback always visible. |
| **Smaller wins** | Loyalty progress strip on the homepage; post-booking add-to-calendar & share (mock). |

## The demo device: Improved vs Classic

A dark **"Case-study demo"** strip above the header switches the prototype between the **Improved** experience and the **Classic** one it replaces. It's deliberately styled as a presenter control, *outside* the product UI — no real user would opt into a worse checkout, so it isn't presented as a product setting. It changes real behaviour:

| | Improved | Classic ("before") |
|---|---|---|
| Seat-hold timer | Visible countdown (green → amber < 2:00 → red < 0:30) | None |
| Offers | One sorted list, best offer flagged | Same offers across 3 tabs, no signal |
| Risk messaging | "Smart Payment Routing" suggests switching rails | None |
| Payment failure | Specific message + refund promise, seats held, auto-return | Generic "Payment Failed." dead end (feeds the win-back card) |

## How to demo

**Easiest: the built-in guided tour.** Click **▶ Demo Tour** (bottom-left; first-time visitors get a prompt). It's a 19-step scripted tour that drives the app itself: the demo strip, loyalty visibility, a live agent booking, QuickBook, seat selection with fee-inclusive pricing, the hold timer, offers, Smart Payment Routing, a forced failure with automatic recovery, the classic dead end, and the win-back card. Presenters just press **Next**.

**Manual demo script:**
1. Tap **✨ Ask** → send "Book 2 recliner seats for Mortal Kombat 2 tonight" → seats held → checkout.
2. Or open a movie → **QuickBook** → confirm group size → pre-filled checkout.
3. On Payment, select **Net Banking** → Smart Payment Routing banner → switch to UPI.
4. Gear icon (bottom-right) → **Simulate Failure** → Pay → watch recovery with seats intact.
5. Switch the demo strip to **Classic**, repeat the failure → generic dead end → go **Home** → the win-back card offers to resume.

## Presenting a failure on demand

On the Payment screen, open the gear icon (bottom-right) → **Demo Controls** → arm *Simulate Success / Failure / Timeout* for the next "Pay" tap. Unarmed payments resolve organically with a ~30% simulated failure rate.

## Running locally

```bash
npm install
npm run dev
```

`walkthrough.mjs` is an optional headless end-to-end walkthrough of every flow (63 checks, including all 19 tour steps); it needs `npm i -D playwright && npx playwright install chromium` first, plus the dev server running.

## Deployment

Pushed to `main` → GitHub Actions builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`). `dist/404.html` is a copy of `index.html` so deep links work on a static host.
