import { CheckCircle2, MessageSquare, Search, ClipboardCheck, Scale, LogOut, XCircle } from "lucide-react";
import HubTabs, { type HubTab } from "@/components/hrd/HubTabs";

import ComplaintApprovalPage from "./complaint/page";
import InvestigationApprovalPage from "./investigation/page";
import CorrectiveActionApprovalPage from "./corrective-action/page";
import IndustrialApprovalPage from "./industrial/page";
import SeparationApprovalPage from "./separation/page";
import CaseClosureApprovalPage from "./case-closure/page";

import { safeTab } from "@/lib/hub-safe";
export const dynamic = "force-dynamic";
// Hub #5 "Approval" — merges the 6 Employee Relations approval routes below
// into a single tabbed page so the top-nav menu only links here. Each
// original page.tsx is left fully intact (still directly reachable at its
// own URL) and is simply invoked and composed as tab content; no business
// logic is duplicated.
export default async function ApprovalHubPage() {
  const tabs: HubTab[] = [
    {
      id: "complaint",
      label: "Complaint Approval",
      icon: <MessageSquare size={14} />,
      content: await safeTab(() => ComplaintApprovalPage(), "Tab"),
    },
    {
      id: "investigation",
      label: "Investigation Approval",
      icon: <Search size={14} />,
      content: await safeTab(() => InvestigationApprovalPage(), "Tab"),
    },
    {
      id: "corrective-action",
      label: "Corrective Action Approval",
      icon: <ClipboardCheck size={14} />,
      content: await safeTab(() => CorrectiveActionApprovalPage(), "Tab"),
    },
    {
      id: "industrial",
      label: "Industrial Relations Approval",
      icon: <Scale size={14} />,
      content: await safeTab(() => IndustrialApprovalPage(), "Tab"),
    },
    {
      id: "separation",
      label: "Separation Approval",
      icon: <LogOut size={14} />,
      content: await safeTab(() => SeparationApprovalPage(), "Tab"),
    },
    {
      id: "case-closure",
      label: "Case Closure Approval",
      icon: <XCircle size={14} />,
      content: await safeTab(() => CaseClosureApprovalPage(), "Tab"),
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-2 bg-rose-100 rounded-xl">
          <CheckCircle2 size={20} className="text-rose-600" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A2530]">Approval</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Semua persetujuan Employee Relations dalam satu tempat — complaint, investigasi, tindakan korektif, hubungan industrial, separasi, dan penutupan kasus.
      </p>

      <HubTabs tabs={tabs} />
    </div>
  );
}
