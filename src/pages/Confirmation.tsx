import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import { inr } from "../data/pricing";

export default function Confirmation() {
  const { state, dispatch } = useBooking();
  const booking = state.lastBooking;

  // The seats/hold/offer are no longer needed once the ticket is issued.
  useEffect(() => {
    if (booking) dispatch({ type: "RESET_FLOW" });
  }, [booking, dispatch]);

  // Booking was already persisted to localStorage on CONFIRM_BOOKING.
  if (!booking) return <Navigate to="/" replace />;

  return (
    <div className="page">
      <div className="success-note">
        <span aria-hidden>✅</span> Booking confirmed!
      </div>
      <div className="ticket-card">
        <div className="ticket-head">
          <img src={booking.poster} alt="" />
          <div>
            <h2>{booking.title}</h2>
            <p>
              {booking.venue} • {booking.when}
            </p>
          </div>
        </div>
        <div className="ticket-body">
          <dl>
            <dt>{booking.itemType === "movie" ? "Seats" : "Tickets"}</dt>
            <dd>{booking.seatsLabel}</dd>
            <dt>Booking ID</dt>
            <dd>{booking.bookingId}</dd>
            <dt>Amount paid</dt>
            <dd>{inr(booking.total)}</dd>
          </dl>
          <img
            className="qr-block"
            src="https://placehold.co/160x160/1e293b/ffffff?text=QR"
            alt="QR code placeholder"
          />
        </div>
      </div>
      <p style={{ fontSize: "0.78rem", color: "var(--slate-mid)", marginBottom: 16 }}>
        This ticket has been saved to <strong>My Tickets</strong>.
      </p>
      <Link to="/my-tickets">
        <button className="btn-primary" style={{ marginBottom: 10 }}>
          View My Tickets
        </button>
      </Link>
      <Link to="/">
        <button className="btn-secondary">Back to Home</button>
      </Link>
    </div>
  );
}
