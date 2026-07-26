import { CheckCircle2, TrendingUp, RefreshCw, DollarSign, Crown, Users2 } from "lucide-react";
import HubTabs, { type HubTab } from "@/components/hrd/HubTabs";

import PromotionApprovalPage from "./promotion/page";
import MutationApprovalPage from "./mutation/page";
import SalaryApprovalPage from "./salary/page";
import SuccessionApprovalPage from "./succession/page";
import CareerCommitteePage from "./committee/page";

import { safeTab } from "@/lib/hub-safe";
export const dynamic = "force-dynamic";
// Hub page merging the 5 "Approval Karier" routes into a single tabbed
// page. Each tab embeds the original route's own async Server Component
// output unchanged.
export default async function CareerApprovalHubPage() {
  const tabs: HubTab[] = [
    { id: "promotion", label: "Promotion Approval", icon: <TrendingUp size={14} />, content: await safeTab(() => PromotionApprovalPage(), "Promotion Approval") },
    { id: "mutation", label: "Mutation Approval", icon: <RefreshCw size={14} />, content: await safeTab(() => MutationApprovalPage(), "Mutation Approval") },
    { id: "salary", label: "Salary Approval", icon: <DollarSign size={14} />, content: await safeTab(() => SalaryApprovalPage(), "Salary Approval") },
    { id: "succession", label: "Succession Approval", icon: <Crown size={14} />, content: await safeTab(() => SuccessionApprovalPage(), "Succession Approval") },
    { id: "committee", label: "Career Committee", icon: <Users2 size={14} />, content: await safeTab(() => CareerCommitteePage(), "Career Committee") },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1A2530] mb-2 flex items-center gap-3">
          <CheckCircle2 className="text-fuchsia-600" />
          Approval Karier
        </h1>
        <p className="text-sm text-gray-500">
          Persetujuan berjenjang untuk transaksi promosi, mutasi, salary review, suksesi, dan tinjauan komite karier.
        </p>
      </div>
      <HubTabs tabs={tabs} defaultTab="promotion" />
    </div>
  );
}
