export interface Offer {
  id: string;
  title: string;
  detail: string;
  // Which classic tab this offer lives under when Fail-Safe is OFF
  tab: "credit" | "debit" | "recommended";
  recommended?: boolean;
  discount: (subtotal: number) => number;
}

export const offers: Offer[] = [
  {
    id: "o1",
    title: "10% off up to ₹150 — HDFC Bank Cards",
    detail: "Applies to your saved HDFC credit card",
    tab: "credit",
    recommended: true,
    discount: (s) => Math.min(150, Math.round(s * 0.1)),
  },
  {
    id: "o2",
    title: "Flat ₹75 off — ICICI Debit Cards",
    detail: "On orders above ₹300",
    tab: "debit",
    discount: (s) => (s > 300 ? 75 : 0),
  },
  {
    id: "o3",
    title: "₹100 off — Amazon Pay UPI",
    detail: "On orders above ₹999",
    tab: "recommended",
    discount: (s) => (s > 999 ? 100 : 0),
  },
  {
    id: "o4",
    title: "Flat ₹50 off — SBI Credit Cards",
    detail: "No minimum order value",
    tab: "credit",
    discount: () => 50,
  },
];

export const CONVENIENCE_FEE = 35;

export const getOffer = (id: string | null) =>
  id ? offers.find((o) => o.id === id) ?? null : null;
