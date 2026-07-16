import { Link } from "react-router-dom";
import type { Movie } from "../data/movies";

export default function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link to={`/movies/${movie.id}`} className="card">
      <img src={movie.poster} alt={movie.title} loading="lazy" />
      <h3>{movie.title}</h3>
      <div className="meta">
        {movie.genre} • {movie.language} • {movie.rating}
      </div>
    </Link>
  );
}
