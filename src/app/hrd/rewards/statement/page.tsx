import { supabaseAdmin } from "@/lib/supabase";
import StatementClient from "./StatementClient";

export default async function TotalRewardsStatementPage() {
  const { data: employees } = await supabaseAdmin
    .from("karyawan").select("id, full_name, department, position").neq("status", "Inactive").order("full_name").limit(200);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Total Rewards Statement</h1>
        <p className="text-sm text-gray-500">Ringkasan seluruh nilai kompensasi yang diterima karyawan dalam satu tahun — gaji, tunjangan, bonus, dan insentif.</p>
      </div>
      <StatementClient employees={(employees || []) as Array<{ id: string; full_name: string; department: string; position: string }>} />
    </div>
  );
}
