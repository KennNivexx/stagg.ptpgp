import { Database, TrendingUp, BarChart3, Award, FileText, Users, RefreshCw, Crown, Layers, Sigma, ShieldCheck } from "lucide-react";
import HubTabs, { type HubTab } from "@/components/hrd/HubTabs";

import CareerFrameworkPage from "./framework/page";
import CareerStreamPage from "./stream/page";
import CareerLevelPage from "./level/page";
import PromotionPolicyPage from "./promotion-policy/page";
import MutationPolicyPage from "./mutation-policy/page";
import RotationPolicyPage from "./rotation-policy/page";
import SuccessionPolicyPage from "./succession-policy/page";
import LeadershipFrameworkPage from "./leadership-framework/page";
import TalentClassificationPage from "./talent-classification/page";
import CareerScoreFormulaPage from "./score-formula/page";
import CareerReadinessRulesPage from "./readiness-rules/page";

import { safeTab } from "@/lib/hub-safe";
export const dynamic = "force-dynamic";
// Hub page merging the 11 "Master Kebijakan Karier" routes into a single
// tabbed page. Each tab's content is the original page's own async Server
// Component output — none of the original routes/logic were modified, they
// simply stopped being individually linked from the top nav.
export default async function CareerMasterHubPage() {
  const tabs: HubTab[] = [
    { id: "framework", label: "Career Framework", icon: <Database size={14} />, content: await safeTab(() => CareerFrameworkPage(), "Career Framework") },
    { id: "stream", label: "Career Stream", icon: <TrendingUp size={14} />, content: await safeTab(() => CareerStreamPage(), "Career Stream") },
    { id: "level", label: "Career Level", icon: <BarChart3 size={14} />, content: await safeTab(() => CareerLevelPage(), "Career Level") },
    { id: "promotion-policy", label: "Promotion Policy", icon: <FileText size={14} />, content: await safeTab(() => PromotionPolicyPage(), "Promotion Policy") },
    { id: "mutation-policy", label: "Mutation Policy", icon: <RefreshCw size={14} />, content: await safeTab(() => MutationPolicyPage(), "Mutation Policy") },
    { id: "rotation-policy", label: "Rotation Policy", icon: <Layers size={14} />, content: await safeTab(() => RotationPolicyPage(), "Rotation Policy") },
    { id: "succession-policy", label: "Succession Policy", icon: <Crown size={14} />, content: await safeTab(() => SuccessionPolicyPage(), "Succession Policy") },
    { id: "leadership-framework", label: "Leadership Framework", icon: <ShieldCheck size={14} />, content: await safeTab(() => LeadershipFrameworkPage(), "Leadership Framework") },
    { id: "talent-classification", label: "Talent Classification", icon: <Users size={14} />, content: await safeTab(() => TalentClassificationPage(), "Talent Classification") },
    { id: "score-formula", label: "Career Score Formula", icon: <Sigma size={14} />, content: await safeTab(() => CareerScoreFormulaPage(), "Career Score Formula") },
    { id: "readiness-rules", label: "Career Readiness Rules", icon: <Award size={14} />, content: await safeTab(() => CareerReadinessRulesPage(), "Career Readiness Rules") },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1A2530] mb-2 flex items-center gap-3">
          <Database className="text-fuchsia-600" />
          Master Kebijakan Karier
        </h1>
        <p className="text-sm text-gray-500">
          Konfigurasi aturan dasar, jalur, jenjang, dan kebijakan yang menjadi pondasi (Single Source of Truth) untuk modul Pengembangan Karir & Manajemen Suksesi.
        </p>
      </div>
      <HubTabs tabs={tabs} defaultTab="framework" />
    </div>
  );
}
