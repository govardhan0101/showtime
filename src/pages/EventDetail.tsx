import { Navigate, useNavigate, useParams } from "react-router-dom";
import { formatEventDate, getEvent } from "../data/events";

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const event = eventId ? getEvent(eventId) : undefined;
  if (!event) return <Navigate to="/events" replace />;

  return (
    <div className="page">
      <div className="detail-hero">
        <img src={event.poster} alt={event.title} />
        <div>
          <h1>{event.title}</h1>
          <div className="tag-row">
            <span className="tag">{event.category}</span>
            <span className="tag">{event.venue}</span>
            <span className="tag">{formatEventDate(event.date)}</span>
          </div>
        </div>
      </div>
      <p className="synopsis">{event.description}</p>
      <p className="synopsis">
        Tickets available across General, Fan Pit, and VIP tiers. Gates open two
        hours before showtime.
      </p>

      <button
        className="btn-primary"
        onClick={() => navigate(`/book/event/${event.id}/showtime/${event.id}-st`)}
      >
        Book Tickets
      </button>
    </div>
  );
}
