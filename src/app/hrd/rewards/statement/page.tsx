import { supabaseAdmin } from "@/lib/supabase";
import { FileText, Percent } from "lucide-react";
import StatementClient from "./StatementClient";
import HubTabs from "@/components/hrd/HubTabs";
import TaxConfigPage from "../tax/page";
import { safeTab } from "@/lib/hub-safe";

export const dynamic = "force-dynamic";
async function StatementTabContent() {
  const { data: employees } = await supabaseAdmin
    .from("karyawan").select("id, full_name, department, position").neq("status", "Inactive").order("full_name").limit(200);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Total Rewards Statement</h1>
        <p className="text-sm text-gray-500">Ringkasan seluruh nilai kompensasi yang diterima karyawan dalam satu tahun — gaji, tunjangan, bonus, dan insentif.</p>
      </div>
      <StatementClient employees={(employees || []) as Array<{ id: string; full_name: string; department: string; position: string }>} />
    </div>
  );
}

// Hub page for "Total Rewards & Pajak" — merges the former separate
// /hrd/rewards/statement and /tax routes into one page with tabs (see
// src/components/hrd/HubTabs.tsx). TaxConfigPage is itself a self-contained
// client component with no route props, so it can be embedded directly
// without an await. The original route files remain intact for anyone
// navigating to them directly.
export default async function TotalRewardsStatementPage() {
  const statementContent = await safeTab(() => StatementTabContent(), "Total Rewards Statement");

  return (
    <div className="p-6 lg:p-8">
      <HubTabs
        tabs={[
          { id: "statement", label: "Total Rewards Statement", icon: <FileText size={14} />, content: statementContent },
          { id: "tax", label: "Konfigurasi PPh 21", icon: <Percent size={14} />, content: <TaxConfigPage /> },
        ]}
        defaultTab="statement"
      />
    </div>
  );
}
