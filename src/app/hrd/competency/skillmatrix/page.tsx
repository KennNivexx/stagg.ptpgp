import { supabaseAdmin } from "@/lib/supabase";
import SkillMatrixClient from "./SkillMatrixClient";

type Employee = {
  id: string;
  full_name: string;
  department: string;
  position: string;
};

type Skill = {
  id: string;
  name: string;
  category: string;
};

type EmployeeSkill = {
  employee_id: string;
  skill_id: string;
  current_level: number;
};

type PositionSkill = {
  position_code: string;
  skill_id: string;
  required_level: number;
};

export default async function SkillMatrixPage() {
  const [empRes, skillRes, empSkillRes, posSkillRes] = await Promise.all([
    supabaseAdmin.from("employees").select("id, full_name, department, position").order("full_name", { ascending: true }),
    supabaseAdmin.from("skills").select("id, name, category").order("name", { ascending: true }),
    supabaseAdmin.from("employee_skills").select("employee_id, skill_id, current_level"),
    supabaseAdmin.from("position_skills").select("position_code, skill_id, required_level"),
  ]);

  const employees: Employee[] = (empRes.data as Employee[]) || [];
  const skills: Skill[] = (skillRes.data as Skill[]) || [];
  const employeeSkills: EmployeeSkill[] = (empSkillRes.data as EmployeeSkill[]) || [];
  const positionSkills: PositionSkill[] = (posSkillRes.data as PositionSkill[]) || [];

  const empSkillMap: Record<string, Record<string, number>> = {};
  for (const es of employeeSkills) {
    if (!empSkillMap[es.employee_id]) empSkillMap[es.employee_id] = {};
    empSkillMap[es.employee_id][es.skill_id] = es.current_level;
  }

  const posSkillMap: Record<string, Record<string, number>> = {};
  for (const ps of positionSkills) {
    if (!posSkillMap[ps.position_code]) posSkillMap[ps.position_code] = {};
    posSkillMap[ps.position_code][ps.skill_id] = ps.required_level;
  }

  type CellData = {
    empId: string;
    skillId: string;
    current: number | null;
    required: number | null;
    gap: number | null;
  };

  const cells: CellData[] = [];
  for (const emp of employees) {
    for (const skill of skills) {
      const current = empSkillMap[emp.id]?.[skill.id] ?? null;
      const required = posSkillMap[emp.position]?.[skill.id] ?? null;
      const gap = current !== null && required !== null ? current - required : null;
      cells.push({ empId: emp.id, skillId: skill.id, current, required, gap });
    }
  }

  return (
    <SkillMatrixClient
      employees={employees.map((e) => ({
        id: e.id,
        fullName: e.full_name,
        department: e.department,
        position: e.position,
      }))}
      skills={skills.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
      }))}
      cells={cells}
    />
  );
}
