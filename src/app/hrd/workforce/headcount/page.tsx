import { supabaseAdmin } from "@/lib/supabase";
import HeadcountClient from "./HeadcountClient";

export default async function HeadcountPlanning() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, department, status")
    .neq("id", "__settings__");

  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("id, name, headcount")
    .order("name");

  const deptList = (departments || []).length > 0
    ? (departments as Record<string, unknown>[]).map((d) => ({
        name: d.name as string,
        id: d.id as string,
        planned: Number(d.headcount) || 0,
      }))
    : [...new Set((employees || []).map((e: Record<string, unknown>) => e.department as string))]
        .filter(Boolean)
        .map((name) => ({ name, id: name, planned: 0 }));

  const headcountData = deptList.map((dept) => {
    const current = (employees || []).filter((e: Record<string, unknown>) =>
      e.department === dept.name && e.status !== "Inactive"
    ).length;
    return {
      id: dept.id,
      name: dept.name,
      current,
      // auto-fill headcount = current if not manually set
      approved: dept.planned > 0 ? dept.planned : current,
    };
  }).sort((a, b) => b.current - a.current || a.name.localeCompare(b.name));

  return (
    <HeadcountClient initialData={headcountData} />
  );
}
