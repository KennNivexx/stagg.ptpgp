import { supabaseAdmin } from "@/lib/supabase";
import { getCases, getCaseCategories } from "@/app/actions/employee-relations";
import CaseClient from "@/components/hrd/CaseClient";

export default async function HarassmentPage() {
  const [rows, categories, { data: employees }] = await Promise.all([
    getCases("Harassment"),
    getCaseCategories(),
    supabaseAdmin.from("karyawan").select("id, full_name, kode_jabatan, nik, department, position").neq("status", "Inactive").order("full_name"),
  ]);
  return (
    <CaseClient
      type="Harassment" title="Harassment & Bullying" description="Pelecehan atau perundungan di tempat kerja."
      initialRows={rows as never} categories={categories as never} employees={employees || []}
    />
  );
}
