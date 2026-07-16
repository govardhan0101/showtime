import { Link } from "react-router-dom";
import { formatEventDate, type Event } from "../data/events";

export default function EventCard({ event }: { event: Event }) {
  return (
    <Link to={`/events/${event.id}`} className="card">
      <img src={event.poster} alt={event.title} loading="lazy" />
      <h3>{event.title}</h3>
      <div className="meta">
        {event.category} • {formatEventDate(event.date)}
      </div>
    </Link>
  );
}
