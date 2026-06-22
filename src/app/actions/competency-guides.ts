"use server";

import { requireRole } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase";
import { getMyDept } from "@/app/actions/department";

export type LevelGuide = {
  id?: string;
  skill_id: string;
  department: string;
  level: number;
  title: string;
  description: string;
  indicators: string;
  example: string;
};

export async function saveAllSkillLevelGuides(formData: FormData) {
  await requireRole("hrd", "superadmin");

  const skill_id = (formData.get("skill_id") as string || "").trim();
  const department = "";

  if (!skill_id) return { error: "Kompetensi wajib dipilih." };

  const records: Omit<LevelGuide, "id">[] = [];
  for (let level = 1; level <= 5; level++) {
    const title = (formData.get(`level_${level}_title`) as string || "").trim();
    const description = (formData.get(`level_${level}_description`) as string || "").trim();
    const indicators = (formData.get(`level_${level}_indicators`) as string || "").trim();
    const example = (formData.get(`level_${level}_example`) as string || "").trim();
    records.push({ skill_id, department, level, title, description, indicators, example });
  }

  const { error } = await supabaseAdmin
    .from("skill_level_guides")
    .upsert(records, { onConflict: "skill_id,department,level" });

  if (error) {
    if ((error as unknown as Record<string, unknown>)?.code === "42P01") {
      return { error: "Jalankan migrasi SQL 20260622001 terlebih dahulu." };
    }
    return { error: error.message };
  }
  return { success: true };
}

export async function getSkillLevelGuides(skillId: string, department?: string): Promise<LevelGuide[]> {
  await requireRole("hrd", "superadmin", "department_manager", "employee");

  const query = supabaseAdmin
    .from("skill_level_guides")
    .select("*")
    .eq("skill_id", skillId)
    .order("level");

  if (department !== undefined) {
    // Dept-specific overrides the general guide (''), fallback to general
    (query as unknown as { or: (s: string) => unknown }).or(`department.eq.${department},department.eq.`);
  }

  const { data, error } = await query;
  if (error?.code === "42P01") return [];
  return (data || []) as LevelGuide[];
}

// Returns guides indexed by level for easy lookup
export async function getSkillGuidesMap(skillId: string): Promise<Record<number, LevelGuide>> {
  await requireRole("hrd", "superadmin", "department_manager", "employee");

  const { data } = await supabaseAdmin
    .from("skill_level_guides")
    .select("*")
    .eq("skill_id", skillId)
    .order("level");

  const map: Record<number, LevelGuide> = {};
  for (const row of (data || []) as LevelGuide[]) {
    if (!map[row.level]) map[row.level] = row;
  }
  return map;
}

// Ambil semua panduan untuk banyak skill sekaligus (efisien untuk halaman dept)
// Return: { [skill_id]: { [level]: LevelGuide } }
export async function getAllSkillGuidesMap(
  skillIds: string[]
): Promise<Record<string, Record<number, LevelGuide>>> {
  if (skillIds.length === 0) return {};

  const { data } = await supabaseAdmin
    .from("skill_level_guides")
    .select("*")
    .in("skill_id", skillIds)
    .order("level");

  const map: Record<string, Record<number, LevelGuide>> = {};
  for (const row of (data || []) as LevelGuide[]) {
    if (!map[row.skill_id]) map[row.skill_id] = {};
    if (!map[row.skill_id][row.level]) map[row.skill_id][row.level] = row;
  }
  return map;
}

// Kepala departemen tambah kompetensi untuk dept mereka sendiri
export async function addDeptSkill(formData: FormData) {
  const { dept } = await getMyDept();
  if (!dept) return { error: "Departemen tidak ditemukan." };

  // Allow dept manager or higher
  await requireRole("department_manager", "superadmin", "hrd");

  const name = (formData.get("name") as string || "").trim();
  const category = (formData.get("category") as string || "Teknis").trim();

  if (!name) return { error: "Nama kompetensi wajib diisi." };

  // Check duplicate per dept
  const { data: existing } = await supabaseAdmin
    .from("skills")
    .select("id")
    .eq("name", name)
    .eq("department", dept)
    .maybeSingle();

  if (existing) return { error: "Kompetensi dengan nama ini sudah ada untuk departemen Anda." };

  const { error } = await supabaseAdmin
    .from("skills")
    .insert({ id: crypto.randomUUID(), name, category, department: dept });

  if (error) return { error: error.message };
  return { success: true };
}
