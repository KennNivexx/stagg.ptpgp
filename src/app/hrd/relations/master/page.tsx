import {
  Database, FileText, Scale, Gavel, ShieldCheck, MessageSquare, Tags,
  Search, AlertTriangle, HeartHandshake, ClipboardList, LogOut, Brain,
} from "lucide-react";
import HubTabs, { type HubTab } from "@/components/hrd/HubTabs";

import ERPolicyPage from "./policy/page";
import CompanyRegulationPage from "./company-regulation/page";
import PKBPage from "./pkb/page";
import CodeOfConductPage from "./code-of-conduct/page";
import CommCategoryPage from "./comm-category/page";
import CaseCategoryPage from "./case-category/page";
import InvestigationTypePage from "./investigation-type/page";
import DisciplinaryCategoryPage from "./disciplinary-category/page";
import EngagementProgramPage from "./engagement-program/page";
import SurveyTemplatePage from "./survey-template/page";
import ExitReasonPage from "./exit-reason/page";
import AIRulePage from "./ai-rule/page";

import { safeTab } from "@/lib/hub-safe";
export const dynamic = "force-dynamic";
// Hub #1 "Master Data" — merges the 12 Employee Relations master-data pages
// (each an independent async Server Component fetching its own rows) into a
// single top-nav entry with client-side tab switching. Original page.tsx
// files under each sub-folder stay intact and reachable by direct URL; only
// the top-nav link count is reduced. See src/components/hrd/HubTabs.tsx for
// the shared shell.
export default async function ErMasterDataHub() {
  const tabs: HubTab[] = [
    { id: "policy", label: "Employee Relation Policy", icon: <FileText size={14} />, content: await safeTab(() => ERPolicyPage(), "Employee Relation Policy") },
    { id: "company-regulation", label: "Company Regulation (PP)", icon: <Scale size={14} />, content: await safeTab(() => CompanyRegulationPage(), "Company Regulation (PP)") },
    { id: "pkb", label: "PKB", icon: <Gavel size={14} />, content: await safeTab(() => PKBPage(), "PKB") },
    { id: "code-of-conduct", label: "Code of Conduct", icon: <ShieldCheck size={14} />, content: await safeTab(() => CodeOfConductPage(), "Code of Conduct") },
    { id: "comm-category", label: "Communication Category", icon: <MessageSquare size={14} />, content: await safeTab(() => CommCategoryPage(), "Communication Category") },
    { id: "case-category", label: "Case Category", icon: <Tags size={14} />, content: await safeTab(() => CaseCategoryPage(), "Case Category") },
    { id: "investigation-type", label: "Investigation Type", icon: <Search size={14} />, content: await safeTab(() => InvestigationTypePage(), "Investigation Type") },
    { id: "disciplinary-category", label: "Disciplinary Category", icon: <AlertTriangle size={14} />, content: await safeTab(() => DisciplinaryCategoryPage(), "Disciplinary Category") },
    { id: "engagement-program", label: "Engagement Program", icon: <HeartHandshake size={14} />, content: await safeTab(() => EngagementProgramPage(), "Engagement Program") },
    { id: "survey-template", label: "Survey Template", icon: <ClipboardList size={14} />, content: await safeTab(() => SurveyTemplatePage(), "Survey Template") },
    { id: "exit-reason", label: "Exit Reason", icon: <LogOut size={14} />, content: await safeTab(() => ExitReasonPage(), "Exit Reason") },
    { id: "ai-rule", label: "AI Recommendation Rule", icon: <Brain size={14} />, content: await safeTab(() => AIRulePage(), "AI Recommendation Rule") },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-2 bg-rose-100 rounded-xl">
          <Database size={20} className="text-rose-600" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A2530]">Master Data</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Data master untuk Employee Relations — kebijakan, kategori, dan aturan yang mendasari seluruh modul.
      </p>

      <HubTabs tabs={tabs} />
    </div>
  );
}
