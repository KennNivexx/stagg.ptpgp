"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";

const MISSING_TABLE = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === "42P01" || error.code === "PGRST205" || /relation .* does not exist|could not find the table/i.test(error.message || ""));
const MIGRATION_ERROR = "Jalankan migrasi 20260818005_kasbon.sql terlebih dahulu.";

export interface KasbonRow {
  id: string;
  employee_id: string;
  jumlah_pengajuan: number;
  alasan: string | null;
  jumlah_cicilan: number;
  cicilan_per_bulan: number;
  status: "Diajukan" | "Disetujui" | "Ditolak" | "Berjalan" | "Lunas" | "Dibatalkan";
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  sisa_pokok: number;
  full_name?: string;
  department?: string;
}

async function resolveEmployeeIdByEmail(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from("karyawan").select("id").eq("email", email.toLowerCase()).maybeSingle();
  return (data as { id: string } | null)?.id || null;
}

/** Attaches the derived remaining balance (jumlah_pengajuan - sum of
 * Terpotong installments) — see 20260818005_kasbon.sql for why this is
 * never a stored column. */
async function withSisaPokok(rows: Record<string, unknown>[]): Promise<KasbonRow[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id as string);
  const { data: cicilanRows } = await supabaseAdmin.from("kasbon_cicilan").select("kasbon_id, jumlah, status").in("kasbon_id", ids);
  const paidByKasbon = new Map<string, number>();
  for (const c of (cicilanRows || []) as { kasbon_id: string; jumlah: number; status: string }[]) {
    if (c.status !== "Terpotong") continue;
    paidByKasbon.set(c.kasbon_id, (paidByKasbon.get(c.kasbon_id) || 0) + (Number(c.jumlah) || 0));
  }
  return rows.map((r) => {
    const karyawan = r.karyawan as { full_name?: string; department?: string } | { full_name?: string; department?: string }[] | undefined;
    const empRow = Array.isArray(karyawan) ? karyawan[0] : karyawan;
    const paid = paidByKasbon.get(r.id as string) || 0;
    return {
      id: r.id, employee_id: r.employee_id, jumlah_pengajuan: r.jumlah_pengajuan, alasan: r.alasan,
      jumlah_cicilan: r.jumlah_cicilan, cicilan_per_bulan: r.cicilan_per_bulan, status: r.status,
      approved_by_name: r.approved_by_name, approved_at: r.approved_at, rejection_reason: r.rejection_reason,
      created_at: r.created_at,
      sisa_pokok: Math.max(0, (Number(r.jumlah_pengajuan) || 0) - paid),
      full_name: empRow?.full_name, department: empRow?.department,
    } as KasbonRow;
  });
}

export async function submitKasbon(formData: FormData): Promise<{ error: string } | { success: true }> {
  const actor = await requireRole("employee", "department_manager");
  const jumlah = Number(formData.get("jumlah_pengajuan")) || 0;
  const jumlahCicilan = parseInt((formData.get("jumlah_cicilan") as string) || "0", 10);
  const alasan = ((formData.get("alasan") as string) || "").trim();
  // Ceiling as well as floor: without an upper bound, `1e15` passes both the
  // app check and the DB's `check (jumlah_pengajuan > 0)`, and nothing floors
  // net_salary at 0 downstream if such a request were ever approved.
  const MAX_KASBON = 500_000_000;
  if (!Number.isFinite(jumlah) || jumlah <= 0) return { error: "Jumlah pengajuan harus lebih dari 0." };
  if (jumlah > MAX_KASBON) return { error: `Jumlah pengajuan melebihi batas maksimal (Rp ${MAX_KASBON.toLocaleString("id-ID")}).` };
  if (!Number.isFinite(jumlahCicilan) || jumlahCicilan < 1 || jumlahCicilan > 24) return { error: "Jumlah cicilan harus antara 1-24 bulan." };
  if (!alasan) return { error: "Alasan pengajuan wajib diisi." };

  const employeeId = await resolveEmployeeIdByEmail(actor.email);
  if (!employeeId) return { error: "Data karyawan tidak ditemukan." };

  // .limit(1) + array check, NOT .maybeSingle(): maybeSingle() errors with
  // PGRST116 and returns data=null once 2+ active rows exist, which would
  // silently DISABLE this one-active-loan rule exactly when it's already
  // been violated. The partial unique index in 20260818007_kasbon_hardening.sql
  // is the real backstop against the check-then-insert race; this is the
  // friendly-message path.
  const { data: activeRows, error: activeErr } = await supabaseAdmin
    .from("kasbon").select("id").eq("employee_id", employeeId)
    .in("status", ["Diajukan", "Disetujui", "Berjalan"]).limit(1);
  if (MISSING_TABLE(activeErr)) return { error: MIGRATION_ERROR };
  if ((activeRows || []).length > 0) return { error: "Anda masih memiliki pengajuan kasbon yang aktif atau sedang berjalan." };

  const cicilanPerBulan = Math.round(jumlah / jumlahCicilan);
  const { error } = await supabaseAdmin.from("kasbon").insert({
    id: crypto.randomUUID(), employee_id: employeeId, jumlah_pengajuan: jumlah, alasan,
    jumlah_cicilan: jumlahCicilan, cicilan_per_bulan: cicilanPerBulan, status: "Diajukan",
    created_at: new Date().toISOString(),
  });
  if (MISSING_TABLE(error)) return { error: MIGRATION_ERROR };
  if (error) { console.error("[kasbon] submitKasbon error:", error.message); return { error: "Gagal mengajukan kasbon. Silakan coba lagi." }; }

  auditLog({ action: "kasbon.request", targetName: actor.name, performedBy: actor, detail: `Mengajukan kasbon Rp ${jumlah.toLocaleString("id-ID")} (${jumlahCicilan}x cicilan).` });
  revalidatePath("/employee/kasbon");
  revalidatePath("/hrd/rewards/kasbon");
  return { success: true };
}

export async function getMyKasbon(): Promise<KasbonRow[]> {
  const actor = await requireRole("employee", "department_manager");
  const employeeId = await resolveEmployeeIdByEmail(actor.email);
  if (!employeeId) return [];
  const { data, error } = await supabaseAdmin.from("kasbon").select("*").eq("employee_id", employeeId).order("created_at", { ascending: false });
  if (MISSING_TABLE(error) || !data) return [];
  return withSisaPokok(data as Record<string, unknown>[]);
}

export async function getKasbonRequests(): Promise<KasbonRow[]> {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("kasbon").select("*, karyawan!inner(full_name, department)")
    .order("created_at", { ascending: false }).limit(200);
  if (MISSING_TABLE(error) || !data) return [];
  return withSisaPokok(data as unknown as Record<string, unknown>[]);
}

export async function decideKasbon(id: string, decision: "Disetujui" | "Ditolak", rejectionReason?: string): Promise<{ error: string } | { success: true }> {
  const actor = await requireRole("hrd", "superadmin");
  const { data: existing, error: fetchErr } = await supabaseAdmin.from("kasbon").select("*").eq("id", id).maybeSingle();
  if (MISSING_TABLE(fetchErr)) return { error: MIGRATION_ERROR };
  if (!existing) return { error: "Pengajuan kasbon tidak ditemukan." };
  const row = existing as Record<string, unknown>;
  if (row.status !== "Diajukan") return { error: "Pengajuan ini sudah diproses sebelumnya." };

  if (decision === "Ditolak") {
    const reason = (rejectionReason || "").trim();
    if (!reason) return { error: "Alasan penolakan wajib diisi." };
    const { error } = await supabaseAdmin.from("kasbon").update({
      status: "Ditolak", approved_by_id: actor.id, approved_by_name: actor.name,
      approved_at: new Date().toISOString(), rejection_reason: reason,
    }).eq("id", id);
    if (error) { console.error("[kasbon] decideKasbon reject error:", error.message); return { error: "Gagal memproses." }; }
    auditLog({ action: "kasbon.reject", targetId: id, performedBy: actor, detail: `Kasbon ditolak: ${reason}` });
    revalidatePath("/hrd/rewards/kasbon");
    revalidatePath("/employee/kasbon");
    return { success: true };
  }

  // Approve. Order matters: CLAIM the row first with a compare-and-swap
  // (.eq("status","Diajukan") in the WHERE, returning the affected rows), and
  // only generate the installment schedule if this call is the one that won.
  // Doing the insert first — as this originally did — meant two concurrent
  // approvals could BOTH pass the status read above and BOTH insert a full
  // schedule, double-deducting the loan and corrupting sisa_pokok.
  const jumlah = Number(row.jumlah_pengajuan) || 0;
  const n = Math.max(1, Number(row.jumlah_cicilan) || 1);

  const { data: claimed, error } = await supabaseAdmin.from("kasbon").update({
    status: "Berjalan", approved_by_id: actor.id, approved_by_name: actor.name, approved_at: new Date().toISOString(),
  }).eq("id", id).eq("status", "Diajukan").select("id");
  if (error) { console.error("[kasbon] decideKasbon approve error:", error.message); return { error: "Gagal memproses." }; }
  if ((claimed || []).length === 0) return { error: "Pengajuan ini sudah diproses oleh pengguna lain." };

  // Remainder from integer division absorbed into the LAST installment so
  // sum(kasbon_cicilan.jumlah) === jumlah_pengajuan exactly (no rounding drift).
  const base = Math.floor(jumlah / n);
  const remainder = jumlah - base * n;
  const now = new Date();
  const cicilanRows = Array.from({ length: n }, (_, i) => {
    const target = new Date(now.getFullYear(), now.getMonth() + 1 + i, 1);
    return {
      id: crypto.randomUUID(), kasbon_id: id, employee_id: row.employee_id as string,
      periode_ke: i + 1, jumlah: base + (i === n - 1 ? remainder : 0),
      status: "Belum Dibayar", target_month: target.getMonth() + 1, target_year: target.getFullYear(),
    };
  });
  const { error: cicilanErr } = await supabaseAdmin.from("kasbon_cicilan").insert(cicilanRows);
  if (cicilanErr) {
    // Roll the claim back so the request doesn't get stranded as "Berjalan"
    // with no schedule attached — it returns to the approval queue instead.
    console.error("[kasbon] decideKasbon cicilan insert error:", cicilanErr.message);
    await supabaseAdmin.from("kasbon").update({ status: "Diajukan", approved_by_id: null, approved_by_name: null, approved_at: null }).eq("id", id);
    return { error: "Gagal membuat jadwal cicilan. Pengajuan dikembalikan ke antrian." };
  }

  auditLog({ action: "kasbon.approve", targetId: id, performedBy: actor, detail: `Kasbon Rp ${jumlah.toLocaleString("id-ID")} disetujui, ${n}x cicilan dijadwalkan mulai bulan depan.` });
  revalidatePath("/hrd/rewards/kasbon");
  revalidatePath("/employee/kasbon");
  return { success: true };
}
