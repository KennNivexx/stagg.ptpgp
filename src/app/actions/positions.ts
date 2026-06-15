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

function uid() { return "pos-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8); }

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
    .select("name")
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
  if (oldName && oldName !== name) {
    const { error: casErr } = await supabaseAdmin.from("employees").update({ position: name }).eq("position", oldName);
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
