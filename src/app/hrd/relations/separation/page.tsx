import { LogOut, Clock, FileX, UserX, MessageCircleQuestion, BarChart3 } from "lucide-react";
import HubTabs, { type HubTab } from "@/components/hrd/HubTabs";
import ResignationsPage from "../resignations/page";
import RetirementPage from "./retirement/page";
import EndOfContractPage from "./end-of-contract/page";
import TerminationPage from "./termination/page";
import ExitInterviewPage from "./exit-interview/page";
import SeparationAnalyticsPage from "./analytics/page";

import { safeTab } from "@/lib/hub-safe";
export const dynamic = "force-dynamic";
export default async function SeparationHubPage() {
  const tabs: HubTab[] = [
    { id: "resignations", label: "Resignations", icon: <LogOut size={14} />, content: await safeTab(() => ResignationsPage(), "Resignations") },
    { id: "retirement", label: "Retirement", icon: <Clock size={14} />, content: await safeTab(() => RetirementPage(), "Retirement") },
    { id: "end-of-contract", label: "End of Contract", icon: <FileX size={14} />, content: await safeTab(() => EndOfContractPage(), "End of Contract") },
    { id: "termination", label: "Termination", icon: <UserX size={14} />, content: await safeTab(() => TerminationPage(), "Termination") },
    { id: "exit-interview", label: "Exit Interview", icon: <MessageCircleQuestion size={14} />, content: await safeTab(() => ExitInterviewPage(), "Exit Interview") },
    { id: "analytics", label: "Separation Analytics", icon: <BarChart3 size={14} />, content: await safeTab(() => SeparationAnalyticsPage(), "Separation Analytics") },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Separation</h1>
        <p className="text-sm text-gray-500">
          Kelola seluruh proses pemisahan hubungan kerja — resignation, retirement, end of contract, termination, exit interview, dan analitiknya.
        </p>
      </div>
      <HubTabs tabs={tabs} defaultTab="resignations" />
    </div>
  );
}
