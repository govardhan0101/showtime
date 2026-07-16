import { tierForRow } from "./movies";

export interface Seat {
  id: string; // e.g. "A1"
  row: string;
  num: number;
  sold: boolean;
  tier: string;
  price: number;
}

export const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
export const SEATS_PER_ROW = 12;

// Deterministic PRNG (mulberry32) seeded from the showtime id so the same
// showtime always renders the same "sold" pattern.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateSeatMap(showtimeId: string): Seat[][] {
  const rand = mulberry32(hashString(showtimeId));
  return ROWS.map((row) => {
    const band = tierForRow(row);
    return Array.from({ length: SEATS_PER_ROW }, (_, i) => ({
      id: `${row}${i + 1}`,
      row,
      num: i + 1,
      sold: rand() < 0.2,
      tier: band.tier,
      price: band.price,
    }));
  });
}
