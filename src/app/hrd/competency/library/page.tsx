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
  id: string;
  position: string;
  skill_id: string;
  required_level: number;
};

export default async function LibraryPage() {
  const [skillRes, posSkillRes, posRes, empRes] = await Promise.all([
    supabaseAdmin.from("skills").select("id, name, category, department").order("category").order("name"),
    supabaseAdmin.from("position_skills").select("id, position, skill_id, required_level"),
    supabaseAdmin.from("positions").select("id, name, department, level").order("name"),
    supabaseAdmin.from("employees").select("department").neq("status", "Inactive"),
  ]);

  // Collect unique departments from employees
  const deptSet = new Set<string>();
  (empRes.data || []).forEach((e) => { if (e.department) deptSet.add(e.department); });
  const departments = Array.from(deptSet).sort();

  return (
    <LibraryClient
      skills={(skillRes.data as Skill[]) || []}
      positionSkills={(posSkillRes.data as PositionSkill[]) || []}
      positions={(posRes.data as Position[]) || []}
      departments={departments}
    />
  );
}
