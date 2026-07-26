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
    { id: "overview", label: "Succession Overview", icon: <Crown size={14} />, content: await HRDSuccession() },
    { id: "pool", label: "Talent Pool", icon: <Users size={14} />, content: await TalentPoolPage() },
    { id: "review", label: "Talent Review", icon: <ClipboardList size={14} />, content: await TalentReviewPage() },
    { id: "9-box", label: "9-Box Matrix", icon: <Grid3x3 size={14} />, content: await NineBoxPage() },
    { id: "positions", label: "Posisi Kritis", icon: <ShieldAlert size={14} />, content: await PosisiKritis() },
    { id: "candidates", label: "Kandidat Suksesor", icon: <Star size={14} />, content: await KandidatSuksesor() },
    { id: "talentpool-suksesi", label: "Pool Suksesi", icon: <UserCheck size={14} />, content: await TalentPoolSuksesi({ searchParams: emptySearchParams }) },
    { id: "readiness", label: "Penilaian Kesiapan", icon: <BarChart3 size={14} />, content: await PenilaianKesiapan() },
    { id: "leadership-pipeline", label: "Leadership Pipeline", icon: <Crown size={14} />, content: await LeadershipPipelinePage() },
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
