"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";

/** PR-PRL-01 Pengendalian Peralatan — General Affair module, tables
 * peralatan_kendaraan / form_pengeluaran_barang (FPB) from
 * 20260816001_general_affair.sql. */

const uid = (prefix: string) => `${prefix}-` + crypto.randomUUID();

export interface Peralatan {
  id: string;
  nama_peralatan: string;
  jenis: string | null;
  kendaraan_atau_lokasi: string | null;
  jumlah_stok: number;
  satuan: string;
  fifo_color: "Hijau" | "Kuning" | "Merah" | null;
  created_at: string;
  updated_at: string;
}

export interface FormPengeluaranBarang {
  id: string;
  peralatan_id: string;
  jenis: "Peminjaman" | "Pengeluaran";
  jumlah: number;
  peminjam: string | null;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string | null;
  tanggal_kembali_aktual: string | null;
  status: "Dipinjam" | "Dikembalikan" | "Rusak/Hilang";
  catatan_berita_acara: string | null;
  approved_by: string | null;
  created_at: string;
}

export async function getPeralatan(): Promise<Peralatan[]> {
  await requireRole("hrd", "superadmin", "department_manager");
  const { data, error } = await supabaseAdmin.from("peralatan_kendaraan").select("*").order("nama_peralatan");
  if (error) { console.error("[ga-peralatan] getPeralatan error:", error.message); return []; }
  return (data as Peralatan[]) || [];
}

export async function createPeralatan(formData: FormData): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin");
  const nama_peralatan = (formData.get("nama_peralatan") as string || "").trim();
  const jenis = (formData.get("jenis") as string || "").trim() || null;
  const kendaraan_atau_lokasi = (formData.get("kendaraan_atau_lokasi") as string || "").trim() || null;
  const jumlah_stok = parseInt((formData.get("jumlah_stok") as string || "0").trim()) || 0;
  const satuan = (formData.get("satuan") as string || "unit").trim();
  const fifo_color = (formData.get("fifo_color") as string || "").trim() || null;

  if (!nama_peralatan) return { error: "Nama peralatan wajib diisi." };

  const { error } = await supabaseAdmin.from("peralatan_kendaraan").insert({
    id: uid("prl"), nama_peralatan, jenis, kendaraan_atau_lokasi, jumlah_stok, satuan,
    fifo_color, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (error) { console.error("[ga-peralatan] createPeralatan error:", error.message); return { error: "Gagal menyimpan peralatan." }; }

  await auditLog({ action: "ga.peralatan.create", targetName: nama_peralatan, performedBy: user });
  revalidatePath("/hrd/ga/peralatan");
  return { success: true };
}

export async function getFpbLog(): Promise<FormPengeluaranBarang[]> {
  await requireRole("hrd", "superadmin", "department_manager");
  const { data, error } = await supabaseAdmin.from("form_pengeluaran_barang").select("*").order("created_at", { ascending: false });
  if (error) { console.error("[ga-peralatan] getFpbLog error:", error.message); return []; }
  return (data as FormPengeluaranBarang[]) || [];
}

export async function recordFPB(formData: FormData): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  const peralatan_id = (formData.get("peralatan_id") as string || "").trim();
  const jenis = (formData.get("jenis") as string || "").trim();
  const jumlah = parseInt((formData.get("jumlah") as string || "1").trim()) || 1;
  const peminjam = (formData.get("peminjam") as string || "").trim() || null;
  const tanggal_kembali_rencana = (formData.get("tanggal_kembali_rencana") as string || "").trim() || null;

  if (!peralatan_id) return { error: "Peralatan wajib dipilih." };
  if (!["Peminjaman", "Pengeluaran"].includes(jenis)) return { error: "Jenis transaksi tidak valid." };

  const { data: item, error: itemError } = await supabaseAdmin.from("peralatan_kendaraan").select("jumlah_stok").eq("id", peralatan_id).maybeSingle();
  if (itemError?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  const stok = (item as { jumlah_stok?: number } | null)?.jumlah_stok ?? 0;
  if (stok < jumlah) return { error: "Stok tidak mencukupi." };

  const { error } = await supabaseAdmin.from("form_pengeluaran_barang").insert({
    id: uid("fpb"), peralatan_id, jenis, jumlah, peminjam,
    tanggal_pinjam: new Date().toISOString().split("T")[0], tanggal_kembali_rencana,
    status: "Dipinjam", created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (error) { console.error("[ga-peralatan] recordFPB error:", error.message); return { error: "Gagal mencatat transaksi." }; }

  await supabaseAdmin.from("peralatan_kendaraan").update({
    jumlah_stok: stok - jumlah, updated_at: new Date().toISOString(),
  }).eq("id", peralatan_id);

  await auditLog({ action: "ga.peralatan.fpb_create", targetId: peralatan_id, performedBy: user, detail: `${jenis} x${jumlah}` });
  revalidatePath("/hrd/ga/peralatan");
  return { success: true };
}

export async function returnFPB(id: string, kondisi: "Dikembalikan" | "Rusak/Hilang", catatan?: string): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  if (!["Dikembalikan", "Rusak/Hilang"].includes(kondisi)) return { error: "Status pengembalian tidak valid." };
  if (kondisi === "Rusak/Hilang" && !catatan?.trim()) return { error: "Berita acara wajib diisi untuk barang rusak/hilang." };

  const { data: fpb, error: fpbError } = await supabaseAdmin.from("form_pengeluaran_barang").select("peralatan_id, jumlah, status").eq("id", id).maybeSingle();
  if (fpbError?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (!fpb) return { error: "Data transaksi tidak ditemukan." };
  const row = fpb as { peralatan_id: string; jumlah: number; status: string };
  if (row.status !== "Dipinjam") return { error: "Transaksi ini sudah diselesaikan." };

  const { error } = await supabaseAdmin.from("form_pengeluaran_barang").update({
    status: kondisi, tanggal_kembali_aktual: new Date().toISOString().split("T")[0],
    catatan_berita_acara: catatan?.trim() || null,
  }).eq("id", id);
  if (error) { console.error("[ga-peralatan] returnFPB error:", error.message); return { error: "Gagal memproses pengembalian." }; }

  // Rusak/Hilang tetap mengembalikan unit ke stok fisik (ganti rugi ditangani
  // di luar sistem lewat catatan_berita_acara), sama seperti pengembalian normal.
  const { data: item } = await supabaseAdmin.from("peralatan_kendaraan").select("jumlah_stok").eq("id", row.peralatan_id).maybeSingle();
  const stok = (item as { jumlah_stok?: number } | null)?.jumlah_stok ?? 0;
  await supabaseAdmin.from("peralatan_kendaraan").update({
    jumlah_stok: stok + row.jumlah, updated_at: new Date().toISOString(),
  }).eq("id", row.peralatan_id);

  await auditLog({ action: "ga.peralatan.fpb_return", targetId: id, performedBy: user, detail: kondisi });
  revalidatePath("/hrd/ga/peralatan");
  return { success: true };
}

/** Perpanjangan waktu pinjam — persetujuan Ka Div Operasional sesuai SOP. */
export async function extendLoan(id: string, newTanggalKembali: string): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  if (!newTanggalKembali) return { error: "Tanggal kembali baru wajib diisi." };

  const { error } = await supabaseAdmin.from("form_pengeluaran_barang").update({
    tanggal_kembali_rencana: newTanggalKembali, approved_by: user.email,
  }).eq("id", id);
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (error) { console.error("[ga-peralatan] extendLoan error:", error.message); return { error: "Gagal memperpanjang waktu pinjam." }; }

  await auditLog({ action: "ga.peralatan.fpb_extend", targetId: id, performedBy: user, detail: newTanggalKembali });
  revalidatePath("/hrd/ga/peralatan");
  return { success: true };
}
