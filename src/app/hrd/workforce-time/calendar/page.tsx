import { CalendarDays, Briefcase } from "lucide-react";
import HubTabs from "@/components/hrd/HubTabs";
import KalenderKerjaClient from "./KalenderKerjaClient";
import PenugasanKerjaPage from "../assignments/page";

export const dynamic = "force-dynamic";
// Hub page for "Kalender & Penugasan Kerja" — merges the former separate
// /hrd/workforce-time/calendar and /hrd/workforce-time/assignments routes
// into one page with tabs (see src/components/hrd/HubTabs.tsx). Neither tab
// does server-side data fetching (both are self-contained client components
// that fetch via useEffect), so this hub needs no await — the original
// calendar page logic was extracted verbatim into KalenderKerjaClient so the
// hub itself can stay a Server Component; PenugasanKerjaPage is embedded
// directly untouched. The original route files remain intact for anyone
// navigating to them directly.
export default function KalenderKerjaPage() {
  return (
    <div className="p-6 lg:p-8">
      <HubTabs
        tabs={[
          { id: "calendar", label: "Kalender Kerja", icon: <CalendarDays size={14} />, content: <KalenderKerjaClient /> },
          { id: "assignments", label: "Penugasan Kerja", icon: <Briefcase size={14} />, content: <PenugasanKerjaPage /> },
        ]}
        defaultTab="calendar"
      />
    </div>
  );
}
