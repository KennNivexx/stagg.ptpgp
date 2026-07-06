"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";

interface Position {
  id: string;
  code: string;
  name: string;
  department: string;
  level: string;
  created_at?: string;
  updated_at?: string;
}

export interface PositionMonitor extends Position {
  hierCode: string;
  employeeCount: number;
  employeeNames: string[];
  deptHeadName: string;
  deptHeadEmail: string;
}

function uid() { return "pos-" + crypto.randomUUID(); }

export async function getPositions(): Promise<Position[]> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("positions")
    .select("*")
    .order("department", { ascending: true })
    .order("level", { ascending: true })
    .order("name", { ascending: true });
  return (data as Position[]) || [];
}

const LEVEL_RANK: Record<string, number> = {
  "Staff": 1, "Supervisor": 2, "Asisten Manajer": 3,
  "Manager": 4, "Kepala Divisi": 5, "Wakil Direktur": 6, "Direktur": 7,
};

// Compares dot-separated hierarchy codes (e.g. "1.1.2.1.10.0.0" vs
// "1.1.2.1.2.0.0") segment-by-segment as NUMBERS. A plain string compare
// would sort "10" before "2" and scatter positions out of hierarchy order.
function compareCodes(a: string, b: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const as = a.split(".").map(Number);
  const bs = b.split(".").map(Number);
  const len = Math.max(as.length, bs.length);
  for (let i = 0; i < len; i++) {
    const av = as[i] ?? 0;
    const bv = bs[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/**
 * Jabatan (monitor-only): derives every position live from the org
 * structure / employees tables rather than a separately-maintained CRUD
 * list. Positions get lazily upserted into the `positions` table so a
 * code/level record exists once a position name is actually in use — new
 * positions appear automatically when a department/employee references
 * them via Struktur Organisasi or Data Karyawan, never created here.
 *
 * Kode ditampilkan dalam format hierarkis titik (mis. "1.1.1.0.0.0.0"):
 * diturunkan dari kode org_unit departemennya + digit urutan posisi di
 * antara saudara-posisi lain pada departemen yang sama (diisi ke segmen
 * nol pertama setelah kode departemen).
 */
export async function getPositionsMonitor(): Promise<PositionMonitor[]> {
  await requireRole("hrd", "superadmin");

  const [{ data: employees }, { data: orgUnits }, { data: positions }] = await Promise.all([
    supabaseAdmin.from("employees").select("id, full_name, department, position, email").neq("status", "Inactive"),
    supabaseAdmin.from("org_units").select("code, name, leader_name, leader_email"),
    supabaseAdmin.from("positions").select("*"),
  ]);

  const empList = (employees || []) as { id: string; full_name: string; department: string | null; position: string | null; email: string }[];
  const unitList = (orgUnits || []) as { code: string; name: string; leader_name: string | null; leader_email: string | null }[];
  const posList = (positions || []) as Position[];

  const unitByName = new Map(unitList.map(u => [u.name, u]));
  const posByKey = new Map(posList.map(p => [`${p.name}::${p.department}`, p]));

  // Collect distinct (position, department) pairs actually in use.
  const pairs = new Map<string, { name: string; department: string }>();
  empList.forEach(e => {
    if (!e.position) return;
    const dept = e.department || "";
    pairs.set(`${e.position}::${dept}`, { name: e.position, department: dept });
  });
  // Include positions already recorded even if no active employee holds them yet.
  posList.forEach(p => pairs.set(`${p.name}::${p.department}`, { name: p.name, department: p.department }));

  // Group by department to compute sibling order for the hierarchical code.
  const byDept = new Map<string, { name: string; department: string }[]>();
  for (const pair of pairs.values()) {
    const list = byDept.get(pair.department) || [];
    list.push(pair);
    byDept.set(pair.department, list);
  }

  const result: PositionMonitor[] = [];
  const toUpsert: Position[] = [];

  for (const [dept, list] of byDept.entries()) {
    list.sort((a, b) => {
      const pa = posByKey.get(`${a.name}::${a.department}`);
      const pb = posByKey.get(`${b.name}::${b.department}`);
      const la = LEVEL_RANK[pa?.level || ""] || 0;
      const lb = LEVEL_RANK[pb?.level || ""] || 0;
      if (la !== lb) return lb - la; // higher rank first
      return a.name.localeCompare(b.name);
    });

    const unit = unitByName.get(dept);
    const deptSegs = unit ? unit.code.split(".") : [];
    const firstZeroIdx = deptSegs.findIndex(s => Number(s) === 0);

    list.forEach((pair, idx) => {
      const existing = posByKey.get(`${pair.name}::${pair.department}`);
      let hierCode: string;
      if (unit && firstZeroIdx >= 0) {
        const segs = [...deptSegs];
        segs[firstZeroIdx] = String(idx + 1);
        hierCode = segs.join(".");
      } else if (unit) {
        hierCode = `${unit.code}.${idx + 1}`;
      } else {
        hierCode = `0.0.0.0.0.0.${idx + 1}`;
      }

      const emps = empList.filter(e => e.position === pair.name && (e.department || "") === pair.department);

      if (!existing) {
        const newPos: Position = {
          id: uid(), code: hierCode, name: pair.name, department: pair.department,
          level: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        };
        toUpsert.push(newPos);
        result.push({
          ...newPos, hierCode,
          employeeCount: emps.length,
          employeeNames: emps.map(e => e.full_name),
          deptHeadName: unit?.leader_name || "",
          deptHeadEmail: unit?.leader_email || "",
        });
      } else {
        result.push({
          ...existing, hierCode,
          employeeCount: emps.length,
          employeeNames: emps.map(e => e.full_name),
          deptHeadName: unit?.leader_name || "",
          deptHeadEmail: unit?.leader_email || "",
        });
      }
    });
  }

  // Lazily persist newly-discovered positions so future level assignment sticks.
  if (toUpsert.length > 0) {
    await supabaseAdmin.from("positions").upsert(toUpsert, { onConflict: "code" });
  }

  // Group order follows the ORG HIERARCHY (each department's own org-unit
  // code), not alphabetical department names — otherwise "COMMISSIONER" and
  // "Director" get scattered among mid-level departments instead of leading.
  result.sort((a, b) => {
    const deptCodeA = unitByName.get(a.department)?.code || "";
    const deptCodeB = unitByName.get(b.department)?.code || "";
    return compareCodes(deptCodeA, deptCodeB)
      || a.department.localeCompare(b.department)
      || compareCodes(a.hierCode, b.hierCode);
  });
  return result;
}

export async function addPosition(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const code = (formData.get("code") as string || "").trim();
  const name = (formData.get("name") as string || "").trim();
  const department = (formData.get("department") as string || "").trim();
  const level = (formData.get("level") as string || "").trim();

  if (!code || !name) return { error: "Kode dan nama jabatan wajib diisi." };
  if (!/^\d+(\.\d+)+$/.test(code)) return { error: "Format kode tidak valid." };

  const { data: existing } = await supabaseAdmin
    .from("positions")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (existing) return { error: `Kode "${code}" sudah digunakan. Gunakan kode lain.` };

  const id = uid();
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("positions").insert({
    id, code, name, department, level, created_at: now, updated_at: now,
  });

  if (error) {
    if (error.message?.includes("duplicate key") || error.code === "23505") {
      return { error: `Kode "${code}" sudah digunakan. Gunakan kode lain.` };
    }
    console.error("addPosition error:", error);
    return { error: "Gagal menambah jabatan." };
  }

  revalidatePath("/hrd/workplace/positions");
  auditLog({ action: "position.add", targetId: id, targetName: name, performedBy: user, detail: `Kode: ${code}, Dept: ${department}` });
  return { success: true };
}

export async function updatePosition(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const id = (formData.get("id") as string || "").trim();
  const code = (formData.get("code") as string || "").trim();
  const name = (formData.get("name") as string || "").trim();
  const department = (formData.get("department") as string || "").trim();
  const level = (formData.get("level") as string || "").trim();

  if (!id || !code || !name) return { error: "ID, kode, dan nama jabatan wajib diisi." };
  if (!/^\d+(\.\d+)+$/.test(code)) return { error: "Format kode tidak valid." };

  const { data: duplicate } = await supabaseAdmin
    .from("positions")
    .select("id")
    .eq("code", code)
    .neq("id", id)
    .maybeSingle();
  if (duplicate) return { error: `Kode "${code}" sudah digunakan oleh jabatan lain. Gunakan kode lain.` };

  const { data: old } = await supabaseAdmin
    .from("positions")
    .select("name, department")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("positions").update({
    code, name, department, level, updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) {
    if (error.message?.includes("duplicate key") || error.code === "23505") {
      return { error: `Kode "${code}" sudah digunakan. Gunakan kode lain.` };
    }
    console.error("updatePosition error:", error);
    return { error: "Gagal mengupdate jabatan." };
  }

  const oldName = (old as Position)?.name;
  const oldDepartment = (old as Position)?.department;
  if (oldName && oldName !== name) {
    // Scope by the position's own department too — position names aren't
    // unique across departments (uniqueness is by code), so an unscoped
    // update would rename the same-named position's employees in every
    // other department as well.
    let cascadeQuery = supabaseAdmin.from("employees").update({ position: name }).eq("position", oldName);
    if (oldDepartment) cascadeQuery = cascadeQuery.eq("department", oldDepartment);
    const { error: casErr } = await cascadeQuery;
    if (casErr) console.error("updatePosition cascade error:", casErr);
  }

  revalidatePath("/hrd/workplace/positions");
  auditLog({ action: "position.update", targetId: id, targetName: name, performedBy: user, detail: `Kode: ${code}, Dept: ${department}` });
  return { success: true };
}

export async function deletePosition(positionId: string) {
  const user = await requireRole("hrd", "superadmin");

  if (!positionId) return { error: "ID jabatan wajib diisi." };

  const { data: pos } = await supabaseAdmin
    .from("positions")
    .select("name")
    .eq("id", positionId)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("positions").delete().eq("id", positionId);
  if (error) {
    console.error("deletePosition error:", error);
    return { error: "Gagal menghapus jabatan." };
  }

  revalidatePath("/hrd/workplace/positions");
  auditLog({ action: "position.delete", targetId: positionId, targetName: (pos as Position)?.name || positionId, performedBy: user });
  return { success: true };
}
