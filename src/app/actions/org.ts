"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";

interface OrgUnit {
  id: string; code: string; name: string; level: number;
  leader_name: string; leader_email: string; children: OrgUnit[];
}

/* ─────── helpers ─────── */

function findUnit(tree: OrgUnit[], code: string): OrgUnit | null {
  for (const u of tree) {
    if (u.code === code) return u;
    const found = findUnit(u.children, code);
    if (found) return found;
  }
  return null;
}

function deleteUnitByCode(tree: OrgUnit[], code: string): boolean {
  const idx = tree.findIndex(u => u.code === code);
  if (idx !== -1) { tree.splice(idx, 1); return true; }
  for (const u of tree) { if (deleteUnitByCode(u.children, code)) return true; }
  return false;
}

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
  for (let i = 0; i < digits.length; i++) {
    if (digits[i] > 0) lastNonZero = i;
  }
  if (lastNonZero <= 0) return null;
  digits[lastNonZero] = 0;
  return digits.join(".");
}

function isDescendantOf(code: string, ancestor: string): boolean {
  const a = codeSegments(ancestor);
  const c = codeSegments(code);
  if (c.length <= a.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] > 0 && a[i] !== c[i]) return false;
  }
  return true;
}

function recalculateCodes(unit: OrgUnit, parentCode: string) {
  unit.code = parentCode;
  unit.level = codeLevel(parentCode);
  for (let i = 0; i < unit.children.length; i++) {
    const childCode = generateCode(parentCode, i);
    recalculateCodes(unit.children[i], childCode);
  }
}

/* ─────── settings persistence ─────── */

async function getSettings() {
  const { data, error } = await supabaseAdmin.from("employees").select("address").eq("email", "__settings__@ptpgp.co.id").single();
  if (error || !data?.address) return {};
  try { return JSON.parse(data.address as string); } catch { return {}; }
}

async function saveSettings(settings: Record<string, unknown>) {
  const tree = settings.org_structure as OrgUnit[] | undefined;
  if (tree && (tree.length === 0 || !tree[0])) {
    throw new Error("saveSettings rejected: empty org_structure");
  }
  await supabaseAdmin.from("employees").upsert({
    full_name: "System Settings", email: "__settings__@ptpgp.co.id",
    address: JSON.stringify(settings), department: "System", position: "Settings",
    join_date: "2024-01-01", status: "Tetap"
  }, { onConflict: "email" });
}

/* ─────── public actions ─────── */

export async function getOrgStructure(): Promise<OrgUnit[]> {
  await requireRole("hrd", "superadmin");
  const s = await getSettings();
  return (s.org_structure as OrgUnit[]) || [];
}

export async function addOrgUnit(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const parent_code = (formData.get("parent_code") as string || "").trim();
  const unit_name = (formData.get("unit_name") as string || "").trim();
  const leader_name = (formData.get("leader_name") as string || "").trim();
  const leader_email = (formData.get("leader_email") as string || "").trim();

  if (!parent_code || !unit_name) return { error: "Parent dan nama unit wajib diisi." };
  if (!/^\d+(\.\d+)+$/.test(parent_code)) return { error: "Format kode parent tidak valid." };

  const settings = await getSettings();
  const tree = (settings.org_structure || []) as OrgUnit[];
  if (tree.length === 0) return { error: "Struktur organisasi belum tersedia. Jalankan seed terlebih dahulu." };

  const parent = findUnit(tree, parent_code);
  if (!parent) return { error: "Parent unit tidak ditemukan." };

  const siblingCount = parent.children.length;
  const newCode = generateCode(parent_code, siblingCount);
  const newLevel = codeLevel(newCode);

  parent.children.push({
    id: "org-" + Date.now(),
    code: newCode,
    name: unit_name,
    level: newLevel,
    leader_name,
    leader_email,
    children: [],
  });

  settings.org_structure = tree;
  try {
    await saveSettings(settings);
  } catch (e) {
    console.error("addOrgUnit save error:", e);
    return { error: "Gagal menyimpan data. Silakan coba lagi." };
  }
  await syncOrgToDepartments(tree);
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace/departments");
  revalidatePath("/hrd/workplace");
  auditLog({ action: "org.add_unit", targetId: newCode, targetName: unit_name, performedBy: user });
  return { success: true, code: newCode };
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

  const settings = await getSettings();
  const tree = (settings.org_structure || []) as OrgUnit[];
  const unit = findUnit(tree, unit_code);
  if (!unit) return { error: "Unit tidak ditemukan." };

  // Validate new code BEFORE any modifications
  if (new_code && new_code !== unit.code) {
    if (!/^\d+(\.\d+)+$/.test(new_code)) {
      return { error: "Format kode tidak valid. Gunakan format: 1.2.3.0.0.0.0" };
    }
    const duplicate = findUnit(tree, new_code);
    if (duplicate && duplicate !== unit) {
      return { error: `Kode "${new_code}" sudah digunakan unit lain.` };
    }
    const newParentCode = getParentCode(new_code);
    if (newParentCode) {
      const newParent = findUnit(tree, newParentCode);
      if (!newParent) {
        return { error: `Parent "${newParentCode}" tidak ditemukan di struktur.` };
      }
      if (newParent === unit) {
        return { error: "Tidak bisa memindahkan ke dirinya sendiri." };
      }
      if (isDescendantOf(newParent.code, unit.code)) {
        return { error: "Tidak bisa memindahkan ke anaknya sendiri." };
      }
    }
  }

  // Now apply modifications (leader only if non-empty)
  if (unit_name) unit.name = unit_name;
  if (leader_name.trim()) {
    unit.leader_name = leader_name.trim();
    unit.leader_email = leader_email.trim();
  }
  unit.level = level;

  if (new_code && new_code !== unit.code) {
    const newParentCode = getParentCode(new_code);
    const currentParentCode = getParentCode(unit.code);

    if (newParentCode && newParentCode !== currentParentCode) {
      const newParent = findUnit(tree, newParentCode)!;
      deleteUnitByCode(tree, unit.code);
      unit.code = new_code;
      unit.level = codeLevel(new_code);
      recalculateCodes(unit, new_code);
      newParent.children.push(unit);
    } else {
      unit.code = new_code;
      unit.level = codeLevel(new_code);
      recalculateCodes(unit, new_code);
    }
  }

  settings.org_structure = tree;
  try {
    await saveSettings(settings);
  } catch (e) {
    console.error("updateOrgUnit save error:", e);
    return { error: "Gagal menyimpan perubahan." };
  }
  await syncOrgToDepartments(tree);
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace/departments");
  revalidatePath("/hrd/workplace");
  auditLog({ action: "org.update_unit", targetId: new_code || unit_code, targetName: unit_name || unit.name, performedBy: user });
  return { success: true };
}

export async function deleteOrgUnit(unitCode: string) {
  const user = await requireRole("hrd", "superadmin");
  if (!unitCode) return { error: "Kode unit wajib diisi." };

  const settings = await getSettings();
  const tree = (settings.org_structure || []) as OrgUnit[];
  if (tree.length === 0) return { error: "Struktur organisasi tidak tersedia." };

  const deleted = deleteUnitByCode(tree, unitCode);
  if (!deleted) return { error: "Unit tidak ditemukan." };

  settings.org_structure = tree;
  try {
    await saveSettings(settings);
  } catch (e) {
    console.error("deleteOrgUnit save error:", e);
    return { error: "Gagal menyimpan perubahan." };
  }
  await syncOrgToDepartments(tree);
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace/departments");
  revalidatePath("/hrd/workplace");
  auditLog({ action: "org.delete_unit", targetId: unitCode, performedBy: user });
  return { success: true };
}

export async function moveOrgUnit(unitCode: string, newParentCode: string) {
  const user = await requireRole("hrd", "superadmin");

  if (!unitCode || !newParentCode) return { error: "Kode unit dan parent wajib diisi." };
  if (unitCode === newParentCode) return { error: "Tidak bisa memindahkan ke dirinya sendiri." };

  const settings = await getSettings();
  const tree = (settings.org_structure || []) as OrgUnit[];

  const unit = findUnit(tree, unitCode);
  if (!unit) return { error: "Unit tidak ditemukan." };

  const newParent = findUnit(tree, newParentCode);
  if (!newParent) return { error: "Parent tujuan tidak ditemukan." };

  if (newParent.code === unitCode || isDescendantOf(newParent.code, unitCode)) {
    return { error: "Tidak bisa memindahkan ke anaknya sendiri." };
  }

  deleteUnitByCode(tree, unitCode);

  const siblingCount = newParent.children.length;
  unit.code = generateCode(newParentCode, siblingCount);
  unit.level = codeLevel(unit.code);
  recalculateCodes(unit, unit.code);

  newParent.children.push(unit);
  settings.org_structure = tree;

  try {
    await saveSettings(settings);
  } catch (e) {
    console.error("moveOrgUnit save error:", e);
    return { error: "Gagal menyimpan perubahan." };
  }
  await syncOrgToDepartments(tree);
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace/departments");
  revalidatePath("/hrd/workplace");
  auditLog({ action: "org.move_unit", targetId: unit.code, targetName: unit.name, performedBy: user, detail: `Dipindah ke ${newParentCode}` });
  return { success: true, newCode: unit.code };
}

/* ─────── departments sync ─────── */

interface FlatDept {
  id?: string; code: string; name: string; parent_code: string | null;
  level: number; leader_name: string; leader_email: string; sort_order: number;
}

function flattenTreeForSync(tree: OrgUnit[], parentCode: string | null = null): FlatDept[] {
  const result: FlatDept[] = [];
  for (let i = 0; i < tree.length; i++) {
    const u = tree[i];
    result.push({
      code: u.code,
      name: u.name,
      parent_code: parentCode,
      level: u.level,
      leader_name: u.leader_name,
      leader_email: u.leader_email,
      sort_order: i,
    });
    if (u.children && u.children.length > 0) {
      result.push(...flattenTreeForSync(u.children, u.code));
    }
  }
  const nameCount: Record<string, number> = {};
  for (const r of result) nameCount[r.name] = (nameCount[r.name] || 0) + 1;
  const dupNames = new Map<string, number>();
  for (const r of result) {
    if (nameCount[r.name] > 1) {
      const idx = (dupNames.get(r.name) || 0) + 1;
      dupNames.set(r.name, idx);
      r.name = `${r.name} (${idx})`;
    }
  }
  return result;
}

async function syncOrgToDepartments(tree: OrgUnit[]) {
  const flat = flattenTreeForSync(tree);
  const treeCodes = flat.map(f => f.code);
  if (flat.length > 0) {
    const { error: upErr } = await supabaseAdmin.from("departments").upsert(flat, { onConflict: "code" });
    if (upErr) { console.error("syncOrgToDepartments upsert error:", upErr); return; }
  }
  const { data: existing, error: selErr } = await supabaseAdmin.from("departments").select("code");
  if (selErr) { console.error("syncOrgToDepartments select error:", selErr); return; }
  if (existing) {
    const toDelete = (existing as { code: string }[]).filter(d => !treeCodes.includes(d.code)).map(d => d.code);
    if (toDelete.length > 0) {
      await supabaseAdmin.from("departments").delete().in("code", toDelete);
    }
  }
}

export async function getDepartments(): Promise<FlatDept[]> {
  const { data } = await supabaseAdmin.from("departments").select("*").order("level", { ascending: true }).order("sort_order", { ascending: true }).order("name", { ascending: true });
  return (data as FlatDept[]) || [];
}

/* ─────── chart layout (legacy) ─────── */

export async function saveChartLayout(
  nodePositions: Record<string, { x: number; y: number }>,
  customEdges: { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }[]
) {
  await requireRole("hrd", "superadmin");
  const settings = await getSettings();
  settings.chart_layout = {
    nodePositions, customEdges,
    edgesCleared: customEdges.length === 0 && Object.keys(nodePositions).length === 0 ? true : undefined,
  };
  await saveSettings(settings);
  revalidatePath("/hrd/workplace/structure");
  return { success: true };
}

export async function getChartLayout(): Promise<{
  nodePositions: Record<string, { x: number; y: number }>;
  customEdges: { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }[];
} | null> {
  await requireRole("hrd", "superadmin");
  const settings = await getSettings();
  return (settings as Record<string, unknown>).chart_layout as any || null;
}
