import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { getCases, getCaseCategories } from "@/app/actions/employee-relations";
import CaseClient from "@/components/hrd/CaseClient";

export default async function EthicsPage() {
  await requireRole("hrd", "superadmin");
  const [rows, categories, { data: employees }] = await Promise.all([
    getCases("Ethics Violation"),
    getCaseCategories(),
    supabaseAdmin.from("karyawan").select("id, full_name, kode_jabatan, nik, department, position").neq("status", "Inactive").order("full_name"),
  ]);
  return (
    <CaseClient
      type="Ethics Violation" title="Ethics Violation" description="Pelanggaran kode etik perusahaan."
      initialRows={rows as never} categories={categories as never} employees={employees || []}
    />
  );
}
