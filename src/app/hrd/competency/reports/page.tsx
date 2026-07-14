import { supabaseAdmin } from "@/lib/supabase";
import ReportsClient from "./ReportsClient";

type Employee = { id: string; full_name: string; department: string; position: string; formasi_id: string | null };
type Skill = { id: string; name: string; category: string };
type EmployeeSkill = { employee_id: string; skill_id: string; current_level: number };
type PositionSkill = { position_code: string; skill_id: string; required_level: number; jabatan_id: string | null };

export type MatrixRow = {
  employeeId: string; employeeName: string; department: string; position: string;
  skillId: string; skillName: string; skillCategory: string;
  currentLevel: number | null; requiredLevel: number | null; gap: number | null;
};

export default async function CompetencyReportsPage() {
  const [empRes, skillRes, empSkillRes, posSkillRes, formasiRes] = await Promise.all([
    supabaseAdmin.from("karyawan").select("id, full_name, department, position, formasi_id").neq("status", "Inactive").order("full_name", { ascending: true }),
    supabaseAdmin.from("master_kompetensi").select("id, name, category").order("name", { ascending: true }),
    supabaseAdmin.from("kompetensi_karyawan").select("employee_id, skill_id, current_level"),
    supabaseAdmin.from("kompetensi_jabatan").select("position_code, skill_id, required_level, jabatan_id"),
    // Employee Assignment chain: karyawan.formasi_id -> formasi_jabatan.jabatan_id
    // -> kompetensi_jabatan (via jabatan_id), same resolution as Gap Analysis.
    supabaseAdmin.from("formasi_jabatan").select("id, jabatan_id"),
  ]);

  const employees: Employee[] = (empRes.data as Employee[]) || [];
  const skills: Skill[] = (skillRes.data as Skill[]) || [];
  const employeeSkills: EmployeeSkill[] = (empSkillRes.data as EmployeeSkill[]) || [];
  const positionSkills: PositionSkill[] = (posSkillRes.data as PositionSkill[]) || [];
  const formasiToJabatan = new Map(((formasiRes.data || []) as { id: string; jabatan_id: string }[]).map(f => [f.id, f.jabatan_id]));

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

  const matrixRows: MatrixRow[] = [];
  for (const emp of employees) {
    const jabatanId = emp.formasi_id ? formasiToJabatan.get(emp.formasi_id) : null;
    for (const skill of skills) {
      const currentLevel = empSkillMap[emp.id]?.[skill.id] ?? null;
      const requiredLevel = (jabatanId ? jabatanSkillMap[jabatanId]?.[skill.id] : undefined) ?? posSkillMap[emp.position]?.[skill.id] ?? null;
      if (currentLevel === null && requiredLevel === null) continue;
      const gap = currentLevel !== null && requiredLevel !== null ? currentLevel - requiredLevel : null;
      matrixRows.push({
        employeeId: emp.id, employeeName: emp.full_name, department: emp.department, position: emp.position,
        skillId: skill.id, skillName: skill.name, skillCategory: skill.category,
        currentLevel, requiredLevel, gap,
      });
    }
  }

  const gapRows = matrixRows.filter((r) => r.gap !== null && r.gap < 0).sort((a, b) => (a.gap! - b.gap!) || a.employeeName.localeCompare(b.employeeName));

  const assessedEmployees = new Set(matrixRows.filter((r) => r.currentLevel !== null).map((r) => r.employeeId)).size;
  const withCurrent = matrixRows.filter((r) => r.currentLevel !== null);
  const avgCurrentLevel = withCurrent.length > 0 ? withCurrent.reduce((s, r) => s + (r.currentLevel || 0), 0) / withCurrent.length : 0;
  const withGap = matrixRows.filter((r) => r.gap !== null);
  const pctKompeten = withGap.length > 0 ? (withGap.filter((r) => (r.gap || 0) >= 0).length / withGap.length) * 100 : 0;
  const wajibTraining = matrixRows.filter((r) => r.gap !== null && r.gap <= -2).length;

  return (
    <ReportsClient
      matrixRows={matrixRows}
      gapRows={gapRows}
      totalEmployees={employees.length}
      assessedEmployees={assessedEmployees}
      avgCurrentLevel={avgCurrentLevel}
      pctKompeten={pctKompeten}
      wajibTraining={wajibTraining}
    />
  );
}
