import { offers } from "../data/offers";

interface Props {
  subtotal: number;
  appliedId: string | null;
  onApply: (id: string | null) => void;
}

// Fail-Safe ON: one sorted list, best ("Recommended for you") offer on top,
// one tap to apply or remove.
export default function OfferListUnified({ subtotal, appliedId, onApply }: Props) {
  const sorted = [...offers].sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    return b.discount(subtotal) - a.discount(subtotal);
  });

  return (
    <div>
      <h3 style={{ fontSize: "0.95rem", margin: "18px 0 10px" }}>Available Offers</h3>
      {sorted.map((offer) => {
        const value = offer.discount(subtotal);
        const applied = appliedId === offer.id;
        return (
          <div key={offer.id} className={`offer-item ${applied ? "applied" : ""}`}>
            <div>
              {offer.recommended && <span className="offer-badge">Recommended for you</span>}
              <div className="offer-title">{offer.title}</div>
              <div className="offer-sub">
                {offer.detail}
                {value > 0 ? ` • saves ₹${value}` : " • not applicable to this order"}
              </div>
            </div>
            <button
              className="offer-apply-btn"
              disabled={value === 0}
              onClick={() => onApply(applied ? null : offer.id)}
            >
              {applied ? "Remove" : "Apply"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
