import { UserCircle2, ClipboardCheck, Gauge, Lightbulb, ListChecks, FlaskConical, History, LineChart } from "lucide-react";
import HubTabs, { type HubTab } from "@/components/hrd/HubTabs";

import CareerProfilePage from "../profile/page";
import CareerAssessmentPage from "../assessment/page";
import CareerReadinessPage from "../readiness/page";
import CareerRecommendationPage from "../recommendation/page";
import CareerPlansPage from "../plans/page";
import CareerSimulationPage from "../simulation/page";
import CareerHistoryPage from "../history/page";
import CareerAnalyticsPage from "../analytics/page";

export const dynamic = "force-dynamic";
// Hub page merging the 8 "Pengembangan Karier" routes into a single tabbed
// page. Each tab embeds the original route's own async Server Component
// output unchanged — none of the original files were modified.
export default async function CareerDevelopmentHubPage() {
  const tabs: HubTab[] = [
    { id: "profile", label: "Career Profile", icon: <UserCircle2 size={14} />, content: await CareerProfilePage() },
    { id: "assessment", label: "Career Assessment", icon: <ClipboardCheck size={14} />, content: await CareerAssessmentPage() },
    { id: "readiness", label: "Career Readiness", icon: <Gauge size={14} />, content: await CareerReadinessPage() },
    { id: "recommendation", label: "Career Recommendation", icon: <Lightbulb size={14} />, content: await CareerRecommendationPage() },
    { id: "plans", label: "Individual Development Plan", icon: <ListChecks size={14} />, content: await CareerPlansPage() },
    { id: "simulation", label: "Career Simulation", icon: <FlaskConical size={14} />, content: await CareerSimulationPage() },
    { id: "history", label: "Career History", icon: <History size={14} />, content: await CareerHistoryPage() },
    { id: "analytics", label: "Career Analytics", icon: <LineChart size={14} />, content: await CareerAnalyticsPage() },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1A2530] mb-2 flex items-center gap-3">
          <UserCircle2 className="text-fuchsia-600" />
          Pengembangan Karier
        </h1>
        <p className="text-sm text-gray-500">
          Profil, asesmen, kesiapan, rekomendasi, rencana pengembangan individu, simulasi, riwayat, dan analitik karier karyawan.
        </p>
      </div>
      <HubTabs tabs={tabs} defaultTab="profile" />
    </div>
  );
}
