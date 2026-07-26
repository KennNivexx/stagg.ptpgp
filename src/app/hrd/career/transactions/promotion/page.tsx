import { supabaseAdmin } from "@/lib/supabase";
import { getCareerTransactions } from "@/app/actions/career-development";
import CareerTransactionClient from "@/components/hrd/CareerTransactionClient";

export default async function TransactionPromotionPage() {
  const [rows, { data: employees }, { data: jabatanList }] = await Promise.all([
    getCareerTransactions("Promotion"),
    supabaseAdmin.from("karyawan").select("id, full_name, kode_jabatan, nik, department, position").neq("status", "Inactive").order("full_name"),
    supabaseAdmin.from("jabatan").select("id, name, department").order("name"),
  ]);
  return (
    <CareerTransactionClient
      type="Promotion" title="Promosi" description="Pengajuan kenaikan jabatan karyawan."
      initialRows={rows as never} employees={employees || []} jabatanList={jabatanList || []}
    />
  );
}
