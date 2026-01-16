
import CalendarHeader from "./components/CalendarHeader";
import UpcomingEvents from "./components/UpcomingEvents";
import PlanCard from "./components/PlanCard";
import BottomNav from "./components/BottomNav";

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto px-4 pb-24">
        <div className="pt-4">
          <CalendarHeader />
        </div>

        <div className="mt-4">
          <UpcomingEvents />
        </div>

        {}
        <div className="mt-4">
          <PlanCard />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
