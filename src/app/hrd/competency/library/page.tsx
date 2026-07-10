import { supabaseAdmin } from "@/lib/supabase";
import LibraryClient from "./LibraryClient";

type Skill = {
  id: string;
  name: string;
  category: string;
  department?: string | null;
};

type Position = {
  id: string;
  name: string;
  department: string;
  level?: string;
};

type PositionSkill = {
  position_code: string;
  skill_id: string;
  required_level: number;
};

export default async function LibraryPage() {
  const [skillRes, posSkillRes, posRes] = await Promise.all([
    supabaseAdmin.from("master_kompetensi").select("id, name, category, department").order("category").order("name"),
    supabaseAdmin.from("kompetensi_jabatan").select("position_code, skill_id, required_level"),
    supabaseAdmin.from("jabatan").select("id, name, department, level").order("name"),
  ]);

  return (
    <LibraryClient
      skills={(skillRes.data as Skill[]) || []}
      positionSkills={(posSkillRes.data as PositionSkill[]) || []}
      positions={(posRes.data as Position[]) || []}
    />
  );
}
