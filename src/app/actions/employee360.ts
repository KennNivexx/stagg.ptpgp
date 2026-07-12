"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const revalidateProfile = (id: string) => revalidatePath(`/hrd/infrastructure/employees/${id}`);

/**
 * Two separate employee-ID spaces exist in this schema: karyawan.id (HRD-
 * assigned records: contracts, competency, KPI, ...) vs pengguna.id (the
 * self-service session id: attendance, leave, complaints, resignation,
 * survey answers, incident reports). Same person, different UUID — resolve
 * via email match before querying the self-service tables, or every one of
 * those tabs silently comes back empty.
 */
async function resolvePenggunaId(email: string): Promise<string | null> {
  if (!email) return null;
  const { data } = await supabaseAdmin.from("pengguna").select("id").eq("email", email).maybeSingle();
  return (data as { id: string } | null)?.id || null;
}

export async function getEmployee360(karyawanId: string) {
  await requireRole("hrd", "superadmin");

  const { data: karyawan } = await supabaseAdmin.from("karyawan").select("*").eq("id", karyawanId).maybeSingle();
  if (!karyawan) return null;
  const k = karyawan as Record<string, unknown>;
  const email = (k.email as string) || "";
  const penggunaId = await resolvePenggunaId(email);

  const [
    // Personal Information (new tables)
    { data: pendidikan }, { data: keluarga },
    // Education & Recruitment
    { data: pelamar }, { data: sertifikat }, { data: peserta },
    // Employment
    { data: kontrak }, { data: riwayatPosisi }, { data: proyek },
    // Performance
    { data: kpi }, { data: feedback }, { data: rencana },
    // Compensation & Benefit
    { data: penggajianRows }, { data: strukturGaji },
    // Attendance (self-service space)
    absensiRes, cutiRes,
    // Health & Safety (self-service space)
    insidenRes,
    // Asset Management
    { data: aset },
    // Document Center
    { data: dokumen },
    // Employee Experience (self-service space)
    surveiRes, keluhanRes,
    // Offboarding (self-service space)
    resignRes,
    // Reward / Disiplin / Talent (Employment + Performance groups)
    { data: penghargaan }, { data: peringatan }, { data: kandidatSuksesor }, { data: poolSuksesi },
    { data: mutasi }, { data: promosi }, { data: kompetensi },
  ] = await Promise.all([
    supabaseAdmin.from("pendidikan_karyawan").select("*").eq("karyawan_id", karyawanId).order("created_at", { ascending: false }),
    supabaseAdmin.from("keluarga_karyawan").select("*").eq("karyawan_id", karyawanId).order("created_at", { ascending: false }),
    email ? supabaseAdmin.from("pelamar").select("*").ilike("email", email).maybeSingle() : Promise.resolve({ data: null }),
    supabaseAdmin.from("sertifikat_pelatihan").select("*").eq("employee_id", karyawanId),
    supabaseAdmin.from("peserta_pelatihan").select("*").eq("employee_id", karyawanId),
    supabaseAdmin.from("kontrak_kerja").select("*").eq("employee_id", karyawanId).order("created_at", { ascending: false }),
    supabaseAdmin.from("riwayat_posisi_karyawan").select("*").eq("karyawan_id", karyawanId).order("tanggal_mulai", { ascending: false }),
    supabaseAdmin.from("pengalaman_proyek_karyawan").select("*").eq("karyawan_id", karyawanId).order("created_at", { ascending: false }),
    supabaseAdmin.from("evaluasi_kpi").select("*").eq("employee_id", karyawanId).order("created_at", { ascending: false }),
    supabaseAdmin.from("umpan_balik_kinerja").select("*").eq("employee_id", karyawanId).order("created_at", { ascending: false }),
    supabaseAdmin.from("rencana_pengembangan").select("*").eq("employee_id", karyawanId),
    supabaseAdmin.from("penggajian").select("*").eq("employee_id", karyawanId).order("year", { ascending: false }).order("month", { ascending: false }),
    supabaseAdmin.from("struktur_gaji").select("*").eq("employee_id", karyawanId).maybeSingle(),
    penggunaId ? supabaseAdmin.from("absensi").select("*").eq("employee_id", penggunaId).order("created_at", { ascending: false }).limit(30) : Promise.resolve({ data: [] }),
    penggunaId ? supabaseAdmin.from("pengajuan_cuti").select("*").eq("employee_id", penggunaId).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    penggunaId ? supabaseAdmin.from("laporan_insiden").select("*").eq("employee_id", penggunaId).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    supabaseAdmin.from("aset_karyawan").select("*").eq("karyawan_id", karyawanId).order("created_at", { ascending: false }),
    supabaseAdmin.from("dokumen_karyawan").select("*").eq("karyawan_id", karyawanId).order("created_at", { ascending: false }),
    penggunaId ? supabaseAdmin.from("jawaban_survei").select("*").eq("employee_id", penggunaId) : Promise.resolve({ data: [] }),
    penggunaId ? supabaseAdmin.from("keluhan").select("*").eq("employee_id", penggunaId).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    penggunaId ? supabaseAdmin.from("pengunduran_diri").select("*").eq("employee_id", penggunaId).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    supabaseAdmin.from("penghargaan_karyawan").select("*").eq("employee_id", karyawanId).order("created_at", { ascending: false }),
    supabaseAdmin.from("surat_peringatan").select("*").eq("employee_id", karyawanId).order("created_at", { ascending: false }),
    supabaseAdmin.from("kandidat_suksesor").select("*").eq("employee_id", karyawanId).maybeSingle(),
    supabaseAdmin.from("pool_suksesi").select("*").eq("employee_id", karyawanId).maybeSingle(),
    supabaseAdmin.from("mutasi_karir").select("*").eq("employee_id", karyawanId).order("created_at", { ascending: false }),
    supabaseAdmin.from("promosi_karir").select("*").eq("employee_id", karyawanId).order("created_at", { ascending: false }),
    supabaseAdmin.from("kompetensi_karyawan").select("*").eq("employee_id", karyawanId),
  ]);

  return {
    karyawan: k,
    personal: { pendidikan: pendidikan || [], keluarga: keluarga || [] },
    recruitment: { pelamar: pelamar || null, sertifikat: sertifikat || [], peserta: peserta || [] },
    employment: { kontrak: kontrak || [], riwayatPosisi: riwayatPosisi || [], proyek: proyek || [], mutasi: mutasi || [], promosi: promosi || [] },
    performance: { kpi: kpi || [], feedback: feedback || [], rencana: rencana || [], kompetensi: kompetensi || [], penghargaan: penghargaan || [], peringatan: peringatan || [], kandidatSuksesor: kandidatSuksesor || null, poolSuksesi: poolSuksesi || null },
    compensation: { penggajian: penggajianRows || [], strukturGaji: strukturGaji || null },
    attendance: { absensi: absensiRes.data || [], cuti: cutiRes.data || [] },
    health: { insiden: insidenRes.data || [] },
    asset: { aset: aset || [] },
    document: { dokumen: dokumen || [] },
    experience: { survei: surveiRes.data || [], keluhan: keluhanRes.data || [] },
    offboarding: { resign: resignRes.data || [] },
  };
}

/* ─────── Personal: Pendidikan ─────── */
export async function addEducation(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const karyawan_id = (formData.get("karyawan_id") as string || "").trim();
  const jenjang = (formData.get("jenjang") as string || "").trim();
  const institusi = (formData.get("institusi") as string || "").trim();
  const jurusan = (formData.get("jurusan") as string || "").trim() || null;
  const tahun_lulus = (formData.get("tahun_lulus") as string || "").trim() || null;
  if (!karyawan_id || !jenjang || !institusi) return { error: "Jenjang dan institusi wajib diisi." };

  const { error } = await supabaseAdmin.from("pendidikan_karyawan").insert({ id: uid("edu"), karyawan_id, jenjang, institusi, jurusan, tahun_lulus });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260712002_employee360.sql terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan pendidikan." };
  revalidateProfile(karyawan_id);
  return { success: true };
}

export async function deleteEducation(id: string, karyawanId: string) {
  await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("pendidikan_karyawan").delete().eq("id", id);
  revalidateProfile(karyawanId);
  return { success: true };
}

/* ─────── Personal: Keluarga ─────── */
export async function addFamilyMember(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const karyawan_id = (formData.get("karyawan_id") as string || "").trim();
  const nama = (formData.get("nama") as string || "").trim();
  const hubungan = (formData.get("hubungan") as string || "").trim();
  const tanggal_lahir = (formData.get("tanggal_lahir") as string || "").trim() || null;
  const pekerjaan = (formData.get("pekerjaan") as string || "").trim() || null;
  if (!karyawan_id || !nama || !hubungan) return { error: "Nama dan hubungan wajib diisi." };

  const { error } = await supabaseAdmin.from("keluarga_karyawan").insert({ id: uid("fam"), karyawan_id, nama, hubungan, tanggal_lahir, pekerjaan });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260712002_employee360.sql terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan data keluarga." };
  revalidateProfile(karyawan_id);
  return { success: true };
}

export async function deleteFamilyMember(id: string, karyawanId: string) {
  await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("keluarga_karyawan").delete().eq("id", id);
  revalidateProfile(karyawanId);
  return { success: true };
}

/* ─────── Employment: Project Experience ─────── */
export async function addProjectExperience(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const karyawan_id = (formData.get("karyawan_id") as string || "").trim();
  const nama_proyek = (formData.get("nama_proyek") as string || "").trim();
  const peran = (formData.get("peran") as string || "").trim() || null;
  const klien = (formData.get("klien") as string || "").trim() || null;
  const tanggal_mulai = (formData.get("tanggal_mulai") as string || "").trim() || null;
  const tanggal_selesai = (formData.get("tanggal_selesai") as string || "").trim() || null;
  const deskripsi = (formData.get("deskripsi") as string || "").trim() || null;
  if (!karyawan_id || !nama_proyek) return { error: "Nama proyek wajib diisi." };

  const { error } = await supabaseAdmin.from("pengalaman_proyek_karyawan").insert({
    id: uid("proj"), karyawan_id, nama_proyek, peran, klien, tanggal_mulai, tanggal_selesai, deskripsi,
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260712002_employee360.sql terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan pengalaman proyek." };
  revalidateProfile(karyawan_id);
  return { success: true };
}

export async function deleteProjectExperience(id: string, karyawanId: string) {
  await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("pengalaman_proyek_karyawan").delete().eq("id", id);
  revalidateProfile(karyawanId);
  return { success: true };
}

/* ─────── Asset Management ─────── */
export async function addCompanyAsset(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const karyawan_id = (formData.get("karyawan_id") as string || "").trim();
  const nama_aset = (formData.get("nama_aset") as string || "").trim();
  const kategori = (formData.get("kategori") as string || "").trim() || null;
  const nomor_seri = (formData.get("nomor_seri") as string || "").trim() || null;
  const tanggal_serah = (formData.get("tanggal_serah") as string || "").trim() || null;
  if (!karyawan_id || !nama_aset) return { error: "Nama aset wajib diisi." };

  const { error } = await supabaseAdmin.from("aset_karyawan").insert({
    id: uid("aset"), karyawan_id, nama_aset, kategori, nomor_seri, tanggal_serah, status: "Dipegang",
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260712002_employee360.sql terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan aset." };
  revalidateProfile(karyawan_id);
  return { success: true };
}

export async function updateAssetStatus(id: string, karyawanId: string, status: "Dipegang" | "Dikembalikan") {
  await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("aset_karyawan").update({ status }).eq("id", id);
  revalidateProfile(karyawanId);
  return { success: true };
}

export async function deleteCompanyAsset(id: string, karyawanId: string) {
  await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("aset_karyawan").delete().eq("id", id);
  revalidateProfile(karyawanId);
  return { success: true };
}

/* ─────── Document Center ─────── */
export async function addPersonalDocument(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const karyawan_id = (formData.get("karyawan_id") as string || "").trim();
  const jenis = (formData.get("jenis") as string || "").trim();
  const judul = (formData.get("judul") as string || "").trim();
  const file_url = (formData.get("file_url") as string || "").trim() || null;
  const catatan = (formData.get("catatan") as string || "").trim() || null;
  if (!karyawan_id || !jenis || !judul) return { error: "Jenis dan judul dokumen wajib diisi." };

  const { error } = await supabaseAdmin.from("dokumen_karyawan").insert({ id: uid("doc"), karyawan_id, jenis, judul, file_url, catatan });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260712002_employee360.sql terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan dokumen." };
  revalidateProfile(karyawan_id);
  return { success: true };
}

export async function deletePersonalDocument(id: string, karyawanId: string) {
  await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("dokumen_karyawan").delete().eq("id", id);
  revalidateProfile(karyawanId);
  return { success: true };
}

/* ─────── BPJS ─────── */
export async function saveBpjsInfo(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const karyawan_id = (formData.get("karyawan_id") as string || "").trim();
  const bpjs_kesehatan_no = (formData.get("bpjs_kesehatan_no") as string || "").trim() || null;
  const bpjs_tk_no = (formData.get("bpjs_tk_no") as string || "").trim() || null;
  if (!karyawan_id) return { error: "ID karyawan wajib diisi." };

  const { error } = await supabaseAdmin.from("karyawan").update({ bpjs_kesehatan_no, bpjs_tk_no }).eq("id", karyawan_id);
  if (error?.code === "PGRST204") return { error: "Jalankan migrasi 20260712002_employee360.sql terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan data BPJS." };
  revalidateProfile(karyawan_id);
  return { success: true };
}
