import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import JobDescJobSpecClient from "./JobDescJobSpecClient";

export const dynamic = "force-dynamic";

interface JobDescRow {
  id: string; title: string; position: string; department: string;
  responsibilities: string[]; requirements: string[];
}
interface JobSpecRow {
  id: string; title: string; position: string; department: string;
  education: string; experience: string; skills: string[]; certifications: string[];
}

export default async function DeptJobDescPage() {
  const user = await requireRole("department_manager", "superadmin");

  let department: string | null = null;
  if (user.role === "department_manager") {
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("department")
      .eq("email", user.email)
      .maybeSingle();
    department = (emp as { department?: string } | null)?.department || null;
  }

  const [{ data: descs }, { data: specs }] = await Promise.all([
    department
      ? supabaseAdmin.from("job_descriptions").select("*").eq("department", department).order("position", { ascending: true })
      : Promise.resolve({ data: [] as JobDescRow[] }),
    department
      ? supabaseAdmin.from("job_specifications").select("*").eq("department", department)
      : Promise.resolve({ data: [] as JobSpecRow[] }),
  ]);

  const jobDescs = ((descs || []) as JobDescRow[]).map(d => ({ ...d, title: d.title || "" }));
  const jobSpecs = ((specs || []) as JobSpecRow[]).map(d => ({ ...d, title: d.title || "" }));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-pgp-navy mb-1">Deskripsi & Spesifikasi Pekerjaan</h1>
        <p className="text-sm text-gray-500">{department || "Departemen Anda"}</p>
      </div>

      <JobDescJobSpecClient jobDescs={jobDescs} jobSpecs={jobSpecs} />
    </div>
  );
}
