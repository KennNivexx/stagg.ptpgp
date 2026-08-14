"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";

const revalidatePengiriman = () => {
  revalidatePath("/hrd/finance/pengiriman");
  revalidatePath("/hrd/reports/laba-rugi");
};

export async function getPengiriman(params?: { from?: string; to?: string; status?: string }) {
  await requireRole("hrd", "superadmin");
  let q = supabaseAdmin.from("pengiriman").select("*").order("tanggal", { ascending: false });
  if (params?.from) q = q.gte("tanggal", params.from);
  if (params?.to) q = q.lte("tanggal", params.to);
  if (params?.status) q = q.eq("status", params.status);
  const { data, error } = await q.limit(200);
  if (error?.code === "42P01") return [];
  return data || [];
}

export async function savePengiriman(formData: FormData) {
  const actor = await requireRole("hrd", "superadmin");
  const klien = (formData.get("klien") as string || "").trim();
  const tujuan = (formData.get("tujuan") as string || "").trim();
  const tanggal = (formData.get("tanggal") as string || "").trim();
  const nilaiRaw = (formData.get("nilai_omset") as string || "").trim();
  const nilai_omset = parseFloat(nilaiRaw);
  const deskripsi = (formData.get("deskripsi") as string || "").trim() || null;
  if (!klien || !tujuan || !tanggal || !nilaiRaw || Number.isNaN(nilai_omset) || nilai_omset < 0) {
    return { error: "Klien, tujuan, tanggal, dan nilai omset (angka valid) wajib diisi." };
  }

  const { data, error } = await supabaseAdmin.from("pengiriman").insert({
    klien, tujuan, tanggal, nilai_omset, deskripsi,
    dicatat_oleh_nama: actor.name, dicatat_oleh_email: actor.email,
  }).select("id").single();
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260818011_pengiriman_omset.sql terlebih dahulu." };
  if (error) { console.error("[pengiriman] savePengiriman error:", error.message); return { error: "Gagal menyimpan pengiriman." }; }

  await auditLog({
    action: "pengiriman.create", targetId: (data as { id: string }).id, targetName: klien,
    performedBy: actor, detail: `Pengiriman ke ${tujuan} untuk ${klien} dicatat, omset Rp ${nilai_omset.toLocaleString("id-ID")}.`,
  });

  revalidatePengiriman();
  return { success: true };
}

/** Voids a mis-entered row instead of deleting it, so it drops out of
 * getFinancialSummary's sum while the history stays auditable. */
export async function voidPengiriman(id: string) {
  const actor = await requireRole("hrd", "superadmin");
  const { data: row } = await supabaseAdmin.from("pengiriman").select("klien, status").eq("id", id).maybeSingle();
  if (!row) return { error: "Pengiriman tidak ditemukan." };
  const r = row as { klien: string; status: string };
  if (r.status === "Dibatalkan") return { error: "Pengiriman ini sudah dibatalkan sebelumnya." };

  await supabaseAdmin.from("pengiriman").update({ status: "Dibatalkan", updated_at: new Date().toISOString() }).eq("id", id);
  await auditLog({
    action: "pengiriman.update", targetId: id, targetName: r.klien,
    performedBy: actor, detail: `Pencatatan pengiriman untuk ${r.klien} dibatalkan.`,
  });

  revalidatePengiriman();
  return { success: true };
}

export interface FinancialSummary {
  periode: string;
  omset: number;
  biaya: { gaji: number; insentif_supir: number; perjalanan_dinas: number; total: number };
  laba_rugi: number;
}

/** Shared aggregation — called by both the Laba/Rugi dashboard page and the
 * HRD Copilot's get_financial_summary tool (same "one action, two callers"
 * pattern as getFleetExecutiveSummary). Defaults to the current month. */
export async function getFinancialSummary(month?: number, year?: number): Promise<FinancialSummary> {
  await requireRole("hrd", "superadmin");
  const now = new Date();
  const m = month || now.getMonth() + 1;
  const y = year || now.getFullYear();
  const periode = `${String(m).padStart(2, "0")}/${y}`;
  const from = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [{ data: omsetRows }, { data: payrollRows }, { data: insentifRows }, { data: dinasRows }] = await Promise.all([
    supabaseAdmin.from("pengiriman").select("nilai_omset").eq("status", "Selesai").gte("tanggal", from).lte("tanggal", to),
    supabaseAdmin.from("penggajian").select("gross_salary").eq("month", m).eq("year", y),
    supabaseAdmin.from("insentif").select("amount").eq("period", periode).eq("type", "incentive"),
    supabaseAdmin.from("perjalanan_dinas").select("estimasi_biaya").eq("status", "Disetujui").gte("start_date", from).lte("start_date", to),
  ]);

  const sum = (rows: unknown[] | null, key: string) =>
    ((rows || []) as Record<string, unknown>[]).reduce((s, r) => s + (Number(r[key]) || 0), 0);

  const omset = sum(omsetRows, "nilai_omset");
  const gaji = sum(payrollRows, "gross_salary");
  const insentif_supir = sum(insentifRows, "amount");
  const perjalanan_dinas = sum(dinasRows, "estimasi_biaya");
  const total = gaji + insentif_supir + perjalanan_dinas;

  return { periode, omset, biaya: { gaji, insentif_supir, perjalanan_dinas, total }, laba_rugi: omset - total };
}
