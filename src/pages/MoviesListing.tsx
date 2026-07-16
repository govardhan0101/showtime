import { useMemo, useState } from "react";
import { movies } from "../data/movies";
import MovieCard from "../components/MovieCard";

export default function MoviesListing() {
  const genres = useMemo(
    () => Array.from(new Set(movies.map((m) => m.genre.split("/")[0]))),
    []
  );
  const languages = useMemo(
    () => Array.from(new Set(movies.map((m) => m.language))),
    []
  );
  const [genre, setGenre] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);

  const filtered = movies.filter(
    (m) =>
      (!genre || m.genre.startsWith(genre)) &&
      (!language || m.language === language)
  );

  return (
    <div className="page">
      <div className="section-title">Movies in Mumbai</div>
      <div className="chip-row">
        {genres.map((g) => (
          <button
            key={g}
            className={`chip ${genre === g ? "active" : ""}`}
            onClick={() => setGenre(genre === g ? null : g)}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="chip-row">
        {languages.map((l) => (
          <button
            key={l}
            className={`chip ${language === l ? "active" : ""}`}
            onClick={() => setLanguage(language === l ? null : l)}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="card-grid">
        {filtered.map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state">
          <p>No movies match those filters.</p>
        </div>
      )}
    </div>
  );
}
