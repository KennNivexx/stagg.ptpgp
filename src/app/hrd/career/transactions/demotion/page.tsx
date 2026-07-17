import { supabaseAdmin } from "@/lib/supabase";
import { getCareerTransactions } from "@/app/actions/career-development";
import CareerTransactionClient from "@/components/hrd/CareerTransactionClient";

export default async function TransactionDemotionPage() {
  const [rows, { data: employees }, { data: jabatanList }] = await Promise.all([
    getCareerTransactions("Demotion"),
    supabaseAdmin.from("karyawan").select("id, full_name").neq("status", "Inactive").order("full_name"),
    supabaseAdmin.from("jabatan").select("id, name, department").order("name"),
  ]);
  return (
    <CareerTransactionClient
      type="Demotion" title="Demosi" description="Penurunan jabatan karyawan."
      initialRows={rows as never} employees={employees || []} jabatanList={jabatanList || []}
    />
  );
}
