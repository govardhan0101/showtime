export interface Event {
  id: string;
  title: string;
  category: string;
  venue: string;
  date: string;
  poster: string;
  description: string;
}

export const events: Event[] = [
  { id: "e1", title: "Guns N' Roses: India 2026", category: "Concert", venue: "DY Patil Stadium, Mumbai", date: "2026-08-14",
    poster: "https://placehold.co/300x450/1e3a8a/ffffff?text=Guns+N+Roses",
    description: "The legendary rock band brings their world tour to India for one night only." },
  { id: "e2", title: "Foo Fighters: India Tour", category: "Concert", venue: "JLN Stadium, Delhi", date: "2026-09-05",
    poster: "https://placehold.co/300x450/1e3a8a/ffffff?text=Foo+Fighters",
    description: "Grammy-winning rock band Foo Fighters perform live as part of their global tour." },
  { id: "e3", title: "Jasmine Sandlas: Live in Concert", category: "Concert", venue: "Phoenix Arena, Bengaluru", date: "2026-07-26",
    poster: "https://placehold.co/300x450/1e3a8a/ffffff?text=Jasmine+Sandlas",
    description: "Chart-topping Punjabi playback singer Jasmine Sandlas performs her biggest hits live." },
  { id: "e4", title: "Rock On Harris: Live in Concert", category: "Concert", venue: "Palace Grounds, Bengaluru", date: "2026-08-02",
    poster: "https://placehold.co/300x450/1e3a8a/ffffff?text=Rock+On+Harris",
    description: "An evening of high-energy rock performances celebrating three decades of hits." },
  { id: "e5", title: "Allow Me — Rahul Dua Live", category: "Comedy", venue: "Canvas Laugh Club, Mumbai", date: "2026-07-20",
    poster: "https://placehold.co/300x450/047857/ffffff?text=Rahul+Dua",
    description: "Stand-up comedian Rahul Dua brings his acclaimed new hour, 'Allow Me,' to the stage." },
];

export interface EventTier {
  id: string;
  name: string;
  price: number;
}

export const eventTiers: EventTier[] = [
  { id: "general", name: "General", price: 1499 },
  { id: "fanpit", name: "Fan Pit", price: 2999 },
  { id: "vip", name: "VIP", price: 5999 },
];

export const getEvent = (id: string) => events.find((e) => e.id === id);

export const formatEventDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
