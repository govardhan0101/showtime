import { useBooking } from "../context/BookingContext";

// A presenter control, deliberately styled as part of the case-study frame
// rather than the product UI: no real user would opt into a worse checkout,
// so this is labelled as a demo comparison device, not a setting.
export default function DemoModeBar() {
  const { state, dispatch } = useBooking();
  return (
    <div className="demo-bar">
      <span className="demo-bar-label">
        Case-study demo — compare checkout experiences
      </span>
      <div className="demo-seg" title="Presenter control: flips the prototype between the improved (Fail-Safe) experience and the classic one it replaces. Not part of the product UI.">
        <button
          className={state.failSafe ? "active" : ""}
          onClick={() => dispatch({ type: "SET_FAILSAFE", on: true })}
        >
          Improved
        </button>
        <button
          className={!state.failSafe ? "active" : ""}
          onClick={() => dispatch({ type: "SET_FAILSAFE", on: false })}
        >
          Classic
        </button>
      </div>
    </div>
  );
}
