import { Users, ClipboardList, Grid3x3, ShieldAlert, Star, UserCheck, BarChart3, Crown } from "lucide-react";
import HubTabs, { type HubTab } from "@/components/hrd/HubTabs";

import HRDSuccession from "../../succession/page";
import PosisiKritis from "../../succession/positions/page";
import KandidatSuksesor from "../../succession/candidates/page";
import TalentPoolSuksesi from "../../succession/talentpool/page";
import PenilaianKesiapan from "../../succession/readiness/page";
import TalentPoolPage from "./pool/page";
import TalentReviewPage from "./review/page";
import NineBoxPage from "../9-box/page";
import LeadershipPipelinePage from "./leadership-pipeline/page";

import { safeTab } from "@/lib/hub-safe";
export const dynamic = "force-dynamic";
// Hub page merging "Talent & Suksesi" routes (career/talent/* and
// succession/*) into a single tabbed page. Each tab embeds the original
// route's own async Server Component output unchanged.
export default async function TalentSuccessionHubPage() {
  // succession/talentpool/page.tsx reads an optional `dept` filter from
  // searchParams; supply an empty resolved value so it renders unfiltered
  // by default here (its own route still supports the query filter).
  const emptySearchParams = Promise.resolve({} as { dept?: string });

  const tabs: HubTab[] = [
    { id: "overview", label: "Succession Overview", icon: <Crown size={14} />, content: await safeTab(() => HRDSuccession(), "Succession Overview") },
    { id: "pool", label: "Talent Pool", icon: <Users size={14} />, content: await safeTab(() => TalentPoolPage(), "Talent Pool") },
    { id: "review", label: "Talent Review", icon: <ClipboardList size={14} />, content: await safeTab(() => TalentReviewPage(), "Talent Review") },
    { id: "9-box", label: "9-Box Matrix", icon: <Grid3x3 size={14} />, content: await safeTab(() => NineBoxPage(), "9-Box Matrix") },
    { id: "positions", label: "Posisi Kritis", icon: <ShieldAlert size={14} />, content: await safeTab(() => PosisiKritis(), "Posisi Kritis") },
    { id: "candidates", label: "Kandidat Suksesor", icon: <Star size={14} />, content: await safeTab(() => KandidatSuksesor(), "Kandidat Suksesor") },
    { id: "talentpool-suksesi", label: "Pool Suksesi", icon: <UserCheck size={14} />, content: await safeTab(() => TalentPoolSuksesi({ searchParams: emptySearchParams }), "Pool Suksesi") },
    { id: "readiness", label: "Penilaian Kesiapan", icon: <BarChart3 size={14} />, content: await safeTab(() => PenilaianKesiapan(), "Penilaian Kesiapan") },
    { id: "leadership-pipeline", label: "Leadership Pipeline", icon: <Crown size={14} />, content: await safeTab(() => LeadershipPipelinePage(), "Leadership Pipeline") },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1A2530] mb-2 flex items-center gap-3">
          <Users className="text-fuchsia-600" />
          Talent & Suksesi
        </h1>
        <p className="text-sm text-gray-500">
          Kelola talent pool, matriks 9-box, posisi kritis, kandidat suksesor, dan penilaian kesiapan dalam satu tempat.
        </p>
      </div>
      <HubTabs tabs={tabs} defaultTab="overview" />
    </div>
  );
}
