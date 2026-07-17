import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getMovie, getShowtimesForMovie, priceBands } from "../data/movies";
import { pickAdjacentFreeSeats } from "../data/seatMapGenerator";
import { useBooking } from "../context/BookingContext";

export default function MovieDetail() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useBooking();
  const [groupSize, setGroupSize] = useState(2);
  const movie = movieId ? getMovie(movieId) : undefined;
  if (!movie) return <Navigate to="/movies" replace />;

  // QuickBook (Solution 4): confirm group size with one tap, pre-fill the
  // rest — tonight's show, Gold seats, straight to the editable checkout.
  const quickBook = () => {
    const showtimes = getShowtimesForMovie(movie.id);
    const st = showtimes.find((s) => s.time === "9:45 PM") ?? showtimes[0];
    const gold = priceBands.find((b) => b.tier === "Gold")!;
    const seats = pickAdjacentFreeSeats(st.id, groupSize, gold.rows);
    dispatch({ type: "START_BOOKING", itemType: "movie", itemId: movie.id, showtimeId: st.id });
    dispatch({ type: "SET_SEATS", seats });
    dispatch({ type: "START_HOLD" });
    dispatch({ type: "SET_RECOVERY_MESSAGE", message: null });
    navigate(`/book/movie/${movie.id}/checkout`);
  };

  const byVenue = new Map<string, { id: string; time: string }[]>();
  for (const st of getShowtimesForMovie(movie.id)) {
    if (!byVenue.has(st.venue)) byVenue.set(st.venue, []);
    byVenue.get(st.venue)!.push({ id: st.id, time: st.time });
  }

  return (
    <div className="page">
      <div className="detail-hero">
        <img src={movie.poster} alt={movie.title} />
        <div>
          <h1>{movie.title}</h1>
          <div className="tag-row">
            <span className="tag">{movie.genre}</span>
            <span className="tag">{movie.language}</span>
            <span className="tag">{movie.duration}</span>
            <span className="tag">{movie.rating}</span>
          </div>
        </div>
      </div>
      <p className="synopsis">{movie.synopsis}</p>

      <div className="quickbook-card">
        <div className="quickbook-head">
          <span>⚡ QuickBook</span>
          <span className="quickbook-badge">For returning users</span>
        </div>
        <p>
          How many people are you booking for? We'll pre-fill tonight's 9:45 PM
          show with adjacent Gold seats — everything stays editable at checkout.
        </p>
        <div className="quickbook-row">
          <div className="stepper">
            <button
              disabled={groupSize <= 1}
              onClick={() => setGroupSize(groupSize - 1)}
              aria-label="Fewer people"
            >
              −
            </button>
            <span className="qty">{groupSize}</span>
            <button
              disabled={groupSize >= 6}
              onClick={() => setGroupSize(groupSize + 1)}
              aria-label="More people"
            >
              +
            </button>
          </div>
          <button className="quickbook-go" onClick={quickBook}>
            Continue with QuickBook
          </button>
        </div>
        <button
          className="quickbook-manual"
          onClick={() =>
            document.getElementById("showtimes")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Book manually instead
        </button>
      </div>

      <button
        className="btn-primary"
        style={{ marginBottom: 18 }}
        onClick={() =>
          document.getElementById("showtimes")?.scrollIntoView({ behavior: "smooth" })
        }
      >
        Book Tickets
      </button>

      <div className="section-title" id="showtimes">
        Showtimes — Today, Mumbai
      </div>
      {[...byVenue.entries()].map(([venue, times]) => (
        <div className="venue-block" key={venue}>
          <h3>{venue}</h3>
          <div className="showtime-row">
            {times.map((t) => (
              <button
                key={t.id}
                className="showtime-pill"
                onClick={() => navigate(`/book/movie/${movie.id}/showtime/${t.id}`)}
              >
                {t.time}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
