import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getMovie, getShowtimesForMovie } from "../data/movies";

export default function MovieDetail() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const movie = movieId ? getMovie(movieId) : undefined;
  if (!movie) return <Navigate to="/movies" replace />;

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
