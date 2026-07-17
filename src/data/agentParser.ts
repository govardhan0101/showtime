import { movies, showtimes, priceBands, tierForRow } from "./movies";
import { events, eventTiers, formatEventDate } from "./events";
import { pickAdjacentFreeSeats } from "./seatMapGenerator";
import { CONVENIENCE_FEE } from "./offers";

export interface AgentProposal {
  itemType: "movie" | "event";
  itemId: string;
  title: string;
  showtimeId: string;
  venue: string;
  timeLabel: string;
  count: number;
  tierName: string;
  seats: string[]; // movies only
  tierQty: Record<string, number>; // events only
  seatsLabel: string;
  total: number;
}

export interface ParseResult {
  proposal?: AgentProposal;
  clarify?: { question: string; suggestions: string[] };
}

// Deliberately simple keyword extraction — this simulates the flagship
// "Conversational Booking Agent" from the strategy deck. No real NLP.

function matchTitle<T extends { id: string; title: string }>(
  text: string,
  items: T[]
): T | undefined {
  let best: T | undefined;
  let bestScore = 0;
  for (const item of items) {
    const tokens = item.title
      .toLowerCase()
      .split(/[^a-z0-9']+/)
      .filter((w) => w.length >= 4);
    const score = tokens.filter((t) => text.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}

function extractCount(text: string): number {
  // Prefer a number attached to a ticket-ish word so "Dhamaal 4" isn't
  // read as four tickets.
  const attached = text.match(/(\d+)\s*(tickets?|seats?|people|persons?|pax)/);
  const leading = text.match(/^book\s+(\d+)\b/);
  const n = attached ? Number(attached[1]) : leading ? Number(leading[1]) : 2;
  return Math.min(8, Math.max(1, n));
}

export function parseRequest(raw: string): ParseResult {
  const text = raw.toLowerCase();
  const movie = matchTitle(text, movies);
  const event = matchTitle(text, events);
  const count = extractCount(text);

  if (!movie && !event) {
    return {
      clarify: {
        question:
          "I couldn't match that to anything showing right now — which of these did you mean?",
        suggestions: [
          `${count} tickets for ${movies[0].title} tonight`,
          `${count} tickets for ${movies[6].title}`,
          `${count} tickets for ${events[0].title}`,
        ],
      },
    };
  }

  if (event && !movie) {
    const wantVip = text.includes("vip");
    const wantFanPit = text.includes("fan pit") || text.includes("fanpit");
    const tier = wantVip
      ? eventTiers[2]
      : wantFanPit
        ? eventTiers[1]
        : eventTiers[0];
    return {
      proposal: {
        itemType: "event",
        itemId: event.id,
        title: event.title,
        showtimeId: `${event.id}-st`,
        venue: event.venue,
        timeLabel: formatEventDate(event.date),
        count,
        tierName: tier.name,
        seats: [],
        tierQty: { [tier.id]: count },
        seatsLabel: `${tier.name} × ${count}`,
        total: tier.price * count + CONVENIENCE_FEE,
      },
    };
  }

  const m = movie!;
  const timeLabel = text.match(/morning/)
    ? "10:30 AM"
    : text.match(/afternoon|matinee/)
      ? "2:15 PM"
      : "9:45 PM"; // tonight / evening / default
  const st =
    showtimes.find((s) => s.movieId === m.id && s.time === timeLabel) ??
    showtimes.find((s) => s.movieId === m.id)!;

  const band =
    priceBands.find((b) => text.includes(b.tier.toLowerCase())) ??
    priceBands.find((b) => b.tier === "Gold")!;
  const seats = pickAdjacentFreeSeats(st.id, count, band.rows);
  const total =
    seats.reduce((sum, id) => sum + tierForRow(id[0]).price, 0) +
    CONVENIENCE_FEE;

  return {
    proposal: {
      itemType: "movie",
      itemId: m.id,
      title: m.title,
      showtimeId: st.id,
      venue: st.venue,
      timeLabel: `Today, ${st.time}`,
      count,
      tierName: tierForRow(seats[0]?.[0] ?? band.rows[0]).tier,
      seats,
      tierQty: {},
      seatsLabel: seats.join(", "),
      total,
    },
  };
}
