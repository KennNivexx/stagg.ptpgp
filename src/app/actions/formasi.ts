"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";
import { getParentCode } from "@/lib/org-code";
import { isMoreSenior } from "@/lib/org-levels";

export interface FormasiRow {
  id: string;
  position_number: string;
  unit_organisasi_id: string;
  unit_name: string;
  jabatan_id: string;
  jabatan_name: string;
  status: "Vacant" | "Filled";
  karyawan_id: string | null;
  karyawan_name: string | null;
  tanggal_mulai: string | null;
  keterangan: string | null;
}

const uid = () => "formasi-" + crypto.randomUUID();
const MISSING_MIGRATION = "Jalankan migrasi 20260712001_org_design_overhaul.sql terlebih dahulu.";

/** Level (rank name) of whichever jabatan is currently the Filled kepala unit
 * of `unitId`, or null if the unit has no unit head assigned yet / no
 * recognizable level — mirrors org-helpers.ts's getKepalaUnit() but also
 * surfaces jabatan.level, which that helper doesn't expose. */
async function getKepalaUnitLevel(unitId: string): Promise<string | null> {
  const { data: formasiRows } = await supabaseAdmin
    .from("formasi_jabatan")
    .select("jabatan_id")
    .eq("unit_organisasi_id", unitId)
    .eq("status", "Filled");
  const rows = (formasiRows || []) as { jabatan_id: string }[];
  if (rows.length === 0) return null;

  const jabatanIds = [...new Set(rows.map(r => r.jabatan_id))];
  const { data: jabatanRows } = await supabaseAdmin
    .from("jabatan")
    .select("id, is_kepala_unit, level")
    .in("id", jabatanIds);
  const kepala = ((jabatanRows || []) as { id: string; is_kepala_unit: boolean; level: string | null }[])
    .find(j => j.is_kepala_unit);
  return kepala?.level || null;
}

/** Guards against assigning a unit-head jabatan that outranks the unit-head
 * of its own parent unit — e.g. a "Manager" leading a sub-unit whose parent
 * unit is still led by a "Supervisor". Only fires when the target jabatan
 * itself is a kepala unit AND both sides resolve to a recognizable level;
 * legacy/empty levels are skipped rather than falsely rejected. */
async function checkKepalaUnitSeniority(unitOrganisasiId: string, jabatanId: string): Promise<{ error: string } | null> {
  const { data: jabatanRow } = await supabaseAdmin
    .from("jabatan")
    .select("name, level, is_kepala_unit")
    .eq("id", jabatanId)
    .maybeSingle();
  const jabatan = jabatanRow as { name: string; level: string | null; is_kepala_unit: boolean } | null;
  if (!jabatan?.is_kepala_unit || !jabatan.level) return null;

  const { data: unitRow } = await supabaseAdmin
    .from("unit_organisasi")
    .select("code")
    .eq("id", unitOrganisasiId)
    .maybeSingle();
  const code = (unitRow as { code: string } | null)?.code;
  if (!code) return null;
  const parentCode = getParentCode(code);
  if (!parentCode) return null;

  const { data: parentRow } = await supabaseAdmin
    .from("unit_organisasi")
    .select("id, name")
    .eq("code", parentCode)
    .maybeSingle();
  const parent = parentRow as { id: string; name: string } | null;
  if (!parent?.id) return null;

  const parentLevel = await getKepalaUnitLevel(parent.id);
  if (!parentLevel) return null;

  if (isMoreSenior(jabatan.level, parentLevel)) {
    return {
      error: `Jabatan "${jabatan.name}" (${jabatan.level}) lebih senior daripada kepala unit induknya, "${parent.name}" (${parentLevel}). Periksa kembali penempatan ini agar urutan struktur tetap benar.`,
    };
  }
  return null;
}

export async function getFormasiList(): Promise<FormasiRow[]> {
  await requireRole("hrd", "superadmin");
  const { data: rows, error } = await supabaseAdmin
    .from("formasi_jabatan")
    .select("*")
    .order("position_number");
  if (error) return [];

  const list = (rows || []) as Record<string, unknown>[];
  const unitIds = [...new Set(list.map(r => r.unit_organisasi_id as string))];
  const jabatanIds = [...new Set(list.map(r => r.jabatan_id as string))];
  const karyawanIds = [...new Set(list.map(r => r.karyawan_id).filter(Boolean) as string[])];

  const [{ data: units }, { data: jabatans }, { data: emps }] = await Promise.all([
    unitIds.length ? supabaseAdmin.from("unit_organisasi").select("id, name").in("id", unitIds) : Promise.resolve({ data: [] }),
    jabatanIds.length ? supabaseAdmin.from("jabatan").select("id, name").in("id", jabatanIds) : Promise.resolve({ data: [] }),
    karyawanIds.length ? supabaseAdmin.from("karyawan").select("id, full_name").in("id", karyawanIds) : Promise.resolve({ data: [] }),
  ]);
  const unitById = new Map(((units || []) as { id: string; name: string }[]).map(u => [u.id, u.name]));
  const jabatanById = new Map(((jabatans || []) as { id: string; name: string }[]).map(j => [j.id, j.name]));
  const empById = new Map(((emps || []) as { id: string; full_name: string }[]).map(e => [e.id, e.full_name]));

  return list.map(r => ({
    id: r.id as string, position_number: r.position_number as string,
    unit_organisasi_id: r.unit_organisasi_id as string, unit_name: unitById.get(r.unit_organisasi_id as string) || "—",
    jabatan_id: r.jabatan_id as string, jabatan_name: jabatanById.get(r.jabatan_id as string) || "—",
    status: r.status as "Vacant" | "Filled",
    karyawan_id: (r.karyawan_id as string) || null,
    karyawan_name: r.karyawan_id ? empById.get(r.karyawan_id as string) || null : null,
    tanggal_mulai: (r.tanggal_mulai as string) || null, keterangan: (r.keterangan as string) || null,
  }));
}

export async function createFormasi(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const unit_organisasi_id = (formData.get("unit_organisasi_id") as string || "").trim();
  const jabatan_id = (formData.get("jabatan_id") as string || "").trim();
  const keterangan = (formData.get("keterangan") as string || "").trim();

  if (!unit_organisasi_id || !jabatan_id) return { error: "Unit dan jabatan wajib dipilih." };

  const seniorityError = await checkKepalaUnitSeniority(unit_organisasi_id, jabatan_id);
  if (seniorityError) return seniorityError;

  const { count, error: countErr } = await supabaseAdmin
    .from("formasi_jabatan")
    .select("*", { count: "exact", head: true });
  if (countErr?.code === "42P01") return { error: MISSING_MIGRATION };

  const position_number = "P" + String((count || 0) + 1).padStart(3, "0");

  const id = uid();
  const { error } = await supabaseAdmin.from("formasi_jabatan").insert({
    id, position_number, unit_organisasi_id, jabatan_id,
    status: "Vacant", keterangan: keterangan || null,
  });
  if (error?.code === "42P01") return { error: MISSING_MIGRATION };
  if (error) { console.error("createFormasi error:", error); return { error: "Gagal membuat Position Number." }; }

  revalidatePath("/hrd/workplace/formasi");
  auditLog({ action: "formasi.create", targetId: id, targetName: position_number, performedBy: user });
  return { success: true, position_number };
}

export async function updateFormasi(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const id = (formData.get("id") as string || "").trim();
  const unit_organisasi_id = (formData.get("unit_organisasi_id") as string || "").trim();
  const jabatan_id = (formData.get("jabatan_id") as string || "").trim();
  const keterangan = (formData.get("keterangan") as string || "").trim();

  if (!id || !unit_organisasi_id || !jabatan_id) return { error: "Unit dan jabatan wajib dipilih." };

  const seniorityError = await checkKepalaUnitSeniority(unit_organisasi_id, jabatan_id);
  if (seniorityError) return seniorityError;

  // Needed before the update to know whether this Position Number is
  // currently occupied — if it is, the occupant's record must be kept in
  // sync below (previously only assignKaryawan did this; editing a Filled
  // formasi's jabatan/unit here left the employee's position/department
  // text fields — and, via jabatan.is_kepala_unit, the org chart's leader —
  // silently desynced from the formasi they actually hold).
  const { data: before } = await supabaseAdmin.from("formasi_jabatan").select("status, karyawan_id").eq("id", id).maybeSingle();
  const occupantId = (before as { status?: string; karyawan_id?: string | null } | null)?.status === "Filled"
    ? (before as { karyawan_id?: string | null }).karyawan_id
    : null;

  const { error } = await supabaseAdmin.from("formasi_jabatan").update({
    unit_organisasi_id, jabatan_id, keterangan: keterangan || null, updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: "Gagal mengupdate Position Number." };

  if (occupantId) {
    const [{ data: jabatan }, { data: unit }] = await Promise.all([
      supabaseAdmin.from("jabatan").select("name, code").eq("id", jabatan_id).maybeSingle(),
      supabaseAdmin.from("unit_organisasi").select("name").eq("id", unit_organisasi_id).maybeSingle(),
    ]);
    const jabatanName = (jabatan as { name?: string } | null)?.name || "";
    const jabatanCode = (jabatan as { code?: string } | null)?.code || "";
    const unitName = (unit as { name?: string } | null)?.name || "";
    const { error: karyawanErr } = await supabaseAdmin.from("karyawan").update({
      position: jabatanName, department: unitName, kode_jabatan: jabatanCode,
    }).eq("id", occupantId);
    if (karyawanErr) console.error("[formasi] updateFormasi: gagal sinkronkan data karyawan:", karyawanErr.message);
  }

  revalidatePath("/hrd/workplace/formasi");
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/infrastructure/employees");
  auditLog({ action: "formasi.update", targetId: id, performedBy: user });
  return { success: true };
}

export async function deleteFormasi(id: string) {
  const user = await requireRole("hrd", "superadmin");
  if (!id) return { error: "ID formasi wajib diisi." };

  const { data: row } = await supabaseAdmin.from("formasi_jabatan").select("status, position_number").eq("id", id).maybeSingle();
  if (!row) return { error: "Position Number tidak ditemukan." };
  if ((row as { status: string }).status === "Filled") {
    return { error: "Position Number ini masih terisi. Lepas penempatan karyawan terlebih dahulu." };
  }

  const { error } = await supabaseAdmin.from("formasi_jabatan").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus Position Number." };

  revalidatePath("/hrd/workplace/formasi");
  auditLog({ action: "formasi.delete", targetId: id, targetName: (row as { position_number: string }).position_number, performedBy: user });
  return { success: true };
}

/**
 * Employee Assignment: the one place a person actually gets attached to the
 * org design. Keeps karyawan.position/department (free text) in sync so
 * every other existing module — payroll, KPI, competency, reports — keeps
 * working unmodified, while the formasi_id/riwayat_posisi_karyawan tables
 * behind it hold the real FK trail.
 */
export async function assignKaryawan(formasiId: string, karyawanId: string) {
  const user = await requireRole("hrd", "superadmin");
  if (!formasiId || !karyawanId) return { error: "Position Number dan karyawan wajib dipilih." };

  const { data: formasi } = await supabaseAdmin.from("formasi_jabatan").select("*").eq("id", formasiId).maybeSingle();
  if (!formasi) return { error: "Position Number tidak ditemukan." };
  const f = formasi as Record<string, unknown>;
  if (f.status === "Filled") return { error: "Position Number ini sudah terisi." };

  const { data: existingAssignment } = await supabaseAdmin.from("karyawan").select("formasi_id").eq("id", karyawanId).maybeSingle();
  if ((existingAssignment as { formasi_id: string | null } | null)?.formasi_id) {
    return { error: "Karyawan ini sudah menempati Position Number lain. Lepas penempatan lamanya terlebih dahulu." };
  }

  const [{ data: jabatan }, { data: unit }] = await Promise.all([
    supabaseAdmin.from("jabatan").select("name, code").eq("id", f.jabatan_id as string).maybeSingle(),
    supabaseAdmin.from("unit_organisasi").select("name").eq("id", f.unit_organisasi_id as string).maybeSingle(),
  ]);
  const jabatanName = (jabatan as { name: string; code?: string } | null)?.name || "";
  const jabatanCode = (jabatan as { name: string; code?: string } | null)?.code || "";
  const unitName = (unit as { name: string } | null)?.name || "";
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  // Three sequential writes with no real transaction available (Supabase
  // REST client) — each is checked and, if a later one fails, the earlier
  // ones are compensated so a Position Number can never end up stuck showing
  // Filled with no employee actually pointing back to it (or vice versa).
  // The .eq("status","Vacant")/.is("formasi_id", null) conditions turn each
  // write into a compare-and-swap, closing the TOCTOU race where two
  // concurrent assignKaryawan calls both pass the SELECT-based checks above
  // before either write lands (which used to let both succeed, stranding
  // whichever employee lost the race with no way to unassign them).
  const { data: formasiRows, error: formasiErr } = await supabaseAdmin.from("formasi_jabatan").update({
    status: "Filled", karyawan_id: karyawanId, tanggal_mulai: today, updated_at: now,
  }).eq("id", formasiId).eq("status", "Vacant").select("id");
  if (formasiErr) { console.error("[formasi] assignKaryawan formasi update error:", formasiErr.message); return { error: "Gagal menempatkan karyawan." }; }
  if (!formasiRows || formasiRows.length === 0) return { error: "Position Number ini baru saja terisi oleh proses lain." };

  const { data: karyawanRows, error: karyawanErr } = await supabaseAdmin.from("karyawan").update({
    formasi_id: formasiId, position: jabatanName, department: unitName,
    kode_jabatan: jabatanCode,
  }).eq("id", karyawanId).is("formasi_id", null).select("id");
  if (!karyawanErr && (!karyawanRows || karyawanRows.length === 0)) {
    console.error("[formasi] assignKaryawan: karyawan already had a formasi_id (race lost)");
    await supabaseAdmin.from("formasi_jabatan").update({
      status: "Vacant", karyawan_id: null, tanggal_mulai: null, updated_at: new Date().toISOString(),
    }).eq("id", formasiId);
    return { error: "Karyawan ini baru saja ditempatkan di Position Number lain oleh proses lain. Perubahan dibatalkan." };
  }
  if (karyawanErr) {
    console.error("[formasi] assignKaryawan karyawan update error:", karyawanErr.message);
    await supabaseAdmin.from("formasi_jabatan").update({
      status: "Vacant", karyawan_id: null, tanggal_mulai: null, updated_at: new Date().toISOString(),
    }).eq("id", formasiId);
    return { error: "Gagal menempatkan karyawan. Perubahan dibatalkan." };
  }

  const { error: riwayatErr } = await supabaseAdmin.from("riwayat_posisi_karyawan").insert({
    id: "riw-" + crypto.randomUUID(), karyawan_id: karyawanId, formasi_id: formasiId,
    jabatan_id: f.jabatan_id, unit_organisasi_id: f.unit_organisasi_id,
    jenis_perubahan: "Penempatan", tanggal_mulai: today, created_by: user.name || user.email,
  });
  if (riwayatErr) {
    console.error("[formasi] assignKaryawan riwayat insert error:", riwayatErr.message);
    await supabaseAdmin.from("formasi_jabatan").update({
      status: "Vacant", karyawan_id: null, tanggal_mulai: null, updated_at: new Date().toISOString(),
    }).eq("id", formasiId);
    await supabaseAdmin.from("karyawan").update({ formasi_id: null }).eq("id", karyawanId);
    return { error: "Gagal mencatat riwayat penempatan. Perubahan dibatalkan." };
  }

  revalidatePath("/hrd/workplace/formasi");
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/infrastructure/employees");
  auditLog({ action: "formasi.assign", targetId: formasiId, targetName: jabatanName, performedBy: user, detail: `Karyawan: ${karyawanId}` });
  return { success: true };
}

export async function unassignKaryawan(formasiId: string) {
  const user = await requireRole("hrd", "superadmin");
  if (!formasiId) return { error: "Position Number wajib diisi." };

  const { data: formasi } = await supabaseAdmin.from("formasi_jabatan").select("karyawan_id").eq("id", formasiId).maybeSingle();
  if (!formasi) return { error: "Position Number tidak ditemukan." };
  const karyawanId = (formasi as { karyawan_id: string | null }).karyawan_id;

  const { error: formasiErr } = await supabaseAdmin.from("formasi_jabatan").update({
    status: "Vacant", karyawan_id: null, tanggal_mulai: null, updated_at: new Date().toISOString(),
  }).eq("id", formasiId);
  if (formasiErr) { console.error("[formasi] unassignKaryawan formasi update error:", formasiErr.message); return { error: "Gagal melepas penempatan." }; }

  if (karyawanId) {
    const { error: karyawanErr } = await supabaseAdmin.from("karyawan").update({ formasi_id: null }).eq("id", karyawanId);
    if (karyawanErr) {
      console.error("[formasi] unassignKaryawan karyawan update error:", karyawanErr.message);
      // Position Number is already Vacant at this point — leaving it that
      // way (rather than re-Filling it) is the safer failure mode, since
      // re-Filling could race with someone else assigning it in the
      // meantime. Surface the error so HRD knows to fix karyawan.formasi_id
      // manually instead of assuming the unassign fully succeeded.
      return { error: "Position Number berhasil dikosongkan, tapi gagal melepas relasi pada data karyawan. Hubungi admin." };
    }
    await supabaseAdmin.from("riwayat_posisi_karyawan")
      .update({ tanggal_selesai: new Date().toISOString().slice(0, 10) })
      .eq("formasi_id", formasiId).eq("karyawan_id", karyawanId).is("tanggal_selesai", null);
  }

  revalidatePath("/hrd/workplace/formasi");
  revalidatePath("/hrd/workplace/structure");
  auditLog({ action: "formasi.unassign", targetId: formasiId, performedBy: user });
  return { success: true };
}

export async function getUnassignedActiveEmployees(): Promise<{ id: string; full_name: string; position: string; department: string }[]> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("karyawan")
    .select("id, full_name, position, department, formasi_id")
    .neq("status", "Inactive")
    .is("formasi_id", null)
    .order("full_name");
  return ((data || []) as { id: string; full_name: string; position: string; department: string }[]);
}
