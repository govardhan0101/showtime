import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import { getMovie, getShowtime } from "../data/movies";
import { getEvent, formatEventDate } from "../data/events";
import SeatGrid from "../components/SeatGrid";
import TierSelector from "../components/TierSelector";
import { bookingSubtotal, inr, ticketCount } from "../data/pricing";

export default function SeatSelection() {
  const { itemType, itemId, showtimeId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useBooking();

  const isMovie = itemType === "movie";
  const movie = isMovie && itemId ? getMovie(itemId) : undefined;
  const showtime = isMovie && showtimeId ? getShowtime(showtimeId) : undefined;
  const event = !isMovie && itemId ? getEvent(itemId) : undefined;
  const valid = isMovie ? Boolean(movie && showtime) : Boolean(event);

  useEffect(() => {
    if (valid && itemType && itemId && showtimeId) {
      dispatch({
        type: "START_BOOKING",
        itemType: itemType as "movie" | "event",
        itemId,
        showtimeId,
      });
    }
  }, [valid, itemType, itemId, showtimeId, dispatch]);

  if (!valid) return <Navigate to="/" replace />;

  const subtotal = bookingSubtotal({ ...state, itemType: itemType as "movie" | "event" });
  const count = ticketCount({ ...state, itemType: itemType as "movie" | "event" });

  const proceed = () => {
    // The seat hold conceptually starts here; the visible countdown renders on
    // the checkout/payment screens (Fail-Safe mode only).
    dispatch({ type: "START_HOLD" });
    dispatch({ type: "SET_RECOVERY_MESSAGE", message: null });
    navigate(`/book/${itemType}/${itemId}/checkout`);
  };

  return (
    <>
      <div className="page">
        {state.recoveryMessage && (
          <div className="recovery-banner">
            <strong>Heads up:</strong> {state.recoveryMessage}
          </div>
        )}
        <div className="section-title">
          {isMovie
            ? `${movie!.title} — ${showtime!.venue}, ${showtime!.time}`
            : `${event!.title} — ${event!.venue}, ${formatEventDate(event!.date)}`}
        </div>
        {isMovie ? (
          <SeatGrid
            showtimeId={showtimeId!}
            selected={state.seats}
            onChange={(seats) => dispatch({ type: "SET_SEATS", seats })}
          />
        ) : (
          <TierSelector
            tierQty={state.tierQty}
            onChange={(tierId, qty) => dispatch({ type: "SET_TIER_QTY", tierId, qty })}
          />
        )}
      </div>
      <div className="sticky-bar">
        <div className="total-info">
          <div className="label">
            {count} {isMovie ? (count === 1 ? "seat" : "seats") : count === 1 ? "ticket" : "tickets"} selected
          </div>
          <div className="amount">{inr(subtotal)}</div>
        </div>
        <button className="btn-primary" disabled={count === 0} onClick={proceed}>
          Proceed
        </button>
      </div>
    </>
  );
}
