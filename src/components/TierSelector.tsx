import { eventTiers } from "../data/events";

const MAX_TOTAL = 10;

interface Props {
  tierQty: Record<string, number>;
  onChange: (tierId: string, qty: number) => void;
}

export default function TierSelector({ tierQty, onChange }: Props) {
  const totalQty = Object.values(tierQty).reduce((a, b) => a + b, 0);

  return (
    <div>
      {eventTiers.map((tier) => {
        const qty = tierQty[tier.id] ?? 0;
        return (
          <div className="tier-card" key={tier.id}>
            <div>
              <h3>{tier.name}</h3>
              <div className="price">₹{tier.price.toLocaleString("en-IN")} per ticket</div>
            </div>
            <div className="stepper">
              <button
                disabled={qty === 0}
                onClick={() => onChange(tier.id, qty - 1)}
                aria-label={`Remove ${tier.name} ticket`}
              >
                −
              </button>
              <span className="qty">{qty}</span>
              <button
                disabled={totalQty >= MAX_TOTAL}
                onClick={() => onChange(tier.id, qty + 1)}
                aria-label={`Add ${tier.name} ticket`}
              >
                +
              </button>
            </div>
          </div>
        );
      })}
      <p style={{ fontSize: "0.72rem", color: "var(--slate-light)" }}>
        Max {MAX_TOTAL} tickets per booking.
      </p>
    </div>
  );
}
