import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { movies } from "../data/movies";
import { events, formatEventDate } from "../data/events";
import { loadAbandoned, clearAbandoned } from "../data/abandoned";
import { loadTickets, useBooking } from "../context/BookingContext";
import MovieCard from "../components/MovieCard";
import EventCard from "../components/EventCard";

const slides = [
  { kind: "Movie" as const, to: `/movies/${movies[6].id}`, title: movies[6].title, sub: `${movies[6].genre} • ${movies[6].language}`, poster: movies[6].poster, bg: "linear-gradient(120deg, #e11d48, #9f1239)" },
  { kind: "Event" as const, to: `/events/${events[0].id}`, title: events[0].title, sub: `${events[0].venue} • ${formatEventDate(events[0].date)}`, poster: events[0].poster, bg: "linear-gradient(120deg, #1e3a8a, #172554)" },
  { kind: "Movie" as const, to: `/movies/${movies[5].id}`, title: movies[5].title, sub: `${movies[5].genre} • ${movies[5].language}`, poster: movies[5].poster, bg: "linear-gradient(120deg, #be123c, #4c0519)" },
  { kind: "Event" as const, to: `/events/${events[1].id}`, title: events[1].title, sub: `${events[1].venue} • ${formatEventDate(events[1].date)}`, poster: events[1].poster, bg: "linear-gradient(120deg, #1d4ed8, #1e3a8a)" },
];

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [abandoned, setAbandoned] = useState(loadAbandoned);
  const navigate = useNavigate();
  const { dispatch } = useBooking();
  const ticketCount = loadTickets().length;
  const GOAL = 3;

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), 4500);
    return () => clearInterval(id);
  }, []);

  // Win-back (Solution 2): resume exactly where the failed booking left off.
  const resumeAbandoned = () => {
    if (!abandoned) return;
    dispatch({
      type: "START_BOOKING",
      itemType: abandoned.itemType,
      itemId: abandoned.itemId,
      showtimeId: abandoned.showtimeId,
    });
    if (abandoned.itemType === "movie") {
      dispatch({ type: "SET_SEATS", seats: abandoned.seats });
    } else {
      for (const [tierId, qty] of Object.entries(abandoned.tierQty)) {
        dispatch({ type: "SET_TIER_QTY", tierId, qty });
      }
    }
    clearAbandoned();
    navigate(`/book/${abandoned.itemType}/${abandoned.itemId}/showtime/${abandoned.showtimeId}`);
  };

  const s = slides[slide];

  return (
    <div className="page">
      {abandoned && (
        <div className="winback-card">
          <div>
            <strong>Finish your booking?</strong> Your payment for{" "}
            <strong>{abandoned.title}</strong> didn't go through — we saved your
            selection, and any debited amount refunds automatically within 5–7
            days.
          </div>
          <div className="winback-actions">
            <button className="winback-resume" onClick={resumeAbandoned}>
              Resume booking
            </button>
            <button
              className="winback-dismiss"
              onClick={() => {
                clearAbandoned();
                setAbandoned(null);
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="loyalty-card">
        <div className="loyalty-row">
          <span>
            🎖 ShowTime Rewards ·{" "}
            {ticketCount >= GOAL
              ? "Reward unlocked!"
              : `${Math.min(ticketCount, GOAL)} of ${GOAL} bookings`}
          </span>
          <span className="loyalty-hint">
            {ticketCount >= GOAL
              ? "Free Recliner upgrade on your next booking"
              : `${GOAL - Math.min(ticketCount, GOAL)} more for a free Recliner upgrade`}
          </span>
        </div>
        <div className="loyalty-track">
          <div
            className="loyalty-fill"
            style={{ width: `${Math.min(100, (ticketCount / GOAL) * 100)}%` }}
          />
        </div>
      </div>
      <div className="hero" style={{ background: s.bg }}>
        <div
          className="hero-slide"
          onClick={() => navigate(s.to)}
          style={{ cursor: "pointer" }}
        >
          <img src={s.poster} alt={s.title} />
          <div>
            <span className="hero-tag">{s.kind}</span>
            <h2>{s.title}</h2>
            <p>{s.sub}</p>
          </div>
        </div>
        <div className="hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === slide ? "active" : ""}`}
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="section-title">
        Now Showing <Link to="/movies">See all</Link>
      </div>
      <div className="rail">
        {movies.map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>

      <div className="section-title">
        Live Events Near You <Link to="/events">See all</Link>
      </div>
      <div className="rail">
        {events.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}
