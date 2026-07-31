import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import SkillMatrixClient from "./SkillMatrixClient";

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

export default async function SkillMatrixPage() {
  await requireRole("hrd", "superadmin");
  const [empRes, skillRes, empSkillRes, posSkillRes, formasiRes] = await Promise.all([
    supabaseAdmin.from("karyawan").select("id, full_name, department, position, formasi_id").neq("status", "Inactive").order("full_name", { ascending: true }),
    supabaseAdmin.from("master_kompetensi").select("id, name, category").order("name", { ascending: true }),
    supabaseAdmin.from("kompetensi_karyawan").select("employee_id, skill_id, current_level"),
    supabaseAdmin.from("kompetensi_jabatan").select("position_code, skill_id, required_level, jabatan_id"),
    supabaseAdmin.from("formasi_jabatan").select("id, jabatan_id"),
  ]);

  const employees: Employee[] = (empRes.data as Employee[]) || [];
  const skills: Skill[] = (skillRes.data as Skill[]) || [];
  const employeeSkills: EmployeeSkill[] = (empSkillRes.data as EmployeeSkill[]) || [];
  const positionSkills: PositionSkill[] = (posSkillRes.data as PositionSkill[]) || [];

  // Employee Assignment chain: karyawan.formasi_id -> formasi_jabatan.jabatan_id
  // -> kompetensi_jabatan (via jabatan_id) — same resolution pattern as Gap
  // Analysis, falling back to legacy position_code text match.
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

  type CellData = {
    empId: string;
    skillId: string;
    current: number | null;
    required: number | null;
    gap: number | null;
  };

  const cells: CellData[] = [];
  for (const emp of employees) {
    const jabatanId = emp.formasi_id ? formasiToJabatan.get(emp.formasi_id) : null;
    for (const skill of skills) {
      const current = empSkillMap[emp.id]?.[skill.id] ?? null;
      const required = (jabatanId ? jabatanSkillMap[jabatanId]?.[skill.id] : undefined) ?? posSkillMap[emp.position]?.[skill.id] ?? null;
      // gap only calculable when both exist; show current even without required
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
