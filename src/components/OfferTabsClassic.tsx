import { useState } from "react";
import { offers } from "../data/offers";

interface Props {
  subtotal: number;
  appliedId: string | null;
  onApply: (id: string | null) => void;
}

const TABS: Array<{ key: "credit" | "debit" | "recommended"; label: string }> = [
  { key: "credit", label: "Credit Card" },
  { key: "debit", label: "Debit Card" },
  { key: "recommended", label: "Recommended" },
];

// Fail-Safe OFF ("classic"): the same offers split across three tabs, with no
// signal of which one is best — deliberately reproduces the researched friction.
export default function OfferTabsClassic({ subtotal, appliedId, onApply }: Props) {
  const [tab, setTab] = useState<"credit" | "debit" | "recommended">("credit");
  const visible = offers.filter((o) => o.tab === tab);

  return (
    <div>
      <h3 style={{ fontSize: "0.95rem", margin: "18px 0 10px" }}>Offers</h3>
      <div className="offer-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`offer-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {visible.length === 0 && (
        <div className="empty-tab-note">No offers in this category.</div>
      )}
      {visible.map((offer) => {
        const value = offer.discount(subtotal);
        const applied = appliedId === offer.id;
        return (
          <div key={offer.id} className={`offer-item ${applied ? "applied" : ""}`}>
            <div>
              <div className="offer-title">{offer.title}</div>
              <div className="offer-sub">{offer.detail}</div>
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
