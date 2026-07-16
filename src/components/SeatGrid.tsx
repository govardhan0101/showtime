import { useMemo } from "react";
import { generateSeatMap } from "../data/seatMapGenerator";
import { priceBands } from "../data/movies";

const MAX_SEATS = 8;

interface Props {
  showtimeId: string;
  selected: string[];
  onChange: (seats: string[]) => void;
}

export default function SeatGrid({ showtimeId, selected, onChange }: Props) {
  const grid = useMemo(() => generateSeatMap(showtimeId), [showtimeId]);

  const toggle = (seatId: string) => {
    if (selected.includes(seatId)) {
      onChange(selected.filter((s) => s !== seatId));
    } else if (selected.length < MAX_SEATS) {
      onChange([...selected, seatId]);
    }
  };

  let lastTier = "";
  return (
    <div className="seat-grid">
      <div className="screen-arc">SCREEN THIS WAY</div>
      {grid.map((row) => {
        const tierHeading =
          row[0].tier !== lastTier ? (
            <div className="seat-tier-label" key={`t-${row[0].tier}`}>
              {row[0].tier} — ₹{row[0].price}
            </div>
          ) : null;
        lastTier = row[0].tier;
        return (
          <div key={row[0].row}>
            {tierHeading}
            <div className="seat-row">
              <span className="row-label">{row[0].row}</span>
              {row.map((seat) => (
                <button
                  key={seat.id}
                  className={`seat ${seat.sold ? "sold" : ""} ${
                    selected.includes(seat.id) ? "selected" : ""
                  }`}
                  disabled={seat.sold}
                  onClick={() => toggle(seat.id)}
                  aria-label={`Seat ${seat.id} ${seat.sold ? "sold" : ""}`}
                >
                  {seat.num}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <div className="seat-legend">
        <span>
          <span className="swatch" /> Available
        </span>
        <span>
          <span className="swatch selected" /> Selected
        </span>
        <span>
          <span className="swatch sold" /> Sold
        </span>
      </div>
      <div className="seat-legend" style={{ marginTop: -8 }}>
        {priceBands.map((b) => (
          <span key={b.tier}>
            {b.tier} ₹{b.price}
          </span>
        ))}
      </div>
    </div>
  );
}
