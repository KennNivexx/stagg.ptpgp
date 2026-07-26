import { supabaseAdmin } from "@/lib/supabase";
import { getCases, getCaseCategories } from "@/app/actions/employee-relations";
import CaseClient from "@/components/hrd/CaseClient";

export default async function GrievancePage() {
  const [rows, categories, { data: employees }] = await Promise.all([
    getCases("Grievance"),
    getCaseCategories(),
    supabaseAdmin.from("karyawan").select("id, full_name, kode_jabatan, nik, department, position").neq("status", "Inactive").order("full_name"),
  ]);
  return (
    <CaseClient
      type="Grievance" title="Grievance" description="Keluhan formal karyawan terkait kondisi kerja."
      initialRows={rows as never} categories={categories as never} employees={employees || []}
    />
  );
}
