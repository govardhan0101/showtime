/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

export const HOLD_DURATION_MS = 5 * 60 * 1000; // 5-minute seat hold

export interface ConfirmedBooking {
  bookingId: string;
  itemType: "movie" | "event";
  itemId: string;
  title: string;
  poster: string;
  venue: string;
  when: string; // showtime or event date, human readable
  seatsLabel: string; // "A4, A5" or "General x2, VIP x1"
  total: number;
  bookedAt: number;
}

export interface BookingState {
  failSafe: boolean;
  itemType: "movie" | "event" | null;
  itemId: string | null;
  showtimeId: string | null;
  seats: string[]; // movie seat ids
  tierQty: Record<string, number>; // event tier id -> qty
  holdStart: number | null; // epoch ms when hold began
  offerId: string | null;
  recoveryMessage: string | null; // shown on seat selection after auto-recovery
  lastBooking: ConfirmedBooking | null;
}

type Action =
  | { type: "SET_FAILSAFE"; on: boolean }
  | { type: "START_BOOKING"; itemType: "movie" | "event"; itemId: string; showtimeId: string }
  | { type: "SET_SEATS"; seats: string[] }
  | { type: "SET_TIER_QTY"; tierId: string; qty: number }
  | { type: "START_HOLD" }
  | { type: "APPLY_OFFER"; offerId: string | null }
  | { type: "SET_RECOVERY_MESSAGE"; message: string | null }
  | { type: "CONFIRM_BOOKING"; booking: ConfirmedBooking }
  | { type: "RESET_FLOW" };

const FAILSAFE_KEY = "showtime.failSafe";
const TICKETS_KEY = "showtime.tickets";

function loadFailSafe(): boolean {
  try {
    const raw = localStorage.getItem(FAILSAFE_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

export function loadTickets(): ConfirmedBooking[] {
  try {
    return JSON.parse(localStorage.getItem(TICKETS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveTicket(booking: ConfirmedBooking) {
  const tickets = loadTickets();
  if (!tickets.some((t) => t.bookingId === booking.bookingId)) {
    tickets.unshift(booking);
    try {
      localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
    } catch {
      /* storage unavailable — ignore */
    }
  }
}

const initialState: BookingState = {
  failSafe: loadFailSafe(),
  itemType: null,
  itemId: null,
  showtimeId: null,
  seats: [],
  tierQty: {},
  holdStart: null,
  offerId: null,
  recoveryMessage: null,
  lastBooking: null,
};

function reducer(state: BookingState, action: Action): BookingState {
  switch (action.type) {
    case "SET_FAILSAFE":
      try {
        localStorage.setItem(FAILSAFE_KEY, String(action.on));
      } catch {
        /* ignore */
      }
      return { ...state, failSafe: action.on };
    case "START_BOOKING": {
      const sameShow =
        state.itemId === action.itemId && state.showtimeId === action.showtimeId;
      return {
        ...state,
        itemType: action.itemType,
        itemId: action.itemId,
        showtimeId: action.showtimeId,
        // keep selection if the user is re-entering the same showtime (recovery path)
        seats: sameShow ? state.seats : [],
        tierQty: sameShow ? state.tierQty : {},
        offerId: sameShow ? state.offerId : null,
      };
    }
    case "SET_SEATS":
      return { ...state, seats: action.seats };
    case "SET_TIER_QTY":
      return {
        ...state,
        tierQty: { ...state.tierQty, [action.tierId]: action.qty },
      };
    case "START_HOLD":
      return { ...state, holdStart: Date.now() };
    case "APPLY_OFFER":
      return { ...state, offerId: action.offerId };
    case "SET_RECOVERY_MESSAGE":
      return { ...state, recoveryMessage: action.message };
    case "CONFIRM_BOOKING":
      // Only record the booking here — clearing the selection immediately
      // would trip the Payment page's empty-booking guard before the route
      // transition to Confirmation commits. Confirmation resets the flow.
      saveTicket(action.booking);
      return { ...state, lastBooking: action.booking };
    case "RESET_FLOW":
      return {
        ...state,
        itemType: null,
        itemId: null,
        showtimeId: null,
        seats: [],
        tierQty: {},
        holdStart: null,
        offerId: null,
        recoveryMessage: null,
      };
    default:
      return state;
  }
}

const BookingContext = createContext<{
  state: BookingState;
  dispatch: Dispatch<Action>;
} | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <BookingContext.Provider value={{ state, dispatch }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
