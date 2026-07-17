import { supabaseAdmin } from "@/lib/supabase";
import { getCases, getCaseCategories } from "@/app/actions/employee-relations";
import CaseClient from "@/components/hrd/CaseClient";

export default async function AllCasesPage() {
  const [rows, categories, { data: employees }] = await Promise.all([
    getCases(),
    getCaseCategories(),
    supabaseAdmin.from("karyawan").select("id, full_name").neq("status", "Inactive").order("full_name"),
  ]);
  return (
    <CaseClient
      type={null} title="Semua Kasus" description="Seluruh kasus hubungan karyawan lintas jenis."
      initialRows={rows as never} categories={categories as never} employees={employees || []} showTypeColumn
    />
  );
}
