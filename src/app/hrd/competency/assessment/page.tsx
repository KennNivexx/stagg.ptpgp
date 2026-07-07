import { supabaseAdmin } from "@/lib/supabase";
import AssessmentClient from "./AssessmentClient";

export default async function AsesmenKompetensi() {
  const { data: employees } = await supabaseAdmin.from("employees").select("id, full_name").neq("status", "Inactive");

  const { data: employeeSkills } = await supabaseAdmin.from("employee_skills")
    .select("id, employee_id, skill_id, current_level, assessed_by, updated_at")
    .order("updated_at", { ascending: false });

  const { data: skills } = await supabaseAdmin.from("skills").select("id, name, category");

  const skillMap = new Map<string, { name: string; category: string }>();
  (skills || []).forEach(s => skillMap.set(s.id, { name: s.name, category: s.category }));

  const empIds = [...new Set((employeeSkills || []).map(e => (e as Record<string, unknown>).employee_id as string))];
  const empMap = new Map<string, { name: string; dept: string; pos: string }>();
  if (empIds.length > 0) {
    const { data: emps } = await supabaseAdmin.from("employees")
      .select("id, full_name, department, position")
      .in("id", empIds);
    (emps || []).forEach(e => {
      const r = e as Record<string, unknown>;
      empMap.set(r.id as string, { name: r.full_name as string, dept: r.department as string || "", pos: r.position as string || "" });
    });
  }

  const { data: posSkills } = await supabaseAdmin.from("position_skills").select("position_code, skill_id, required_level");
  const posSkillMap = new Map<string, number>();
  (posSkills || []).forEach(p => {
    const r = p as Record<string, unknown>;
    const key = `${r.position_code}_${r.skill_id}`;
    posSkillMap.set(key, Number(r.required_level));
  });

  const rows = (employeeSkills || []).map(es => {
    const r = es as Record<string, unknown>;
    const empId = r.employee_id as string;
    const skillId = r.skill_id as string;
    const emp = empMap.get(empId) || { name: "Unknown", dept: "", pos: "" };
    const skill = skillMap.get(skillId) || { name: skillId, category: "" };
    const currentLevel = Number(r.current_level);
    const empPos = emp.pos;
    const reqKey = `${empPos}_${skillId}`;
    const requiredLevel = posSkillMap.has(reqKey) ? posSkillMap.get(reqKey)! : null;
    const gap = requiredLevel !== null ? currentLevel - requiredLevel : null;

    return {
      id: r.id as string,
      employee_id: empId,
      employee_name: emp.name,
      department: emp.dept,
      position: emp.pos,
      skill_name: skill.name,
      skill_category: skill.category,
      current_level: currentLevel,
      required_level: requiredLevel,
      gap,
      assessed_by: r.assessed_by as string || "",
      updated_at: r.updated_at as string,
    };
  });

  return <AssessmentClient data={rows} totalEmployees={(employees || []).length} />;
}
