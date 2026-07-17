import { useEffect, useRef, useState } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import { pickAdjacentFreeSeats } from "../data/seatMapGenerator";

const TOUR_SEEN_KEY = "showtime.tourSeen";
const TOUR_SHOWTIME = "m1-s1";

interface TourCtx {
  dispatch: ReturnType<typeof useBooking>["dispatch"];
  navigate: NavigateFunction;
}

interface TourStep {
  title: string;
  body: string;
  path?: string; // navigate on step entry
  preWait?: string; // selector that must exist BEFORE run() fires
  run?: (ctx: TourCtx) => void;
  waitFor?: string; // selector that must appear before the step is "ready"
  target?: string; // selector to spotlight
}

const fireTourEvent = (action: string) =>
  window.dispatchEvent(new CustomEvent("showtime-tour", { detail: action }));

const steps: TourStep[] = [
  {
    title: "Welcome to ShowTime 👋",
    body: "A BookMyShow-inspired prototype of a retention-led strategy: a conversational booking agent, QuickBook for returning users, transparent pricing, and a fail-safe checkout with win-back. This tour drives the app for you — just press Next.",
  },
  {
    target: ".demo-bar",
    title: "A presenter control — not a product setting",
    body: "No real user would opt into a worse checkout, so this switch lives in a clearly-labelled demo strip, outside the product UI. It flips the prototype between the Improved experience and the Classic one it replaces — changing real behaviour, not labels.",
  },
  {
    target: ".loyalty-card",
    title: "Loyalty made visible",
    body: "Research finding: loyalty value feels invisible because progress hides in the profile. Here it sits on the homepage — seen every time the app opens, without being asked for.",
  },
  {
    path: "/agent",
    preWait: ".agent-input",
    run: () => fireTourEvent("agent-demo"),
    waitFor: ".agent-actions",
    target: ".agent-thread",
    title: "Flagship: the Conversational Booking Agent",
    body: "One sentence replaces five filter screens. The agent matched the movie, showtime, and two adjacent Recliners — and placed the seat hold the moment it found a match, so chat latency can't lose the seats. Payment always stays in the normal checkout.",
  },
  {
    path: "/movies/m1",
    target: ".quickbook-card",
    title: "QuickBook — the tap-based fast path",
    body: "For returning users who prefer speed over conversation: confirm group size with one tap — never assumed — and everything else is pre-filled, with a manual fallback always visible. The tour takes the scenic manual route so you see every screen.",
  },
  {
    path: `/book/movie/m1/showtime/${TOUR_SHOWTIME}`,
    run: ({ dispatch }) => {
      dispatch({ type: "START_BOOKING", itemType: "movie", itemId: "m1", showtimeId: TOUR_SHOWTIME });
      dispatch({ type: "SET_SEATS", seats: pickAdjacentFreeSeats(TOUR_SHOWTIME, 2) });
    },
    waitFor: ".seat.selected",
    target: ".seat-grid",
    title: "Pick your seats",
    body: "An 8×12 seat map with tiered pricing — grey seats are already sold. We've selected two Recliners for you. Remember these seats; they matter later.",
  },
  {
    target: ".sticky-bar",
    title: "The true price, early",
    body: "Fee-triggered abandonment was the second-biggest churn driver in the research — so the running total here already includes the ₹35 convenience fee. No surprise at the last step.",
  },
  {
    run: ({ dispatch }) => {
      dispatch({ type: "START_HOLD" });
      dispatch({ type: "SET_RECOVERY_MESSAGE", message: null });
    },
    path: "/book/movie/m1/checkout",
    target: ".countdown",
    title: "A visible hold timer",
    body: "Your seat hold is explicit and always visible — green, then amber under 2:00, red under 0:30. No silently expiring seats.",
  },
  {
    target: ".offer-item",
    title: "One offer list, best first",
    body: "Transparent Checkout auto-matches the best offer for your saved payment method and flags it \"Recommended\". In classic mode these exact offers scatter across three tabs with no signal — you'll see that shortly.",
  },
  {
    target: ".summary-card",
    title: "Fee transparency, itemised",
    body: "The ₹35 fee is a separate labelled line with a plain-language tooltip — shown plainly here and already included in every running total you've seen.",
  },
  {
    path: "/book/movie/m1/payment",
    target: ".countdown",
    title: "The timer follows you",
    body: "Same hold countdown, still ticking on the payment screen — even under the processing spinner.",
  },
  {
    run: () => fireTourEvent("netbanking"),
    waitFor: ".risk-banner",
    target: ".risk-banner",
    title: "Smart Payment Routing",
    body: "We just selected Net Banking — a rail the simulated router flags as risky right now. It warns you before you pay and offers a one-tap switch to UPI.",
  },
  {
    run: () => {
      fireTourEvent("open-demo");
      fireTourEvent("arm-failure");
    },
    waitFor: ".demo-panel",
    target: ".demo-panel",
    title: "Presenter controls",
    body: "This hidden gear panel forces Success, Failure, or Timeout on the next Pay tap, so a live demo never depends on chance. We've just armed a failure…",
  },
  {
    run: () => fireTourEvent("pay-failure"),
    waitFor: ".failure-box.recovery",
    target: ".failure-box.recovery",
    title: "Failure without stranding",
    body: "The payment just failed — on purpose. The message says what happened, that your seats are safe, and that any debited amount auto-refunds in 5–7 days — the upfront refund promise that removes the anxiety. Press Next.",
  },
  {
    waitFor: ".recovery-banner",
    target: ".recovery-banner",
    title: "Automatic recovery",
    body: "Back at seat selection: the same two seats are still selected, a fresh hold is running, and the banner explains what happened. No dead end. Now let's see how the classic experience handles the same failure…",
  },
  {
    run: ({ dispatch }) => {
      dispatch({ type: "SET_FAILSAFE", on: false });
      dispatch({ type: "START_HOLD" });
    },
    path: "/book/movie/m1/checkout",
    target: ".offer-tabs",
    title: "Classic mode",
    body: "We've switched the demo strip to Classic. Same order, same offers — but now they're split across three tabs with no best-offer signal. And notice: the hold timer is gone.",
  },
  {
    path: "/book/movie/m1/payment",
    preWait: ".method-list",
    run: () => fireTourEvent("pay-failure"),
    waitFor: ".failure-box.deadend",
    target: ".failure-box.deadend",
    title: "…and the classic dead end",
    body: "The identical failure in classic mode: a generic \"Payment Failed\", no seat status, no refund promise, no path forward. This stranded moment is exactly what the improved flow removes.",
  },
  {
    path: "/",
    waitFor: ".winback-card",
    target: ".winback-card",
    title: "Win-back: one specific reason to return",
    body: "The platform remembered that stranded booking. Next time the user opens the app, it offers to resume exactly where they left off — selection saved, refund timeline stated. Proactive recovery instead of a lost customer.",
  },
  {
    title: "That's the strategy on screen 🎬",
    body: "Conversational agent + QuickBook cut booking effort; transparent pricing and offer-matching stop fee abandonment; the fail-safe flow with refund promises and win-back turns failures into second transactions. Explore freely — the demo strip and the Payment gear panel are always available. (Switched back to Improved.)",
  },
];

function waitForEl(selector: string, timeoutMs = 15000): Promise<Element | null> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const poll = () => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      if (Date.now() - startedAt > timeoutMs) return resolve(null);
      setTimeout(poll, 250);
    };
    poll();
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function DemoTour() {
  const { dispatch } = useBooking();
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [showPrompt, setShowPrompt] = useState(() => {
    try {
      return !localStorage.getItem(TOUR_SEEN_KEY);
    } catch {
      return false;
    }
  });

  const markSeen = () => {
    setShowPrompt(false);
    try {
      localStorage.setItem(TOUR_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const start = () => {
    markSeen();
    dispatch({ type: "SET_FAILSAFE", on: true });
    dispatch({ type: "RESET_FLOW" });
    navigate("/");
    setIndex(0);
    setActive(true);
  };

  const finish = () => {
    setActive(false);
    dispatch({ type: "SET_FAILSAFE", on: true });
    dispatch({ type: "RESET_FLOW" });
    navigate("/");
  };

  // Execute the current step's script, then wait for its anchor element.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const step = steps[index];
    (async () => {
      setReady(false);
      setRect(null);
      if (step.path) navigate(step.path);
      if (step.preWait) await waitForEl(step.preWait);
      if (cancelled) return;
      step.run?.({ dispatch, navigate });
      const anchor = step.waitFor ?? step.target;
      if (anchor) await waitForEl(anchor);
      if (cancelled) return;
      await sleep(400);
      if (cancelled) return;
      const el = step.target ? document.querySelector(step.target) : null;
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, index]);

  // Track the spotlight rect while a step is displayed (handles scrolling,
  // sticky elements, and targets that appear/disappear).
  const targetSel = active && ready ? steps[index].target : undefined;
  const rectRef = useRef<string>("");
  useEffect(() => {
    if (!targetSel) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(targetSel);
      if (!el) {
        if (rectRef.current !== "") {
          rectRef.current = "";
          setRect(null);
        }
        return;
      }
      const r = el.getBoundingClientRect();
      const key = `${r.x},${r.y},${r.width},${r.height}`;
      if (key !== rectRef.current) {
        rectRef.current = key;
        setRect(r);
      }
    };
    measure();
    const id = setInterval(measure, 300);
    return () => clearInterval(id);
  }, [targetSel]);

  if (!active) {
    return (
      <>
        {showPrompt && (
          <div className="tour-bubble">
            <span>New here? Take the 3-minute guided tour — it demos the booking agent, QuickBook, and the fail-safe checkout for you.</span>
            <button className="tour-bubble-close" onClick={markSeen} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}
        <button className="tour-launch" onClick={start}>
          ▶ Demo Tour
        </button>
      </>
    );
  }

  const step = steps[index];
  const last = index === steps.length - 1;

  return (
    <div className="tour-overlay">
      {rect ? (
        <div
          className="tour-spotlight"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      ) : (
        <div className="tour-backdrop" />
      )}
      <div className="tour-card">
        <div className="tour-progress">
          Step {index + 1} of {steps.length}
        </div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="tour-actions">
          <button className="tour-exit" onClick={finish}>
            End tour
          </button>
          <button
            className="tour-next"
            disabled={!ready}
            onClick={() => {
              setReady(false); // disarm immediately so a fast double-click can't skip a step
              if (last) finish();
              else setIndex(index + 1);
            }}
          >
            {ready ? (last ? "Finish" : "Next →") : "…"}
          </button>
        </div>
      </div>
    </div>
  );
}
