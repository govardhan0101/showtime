import { chromium } from "playwright";

const BASE = "http://localhost:5173/showtime";
const SHOT_DIR = process.env.SHOT_DIR ?? ".";
let failures = 0;

function check(name, cond) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failures++;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 480, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

// ---------- 1. Browsing (ON mode default) ----------
await page.goto(`${BASE}/`);
check("Home renders hero + rails", await page.locator(".hero").isVisible() && (await page.locator(".rail .card").count()) >= 10);
check("Disclaimer on Home", (await page.locator(".disclaimer").textContent()).includes("not affiliated"));
check("Fail-Safe toggle default ON", (await page.locator(".failsafe-toggle").textContent()).includes("ON"));

await page.goto(`${BASE}/movies`);
check("Movies listing shows 7 movies", (await page.locator(".card-grid .card").count()) === 7);
await page.locator(".chip", { hasText: "Hindi" }).click();
check("Language filter narrows list", (await page.locator(".card-grid .card").count()) === 2);
await page.locator(".chip", { hasText: "Hindi" }).click();

await page.goto(`${BASE}/events`);
check("Events listing shows 5 events", (await page.locator(".card-grid .card").count()) === 5);

// ---------- 2. Full movie booking, ON mode, demo-forced SUCCESS ----------
await page.goto(`${BASE}/movies/m1`);
check("Movie detail shows synopsis + showtimes", await page.locator(".venue-block").first().isVisible());
await page.locator(".showtime-pill").first().click();
await page.waitForURL("**/book/movie/m1/showtime/**");
await page.waitForSelector(".seat");
check("Seat grid rendered", (await page.locator(".seat").count()) === 96);
check("Some seats pre-sold", (await page.locator(".seat.sold").count()) > 5);

const freeSeats = page.locator(".seat:not(.sold)");
await freeSeats.nth(0).click();
await freeSeats.nth(1).click();
const selectedIds = await page.locator(".seat.selected").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
check("Two seats selected", (await page.locator(".seat.selected").count()) === 2);
await page.screenshot({ path: `${SHOT_DIR}/1-seat-selection.png` });
await page.locator(".sticky-bar .btn-primary").click();

await page.waitForURL("**/checkout");
check("ON: countdown timer on checkout", await page.locator(".countdown").isVisible());
check("ON: unified offer list (no tabs)", (await page.locator(".offer-tabs").count()) === 0 && await page.locator(".offer-item").first().isVisible());
check("ON: Recommended badge on top offer", (await page.locator(".offer-item").first().textContent()).includes("Recommended for you"));
check("Convenience fee shown", (await page.locator(".summary-card").textContent()).includes("Convenience fee"));
await page.locator(".offer-item").first().locator(".offer-apply-btn").click();
check("Offer applies and discounts total", (await page.locator(".summary-card").textContent()).includes("Offer applied"));
await page.screenshot({ path: `${SHOT_DIR}/2-checkout-on.png` });
await page.locator(".sticky-bar .btn-primary").click();

await page.waitForURL("**/payment");
check("ON: countdown timer on payment", await page.locator(".countdown").isVisible());
// Smart routing banner on Net Banking
await page.locator(".method-item", { hasText: "Net Banking" }).click();
check("ON: Smart Payment Routing banner for Net Banking", await page.locator(".risk-banner").isVisible());
await page.locator(".risk-banner .switch-btn").click();
check("Switch to UPI works", (await page.locator(".method-item.selected").textContent()).includes("UPI"));
// Demo controls: force success
await page.locator(".demo-gear").click();
await page.locator(".demo-panel button", { hasText: "Simulate Success" }).click();
await page.locator(".demo-gear").click();
await page.screenshot({ path: `${SHOT_DIR}/3-payment-on.png` });
await page.locator(".sticky-bar .btn-primary").click();
check("Processing spinner shows", await page.locator(".spinner").isVisible());
await page.waitForURL("**/confirmation", { timeout: 10000 });
const bookingText = await page.locator(".ticket-card").textContent();
check("Confirmation has ST- booking id", /ST-[A-Z2-9]{8}/.test(bookingText));
check("Confirmation shows selected seats", selectedIds.every((s) => bookingText.includes(s.replace("Seat ", "").trim())));
await page.screenshot({ path: `${SHOT_DIR}/4-confirmation.png` });

await page.goto(`${BASE}/my-tickets`);
check("Movie booking in My Tickets", (await page.locator(".ticket-card").count()) === 1);

// ---------- 3. ON mode, demo-forced FAILURE → auto-recovery ----------
const atSeatSelection = (u) => /\/book\/[^/]+\/[^/]+\/showtime\//.test(u.pathname);
await page.goto(`${BASE}/movies/m2`);
await page.locator(".showtime-pill").first().click();
await page.waitForURL(atSeatSelection);
await page.waitForSelector(".seat");
const seatSelUrl = page.url();
const free2 = page.locator(".seat:not(.sold)");
await free2.nth(3).click();
await free2.nth(4).click();
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/checkout");
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/payment");
await page.locator(".demo-gear").click();
await page.locator(".demo-panel button", { hasText: "Simulate Failure" }).click();
await page.locator(".demo-gear").click();
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForSelector(".failure-box.recovery", { timeout: 10000 });
check("ON failure: recovery message shown", (await page.locator(".failure-box.recovery").textContent()).includes("seats are still held"));
await page.waitForURL(atSeatSelection, { timeout: 10000 });
await page.waitForSelector(".seat");
check("ON failure: auto-returned to seat selection", page.url() === seatSelUrl);
check("ON failure: recovery banner explains what happened", await page.locator(".recovery-banner").isVisible());
check("ON failure: same 2 seats still selected", (await page.locator(".seat.selected").count()) === 2);
await page.screenshot({ path: `${SHOT_DIR}/5-recovery.png` });

// ---------- 4. ON mode, demo-forced TIMEOUT → auto-recovery ----------
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/checkout");
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/payment");
await page.locator(".demo-gear").click();
await page.locator(".demo-panel button", { hasText: "Simulate Timeout" }).click();
await page.locator(".demo-gear").click();
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForSelector(".failure-box.recovery", { timeout: 12000 });
await page.waitForURL(atSeatSelection, { timeout: 10000 });
await page.waitForSelector(".seat");
check("ON timeout: recovered to seat selection with seats", (await page.locator(".seat.selected").count()) === 2);

// ---------- 5. Full event booking, ON mode, tier/quantity flow ----------
await page.goto(`${BASE}/events/e1`);
await page.locator(".btn-primary", { hasText: "Book Tickets" }).click();
await page.waitForURL("**/book/event/e1/showtime/**");
check("Event flow: tier cards, no seat grid", (await page.locator(".tier-card").count()) === 3 && (await page.locator(".seat").count()) === 0);
const gnPlus = page.locator(".tier-card", { hasText: "General" }).locator(".stepper button").nth(1);
await gnPlus.click();
await gnPlus.click();
await page.locator(".tier-card", { hasText: "VIP" }).locator(".stepper button").nth(1).click();
check("Event subtotal = 2×1499 + 5999", (await page.locator(".sticky-bar .amount").textContent()).includes("8,997"));
await page.screenshot({ path: `${SHOT_DIR}/6-event-tiers.png` });
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/checkout");
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/payment");
await page.locator(".demo-gear").click();
await page.locator(".demo-panel button", { hasText: "Simulate Success" }).click();
await page.locator(".demo-gear").click();
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/confirmation", { timeout: 10000 });
check("Event confirmation shows tiers", (await page.locator(".ticket-card").textContent()).includes("General × 2"));
await page.goto(`${BASE}/my-tickets`);
check("Both bookings in My Tickets", (await page.locator(".ticket-card").count()) === 2);

// ---------- 6. OFF ("classic") mode contrast ----------
await page.locator(".failsafe-toggle").click();
check("Toggle now OFF", (await page.locator(".failsafe-toggle").textContent()).includes("OFF"));
await page.goto(`${BASE}/movies/m3`);
await page.locator(".showtime-pill").first().click();
await page.waitForURL("**/showtime/**");
await page.locator(".seat:not(.sold)").first().click();
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/checkout");
check("OFF: no countdown timer on checkout", (await page.locator(".countdown").count()) === 0);
check("OFF: offers split into 3 tabs", (await page.locator(".offer-tab").count()) === 3);
check("OFF: no Recommended-for-you badge", (await page.locator(".offer-badge").count()) === 0);
await page.locator(".offer-tab", { hasText: "Debit Card" }).click();
check("OFF: tab switch shows debit offers", (await page.locator(".offer-item").first().textContent()).includes("ICICI"));
await page.screenshot({ path: `${SHOT_DIR}/7-checkout-off.png` });
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/payment");
check("OFF: no timer on payment", (await page.locator(".countdown").count()) === 0);
await page.locator(".method-item", { hasText: "Net Banking" }).click();
check("OFF: no smart-routing banner", (await page.locator(".risk-banner").count()) === 0);
const payUrl = page.url();
await page.locator(".demo-gear").click();
await page.locator(".demo-panel button", { hasText: "Simulate Failure" }).click();
await page.locator(".demo-gear").click();
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForSelector(".failure-box.deadend", { timeout: 10000 });
check("OFF failure: generic dead-end message", (await page.locator(".failure-box.deadend").textContent()).includes("Payment Failed. Please try again."));
await page.screenshot({ path: `${SHOT_DIR}/8-deadend-off.png` });
await page.locator(".ok-btn").click();
await page.waitForTimeout(2500);
check("OFF failure: user stays stranded on payment page", page.url() === payUrl);
check("OFF failure: no recovery banner anywhere", (await page.locator(".recovery-banner").count()) === 0);

// OFF mode can still succeed
await page.locator(".demo-gear").click();
await page.locator(".demo-panel button", { hasText: "Simulate Success" }).click();
await page.locator(".demo-gear").click();
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/confirmation", { timeout: 10000 });
check("OFF: success path still completes", true);

// ---------- 7. Deep link ----------
const resp = await page.goto(`${BASE}/movies`);
check("Deep link to /movies renders listing", resp.ok() && (await page.locator(".card-grid .card").count()) === 7);

await browser.close();
console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
