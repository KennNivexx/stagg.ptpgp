import { supabaseAdmin } from "@/lib/supabase";
import GapAnalysisClient from "./GapAnalysisClient";

type Employee = {
  id: string;
  full_name: string;
  department: string;
  position: string;
  formasi_id: string | null;
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
  jabatan_id: string | null;
};

type GapRow = {
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  skillId: string;
  skillName: string;
  skillCategory: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
};

export default async function GapAnalysisPage() {
  const [empRes, skillRes, empSkillRes, posSkillRes, formasiRes] = await Promise.all([
    supabaseAdmin
      .from("karyawan")
      .select("id, full_name, department, position, formasi_id")
      .neq("status", "Inactive")
      .order("full_name", { ascending: true }),
    supabaseAdmin
      .from("master_kompetensi")
      .select("id, name, category")
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("kompetensi_karyawan")
      .select("employee_id, skill_id, current_level"),
    supabaseAdmin
      .from("kompetensi_jabatan")
      .select("position_code, skill_id, required_level, jabatan_id"),
    // Employee Assignment chain: karyawan.formasi_id -> formasi_jabatan.jabatan_id
    // -> kompetensi_jabatan (via jabatan_id) — the actual "competency follows
    // the position" resolution. position_code text-match below is now only a
    // fallback for employees not yet assigned via Position Management.
    supabaseAdmin.from("formasi_jabatan").select("id, jabatan_id"),
  ]);

  const employees: Employee[] = (empRes.data as Employee[]) || [];
  const skills: Skill[] = (skillRes.data as Skill[]) || [];
  const employeeSkills: EmployeeSkill[] =
    (empSkillRes.data as EmployeeSkill[]) || [];
  const positionSkills: PositionSkill[] =
    (posSkillRes.data as PositionSkill[]) || [];
  const formasiList = (formasiRes.data as { id: string; jabatan_id: string }[]) || [];
  const formasiToJabatan = new Map(formasiList.map(f => [f.id, f.jabatan_id]));

  const empSkillMap: Record<string, Record<string, number>> = {};
  for (const es of employeeSkills) {
    if (!empSkillMap[es.employee_id]) empSkillMap[es.employee_id] = {};
    empSkillMap[es.employee_id][es.skill_id] = es.current_level;
  }

  const posSkillMap: Record<string, Record<string, number>> = {};
  const jabatanSkillMap: Record<string, Record<string, number>> = {};
  for (const ps of positionSkills) {
    if (!posSkillMap[ps.position_code]) posSkillMap[ps.position_code] = {};
    posSkillMap[ps.position_code][ps.skill_id] = ps.required_level;
    if (ps.jabatan_id) {
      if (!jabatanSkillMap[ps.jabatan_id]) jabatanSkillMap[ps.jabatan_id] = {};
      jabatanSkillMap[ps.jabatan_id][ps.skill_id] = ps.required_level;
    }
  }

  const gapRows: GapRow[] = [];
  for (const emp of employees) {
    const jabatanId = emp.formasi_id ? formasiToJabatan.get(emp.formasi_id) : null;
    for (const skill of skills) {
      const current = empSkillMap[emp.id]?.[skill.id] ?? null;
      // Employee Assignment chain first; fall back to legacy position-text
      // match only when the employee has no formasi assignment yet, or that
      // jabatan has no competency requirements defined via jabatan_id.
      const required = (jabatanId ? jabatanSkillMap[jabatanId]?.[skill.id] : undefined)
        ?? posSkillMap[emp.position]?.[skill.id] ?? null;
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
          skillId: skill.id,
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
