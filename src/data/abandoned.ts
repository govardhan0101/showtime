// "Failure Recovery & Win-Back" (Solution 2): when a payment dead-ends and the
// user walks away, remember what they were buying so the home screen can offer
// one specific, relevant reason to come back.

export interface AbandonedBooking {
  itemType: "movie" | "event";
  itemId: string;
  showtimeId: string;
  title: string;
  seats: string[];
  tierQty: Record<string, number>;
  abandonedAt: number;
}

const KEY = "showtime.abandoned";

export function saveAbandoned(booking: AbandonedBooking) {
  try {
    localStorage.setItem(KEY, JSON.stringify(booking));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function loadAbandoned(): AbandonedBooking | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AbandonedBooking) : null;
  } catch {
    return null;
  }
}

export function clearAbandoned() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
