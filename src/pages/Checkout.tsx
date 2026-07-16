import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import { getMovie, getShowtime } from "../data/movies";
import { getEvent, formatEventDate } from "../data/events";
import { bookingSubtotal, inr, seatsLabel } from "../data/pricing";
import { CONVENIENCE_FEE, getOffer } from "../data/offers";
import OfferListUnified from "../components/OfferListUnified";
import OfferTabsClassic from "../components/OfferTabsClassic";
import CountdownTimer from "../components/CountdownTimer";

export default function Checkout() {
  const { itemType, itemId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useBooking();

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

  const title = isMovie ? movie?.title : event?.title;
  const sub = isMovie
    ? `${showtime?.venue} • Today, ${showtime?.time}`
    : `${event?.venue} • ${event ? formatEventDate(event.date) : ""}`;

  const holdExpired = () => {
    dispatch({ type: "RESET_FLOW" });
    navigate(isMovie ? `/movies/${itemId}` : `/events/${itemId}`);
  };

  return (
    <>
      <div className="page">
        {state.failSafe && state.holdStart && (
          <CountdownTimer holdStart={state.holdStart} onExpire={holdExpired} />
        )}
        <div className="summary-card">
          <h2>{title}</h2>
          <div className="sub">{sub}</div>
          <div className="summary-line">
            <span>{isMovie ? "Seats" : "Tickets"}</span>
            <span>{seatsLabel(state)}</span>
          </div>
          <div className="summary-line">
            <span>Subtotal</span>
            <span>{inr(subtotal)}</span>
          </div>
          <div className="summary-line">
            <span
              className="fee-tip"
              title="Platform fee — covers payment processing & support"
            >
              Convenience fee
            </span>
            <span>{inr(CONVENIENCE_FEE)}</span>
          </div>
          {discount > 0 && (
            <div className="summary-line">
              <span className="discount">Offer applied ({offer!.title.split(" — ")[1]})</span>
              <span className="discount">−{inr(discount)}</span>
            </div>
          )}
          <div className="summary-line total">
            <span>Total</span>
            <span>{inr(total)}</span>
          </div>
        </div>

        {state.failSafe ? (
          <OfferListUnified
            subtotal={subtotal}
            appliedId={state.offerId}
            onApply={(id) => dispatch({ type: "APPLY_OFFER", offerId: id })}
          />
        ) : (
          <OfferTabsClassic
            subtotal={subtotal}
            appliedId={state.offerId}
            onApply={(id) => dispatch({ type: "APPLY_OFFER", offerId: id })}
          />
        )}
      </div>
      <div className="sticky-bar">
        <div className="total-info">
          <div className="label">Amount payable</div>
          <div className="amount">{inr(total)}</div>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate(`/book/${itemType}/${itemId}/payment`)}
        >
          Proceed to Pay
        </button>
      </div>
    </>
  );
}
