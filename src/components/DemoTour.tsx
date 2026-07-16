import { useEffect, useRef, useState } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import { generateSeatMap } from "../data/seatMapGenerator";

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

function pickTwoAdjacentFreeSeats(): string[] {
  for (const row of generateSeatMap(TOUR_SHOWTIME)) {
    for (let i = 0; i < row.length - 1; i++) {
      if (!row[i].sold && !row[i + 1].sold) return [row[i].id, row[i + 1].id];
    }
  }
  return [];
}

const steps: TourStep[] = [
  {
    title: "Welcome to ShowTime 👋",
    body: "A BookMyShow-inspired prototype built to demonstrate one product idea: Fail-Safe Checkout. This 2-minute tour drives the app for you — book seats, fail a payment, watch the recovery, then see the classic experience for contrast. Just press Next.",
  },
  {
    target: ".failsafe-toggle",
    title: "The master switch",
    body: "This global toggle flips the entire checkout between the improved experience (ON) and the classic one (OFF). It changes real behavior — timers, offers, failure handling — not just labels. It's ON right now.",
  },
  {
    path: "/movies/m1",
    target: ".venue-block",
    title: "Browse → showtimes",
    body: "Standard discovery: posters, details, and showtimes grouped by venue. The tour picks Mortal Kombat 2 at PVR: Phoenix Marketcity for you.",
  },
  {
    path: `/book/movie/m1/showtime/${TOUR_SHOWTIME}`,
    run: ({ dispatch }) => {
      dispatch({ type: "START_BOOKING", itemType: "movie", itemId: "m1", showtimeId: TOUR_SHOWTIME });
      dispatch({ type: "SET_SEATS", seats: pickTwoAdjacentFreeSeats() });
    },
    waitFor: ".seat.selected",
    target: ".seat-grid",
    title: "Pick your seats",
    body: "An 8×12 seat map with tiered pricing — grey seats are already sold. We've selected two Recliners for you. The moment you proceed, a 5-minute seat hold starts. Remember these seats; they matter later.",
  },
  {
    run: ({ dispatch }) => {
      dispatch({ type: "START_HOLD" });
      dispatch({ type: "SET_RECOVERY_MESSAGE", message: null });
    },
    path: "/book/movie/m1/checkout",
    target: ".countdown",
    title: "Fail-Safe #1: a visible hold timer",
    body: "Your seat hold is explicit and always visible — green, then amber under 2:00, red under 0:30. No silently expiring seats.",
  },
  {
    target: ".offer-item",
    title: "Fail-Safe #2: one offer list, best first",
    body: "Every offer in a single sorted list, with the best one for you flagged \"Recommended\". Flip the toggle OFF and these exact offers scatter across three tabs with no signal of which is best — you'll see that later.",
  },
  {
    target: ".summary-card",
    title: "Fee transparency",
    body: "The ₹35 convenience fee is itemized up front with a plain-language explanation — hidden fees were a named research finding, so this prototype shows them plainly.",
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
    title: "Fail-Safe #3: Smart Payment Routing",
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
    title: "Fail-Safe #4: failure without stranding",
    body: "The payment just failed — on purpose. Notice the message: it says exactly what happened AND that your seats are safe. In two seconds it takes you back automatically. Press Next.",
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
    title: "Classic mode: toggle OFF",
    body: "We've flipped the toggle OFF. Same order, same offers — but now they're split across three tabs with no best-offer signal. And notice: the hold timer is gone.",
  },
  {
    path: "/book/movie/m1/payment",
    preWait: ".method-list",
    run: () => fireTourEvent("pay-failure"),
    waitFor: ".failure-box.deadend",
    target: ".failure-box.deadend",
    title: "…and the classic dead end",
    body: "The identical failure in classic mode: a generic \"Payment Failed\", no seat status, no path forward except backing out manually. This stranded moment is exactly what Fail-Safe Checkout removes.",
  },
  {
    title: "That's the pitch 🎬",
    body: "Fail-Safe Checkout = visible seat holds + one smart offer list + risk-aware payment routing + automatic recovery on failure. Explore freely — flip the header toggle any time, and use the gear icon on the Payment screen to force any outcome. (Toggle restored to ON.)",
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
            <span>New here? Take the 2-minute guided tour of the Fail-Safe Checkout demo.</span>
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
