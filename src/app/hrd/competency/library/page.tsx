import { supabaseAdmin } from "@/lib/supabase";
import LibraryClient from "./LibraryClient";

type Skill = {
  id: string;
  name: string;
  category: string;
  created_at?: string;
  updated_at?: string;
};

type Position = {
  id: string;
  name: string;
  department: string;
  level?: string;
};

type PositionSkill = {
  id: string;
  position: string;
  skill_id: string;
  required_level: number;
};

export default async function LibraryPage() {
  const [skillRes, posSkillRes, posRes] = await Promise.all([
    supabaseAdmin.from("skills").select("id, name, category, created_at, updated_at").order("category").order("name"),
    supabaseAdmin.from("position_skills").select("id, position, skill_id, required_level"),
    supabaseAdmin.from("positions").select("id, name, department, level").order("name"),
  ]);

  return (
    <LibraryClient
      skills={(skillRes.data as Skill[]) || []}
      positionSkills={(posSkillRes.data as PositionSkill[]) || []}
      positions={(posRes.data as Position[]) || []}
    />
  );
}
