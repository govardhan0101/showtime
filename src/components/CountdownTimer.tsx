import { useEffect, useRef, useState } from "react";
import { HOLD_DURATION_MS } from "../context/BookingContext";

interface Props {
  holdStart: number;
  onExpire?: () => void;
}

export default function CountdownTimer({ holdStart, onExpire }: Props) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, holdStart + HOLD_DURATION_MS - Date.now())
  );
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    expiredRef.current = false;
    const tick = () => {
      const left = Math.max(0, holdStart + HOLD_DURATION_MS - Date.now());
      setRemaining(left);
      if (left === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [holdStart]);

  const totalSec = Math.ceil(remaining / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const cls = totalSec <= 30 ? "danger" : totalSec <= 120 ? "warn" : "";

  return (
    <div className={`countdown ${cls}`} role="timer" aria-live="polite">
      <span>Seats held for</span>
      <span className="time">
        {mm}:{ss}
      </span>
    </div>
  );
}
