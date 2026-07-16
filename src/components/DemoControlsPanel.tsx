export type DemoOutcome = "success" | "failure" | "timeout" | null;

interface Props {
  armed: DemoOutcome;
  onArm: (outcome: DemoOutcome) => void;
  open: boolean;
  onToggle: (open: boolean) => void;
}

// Presenter-only panel: pre-arms the outcome of the next "Pay" tap so a live
// demo never depends on random chance.
export default function DemoControlsPanel({ armed, onArm, open, onToggle }: Props) {
  return (
    <>
      {open && (
        <div className="demo-panel">
          <h4>Demo Controls</h4>
          <button
            className={armed === "success" ? "armed" : ""}
            onClick={() => onArm(armed === "success" ? null : "success")}
          >
            Simulate Success {armed === "success" && "✓"}
          </button>
          <button
            className={armed === "failure" ? "armed" : ""}
            onClick={() => onArm(armed === "failure" ? null : "failure")}
          >
            Simulate Failure {armed === "failure" && "✓"}
          </button>
          <button
            className={armed === "timeout" ? "armed" : ""}
            onClick={() => onArm(armed === "timeout" ? null : "timeout")}
          >
            Simulate Timeout {armed === "timeout" && "✓"}
          </button>
          <p className="note">
            Arms the outcome of the next "Pay" tap. If nothing is armed, payment
            resolves organically (~30% simulated failure).
          </p>
        </div>
      )}
      <button
        className="demo-gear"
        onClick={() => onToggle(!open)}
        aria-label="Demo controls"
        title="Demo controls"
      >
        ⚙️
      </button>
    </>
  );
}
