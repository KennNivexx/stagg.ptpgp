"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";
import { getKepalaUnitMap } from "@/lib/org-helpers";
import { levelRank } from "@/lib/org-levels";

interface Position {
  id: string;
  code: string;
  name: string;
  department: string;
  level: string;
  created_at?: string;
  updated_at?: string;
}

export interface MasterJabatan {
  id: string;
  code: string;
  name: string;
  department: string;
  level: string;
  grade_id: string | null;
  grade_name: string | null;
  is_kepala_unit: boolean;
  status: string;
  is_master: boolean;
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
    .from("jabatan")
    .select("*")
    .order("department", { ascending: true })
    .order("level", { ascending: true })
    .order("name", { ascending: true });
  return (data as Position[]) || [];
}

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
    supabaseAdmin.from("karyawan").select("id, full_name, department, position, email").neq("status", "Inactive"),
    supabaseAdmin.from("unit_organisasi").select("id, code, name"),
    supabaseAdmin.from("jabatan").select("*"),
  ]);

  const empList = (employees || []) as { id: string; full_name: string; department: string | null; position: string | null; email: string }[];
  const unitRows = (orgUnits || []) as { id: string; code: string; name: string }[];
  const posList = (positions || []) as Position[];

  // Deptartment "head" here is the same derived Position-Assignment concept
  // used across Desain Organisasi (see org-helpers.ts) — not a stored field.
  const kepalaMap = await getKepalaUnitMap(unitRows.map(u => u.id));
  const unitList = unitRows.map(u => {
    const k = kepalaMap.get(u.id);
    return { code: u.code, name: u.name, leader_name: k?.name || null, leader_email: k?.email || null };
  });

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
      const la = levelRank(pa?.level);
      const lb = levelRank(pb?.level);
      if (la !== lb) return la - lb; // more senior first (lower rank number = more senior)
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
    await supabaseAdmin.from("jabatan").upsert(toUpsert, { onConflict: "code" });
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

/**
 * Master Jabatan (enterprise redesign): the actual CRUD list HR manages,
 * distinct from getPositionsMonitor()'s legacy live-derived cache — both
 * read/write the same `jabatan` table, `is_master` just flags which rows
 * were created intentionally through this screen.
 */
export async function getMasterJabatan(): Promise<MasterJabatan[]> {
  await requireRole("hrd", "superadmin");
  const [{ data: jabatanRows }, { data: gradeRows }] = await Promise.all([
    supabaseAdmin.from("jabatan").select("*").order("code"),
    supabaseAdmin.from("grade_jabatan").select("id, nama"),
  ]);
  const gradeById = new Map(((gradeRows || []) as { id: string; nama: string }[]).map(g => [g.id, g.nama]));
  return ((jabatanRows || []) as Record<string, unknown>[]).map(r => ({
    id: r.id as string, code: r.code as string, name: r.name as string,
    department: (r.department as string) || "", level: (r.level as string) || "",
    grade_id: (r.grade_id as string) || null, grade_name: r.grade_id ? gradeById.get(r.grade_id as string) || null : null,
    is_kepala_unit: !!r.is_kepala_unit, status: (r.status as string) || "Aktif",
    is_master: !!r.is_master,
  }));
}

export async function addPosition(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const code = (formData.get("code") as string || "").trim();
  const name = (formData.get("name") as string || "").trim();
  const department = (formData.get("department") as string || "").trim();
  const level = (formData.get("level") as string || "").trim();
  const grade_id = (formData.get("grade_id") as string || "").trim() || null;
  const is_kepala_unit = formData.get("is_kepala_unit") === "on" || formData.get("is_kepala_unit") === "true";
  const status = (formData.get("status") as string || "Aktif").trim();

  if (!code || !name) return { error: "Kode dan nama jabatan wajib diisi." };
  if (!/^\d+(\.\d+)+$/.test(code)) return { error: "Format kode tidak valid." };

  const { data: existing } = await supabaseAdmin
    .from("jabatan")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (existing) return { error: `Kode "${code}" sudah digunakan. Gunakan kode lain.` };

  const id = uid();
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("jabatan").insert({
    id, code, name, department, level, grade_id, is_kepala_unit, status,
    is_master: true, created_at: now, updated_at: now,
  });

  if (error) {
    if (error.message?.includes("duplicate key") || error.code === "23505") {
      return { error: `Kode "${code}" sudah digunakan. Gunakan kode lain.` };
    }
    console.error("addPosition error:", error);
    return { error: "Gagal menambah jabatan." };
  }

  revalidatePath("/hrd/workplace/positions");
  auditLog({ action: "jabatan.create", targetId: id, targetName: name, performedBy: user, detail: `Kode: ${code}, Dept: ${department}` });
  return { success: true };
}

export async function updatePosition(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const id = (formData.get("id") as string || "").trim();
  const code = (formData.get("code") as string || "").trim();
  const name = (formData.get("name") as string || "").trim();
  const department = (formData.get("department") as string || "").trim();
  const level = (formData.get("level") as string || "").trim();
  const grade_id = (formData.get("grade_id") as string || "").trim() || null;
  const is_kepala_unit = formData.get("is_kepala_unit") === "on" || formData.get("is_kepala_unit") === "true";
  const status = (formData.get("status") as string || "Aktif").trim();

  if (!id || !code || !name) return { error: "ID, kode, dan nama jabatan wajib diisi." };
  if (!/^\d+(\.\d+)+$/.test(code)) return { error: "Format kode tidak valid." };

  const { data: duplicate } = await supabaseAdmin
    .from("jabatan")
    .select("id")
    .eq("code", code)
    .neq("id", id)
    .maybeSingle();
  if (duplicate) return { error: `Kode "${code}" sudah digunakan oleh jabatan lain. Gunakan kode lain.` };

  const { data: old } = await supabaseAdmin
    .from("jabatan")
    .select("name, department")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("jabatan").update({
    code, name, department, level, grade_id, is_kepala_unit, status,
    is_master: true, updated_at: new Date().toISOString(),
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
    let cascadeQuery = supabaseAdmin.from("karyawan").update({ position: name }).eq("position", oldName);
    if (oldDepartment) cascadeQuery = cascadeQuery.eq("department", oldDepartment);
    const { error: casErr } = await cascadeQuery;
    if (casErr) console.error("updatePosition cascade error:", casErr);
  }

  revalidatePath("/hrd/workplace/positions");
  auditLog({ action: "jabatan.update", targetId: id, targetName: name, performedBy: user, detail: `Kode: ${code}, Dept: ${department}` });
  return { success: true };
}

export async function deletePosition(positionId: string) {
  const user = await requireRole("hrd", "superadmin");

  if (!positionId) return { error: "ID jabatan wajib diisi." };

  const { data: pos } = await supabaseAdmin
    .from("jabatan")
    .select("name")
    .eq("id", positionId)
    .maybeSingle();

  const { count } = await supabaseAdmin
    .from("formasi_jabatan")
    .select("*", { count: "exact", head: true })
    .eq("jabatan_id", positionId);
  if (count && count > 0) {
    return { error: "Jabatan ini masih dipakai oleh Position Number (Formasi). Hapus formasinya terlebih dahulu." };
  }

  const { error } = await supabaseAdmin.from("jabatan").delete().eq("id", positionId);
  if (error) {
    console.error("deletePosition error:", error);
    return { error: "Gagal menghapus jabatan." };
  }

  revalidatePath("/hrd/workplace/positions");
  auditLog({ action: "jabatan.delete", targetId: positionId, targetName: (pos as Position)?.name || positionId, performedBy: user });
  return { success: true };
}
