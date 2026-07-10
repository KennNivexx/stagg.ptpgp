import { supabaseAdmin } from "@/lib/supabase";
import { getBonuses } from "@/app/actions/rewards";
import BonusesClient from "./BonusesClient";

export default async function BonusesPage() {
  const [{ data: employees }, bonuses] = await Promise.all([
    supabaseAdmin.from("karyawan").select("id, full_name, department, position")    .neq("email", "__settings__@ptpgp.co.id")
    .neq("email", "superadmin@ptpgp.co.id").order("full_name").limit(200),
    getBonuses().catch(() => []),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <BonusesClient
        employees={(employees || []) as Array<{ id: string; full_name: string; department: string; position: string; }>}
        initialBonuses={bonuses as Parameters<typeof BonusesClient>[0]["initialBonuses"]}
      />
    </div>
  );
}
