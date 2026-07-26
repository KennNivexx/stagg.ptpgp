import { Clock, Wrench } from "lucide-react";
import HubTabs from "@/components/hrd/HubTabs";
import AttendanceClient from "./AttendanceClient";
import KoreksiAbsensiPage from "../workforce-time/corrections/page";

export const dynamic = "force-dynamic";

// Hub page for "Absensi & Koreksi" — merges the former separate
// /hrd/attendance and /hrd/workforce-time/corrections routes into one page
// with tabs (see src/components/hrd/HubTabs.tsx). Neither tab does
// server-side data fetching (both are self-contained client components that
// fetch via useEffect), so this hub needs no await — the original attendance
// page logic was extracted verbatim into AttendanceClient so the hub itself
// can stay a Server Component; KoreksiAbsensiPage is embedded directly
// untouched. The original route files remain intact for anyone navigating to
// them directly.
export default function AttendancePage() {
  return (
    <div className="p-6 lg:p-8">
      <HubTabs
        tabs={[
          { id: "attendance", label: "Absensi", icon: <Clock size={14} />, content: <AttendanceClient /> },
          { id: "corrections", label: "Koreksi Absensi", icon: <Wrench size={14} />, content: <KoreksiAbsensiPage /> },
        ]}
        defaultTab="attendance"
      />
    </div>
  );
}
