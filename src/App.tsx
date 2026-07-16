import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Disclaimer from "./components/Disclaimer";
import Home from "./pages/Home";
import MoviesListing from "./pages/MoviesListing";
import EventsListing from "./pages/EventsListing";
import MovieDetail from "./pages/MovieDetail";
import EventDetail from "./pages/EventDetail";
import SeatSelection from "./pages/SeatSelection";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import MyTickets from "./pages/MyTickets";

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<MoviesListing />} />
        <Route path="/movies/:movieId" element={<MovieDetail />} />
        <Route path="/events" element={<EventsListing />} />
        <Route path="/events/:eventId" element={<EventDetail />} />
        <Route path="/book/:itemType/:itemId/showtime/:showtimeId" element={<SeatSelection />} />
        <Route path="/book/:itemType/:itemId/checkout" element={<Checkout />} />
        <Route path="/book/:itemType/:itemId/payment" element={<Payment />} />
        <Route path="/book/:itemType/:itemId/confirmation" element={<Confirmation />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Disclaimer />
    </div>
  );
}
