import { tierForRow } from "./movies";
import { eventTiers } from "./events";
import type { BookingState } from "../context/BookingContext";

export function seatPrice(seatId: string) {
  return tierForRow(seatId[0]).price;
}

export function bookingSubtotal(state: BookingState): number {
  if (state.itemType === "movie") {
    return state.seats.reduce((sum, s) => sum + seatPrice(s), 0);
  }
  return eventTiers.reduce(
    (sum, t) => sum + (state.tierQty[t.id] ?? 0) * t.price,
    0
  );
}

export function seatsLabel(state: BookingState): string {
  if (state.itemType === "movie") return state.seats.join(", ");
  return eventTiers
    .filter((t) => (state.tierQty[t.id] ?? 0) > 0)
    .map((t) => `${t.name} × ${state.tierQty[t.id]}`)
    .join(", ");
}

export function ticketCount(state: BookingState): number {
  if (state.itemType === "movie") return state.seats.length;
  return Object.values(state.tierQty).reduce((a, b) => a + b, 0);
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
