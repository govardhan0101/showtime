import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import { parseRequest, type AgentProposal } from "../data/agentParser";
import { inr } from "../data/pricing";

interface Msg {
  role: "user" | "agent";
  text: string;
  chips?: string[];
  proposal?: AgentProposal;
}

const OPENING: Msg = {
  role: "agent",
  text:
    "Hi! Tell me what you'd like to book, in your own words — I'll find it, hold seats for you, and take you straight to one editable confirmation screen.",
};

const SUGGESTIONS = [
  "Book 2 recliner seats for Mortal Kombat 2 tonight",
  "3 tickets for Dhamaal 4, afternoon show",
  "2 VIP tickets for Guns N' Roses",
];

export default function Agent() {
  const { dispatch } = useBooking();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([OPENING]);
  const [input, setInput] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  const submit = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setInput("");
    const result = parseRequest(text);
    setMessages((prev) => {
      const next: Msg[] = [...prev, { role: "user", text }];
      if (result.clarify) {
        next.push({
          role: "agent",
          text: result.clarify.question,
          chips: result.clarify.suggestions,
        });
      } else if (result.proposal) {
        const p = result.proposal;
        // Deck behaviour: the hold is placed the moment a confident match is
        // found — not after the conversation ends — so seats aren't lost to
        // chat latency.
        dispatch({ type: "START_BOOKING", itemType: p.itemType, itemId: p.itemId, showtimeId: p.showtimeId });
        if (p.itemType === "movie") {
          dispatch({ type: "SET_SEATS", seats: p.seats });
        } else {
          for (const [tierId, qty] of Object.entries(p.tierQty)) {
            dispatch({ type: "SET_TIER_QTY", tierId, qty });
          }
        }
        dispatch({ type: "START_HOLD" });
        dispatch({ type: "SET_RECOVERY_MESSAGE", message: null });
        next.push({
          role: "agent",
          text:
            `Found it — ${p.title}, ${p.venue}, ${p.timeLabel} · ` +
            `${p.count} × ${p.tierName} (${p.seatsLabel}) · ${inr(p.total)} incl. the ₹35 fee. ` +
            `I'm already holding ${p.itemType === "movie" ? "these seats" : "these tickets"} for 5 minutes.`,
          proposal: p,
        });
      }
      return next;
    });
  };

  const submitRef = useRef(submit);
  submitRef.current = submit;

  // Lets the guided Demo Tour drive this screen with a sample request.
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<string>).detail === "agent-demo") {
        submitRef.current(SUGGESTIONS[0]);
      }
    };
    window.addEventListener("showtime-tour", handler);
    return () => window.removeEventListener("showtime-tour", handler);
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="page agent-page">
      <div className="section-title">
        Ask ShowTime
        <span className="agent-flag">Conversational booking · simulated</span>
      </div>
      <div className="agent-thread" ref={threadRef}>
        {messages.map((m, i) => (
          <div key={i} className={`agent-msg ${m.role}`}>
            <div className="bubble">
              {m.text}
              {m.chips && (
                <div className="agent-chips">
                  {m.chips.map((c) => (
                    <button key={c} onClick={() => submit(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
              {m.proposal && i === messages.length - 1 && (
                <div className="agent-actions">
                  <button
                    className="agent-confirm"
                    onClick={() =>
                      navigate(`/book/${m.proposal!.itemType}/${m.proposal!.itemId}/checkout`)
                    }
                  >
                    Looks right — take me to checkout
                  </button>
                  <button
                    className="agent-change"
                    onClick={() =>
                      setMessages((prev) => [
                        ...prev,
                        { role: "agent", text: "No problem — tell me what to change." },
                      ])
                    }
                  >
                    Change something
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="agent-suggestions">
        {messages.length === 1 &&
          SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => submit(s)}>
              {s}
            </button>
          ))}
      </div>
      <form
        className="agent-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <input
          className="agent-input"
          placeholder="e.g. Book 2 recliner seats for Alpha tonight"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="agent-send" disabled={!input.trim()}>
          Send
        </button>
      </form>
      <p className="agent-note">
        Simulated agent — keyword matching over the seed catalogue, no real AI or
        network calls. Payment always stays in the normal checkout flow.
      </p>
    </div>
  );
}
