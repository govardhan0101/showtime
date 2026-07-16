import { Link } from "react-router-dom";
import { loadTickets } from "../context/BookingContext";
import { inr } from "../data/pricing";

export default function MyTickets() {
  const tickets = loadTickets();

  if (tickets.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <p>No tickets yet — go book something!</p>
          <Link to="/">
            <button className="btn-primary" style={{ width: "auto", padding: "12px 28px", margin: "0 auto" }}>
              Browse Movies & Events
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="section-title">My Tickets</div>
      {tickets.map((t) => (
        <div className="ticket-card" key={t.bookingId}>
          <div className="ticket-head">
            <img src={t.poster} alt="" />
            <div>
              <h2>{t.title}</h2>
              <p>
                {t.venue} • {t.when}
              </p>
            </div>
          </div>
          <div className="ticket-body">
            <dl>
              <dt>{t.itemType === "movie" ? "Seats" : "Tickets"}</dt>
              <dd>{t.seatsLabel}</dd>
              <dt>Booking ID</dt>
              <dd>{t.bookingId}</dd>
              <dt>Amount paid</dt>
              <dd>{inr(t.total)}</dd>
            </dl>
            <img
              className="qr-block"
              src="https://placehold.co/160x160/1e293b/ffffff?text=QR"
              alt="QR code placeholder"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
