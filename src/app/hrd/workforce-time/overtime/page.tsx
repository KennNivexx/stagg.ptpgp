import { Clock3, ClipboardList } from "lucide-react";
import HubTabs from "@/components/hrd/HubTabs";
import LemburClient from "./LemburClient";
import TimesheetPage from "../timesheet/page";

export const dynamic = "force-dynamic";
// Hub page for "Lembur & Timesheet" — merges the former separate
// /hrd/workforce-time/overtime and /hrd/workforce-time/timesheet routes into
// one page with tabs (see src/components/hrd/HubTabs.tsx). Neither tab does
// server-side data fetching (both are self-contained client components that
// fetch via useEffect), so this hub needs no await — the original overtime
// page logic was extracted verbatim into LemburClient so the hub itself can
// stay a Server Component; TimesheetPage is embedded directly untouched. The
// original route files remain intact for anyone navigating to them directly.
export default function LemburPage() {
  return (
    <div className="p-6 lg:p-8">
      <HubTabs
        tabs={[
          { id: "overtime", label: "Lembur", icon: <Clock3 size={14} />, content: <LemburClient /> },
          { id: "timesheet", label: "Timesheet", icon: <ClipboardList size={14} />, content: <TimesheetPage /> },
        ]}
        defaultTab="overtime"
      />
    </div>
  );
}
