import { supabaseAdmin } from "@/lib/supabase";

// Resolves which department a department_manager session is head of. Tries
// karyawan.email first (a manager who is also a real employee record), then
// falls back to pengguna.department (generic per-department login accounts
// like finance@ptpgp.co.id that have no matching karyawan row).
export async function resolveManagerDepartment(email: string): Promise<string | null> {
  const { data: emp } = await supabaseAdmin
    .from("karyawan")
    .select("department")
    .eq("email", email)
    .maybeSingle();
  const deptFromKaryawan = (emp as { department?: string } | null)?.department;
  if (deptFromKaryawan) return deptFromKaryawan;

  const { data: usr } = await supabaseAdmin
    .from("pengguna")
    .select("department")
    .eq("email", email)
    .maybeSingle();
  return (usr as { department?: string } | null)?.department || null;
}
