import { supabaseAdmin } from "@/lib/supabase";
import { getCases, getCaseCategories } from "@/app/actions/employee-relations";
import CaseClient from "@/components/hrd/CaseClient";

export default async function WhistleblowingPage() {
  const [rows, categories, { data: employees }] = await Promise.all([
    getCases("Whistleblowing"),
    getCaseCategories(),
    supabaseAdmin.from("karyawan").select("id, full_name, kode_jabatan, nik, department, position").neq("status", "Inactive").order("full_name"),
  ]);
  return (
    <CaseClient
      type="Whistleblowing" title="Whistleblowing" description="Pelaporan pelanggaran secara rahasia, dapat dilakukan anonim."
      initialRows={rows as never} categories={categories as never} employees={employees || []}
    />
  );
}
