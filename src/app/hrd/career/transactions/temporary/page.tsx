import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { getCareerTransactions } from "@/app/actions/career-development";
import CareerTransactionClient from "@/components/hrd/CareerTransactionClient";

export default async function TransactionTemporaryPage() {
  await requireRole("hrd", "superadmin");
  const [rows, { data: employees }, { data: jabatanList }] = await Promise.all([
    getCareerTransactions("Temporary Assignment"),
    supabaseAdmin.from("karyawan").select("id, full_name, kode_jabatan, nik, department, position").neq("status", "Inactive").order("full_name"),
    supabaseAdmin.from("jabatan").select("id, name, department").order("name"),
  ]);
  return (
    <CareerTransactionClient
      type="Temporary Assignment" title="Temporary Assignment" description="Penugasan sementara jangka pendek."
      initialRows={rows as never} employees={employees || []} jabatanList={jabatanList || []}
    />
  );
}
