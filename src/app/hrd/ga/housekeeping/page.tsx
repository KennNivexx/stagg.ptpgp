import { ClipboardCheck, Sparkles, AlertOctagon } from "lucide-react";
import { getChecklistKebersihan, getAudit5R, getNCReports } from "@/app/actions/ga-housekeeping";
import HubTabs from "@/components/hrd/HubTabs";
import ChecklistTab from "./ChecklistTab";
import Audit5RTab from "./Audit5RTab";
import NCTab from "./NCTab";

export default async function HousekeepingPage() {
  const [checklist, audits, ncReports] = await Promise.all([
    getChecklistKebersihan(), getAudit5R(), getNCReports(),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Housekeeping & 5R</h1>
        <p className="text-sm text-gray-500 mt-1">Checklist kebersihan harian, audit 5R, dan laporan ketidaksesuaian (PR-SDM-08).</p>
      </div>
      <HubTabs
        tabs={[
          { id: "checklist", label: "Checklist Kebersihan", icon: <ClipboardCheck size={14} />, content: <ChecklistTab initialChecklist={checklist} /> },
          { id: "audit5r", label: "Audit 5R", icon: <Sparkles size={14} />, content: <Audit5RTab initialAudits={audits} /> },
          { id: "nc", label: "Laporan Ketidaksesuaian", icon: <AlertOctagon size={14} />, content: <NCTab initialAudits={audits} initialReports={ncReports} /> },
        ]}
      />
    </div>
  );
}
