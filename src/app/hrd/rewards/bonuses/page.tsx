import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { getBonuses } from "@/app/actions/rewards";
import { Award, Gift, Trophy } from "lucide-react";
import BonusesClient from "./BonusesClient";
import HubTabs from "@/components/hrd/HubTabs";
import IncentivesPage from "../incentives/page";
import AwardsPage from "../awards/page";
import { safeTab } from "@/lib/hub-safe";

export const dynamic = "force-dynamic";
async function BonusesTabContent() {
  const [{ data: employees }, bonuses] = await Promise.all([
    supabaseAdmin.from("karyawan").select("id, full_name, department, position")    .neq("email", "__settings__@ptpgp.co.id")
    .neq("email", "superadmin@ptpgp.co.id").order("full_name").limit(200),
    getBonuses().catch(() => []),
  ]);

  return (
    <BonusesClient
      employees={(employees || []) as Array<{ id: string; full_name: string; department: string; position: string; }>}
      initialBonuses={bonuses as Parameters<typeof BonusesClient>[0]["initialBonuses"]}
    />
  );
}

// Hub page for "Bonus, Insentif & Penghargaan" — merges the former separate
// /hrd/rewards/bonuses, /incentives and /awards routes into one page with
// tabs (see src/components/hrd/HubTabs.tsx). Each tab reuses the original
// page's Server Component output untouched; the original route files remain
// intact for anyone navigating to them directly.
export default async function BonusesPage() {
  await requireRole("hrd", "superadmin", "director");
  const [bonusesContent, incentivesContent, awardsContent] = await Promise.all([
    safeTab(() => BonusesTabContent(), "Bonus"),
    safeTab(() => IncentivesPage(), "Insentif"),
    safeTab(() => AwardsPage(), "Penghargaan"),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <HubTabs
        tabs={[
          { id: "bonuses", label: "Bonus", icon: <Award size={14} />, content: bonusesContent },
          { id: "incentives", label: "Insentif", icon: <Gift size={14} />, content: incentivesContent },
          { id: "awards", label: "Penghargaan", icon: <Trophy size={14} />, content: awardsContent },
        ]}
        defaultTab="bonuses"
      />
    </div>
  );
}
