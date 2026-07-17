import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { movies } from "../data/movies";
import { events } from "../data/events";
import DemoModeBar from "./DemoModeBar";

export default function Header() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const movieHits = movies
      .filter((m) => m.title.toLowerCase().includes(q))
      .map((m) => ({ to: `/movies/${m.id}`, title: m.title, kind: "Movie" }));
    const eventHits = events
      .filter((e) => e.title.toLowerCase().includes(q))
      .map((e) => ({ to: `/events/${e.id}`, title: e.title, kind: "Event" }));
    return [...movieHits, ...eventHits].slice(0, 6);
  }, [query]);

  return (
    <header className="header">
      <DemoModeBar />
      <div className="header-row">
        <Link to="/" className="logo">
          Show<span>Time</span>
        </Link>
        <select className="city-select" defaultValue="Mumbai" aria-label="City">
          <option>Mumbai</option>
          <option>Delhi</option>
          <option>Bengaluru</option>
          <option>Hyderabad</option>
          <option>Chennai</option>
        </select>
        <Link to="/my-tickets" className="my-tickets-link">
          My Tickets
        </Link>
      </div>
      <div className="header-row2">
        <div className="search-wrap">
          <input
            className="search-input"
            placeholder="Search movies & events…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {results.length > 0 && (
            <div className="search-results">
              {results.map((r) => (
                <Link
                  key={r.to}
                  to={r.to}
                  className="search-result-item"
                  onClick={() => setQuery("")}
                >
                  {r.title}
                  <small>{r.kind}</small>
                </Link>
              ))}
            </div>
          )}
        </div>
        <Link to="/agent" className="ask-btn" title="Conversational booking — tell ShowTime what you want in one sentence">
          ✨ Ask
        </Link>
      </div>
      <nav className="nav-tabs">
        <NavLink to="/" end className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}>
          Home
        </NavLink>
        <NavLink to="/movies" className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}>
          Movies
        </NavLink>
        <NavLink to="/events" className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}>
          Events
        </NavLink>
      </nav>
    </header>
  );
}
