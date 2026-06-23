import { supabaseAdmin } from "@/lib/supabase";
import GapAnalysisClient from "./GapAnalysisClient";

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

type GapRow = {
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  skillName: string;
  skillCategory: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
};

export default async function GapAnalysisPage() {
  const [empRes, skillRes, empSkillRes, posSkillRes] = await Promise.all([
    supabaseAdmin
      .from("employees")
      .select("id, full_name, department, position")
      .neq("status", "Inactive")
      .order("full_name", { ascending: true }),
    supabaseAdmin
      .from("skills")
      .select("id, name, category")
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("employee_skills")
      .select("employee_id, skill_id, current_level"),
    supabaseAdmin
      .from("position_skills")
      .select("position_code, skill_id, required_level"),
  ]);

  const employees: Employee[] = (empRes.data as Employee[]) || [];
  const skills: Skill[] = (skillRes.data as Skill[]) || [];
  const employeeSkills: EmployeeSkill[] =
    (empSkillRes.data as EmployeeSkill[]) || [];
  const positionSkills: PositionSkill[] =
    (posSkillRes.data as PositionSkill[]) || [];

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

  const gapRows: GapRow[] = [];
  for (const emp of employees) {
    for (const skill of skills) {
      const current = empSkillMap[emp.id]?.[skill.id] ?? null;
      const required = posSkillMap[emp.position]?.[skill.id] ?? null;
      // Skip if no required standard set for this position-skill combo
      if (required === null) continue;
      const effectiveCurrent = current ?? 0;
      const gap = effectiveCurrent - required;
      if (gap < 0) {
        gapRows.push({
          employeeId: emp.id,
          employeeName: emp.full_name,
          department: emp.department,
          position: emp.position,
          skillName: skill.name,
          skillCategory: skill.category,
          currentLevel: effectiveCurrent,
          requiredLevel: required,
          gap,
        });
      }
    }
  }

  gapRows.sort(
    (a, b) => a.gap - b.gap || a.employeeName.localeCompare(b.employeeName),
  );

  return (
    <GapAnalysisClient
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
      gapRows={gapRows}
    />
  );
}
