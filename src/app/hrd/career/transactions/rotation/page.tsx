import { supabaseAdmin } from "@/lib/supabase";
import { getCareerTransactions } from "@/app/actions/career-development";
import CareerTransactionClient from "@/components/hrd/CareerTransactionClient";

export default async function TransactionRotationPage() {
  const [rows, { data: employees }, { data: jabatanList }] = await Promise.all([
    getCareerTransactions("Rotation"),
    supabaseAdmin.from("karyawan").select("id, full_name, kode_jabatan, nik, department, position").neq("status", "Inactive").order("full_name"),
    supabaseAdmin.from("jabatan").select("id, name, department").order("name"),
  ]);
  return (
    <CareerTransactionClient
      type="Rotation" title="Rotasi" description="Perpindahan karyawan ke jabatan setara pada unit lain."
      initialRows={rows as never} employees={employees || []} jabatanList={jabatanList || []}
    />
  );
}
