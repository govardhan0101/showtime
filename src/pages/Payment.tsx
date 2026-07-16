import { useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  useBooking,
  type ConfirmedBooking,
} from "../context/BookingContext";
import { getMovie, getShowtime } from "../data/movies";
import { getEvent, formatEventDate } from "../data/events";
import { bookingSubtotal, inr, seatsLabel } from "../data/pricing";
import { CONVENIENCE_FEE, getOffer } from "../data/offers";
import CountdownTimer from "../components/CountdownTimer";
import DemoControlsPanel, { type DemoOutcome } from "../components/DemoControlsPanel";

type Method = "upi" | "credit" | "debit" | "netbanking";

const METHODS: Array<{ id: Method; label: string; icon: string }> = [
  { id: "upi", label: "UPI", icon: "📱" },
  { id: "credit", label: "Credit Card", icon: "💳" },
  { id: "debit", label: "Debit Card", icon: "🏦" },
  { id: "netbanking", label: "Net Banking", icon: "🌐" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function makeBookingId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return `ST-${id}`;
}

export default function Payment() {
  const { itemType, itemId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useBooking();

  const [method, setMethod] = useState<Method>("upi");
  const [armed, setArmed] = useState<DemoOutcome>(null);
  const [processing, setProcessing] = useState(false);
  const [failure, setFailure] = useState<null | "recovering" | "deadend">(null);
  const [riskDismissed, setRiskDismissed] = useState(false);
  const [cardNum, setCardNum] = useState("");
  const resolvingRef = useRef(false);

  const isMovie = itemType === "movie";
  const movie = isMovie && itemId ? getMovie(itemId) : undefined;
  const showtime = isMovie && state.showtimeId ? getShowtime(state.showtimeId) : undefined;
  const event = !isMovie && itemId ? getEvent(itemId) : undefined;

  const subtotal = bookingSubtotal(state);
  if (!itemId || state.itemId !== itemId || subtotal === 0) {
    return <Navigate to="/" replace />;
  }

  const offer = getOffer(state.offerId);
  const discount = offer ? offer.discount(subtotal) : 0;
  const total = subtotal + CONVENIENCE_FEE - discount;

  // "Smart Payment Routing" simulation: deterministic elevated-risk signal when
  // Net Banking is chosen, or when a failure has been pre-armed via Demo Controls.
  const showRiskBanner =
    state.failSafe &&
    !riskDismissed &&
    !processing &&
    !failure &&
    (method === "netbanking" || armed === "failure");

  const failToSeatSelection = (message: string) => {
    setFailure("recovering");
    window.setTimeout(() => {
      dispatch({ type: "SET_RECOVERY_MESSAGE", message });
      dispatch({ type: "START_HOLD" }); // extend a fresh hold window
      navigate(`/book/${itemType}/${itemId}/showtime/${state.showtimeId}`);
    }, 2000);
  };

  const handleFailure = (kind: "failure" | "timeout") => {
    setProcessing(false);
    if (state.failSafe) {
      failToSeatSelection(
        kind === "timeout"
          ? "The payment timed out — good news, your seats are still held. We've extended your hold so you can try again."
          : "Your payment didn't go through — good news, your seats are still held. Pick up right where you left off."
      );
    } else {
      setFailure("deadend");
    }
  };

  const handleSuccess = () => {
    const booking: ConfirmedBooking = {
      bookingId: makeBookingId(),
      itemType: itemType as "movie" | "event",
      itemId,
      title: (isMovie ? movie?.title : event?.title) ?? "",
      poster: (isMovie ? movie?.poster : event?.poster) ?? "",
      venue: (isMovie ? showtime?.venue : event?.venue) ?? "",
      when: isMovie
        ? `Today, ${showtime?.time}`
        : event
          ? formatEventDate(event.date)
          : "",
      seatsLabel: seatsLabel(state),
      total,
      bookedAt: Date.now(),
    };
    dispatch({ type: "CONFIRM_BOOKING", booking });
    navigate(`/book/${itemType}/${itemId}/confirmation`);
  };

  const pay = async () => {
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    setFailure(null);
    setProcessing(true);
    const outcome: Exclude<DemoOutcome, null> =
      armed ?? (Math.random() < 0.3 ? "failure" : "success");
    setArmed(null);
    await sleep(outcome === "timeout" ? 4000 : 2500);
    resolvingRef.current = false;
    if (outcome === "success") {
      handleSuccess();
    } else {
      handleFailure(outcome);
    }
  };

  // Fail-Safe ON: if the hold clock runs out mid-payment, treat it as a timeout
  // and recover rather than stranding the user.
  const onHoldExpire = () => {
    if (failure) return;
    setProcessing(false);
    failToSeatSelection(
      "Your seat hold lapsed before payment completed. We've re-reserved your seats with a fresh hold — please retry."
    );
  };

  return (
    <>
      <div className="page">
        {state.failSafe && state.holdStart && (
          <CountdownTimer holdStart={state.holdStart} onExpire={onHoldExpire} />
        )}

        <div className="section-title">Payment</div>

        {showRiskBanner && (
          <div className="risk-banner">
            <span aria-hidden>⚠️</span>
            <div>
              <span className="caption">Smart Payment Routing</span>
              This payment method is seeing delays right now — try UPI instead?
              <div className="actions">
                <button
                  className="switch-btn"
                  onClick={() => {
                    setMethod("upi");
                    setRiskDismissed(true);
                  }}
                >
                  Switch to UPI
                </button>
                <button className="dismiss-btn" onClick={() => setRiskDismissed(true)}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="method-list">
          {METHODS.map((m) => (
            <label
              key={m.id}
              className={`method-item ${method === m.id ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="method"
                checked={method === m.id}
                onChange={() => {
                  setMethod(m.id);
                  setRiskDismissed(false);
                }}
              />
              <span aria-hidden>{m.icon}</span>
              {m.label}
            </label>
          ))}
        </div>

        {(method === "credit" || method === "debit") && (
          <div className="card-mask-fields">
            <input
              placeholder="Card number"
              inputMode="numeric"
              maxLength={19}
              value={cardNum}
              onChange={(e) =>
                setCardNum(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 16)
                    .replace(/(.{4})/g, "$1 ")
                    .trim()
                )
              }
            />
            <div className="card-mask-row">
              <input placeholder="MM/YY" maxLength={5} />
              <input placeholder="CVV" type="password" maxLength={3} />
            </div>
          </div>
        )}

        {method === "upi" && (
          <div className="card-mask-fields">
            <input placeholder="yourname@upi" />
          </div>
        )}

        <div className="summary-card">
          <div className="summary-line">
            <span>{isMovie ? "Seats" : "Tickets"}</span>
            <span>{seatsLabel(state)}</span>
          </div>
          <div className="summary-line total">
            <span>Amount payable</span>
            <span>{inr(total)}</span>
          </div>
        </div>
      </div>

      <div className="sticky-bar">
        <button className="btn-primary" onClick={pay} disabled={processing}>
          Pay {inr(total)}
        </button>
      </div>

      {(processing || failure) && (
        <div className="processing-overlay">
          {state.failSafe && state.holdStart && !failure && (
            <CountdownTimer holdStart={state.holdStart} onExpire={onHoldExpire} />
          )}
          {processing && !failure && (
            <>
              <div className="spinner" />
              <p style={{ fontSize: "0.9rem", color: "var(--slate-mid)" }}>
                Processing your payment…
              </p>
            </>
          )}
          {failure === "recovering" && (
            <div className="failure-box recovery">
              <strong>Payment didn't go through</strong> — good news, your seats
              are still held. Taking you back…
            </div>
          )}
          {failure === "deadend" && (
            <div className="failure-box deadend">
              Payment Failed. Please try again.
              <div>
                <button className="ok-btn" onClick={() => setFailure(null)}>
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <DemoControlsPanel armed={armed} onArm={setArmed} />
    </>
  );
}
