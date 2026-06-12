"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

interface OrgUnit {
  id: string; code: string; name: string; level: number;
  leader_name: string; leader_email: string; children: OrgUnit[];
}

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

function generateCode(parentCode: string, siblingCount: number): string {
  const digits = parentCode.split(".").map(Number);
  let level = 0;
  for (let i = 0; i < digits.length; i++) {
    if (digits[i] > 0) level = i + 1;
  }
  digits[level] = siblingCount + 1;
  for (let i = level + 1; i < 7; i++) digits[i] = 0;
  return digits.join(".");
}

async function getSettings() {
  const { data } = await supabaseAdmin.from("employees").select("address").eq("email", "__settings__@ptpgp.co.id").single();
  if (!data?.address) return {};
  try { return JSON.parse(data.address as string); } catch { return {}; }
}

async function saveSettings(settings: Record<string, unknown>) {
  await supabaseAdmin.from("employees").upsert({
    full_name: "System Settings", email: "__settings__@ptpgp.co.id",
    address: JSON.stringify(settings), department: "System", position: "Settings",
    join_date: "2024-01-01", status: "Tetap"
  }, { onConflict: "email" });
}

export async function getOrgStructure(): Promise<OrgUnit[]> {
  const s = await getSettings();
  return (s.org_structure as OrgUnit[]) || [];
}

export async function addOrgUnit(formData: FormData) {
  const parent_code = formData.get("parent_code") as string;
  const unit_name = formData.get("unit_name") as string;
  const leader_name = (formData.get("leader_name") as string) || "";
  const leader_email = (formData.get("leader_email") as string) || "";

  if (!parent_code || !unit_name) return { error: "Parent dan nama unit wajib diisi." };

  const settings = await getSettings();
  const tree = (settings.org_structure || []) as OrgUnit[];
  
  const parent = findUnit(tree, parent_code);
  if (!parent) return { error: "Parent unit tidak ditemukan." };

  const siblingCount = parent.children.length;
  const newCode = generateCode(parent_code, siblingCount);
  const newLevel = newCode.split(".").filter(d => Number(d) > 0).length - 1;

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
  await saveSettings(settings);
  revalidatePath("/hrd/workplace");
  return { success: true, code: newCode };
}

export async function updateOrgUnit(formData: FormData) {
  const unit_code = formData.get("unit_code") as string;
  const unit_name = formData.get("unit_name") as string;
  const leader_name = (formData.get("leader_name") as string) || "";
  const leader_email = (formData.get("leader_email") as string) || "";
  const level = parseInt((formData.get("level") as string) || "0");

  if (!unit_code) return { error: "Kode unit wajib diisi." };
  
  const settings = await getSettings();
  const tree = (settings.org_structure || []) as OrgUnit[];
  const unit = findUnit(tree, unit_code);
  if (!unit) return { error: "Unit tidak ditemukan." };

  if (unit_name) unit.name = unit_name;
  unit.leader_name = leader_name;
  unit.leader_email = leader_email;
  if (level > 0) unit.level = level;

  settings.org_structure = tree;
  await saveSettings(settings);
  revalidatePath("/hrd/workplace");
  return { success: true };
}

export async function deleteOrgUnit(unitCode: string) {
  if (!unitCode) return { error: "Kode unit wajib diisi." };
  const settings = await getSettings();
  const tree = (settings.org_structure || []) as OrgUnit[];
  const deleted = deleteUnitByCode(tree, unitCode);
  if (!deleted) return { error: "Unit tidak ditemukan." };
  settings.org_structure = tree;
  await saveSettings(settings);
  revalidatePath("/hrd/workplace");
  return { success: true };
}

export async function moveOrgUnit(unitCode: string, newParentCode: string) {
  if (!unitCode || !newParentCode) return { error: "Kode unit dan parent wajib diisi." };
  if (unitCode === newParentCode) return { error: "Tidak bisa memindahkan ke dirinya sendiri." };

  const settings = await getSettings();
  const tree = (settings.org_structure || []) as OrgUnit[];

  const unit = findUnit(tree, unitCode);
  if (!unit) return { error: "Unit tidak ditemukan." };

  const newParent = findUnit(tree, newParentCode);
  if (!newParent) return { error: "Parent tujuan tidak ditemukan." };

  if (newParent.code === unitCode || newParent.code.startsWith(unitCode + ".")) {
    return { error: "Tidak bisa memindahkan ke anaknya sendiri." };
  }

  deleteUnitByCode(tree, unitCode);

  const siblingCount = newParent.children.length;
  unit.code = generateCode(newParentCode, siblingCount);
  unit.level = unit.code.split(".").filter(d => Number(d) > 0).length - 1;
  recalculateCodes(unit, unit.code);

  newParent.children.push(unit);
  settings.org_structure = tree;
  await saveSettings(settings);
  revalidatePath("/hrd/workplace");
  return { success: true, newCode: unit.code };
}

function recalculateCodes(unit: OrgUnit, parentCode: string) {
  unit.code = parentCode;
  unit.level = parentCode.split(".").filter(d => Number(d) > 0).length - 1;
  for (let i = 0; i < unit.children.length; i++) {
    const childCode = generateCode(parentCode, i);
    recalculateCodes(unit.children[i], childCode);
  }
}

export async function saveChartLayout(
  nodePositions: Record<string, { x: number; y: number }>,
  customEdges: { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }[]
) {
  const settings = await getSettings();
  settings.chart_layout = {
    nodePositions,
    customEdges,
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
  const settings = await getSettings();
  return (settings as any).chart_layout || null;
}
