"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";
import { buildTree } from "@/app/actions/org";

export interface StrukturVersi {
  id: string;
  nama: string;
  nomor_sk: string;
  tanggal_sk: string;
  tanggal_berlaku: string;
  versi: string;
  status: "Draft" | "Review" | "Approved" | "Archived";
  keterangan: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

const uid = () => "sk-" + crypto.randomUUID();
const MISSING_MIGRATION = "Jalankan migrasi 20260712001_org_design_overhaul.sql terlebih dahulu.";

export async function getStrukturVersions(): Promise<StrukturVersi[]> {
  await requireRole("hrd", "director", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("struktur_organisasi_versi")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as StrukturVersi[]) || [];
}

export async function createStrukturVersion(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const nama = (formData.get("nama") as string || "").trim();
  const nomor_sk = (formData.get("nomor_sk") as string || "").trim();
  const tanggal_sk = (formData.get("tanggal_sk") as string || "").trim();
  const tanggal_berlaku = (formData.get("tanggal_berlaku") as string || "").trim();
  const versi = (formData.get("versi") as string || "V1.0").trim();
  const keterangan = (formData.get("keterangan") as string || "").trim();

  if (!nama || !nomor_sk || !tanggal_sk || !tanggal_berlaku) {
    return { error: "Nama, Nomor SK, Tanggal SK, dan Tanggal Berlaku wajib diisi." };
  }

  const id = uid();
  const { error } = await supabaseAdmin.from("struktur_organisasi_versi").insert({
    id, nama, nomor_sk, tanggal_sk, tanggal_berlaku, versi,
    keterangan: keterangan || null, status: "Draft",
    created_by: user.name || user.email,
  });
  if (error?.code === "42P01") return { error: MISSING_MIGRATION };
  if (error) { console.error("createStrukturVersion error:", error); return { error: "Gagal membuat versi struktur." }; }

  revalidatePath("/hrd/workplace/sk");
  auditLog({ action: "orgsk.create", targetId: id, targetName: nama, performedBy: user, detail: `SK: ${nomor_sk}` });
  return { success: true, id };
}

export async function updateStrukturVersion(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const id = (formData.get("id") as string || "").trim();
  const nama = (formData.get("nama") as string || "").trim();
  const nomor_sk = (formData.get("nomor_sk") as string || "").trim();
  const tanggal_sk = (formData.get("tanggal_sk") as string || "").trim();
  const tanggal_berlaku = (formData.get("tanggal_berlaku") as string || "").trim();
  const versi = (formData.get("versi") as string || "V1.0").trim();
  const keterangan = (formData.get("keterangan") as string || "").trim();

  if (!id) return { error: "ID versi wajib diisi." };

  const { data: existing } = await supabaseAdmin.from("struktur_organisasi_versi").select("status").eq("id", id).maybeSingle();
  if (!existing) return { error: "Versi struktur tidak ditemukan." };
  if ((existing as { status: string }).status === "Approved" || (existing as { status: string }).status === "Archived") {
    return { error: "Versi yang sudah Approved/Archived tidak bisa diedit." };
  }

  const { error } = await supabaseAdmin.from("struktur_organisasi_versi").update({
    nama, nomor_sk, tanggal_sk, tanggal_berlaku, versi,
    keterangan: keterangan || null, updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) { console.error("updateStrukturVersion error:", error); return { error: "Gagal mengupdate versi struktur." }; }

  revalidatePath("/hrd/workplace/sk");
  auditLog({ action: "orgsk.update", targetId: id, targetName: nama, performedBy: user });
  return { success: true };
}

export async function submitForReview(id: string) {
  const user = await requireRole("hrd", "superadmin");
  if (!id) return { error: "ID versi wajib diisi." };

  const { error } = await supabaseAdmin.from("struktur_organisasi_versi")
    .update({ status: "Review", updated_at: new Date().toISOString() })
    .eq("id", id).eq("status", "Draft");
  if (error) return { error: "Gagal mengajukan review." };

  revalidatePath("/hrd/workplace/sk");
  auditLog({ action: "orgsk.submit", targetId: id, performedBy: user });
  return { success: true };
}

/** Approving a version archives every other currently-Approved version — only
 * one structure version is ever "live" at a time, matching the doc's
 * requirement that org design changes must trace back to a single governing SK. */
export async function approveStruktur(id: string) {
  const user = await requireRole("director", "superadmin");
  if (!id) return { error: "ID versi wajib diisi." };

  const { data: row } = await supabaseAdmin.from("struktur_organisasi_versi").select("nama, status").eq("id", id).maybeSingle();
  if (!row) return { error: "Versi struktur tidak ditemukan." };
  if ((row as { status: string }).status === "Approved") return { error: "Versi ini sudah Approved." };

  await supabaseAdmin.from("struktur_organisasi_versi")
    .update({ status: "Archived", updated_at: new Date().toISOString() })
    .eq("status", "Approved");

  // Snapshot the live org tree at the moment of approval so drift can be
  // detected later — approving an SK doesn't lock unit_organisasi/jabatan,
  // it just records what the structure looked like when this SK took effect.
  const snapshot_data = await buildTree();

  const { error } = await supabaseAdmin.from("struktur_organisasi_versi").update({
    status: "Approved", approved_by: user.name || user.email, approved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(), snapshot_data,
  }).eq("id", id);
  if (error) return { error: "Gagal menyetujui versi struktur." };

  revalidatePath("/hrd/workplace/sk");
  revalidatePath("/hrd/workplace/structure");
  auditLog({ action: "orgsk.approve", targetId: id, targetName: (row as { nama: string }).nama, performedBy: user });
  return { success: true };
}

export async function archiveStruktur(id: string) {
  const user = await requireRole("hrd", "superadmin");
  if (!id) return { error: "ID versi wajib diisi." };

  const { error } = await supabaseAdmin.from("struktur_organisasi_versi")
    .update({ status: "Archived", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Gagal mengarsipkan versi struktur." };

  revalidatePath("/hrd/workplace/sk");
  auditLog({ action: "orgsk.archive", targetId: id, performedBy: user });
  return { success: true };
}

export async function getActiveStrukturVersion(): Promise<StrukturVersi | null> {
  const { data } = await supabaseAdmin.from("struktur_organisasi_versi").select("*").eq("status", "Approved").maybeSingle();
  return (data as StrukturVersi) || null;
}

export interface StrukturSyncStatus {
  hasApprovedVersion: boolean;
  inSync: boolean;
  approvedVersionName: string | null;
  approvedVersionNomorSk: string | null;
}

/** Compares the live org tree against the snapshot taken when the currently
 * Approved SK version was signed off. Structural JSON equality is enough to
 * tell "unchanged" from "drifted" — this isn't meant to pinpoint what
 * changed, just to surface that org design has moved since the last SK. */
export async function getStrukturSyncStatus(): Promise<StrukturSyncStatus> {
  const { data } = await supabaseAdmin
    .from("struktur_organisasi_versi")
    .select("nama, nomor_sk, snapshot_data")
    .eq("status", "Approved")
    .maybeSingle();
  const approved = data as { nama: string; nomor_sk: string; snapshot_data: unknown } | null;

  if (!approved) {
    return { hasApprovedVersion: false, inSync: false, approvedVersionName: null, approvedVersionNomorSk: null };
  }
  if (!approved.snapshot_data) {
    // Approved before the snapshot column existed / migration not applied yet.
    return { hasApprovedVersion: true, inSync: false, approvedVersionName: approved.nama, approvedVersionNomorSk: approved.nomor_sk };
  }

  const currentTree = await buildTree();
  const inSync = JSON.stringify(currentTree) === JSON.stringify(approved.snapshot_data);
  return { hasApprovedVersion: true, inSync, approvedVersionName: approved.nama, approvedVersionNomorSk: approved.nomor_sk };
}
