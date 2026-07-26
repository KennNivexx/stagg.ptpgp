import { DoorOpen, ClipboardList, FileText } from "lucide-react";
import HubTabs, { type HubTab } from "@/components/hrd/HubTabs";
import MeetingRoomsPage from "./rooms/page";
import AttendancePage from "./attendance/page";
import MinutesPage from "./minutes/page";

export const dynamic = "force-dynamic";

// Merged hub: composes the 3 previously-missing "Tata Kelola Rapat" forms
// (SOP-SDM-09 Pengendalian Ruang Meeting, FR-PR-MRE-06-02 Daftar Hadir,
// FR-PR-MRE-06-03 Notulen Rapat) into one landing page, since the source
// SOP documents treat Daftar Hadir and Notulen Rapat as companion forms
// used across many other procedures (training, 5R socialization, briefing,
// MPP discussions). Each sub-route below still works standalone.
export default async function MeetingGovernanceHub() {
  const tabs: HubTab[] = [
    { id: "rooms", label: "Ruang Meeting", icon: <DoorOpen size={14} />, content: await MeetingRoomsPage() },
    { id: "attendance", label: "Daftar Hadir", icon: <ClipboardList size={14} />, content: await AttendancePage() },
    { id: "minutes", label: "Notulen Rapat", icon: <FileText size={14} />, content: await MinutesPage() },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Tata Kelola Rapat</h1>
        <p className="text-sm text-gray-500">
          Pengendalian ruang meeting, daftar hadir digital, dan notulen rapat dalam satu tempat.
        </p>
      </div>
      <HubTabs tabs={tabs} defaultTab="rooms" />
    </div>
  );
}
