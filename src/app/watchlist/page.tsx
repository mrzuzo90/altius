import type { Metadata } from "next";
import { WatchlistDashboard } from "@/components/watchlist/watchlist-dashboard";

export const metadata: Metadata = {
  title: "Mis acciones favoritas",
  description: "Lista personal de acciones con precios objetivo y avisos dentro de Altius.",
};

export default function WatchlistPage() {
  return <WatchlistDashboard />;
}
