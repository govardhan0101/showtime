export interface Movie {
  id: string;
  title: string;
  genre: string;
  language: string;
  duration: string;
  rating: string;
  poster: string;
  synopsis: string;
}

export const movies: Movie[] = [
  { id: "m1", title: "Mortal Kombat 2", genre: "Action", language: "English", duration: "2h 15m", rating: "UA16+",
    poster: "https://placehold.co/300x450/e11d48/ffffff?text=Mortal+Kombat+2",
    synopsis: "The next chapter in the hit fighting-game franchise, bringing new fighters and higher stakes to the tournament." },
  { id: "m2", title: "Michael", genre: "Drama/Biopic", language: "English", duration: "2h 45m", rating: "UA13+",
    poster: "https://placehold.co/300x450/e11d48/ffffff?text=Michael",
    synopsis: "A biographical drama tracing a legendary music icon's rise, reinvention, and legacy." },
  { id: "m3", title: "The Mummy", genre: "Horror/Adventure", language: "English", duration: "1h 58m", rating: "UA16+",
    poster: "https://placehold.co/300x450/e11d48/ffffff?text=The+Mummy",
    synopsis: "A fresh reimagining of the classic horror-adventure, following an ancient curse awakened in the modern day." },
  { id: "m4", title: "Dhamaal 4", genre: "Comedy", language: "Hindi", duration: "2h 20m", rating: "U",
    poster: "https://placehold.co/300x450/e11d48/ffffff?text=Dhamaal+4",
    synopsis: "The chaotic treasure-hunting comedy franchise returns with a brand-new heist and an even bigger cast of misfits." },
  { id: "m5", title: "Alpha", genre: "Thriller", language: "Hindi", duration: "2h 10m", rating: "UA16+",
    poster: "https://placehold.co/300x450/e11d48/ffffff?text=Alpha",
    synopsis: "A high-stakes espionage thriller following an operative unraveling a conspiracy that reaches the top." },
  { id: "m6", title: "The Odyssey", genre: "Adventure/Epic", language: "English", duration: "2h 40m", rating: "UA13+",
    poster: "https://placehold.co/300x450/e11d48/ffffff?text=The+Odyssey",
    synopsis: "An epic retelling of the legendary voyage home, brought to the screen with sweeping scale." },
  { id: "m7", title: "Spider-Man: Brand New Day", genre: "Action/Superhero", language: "English", duration: "2h 25m", rating: "UA13+",
    poster: "https://placehold.co/300x450/e11d48/ffffff?text=Spider-Man",
    synopsis: "Your friendly neighborhood hero faces a new threat that puts everything he's built on the line." },
];

export interface Showtime {
  id: string;
  movieId: string;
  venue: string;
  time: string;
}

export const priceBands = [
  { tier: "Recliner", price: 450, rows: ["A", "B", "C"] },
  { tier: "Gold", price: 280, rows: ["D", "E", "F"] },
  { tier: "Silver", price: 180, rows: ["G", "H"] },
] as const;

const venueTimes: Array<{ venue: string; times: string[] }> = [
  { venue: "PVR: Phoenix Marketcity", times: ["10:30 AM", "2:15 PM", "9:45 PM"] },
  { venue: "INOX: R-City Mall", times: ["11:00 AM", "6:30 PM"] },
];

export const showtimes: Showtime[] = movies.flatMap((m) => {
  let n = 0;
  return venueTimes.flatMap(({ venue, times }) =>
    times.map((time) => ({ id: `${m.id}-s${++n}`, movieId: m.id, venue, time }))
  );
});

export const getMovie = (id: string) => movies.find((m) => m.id === id);
export const getShowtime = (id: string) => showtimes.find((s) => s.id === id);
export const getShowtimesForMovie = (movieId: string) =>
  showtimes.filter((s) => s.movieId === movieId);

export const tierForRow = (row: string) =>
  priceBands.find((b) => (b.rows as readonly string[]).includes(row))!;
