import { useMemo, useState } from "react";
import { events } from "../data/events";
import EventCard from "../components/EventCard";

export default function EventsListing() {
  const categories = useMemo(
    () => Array.from(new Set(events.map((e) => e.category))),
    []
  );
  const [category, setCategory] = useState<string | null>(null);

  const filtered = events.filter((e) => !category || e.category === category);

  return (
    <div className="page">
      <div className="section-title">Live Events</div>
      <div className="chip-row">
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${category === c ? "active" : ""}`}
            onClick={() => setCategory(category === c ? null : c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="card-grid">
        {filtered.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state">
          <p>No events in this category.</p>
        </div>
      )}
    </div>
  );
}
