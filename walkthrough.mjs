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

const atSeatSelection = (u) => /\/book\/[^/]+\/[^/]+\/showtime\//.test(u.pathname);

// ---------- 1. Browsing (Improved mode default) ----------
await page.goto(`${BASE}/`);
check("Home renders hero + rails", await page.locator(".hero").isVisible() && (await page.locator(".rail .card").count()) >= 10);
check("Disclaimer on Home", (await page.locator(".disclaimer").textContent()).includes("not affiliated"));
check("Demo strip defaults to Improved", (await page.locator(".demo-seg .active").textContent()).includes("Improved"));
check("Loyalty progress strip on Home", await page.locator(".loyalty-card").isVisible());

await page.goto(`${BASE}/movies`);
check("Movies listing shows 7 movies", (await page.locator(".card-grid .card").count()) === 7);
await page.locator(".chip", { hasText: "Hindi" }).click();
check("Language filter narrows list", (await page.locator(".card-grid .card").count()) === 2);
await page.locator(".chip", { hasText: "Hindi" }).click();

await page.goto(`${BASE}/events`);
check("Events listing shows 5 events", (await page.locator(".card-grid .card").count()) === 5);

// ---------- 2. Full movie booking, Improved mode, demo-forced SUCCESS ----------
await page.goto(`${BASE}/movies/m1`);
check("Movie detail shows synopsis + showtimes", await page.locator(".venue-block").first().isVisible());
check("QuickBook card on movie detail", await page.locator(".quickbook-card").isVisible());
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
check("Seat-selection total is fee-inclusive", (await page.locator(".sticky-bar .label").textContent()).includes("incl. ₹35 fee"));
await page.screenshot({ path: `${SHOT_DIR}/1-seat-selection.png` });
await page.locator(".sticky-bar .btn-primary").click();

await page.waitForURL("**/checkout");
await page.waitForSelector(".offer-item");
check("Improved: countdown timer on checkout", await page.locator(".countdown").isVisible());
check("Improved: unified offer list (no tabs)", (await page.locator(".offer-tabs").count()) === 0 && await page.locator(".offer-item").first().isVisible());
check("Improved: Recommended badge on top offer", (await page.locator(".offer-item").first().textContent()).includes("Recommended for you"));
check("Convenience fee shown", (await page.locator(".summary-card").textContent()).includes("Convenience fee"));
await page.locator(".offer-item").first().locator(".offer-apply-btn").click();
check("Offer applies and discounts total", (await page.locator(".summary-card").textContent()).includes("Offer applied"));
await page.screenshot({ path: `${SHOT_DIR}/2-checkout-on.png` });
await page.locator(".sticky-bar .btn-primary").click();

await page.waitForURL("**/payment");
check("Improved: countdown timer on payment", await page.locator(".countdown").isVisible());
await page.locator(".method-item", { hasText: "Net Banking" }).click();
check("Improved: Smart Payment Routing banner for Net Banking", await page.locator(".risk-banner").isVisible());
await page.locator(".risk-banner .switch-btn").click();
check("Switch to UPI works", (await page.locator(".method-item.selected").textContent()).includes("UPI"));
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
await page.locator(".confirm-extras button", { hasText: "Add to calendar" }).click();
check("Add-to-calendar mock works", (await page.locator(".confirm-extras").textContent()).includes("✓ Added"));
await page.screenshot({ path: `${SHOT_DIR}/4-confirmation.png` });

await page.goto(`${BASE}/my-tickets`);
check("Movie booking in My Tickets", (await page.locator(".ticket-card").count()) === 1);

// ---------- 3. Improved mode, demo-forced FAILURE → auto-recovery ----------
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
check("Improved failure: recovery message with refund promise", (await page.locator(".failure-box.recovery").textContent()).includes("refunds automatically"));
await page.waitForURL(atSeatSelection, { timeout: 10000 });
await page.waitForSelector(".seat");
check("Improved failure: auto-returned to seat selection", page.url() === seatSelUrl);
check("Improved failure: recovery banner explains what happened", await page.locator(".recovery-banner").isVisible());
check("Improved failure: same 2 seats still selected", (await page.locator(".seat.selected").count()) === 2);
await page.screenshot({ path: `${SHOT_DIR}/5-recovery.png` });

// ---------- 4. Improved mode, demo-forced TIMEOUT → auto-recovery ----------
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
check("Improved timeout: recovered to seat selection with seats", (await page.locator(".seat.selected").count()) === 2);

// ---------- 5. Full event booking, Improved mode, tier/quantity flow ----------
await page.goto(`${BASE}/events/e1`);
await page.locator(".btn-primary", { hasText: "Book Tickets" }).click();
await page.waitForURL("**/book/event/e1/showtime/**");
await page.waitForSelector(".tier-card");
check("Event flow: tier cards, no seat grid", (await page.locator(".tier-card").count()) === 3 && (await page.locator(".seat").count()) === 0);
const gnPlus = page.locator(".tier-card", { hasText: "General" }).locator(".stepper button").nth(1);
await gnPlus.click();
await gnPlus.click();
await page.locator(".tier-card", { hasText: "VIP" }).locator(".stepper button").nth(1).click();
check("Event total = 2×1499 + 5999 + 35 fee", (await page.locator(".sticky-bar .amount").textContent()).includes("9,032"));
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

// ---------- 6. Conversational agent ----------
await page.goto(`${BASE}/agent`);
await page.locator(".agent-input").fill("Book 2 recliner seats for Mortal Kombat 2 tonight");
await page.locator(".agent-send").click();
await page.waitForSelector(".agent-actions");
const agentReply = await page.locator(".agent-msg.agent .bubble").last().textContent();
check("Agent matches movie + tier + holds seats", agentReply.includes("Mortal Kombat 2") && agentReply.includes("Recliner") && agentReply.includes("holding"));
await page.screenshot({ path: `${SHOT_DIR}/7-agent.png` });
await page.locator(".agent-confirm").click();
await page.waitForURL("**/checkout");
await page.waitForSelector(".summary-card");
check("Agent → checkout with live hold timer", await page.locator(".countdown").isVisible());
check("Agent picked 2 adjacent seats", ((await page.locator(".summary-card").textContent()).match(/[A-H]\d+/g) ?? []).length >= 2);

// Clarifying-question path
await page.goto(`${BASE}/agent`);
await page.locator(".agent-input").fill("book something fun this weekend");
await page.locator(".agent-send").click();
await page.waitForSelector(".agent-chips");
check("Agent asks one clarifying question with suggestions", (await page.locator(".agent-chips button").count()) >= 2);
await page.locator(".agent-chips button").first().click();
await page.waitForSelector(".agent-actions");
check("Clarify chip resolves to a proposal", await page.locator(".agent-confirm").isVisible());

// ---------- 7. QuickBook ----------
await page.goto(`${BASE}/movies/m2`);
await page.locator(".quickbook-card .stepper button").nth(1).click(); // 2 → 3
await page.locator(".quickbook-go").click();
await page.waitForURL("**/checkout");
check("QuickBook → checkout with 3 pre-filled seats", ((await page.locator(".summary-card").textContent()).match(/[A-H]\d+/g) ?? []).length === 3);
check("QuickBook hold timer running", await page.locator(".countdown").isVisible());

// ---------- 8. Classic ("before") mode contrast ----------
await page.locator(".demo-seg button", { hasText: "Classic" }).click();
check("Demo strip switched to Classic", (await page.locator(".demo-seg .active").textContent()).includes("Classic"));
await page.goto(`${BASE}/movies/m3`);
await page.waitForSelector(".showtime-pill");
await page.locator(".showtime-pill").first().click();
await page.waitForURL(atSeatSelection);
await page.waitForSelector(".seat");
await page.locator(".seat:not(.sold)").first().click();
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/checkout");
await page.waitForSelector(".offer-tab");
check("Classic: no countdown timer on checkout", (await page.locator(".countdown").count()) === 0);
check("Classic: offers split into 3 tabs", (await page.locator(".offer-tab").count()) === 3);
check("Classic: no Recommended-for-you badge", (await page.locator(".offer-badge").count()) === 0);
await page.locator(".offer-tab", { hasText: "Debit Card" }).click();
check("Classic: tab switch shows debit offers", (await page.locator(".offer-item").first().textContent()).includes("ICICI"));
await page.screenshot({ path: `${SHOT_DIR}/8-checkout-off.png` });
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/payment");
check("Classic: no timer on payment", (await page.locator(".countdown").count()) === 0);
await page.locator(".method-item", { hasText: "Net Banking" }).click();
check("Classic: no smart-routing banner", (await page.locator(".risk-banner").count()) === 0);
const payUrl = page.url();
await page.locator(".demo-gear").click();
await page.locator(".demo-panel button", { hasText: "Simulate Failure" }).click();
await page.locator(".demo-gear").click();
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForSelector(".failure-box.deadend", { timeout: 10000 });
check("Classic failure: generic dead-end message", (await page.locator(".failure-box.deadend").textContent()).includes("Payment Failed. Please try again."));
await page.screenshot({ path: `${SHOT_DIR}/9-deadend-off.png` });
await page.locator(".ok-btn").click();
await page.waitForTimeout(2500);
check("Classic failure: user stays stranded on payment page", page.url() === payUrl);
check("Classic failure: no recovery banner anywhere", (await page.locator(".recovery-banner").count()) === 0);

// ---------- 9. Win-back after the classic dead end ----------
await page.goto(`${BASE}/`);
await page.waitForSelector(".winback-card");
check("Win-back card on Home with refund promise", (await page.locator(".winback-card").textContent()).includes("refunds automatically"));
await page.screenshot({ path: `${SHOT_DIR}/10-winback.png` });
await page.locator(".winback-resume").click();
await page.waitForURL(atSeatSelection);
await page.waitForSelector(".seat");
check("Win-back resume restores the abandoned seat", (await page.locator(".seat.selected").count()) === 1);
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/checkout");
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/payment");
await page.locator(".demo-gear").click();
await page.locator(".demo-panel button", { hasText: "Simulate Success" }).click();
await page.locator(".demo-gear").click();
await page.locator(".sticky-bar .btn-primary").click();
await page.waitForURL("**/confirmation", { timeout: 10000 });
check("Resumed booking completes (classic mode success path)", true);
await page.goto(`${BASE}/`);
check("Completed booking clears the win-back card", (await page.locator(".winback-card").count()) === 0);

// ---------- 10. Deep link ----------
const resp = await page.goto(`${BASE}/movies`);
check("Deep link to /movies renders listing", resp.ok() && (await page.locator(".card-grid .card").count()) === 7);

// ---------- 11. Guided Demo Tour (fresh context = first visit) ----------
const ctx2 = await browser.newContext({ viewport: { width: 480, height: 900 } });
const p2 = await ctx2.newPage();
p2.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
await p2.goto(`${BASE}/`);
check("First visit shows tour prompt bubble", await p2.locator(".tour-bubble").isVisible());
check("Tour launch button present", await p2.locator(".tour-launch").isVisible());
await p2.locator(".tour-launch").click();
check("Tour starts with welcome card", (await p2.locator(".tour-card h3").textContent()).includes("Welcome"));

const milestones = {
  1: ".demo-bar",
  2: ".loyalty-card",
  3: ".agent-actions",
  4: ".quickbook-card",
  5: ".seat.selected",
  6: ".sticky-bar",
  7: ".countdown",
  8: ".offer-item",
  9: ".summary-card",
  10: ".countdown",
  11: ".risk-banner",
  12: ".demo-panel",
  13: ".failure-box.recovery",
  14: ".recovery-banner",
  15: ".offer-tabs",
  16: ".failure-box.deadend",
  17: ".winback-card",
};
const TOTAL_STEPS = 19;
let tourOk = true;
for (let i = 0; i < TOTAL_STEPS; i++) {
  await p2.locator(".tour-progress", { hasText: `Step ${i + 1} of ${TOTAL_STEPS}` }).waitFor({ timeout: 30000 });
  await p2.locator(".tour-next:not([disabled])").waitFor({ timeout: 30000 });
  if (milestones[i]) {
    const visible = await p2.locator(milestones[i]).first().isVisible();
    if (!visible) {
      console.log(`      tour step ${i + 1}: expected ${milestones[i]} visible`);
      tourOk = false;
    }
  }
  await p2.locator(".tour-next").click();
}
check("Tour steps all reached ready state with expected milestones", tourOk);
await p2.waitForURL(`${BASE}/`);
check("Tour finish returns home with Improved mode restored", (await p2.locator(".demo-seg .active").textContent()).includes("Improved"));
check("Tour prompt bubble not shown again", (await p2.locator(".tour-bubble").count()) === 0);
await p2.screenshot({ path: `${SHOT_DIR}/11-tour-done.png` });
await ctx2.close();

await browser.close();
console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
