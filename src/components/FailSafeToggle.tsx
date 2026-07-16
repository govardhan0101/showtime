import { useBooking } from "../context/BookingContext";

export default function FailSafeToggle() {
  const { state, dispatch } = useBooking();
  return (
    <button
      className={`failsafe-toggle ${state.failSafe ? "on" : ""}`}
      onClick={() => dispatch({ type: "SET_FAILSAFE", on: !state.failSafe })}
      title="Flip between the improved (Fail-Safe) and classic checkout experiences"
    >
      Fail-Safe Checkout: {state.failSafe ? "ON" : "OFF"}
      <span className="pill" />
    </button>
  );
}
