"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";
import type { OrgUnit, FlatDept } from "@/types/org";

/* ─────── helpers ─────── */

function codeSegments(code: string): number[] {
  return code.split(".").map(Number);
}

function codeLevel(code: string): number {
  return codeSegments(code).filter(d => d > 0).length - 1;
}

function generateCode(parentCode: string, siblingCount: number): string {
  const digits = codeSegments(parentCode);
  let level = 0;
  for (let i = 0; i < digits.length; i++) {
    if (digits[i] > 0) level = i + 1;
  }
  digits[level] = siblingCount + 1;
  for (let i = level + 1; i < digits.length; i++) digits[i] = 0;
  return digits.join(".");
}

function getParentCode(code: string): string | null {
  const digits = codeSegments(code);
  let lastNonZero = -1;
  for (let i = 0; i < digits.length; i++) if (digits[i] > 0) lastNonZero = i;
  if (lastNonZero <= 0) return null;
  digits[lastNonZero] = 0;
  return digits.join(".");
}

function isDescendantOf(code: string, ancestor: string): boolean {
  const a = codeSegments(ancestor);
  const c = codeSegments(code);
  if (c.length <= a.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] > 0 && a[i] !== c[i]) return false;
  return true;
}

const uid = () => "org-" + crypto.randomUUID();

/* ─────── tree builder ─────── */

async function getSettings() {
  // Try new system_settings table first; fall back to legacy employee row if
  // the migration hasn't been applied yet.
  const { data: row, error } = await supabaseAdmin
    .from("system_settings")
    .select("value")
    .eq("key", "org_settings")
    .maybeSingle();

  if (!error && row) {
    try { return (row as Record<string, unknown>).value as Record<string, unknown> || {}; } catch { return {}; }
  }

  // Legacy fallback
  const { data } = await supabaseAdmin.from("employees").select("address").eq("email", "__settings__@ptpgp.co.id").maybeSingle();
  if (!data?.address) return {};
  try { return JSON.parse(data.address as string); } catch { return {}; }
}

async function saveSettings(settings: Record<string, unknown>) {
  // Try new table first
  const { error } = await supabaseAdmin
    .from("system_settings")
    .upsert({ key: "org_settings", value: settings, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) {
    // Legacy fallback if migration not yet applied
    await supabaseAdmin.from("employees").upsert({
      full_name: "System Settings", email: "__settings__@ptpgp.co.id",
      address: JSON.stringify(settings), department: "System", position: "Settings",
      join_date: "2024-01-01", status: "Tetap"
    }, { onConflict: "email" });
  }
}

interface OrgUnitRow {
  id: string; code: string; name: string; parent_code: string | null;
  level: number; leader_name: string | null; leader_email: string | null; sort_order: number;
}

async function buildTree(): Promise<OrgUnit[]> {
  const { data } = await supabaseAdmin.from("org_units").select("*").order("level", { ascending: true }).order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (data && data.length > 0) {
    const rows = data as unknown as OrgUnitRow[];
    const map = new Map<string, OrgUnit>();
    const roots: OrgUnit[] = [];
    for (const row of rows) {
      map.set(row.code, {
        id: row.id, code: row.code, name: row.name, level: row.level,
        leader_name: row.leader_name || "", leader_email: row.leader_email || "",
        children: [],
      });
    }
    for (const row of rows) {
      const u = map.get(row.code)!;
      if (row.parent_code && map.has(row.parent_code)) {
        map.get(row.parent_code)!.children.push(u);
      } else {
        roots.push(u);
      }
    }

    // Inject employees as leaf nodes under their org unit.
    // Prefer employees.kode (sequential org code) to place them precisely;
    // fall back to matching employees.department -> org_units.name directly
    // for older records that never got a kode backfilled, so nobody silently
    // disappears from the audit view. Employees without a kode get one
    // generated here (parent's code with the first free segment filled in,
    // sequential per department — same scheme hireCandidate() uses) and it's
    // persisted back so the code stays stable instead of showing a raw id.
    const { data: empData } = await supabaseAdmin
      .from("employees")
      .select("id, full_name, kode, nik, position, department, email")
      .neq("status", "Inactive")
      .order("full_name");
    if (empData) {
      type EmpRow = { id: string; full_name: string; kode: string | null; nik: string | null; position: string; department: string | null; email: string };
      const resolved: { emp: EmpRow; parent: OrgUnit }[] = [];

      for (const emp of empData as EmpRow[]) {
        let parent: OrgUnit | undefined;

        if (emp.kode) {
          // Parent org unit = replace the last non-zero segment with 0
          const segs = emp.kode.split(".");
          let lastNonZero = -1;
          for (let i = segs.length - 1; i >= 0; i--) {
            if (Number(segs[i]) !== 0) { lastNonZero = i; break; }
          }
          if (lastNonZero >= 0) {
            const parentSegs = [...segs];
            parentSegs[lastNonZero] = "0";
            parent = map.get(parentSegs.join("."));
          }
        }

        // Fallback: match by department name directly (covers employees
        // without a resolvable kode so the tree stays accurate/live).
        if (!parent && emp.department) {
          parent = Array.from(map.values()).find(u => u.name === emp.department);
        }

        // Refine into a specific sub-unit (e.g. "Payroll", "General Affair")
        // when the employee's position clearly names one, instead of leaving
        // everyone dumped flat under the parent division just because
        // employees.department only ever stores the top-level division name.
        // Matches whole words (with basic plural handling) rather than plain
        // substrings — a naive `.includes()` would wrongly match "Officer"
        // against a sub-unit named "Office ...".
        if (parent && emp.position) {
          const posWords = new Set(emp.position.toLowerCase().split(/[\s&,./]+/).filter(Boolean));
          const hasWord = (w: string) => posWords.has(w) || posWords.has(w + "s") || posWords.has(w + "es");
          const subUnit = rows.find(r => {
            if (r.parent_code !== parent!.code) return false;
            const words = r.name.toLowerCase().split(/[\s&]+/).filter(w => w.length > 3);
            return words.length > 0 && words.every(hasWord);
          });
          if (subUnit) parent = map.get(subUnit.code);
        }

        if (!parent) continue;
        resolved.push({ emp, parent });
      }

      // Seed each parent's next-sequence counter from kode values already in
      // use, so a generated code never collides with a real one.
      const seqByParent = new Map<string, number>();
      for (const { emp, parent } of resolved) {
        if (!emp.kode) continue;
        const parentSegs = parent.code.split(".");
        const firstZero = parentSegs.findIndex(s => Number(s) === 0);
        if (firstZero < 0) continue;
        const usedSeq = Number(emp.kode.split(".")[firstZero]) || 0;
        seqByParent.set(parent.code, Math.max(seqByParent.get(parent.code) || 0, usedSeq));
      }

      const toBackfill: { id: string; kode: string }[] = [];
      for (const { emp, parent } of resolved) {
        let personalCode = emp.kode || "";
        if (!personalCode) {
          const segments = parent.code.split(".");
          const firstZero = segments.findIndex(s => Number(s) === 0);
          const next = (seqByParent.get(parent.code) || 0) + 1;
          seqByParent.set(parent.code, next);
          segments[firstZero >= 0 ? firstZero : segments.length - 1] = String(next);
          personalCode = segments.join(".");
          toBackfill.push({ id: emp.id, kode: personalCode });
        }

        parent.children.push({
          id: emp.id,
          code: personalCode,
          name: emp.full_name,
          level: parent.level + 1,
          leader_name: emp.position || "",
          leader_email: emp.email || "",
          children: [],
          isEmployee: true,
          position: emp.position || "",
        });
      }

      if (toBackfill.length > 0) {
        await Promise.all(toBackfill.map(b => supabaseAdmin.from("employees").update({ kode: b.kode }).eq("id", b.id)));
      }
    }

    return roots;
  }

  // Fallback to JSON if org_units is empty
  const settings = await getSettings();
  const tree = (settings.org_structure as OrgUnit[]) || [];
  if (tree.length > 0) {
    // Auto-migrate to org_units
    migrateTreeToOrgUnits(tree);
  }
  return tree;
}

async function countChildren(parentCode: string): Promise<number> {
  const { count } = await supabaseAdmin.from("org_units").select("*", { count: "exact", head: true }).eq("parent_code", parentCode);
  return count || 0;
}

async function recalculateDescendants(parentCode: string, newParentCode: string) {
  const { data: children } = await supabaseAdmin.from("org_units").select("code").eq("parent_code", parentCode).order("sort_order", { ascending: true });
  if (!children) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as { code: string };
    const newChildCode = generateCode(newParentCode, i);
    const newLevel = codeLevel(newChildCode);
    await supabaseAdmin.from("org_units").update({ code: newChildCode, level: newLevel, parent_code: newParentCode }).eq("code", child.code);
    await recalculateDescendants(child.code, newChildCode);
  }
}

async function deleteSubtree(code: string) {
  const { data: children } = await supabaseAdmin.from("org_units").select("code").eq("parent_code", code);
  if (children) {
    for (const c of children as { code: string }[]) {
      await deleteSubtree(c.code);
    }
  }
  await supabaseAdmin.from("org_units").delete().eq("code", code);
}

async function migrateTreeToOrgUnits(tree: OrgUnit[]) {
  function flatten(list: OrgUnit[], parentCode: string | null): { id: string; code: string; name: string; parent_code: string | null; level: number; leader_name: string; leader_email: string; sort_order: number }[] {
    const result: { id: string; code: string; name: string; parent_code: string | null; level: number; leader_name: string; leader_email: string; sort_order: number }[] = [];
    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      result.push({ id: u.id, code: u.code, name: u.name, parent_code: parentCode, level: u.level, leader_name: u.leader_name, leader_email: u.leader_email, sort_order: i });
      if (u.children?.length) result.push(...flatten(u.children, u.code));
    }
    return result;
  }
  const flat = flatten(tree, null);
  for (const row of flat) {
    await supabaseAdmin.from("org_units").upsert(row, { onConflict: "code" });
  }
}

/* ─────── public API ─────── */

export async function getOrgStructure(): Promise<OrgUnit[]> {
  await requireRole("hrd", "superadmin");
  return await buildTree();
}

export async function addOrgUnit(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const parent_code = (formData.get("parent_code") as string || "").trim();
  const unit_name = (formData.get("unit_name") as string || "").trim();
  const leader_name = (formData.get("leader_name") as string || "").trim();
  const leader_email = (formData.get("leader_email") as string || "").trim();

  if (!parent_code || !unit_name) return { error: "Parent dan nama unit wajib diisi." };
  if (!/^\d+(\.\d+)+$/.test(parent_code)) return { error: "Format kode parent tidak valid." };

  const { data: parent } = await supabaseAdmin.from("org_units").select("code").eq("code", parent_code).maybeSingle();
  if (!parent) return { error: "Parent unit tidak ditemukan." };

  const siblingCount = await countChildren(parent_code);
  const newCode = generateCode(parent_code, siblingCount);
  const newLevel = codeLevel(newCode);

  const { error } = await supabaseAdmin.from("org_units").insert({
    id: uid(), code: newCode, name: unit_name, level: newLevel,
    parent_code: parent_code, leader_name, leader_email, sort_order: siblingCount,
  });
  if (error) {
    console.error("addOrgUnit error:", error);
    return { error: "Gagal menambah unit." };
  }

  await syncOrgToDepartments();
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace/departments");
  revalidatePath("/hrd/workplace");
  auditLog({ action: "org.add_unit", targetId: newCode, targetName: unit_name, performedBy: user });
  return { success: true, code: newCode };
}

/**
 * Dedicated "Departemen" page creator: HRD types the department code by hand
 * (not auto-generated), but must still anchor it to an existing parent
 * code/department so its place in the 5-level org hierarchy stays well
 * defined. Level is derived from the code's position under the parent.
 */
export async function addDepartmentManual(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const code = (formData.get("code") as string || "").trim();
  const parent_code = (formData.get("parent_code") as string || "").trim();
  const unit_name = (formData.get("unit_name") as string || "").trim();
  const leader_name = (formData.get("leader_name") as string || "").trim();
  const leader_email = (formData.get("leader_email") as string || "").trim();

  if (!code || !parent_code || !unit_name) {
    return { error: "Kode, induk (parent), dan nama departemen wajib diisi." };
  }
  if (!/^\d+(\.\d+)+$/.test(code)) {
    return { error: "Format kode tidak valid. Gunakan format: 1.2.1.0.0.0.0 (dipisah titik)." };
  }
  if (!/^\d+(\.\d+)+$/.test(parent_code)) {
    return { error: "Format kode induk tidak valid." };
  }

  const { data: existing } = await supabaseAdmin.from("org_units").select("code").eq("code", code).maybeSingle();
  if (existing) return { error: `Kode "${code}" sudah digunakan unit lain.` };

  const { data: parent } = await supabaseAdmin.from("org_units").select("code").eq("code", parent_code).maybeSingle();
  if (!parent) return { error: "Induk (parent) tidak ditemukan." };

  // HRD types the code manually, but it must genuinely sit directly under
  // the chosen parent so the hierarchy stays well defined.
  if (getParentCode(code) !== parent_code) {
    return { error: `Kode "${code}" tidak berada langsung di bawah induk "${parent_code}". Sesuaikan kode agar induknya cocok.` };
  }

  const newLevel = codeLevel(code);
  const siblingCount = await countChildren(parent_code);

  const { error } = await supabaseAdmin.from("org_units").insert({
    id: uid(), code, name: unit_name, level: newLevel,
    parent_code, leader_name, leader_email, sort_order: siblingCount,
  });
  if (error) {
    console.error("addDepartmentManual error:", error);
    if (error.message?.includes("duplicate key") || error.code === "23505") {
      return { error: `Kode "${code}" sudah digunakan. Gunakan kode lain.` };
    }
    return { error: "Gagal menambah departemen." };
  }

  await syncOrgToDepartments();
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace/departments");
  revalidatePath("/hrd/workplace");
  auditLog({ action: "org.add_department", targetId: code, targetName: unit_name, performedBy: user, detail: `Induk: ${parent_code}` });
  return { success: true, code };
}

export async function updateOrgUnit(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const unit_code = (formData.get("unit_code") as string || "").trim();
  const unit_name = (formData.get("unit_name") as string || "").trim();
  const leader_name = formData.get("leader_name") as string || "";
  const leader_email = formData.get("leader_email") as string || "";
  const level = parseInt((formData.get("level") as string) || "0");
  const new_code = (formData.get("new_code") as string || "").trim();

  if (!unit_code) return { error: "Kode unit wajib diisi." };

  const { data: unit } = await supabaseAdmin.from("org_units").select("*").eq("code", unit_code).maybeSingle();
  if (!unit) return { error: "Unit tidak ditemukan." };

  // Validate new code first
  if (new_code && new_code !== unit_code) {
    if (!/^\d+(\.\d+)+$/.test(new_code)) {
      return { error: "Format kode tidak valid. Gunakan format: 1.2.3.0.0.0.0" };
    }
    const { data: dup } = await supabaseAdmin.from("org_units").select("code").eq("code", new_code).maybeSingle();
    if (dup) return { error: `Kode "${new_code}" sudah digunakan unit lain.` };
    const npc = getParentCode(new_code);
    if (npc) {
      const { data: np } = await supabaseAdmin.from("org_units").select("code").eq("code", npc).maybeSingle();
      if (!np) return { error: `Parent "${npc}" tidak ditemukan.` };
      if (isDescendantOf(npc, unit_code)) return { error: "Tidak bisa memindahkan ke anaknya sendiri." };
    }
  }

  const updates: Record<string, unknown> = {};
  if (unit_name) updates.name = unit_name;
  if (leader_name.trim()) { updates.leader_name = leader_name.trim(); updates.leader_email = leader_email.trim(); }
  updates.level = level;

  if (new_code && new_code !== unit_code) {
    const npc = getParentCode(new_code);
    const curPc = (unit as Record<string, unknown>).parent_code as string || null;
    const oldParent = curPc ? getParentCode(unit_code) : null;
    updates.code = new_code;
    updates.level = codeLevel(new_code);
    if (npc && npc !== oldParent) {
      updates.parent_code = npc;
    }
    await supabaseAdmin.from("org_units").update(updates).eq("code", unit_code);
    await recalculateDescendants(unit_code, new_code);
  } else {
    await supabaseAdmin.from("org_units").update(updates).eq("code", unit_code);
  }

  // Sync JSON backup
  try {
    const tree = await buildTree();
    const settings = await getSettings();
    settings.org_structure = tree;
    await saveSettings(settings);
  } catch (e) { console.error("updateOrgUnit JSON backup error:", e); }

  await syncOrgToDepartments();
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace/departments");
  revalidatePath("/hrd/workplace");
  auditLog({ action: "org.update_unit", targetId: new_code || unit_code, targetName: unit_name || (unit as Record<string, unknown>).name as string, performedBy: user });
  return { success: true };
}

export async function deleteOrgUnit(unitCode: string) {
  const user = await requireRole("hrd", "superadmin");
  if (!unitCode) return { error: "Kode unit wajib diisi." };

  const { data: unit } = await supabaseAdmin.from("org_units").select("name, code").eq("code", unitCode).maybeSingle();
  if (!unit) return { error: "Unit tidak ditemukan." };

  await deleteSubtree(unitCode);

  try {
    const tree = await buildTree();
    const settings = await getSettings();
    settings.org_structure = tree;
    await saveSettings(settings);
  } catch (e) { console.error("deleteOrgUnit JSON backup error:", e); }

  await syncOrgToDepartments();
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace/departments");
  revalidatePath("/hrd/workplace");
  auditLog({ action: "org.delete_unit", targetId: unitCode, targetName: (unit as { name: string }).name, performedBy: user });
  return { success: true };
}

export async function moveOrgUnit(unitCode: string, newParentCode: string) {
  const user = await requireRole("hrd", "superadmin");

  if (!unitCode || !newParentCode) return { error: "Kode unit dan parent wajib diisi." };
  if (unitCode === newParentCode) return { error: "Tidak bisa memindahkan ke dirinya sendiri." };

  const { data: unit } = await supabaseAdmin.from("org_units").select("code, name").eq("code", unitCode).maybeSingle();
  if (!unit) return { error: "Unit tidak ditemukan." };

  const { data: newParent } = await supabaseAdmin.from("org_units").select("code").eq("code", newParentCode).maybeSingle();
  if (!newParent) return { error: "Parent tujuan tidak ditemukan." };
  if (isDescendantOf(newParentCode, unitCode)) return { error: "Tidak bisa memindahkan ke anaknya sendiri." };

  const siblingCount = await countChildren(newParentCode);
  const newCode = generateCode(newParentCode, siblingCount);
  const newLevel = codeLevel(newCode);

  await supabaseAdmin.from("org_units").update({
    code: newCode, level: newLevel, parent_code: newParentCode,
    sort_order: siblingCount,
  }).eq("code", unitCode);

  await recalculateDescendants(unitCode, newCode);

  try {
    const tree = await buildTree();
    const settings = await getSettings();
    settings.org_structure = tree;
    await saveSettings(settings);
  } catch (e) { console.error("moveOrgUnit JSON backup error:", e); }

  await syncOrgToDepartments();
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace/departments");
  revalidatePath("/hrd/workplace");
  auditLog({ action: "org.move_unit", targetId: newCode, targetName: (unit as { name: string }).name, performedBy: user, detail: `Dipindah ke ${newParentCode}` });
  return { success: true, newCode };
}

/* ─────── departments sync ─────── */

async function syncOrgToDepartments() {
  let { data } = await supabaseAdmin.from("org_units").select("*").order("level").order("sort_order").order("name");

  // If org_units empty, migrate from JSON first
  if (!data || data.length === 0) {
    const settings = await getSettings();
    const tree = (settings.org_structure as OrgUnit[]) || [];
    if (tree.length > 0) {
      await migrateTreeToOrgUnits(tree);
      const retry = await supabaseAdmin.from("org_units").select("*").order("level").order("sort_order").order("name");
      data = retry.data;
    }
  }

  if (!data || data.length === 0) return;
  const rows = data as unknown as OrgUnitRow[];
  const flat: FlatDept[] = rows.map((r, i) => ({
    code: r.code, name: r.name, parent_code: r.parent_code || null,
    level: r.level, leader_name: r.leader_name || "", leader_email: r.leader_email || "", sort_order: r.sort_order || i,
  }));
  const nameCount: Record<string, number> = {};
  for (const r of flat) nameCount[r.name] = (nameCount[r.name] || 0) + 1;
  const dupNames = new Map<string, number>();
  for (const r of flat) {
    if (nameCount[r.name] > 1) {
      const idx = (dupNames.get(r.name) || 0) + 1;
      dupNames.set(r.name, idx);
      r.name = `${r.name} (${idx})`;
    }
  }
  const treeCodes = flat.map(f => f.code);
  const { error: upErr } = await supabaseAdmin.from("departments").upsert(flat, { onConflict: "code" });
  if (upErr) { console.error("syncToDepartments upsert error:", upErr); return; }
  const { data: existing } = await supabaseAdmin.from("departments").select("code");
  if (existing) {
    const toDelete = (existing as { code: string }[]).filter(d => !treeCodes.includes(d.code)).map(d => d.code);
    if (toDelete.length > 0) await supabaseAdmin.from("departments").delete().in("code", toDelete);
  }
}

export async function getDepartments(): Promise<FlatDept[]> {
  let { data } = await supabaseAdmin.from("departments").select("*").order("level", { ascending: true }).order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (!data || data.length === 0) {
    await syncOrgToDepartments();
    const retry = await supabaseAdmin.from("departments").select("*").order("level", { ascending: true }).order("sort_order", { ascending: true }).order("name", { ascending: true });
    data = retry.data;
  }
  return (data as FlatDept[]) || [];
}

/* ─────── seed / migrate from JSON ─────── */

export async function migrateJsonToOrgUnits() {
  await requireRole("hrd", "superadmin");

  const settings = await getSettings();
  const tree = (settings.org_structure as OrgUnit[]) || [];
  if (tree.length === 0) return { error: "No JSON data to migrate." };

  function flatten(list: OrgUnit[], parentCode: string | null = null, depth = 0): { id: string; code: string; name: string; parent_code: string | null; level: number; leader_name: string; leader_email: string; sort_order: number }[] {
    const result: { id: string; code: string; name: string; parent_code: string | null; level: number; leader_name: string; leader_email: string; sort_order: number }[] = [];
    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      result.push({
        id: u.id, code: u.code, name: u.name, parent_code: parentCode,
        level: u.level, leader_name: u.leader_name, leader_email: u.leader_email, sort_order: i,
      });
      if (u.children && u.children.length > 0) result.push(...flatten(u.children, u.code, depth + 1));
    }
    return result;
  }

  const flat = flatten(tree);
  for (const row of flat) {
    await supabaseAdmin.from("org_units").upsert(row, { onConflict: "code" });
  }
  await syncOrgToDepartments();
  return { success: true, count: flat.length };
}

/* ─────── chart layout (legacy) ─────── */

export async function saveChartLayout(
  nodePositions: Record<string, { x: number; y: number }>,
  customEdges: { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }[]
) {
  await requireRole("hrd", "superadmin");
  const settings = await getSettings();
  settings.chart_layout = { nodePositions, customEdges, edgesCleared: customEdges.length === 0 && Object.keys(nodePositions).length === 0 ? true : undefined };
  await saveSettings(settings);
  revalidatePath("/hrd/workplace/structure");
  return { success: true };
}

export async function getChartLayout(): Promise<{ nodePositions: Record<string, { x: number; y: number }>; customEdges: { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }[] } | null> {
  await requireRole("hrd", "superadmin");
  const settings = await getSettings();
  return ((settings as Record<string, unknown>).chart_layout as { nodePositions: Record<string, { x: number; y: number }>; customEdges: { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }[] }) || null;
}
