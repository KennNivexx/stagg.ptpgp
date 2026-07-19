import { supabaseAdmin } from "@/lib/supabase";

const MISSING_COLUMN = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === "PGRST204" || /column .* does not exist|could not find the .* column/i.test(error.message || ""));

/** VAC-YYYY-NNNNNN, sequential within the year — the spec-required vacancy
 * identifier (Recruitment Framework §2). */
export async function generateVacancyNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabaseAdmin
    .from("lowongan_kerja")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
    .lt("created_at", `${year + 1}-01-01`);
  const seq = (count || 0) + 1;
  return `VAC-${year}-${String(seq).padStart(6, "0")}`;
}

/** Internal Candidate Validation (Recruitment Framework §3): before a
 * vacancy is published externally, check the talent pool for an employee
 * already earmarked for this position. Matches by jabatan name == the
 * vacancy's position title — the same loose name-matching this codebase
 * already uses elsewhere for jabatan lookups (career-hrd.ts, career-
 * development.ts), since lowongan_kerja.position is free text, not an FK. */
async function findInternalCandidates(position: string): Promise<{ id: string; full_name: string }[]> {
  if (!position) return [];
  const { data: jabatan } = await supabaseAdmin.from("jabatan").select("id").eq("name", position).maybeSingle();
  const jabatanId = (jabatan as { id?: string } | null)?.id;
  if (!jabatanId) return [];
  const { data: pool } = await supabaseAdmin.from("talent_pools")
    .select("karyawan_id, status, karyawan!talent_pools_karyawan_id_fkey(full_name)")
    .eq("target_jabatan_id", jabatanId)
    .not("status", "in", "(Withdrawn,Rejected)");
  return ((pool || []) as { karyawan_id: string; karyawan?: { full_name?: string } | { full_name?: string }[] }[]).map(p => {
    const k = Array.isArray(p.karyawan) ? p.karyawan[0] : p.karyawan;
    return { id: p.karyawan_id, full_name: k?.full_name || "-" };
  });
}

/** Inserts a lowongan_kerja row with a generated vacancy_number, falling
 * back to a plain insert if the vacancy_number column doesn't exist yet
 * (migration 20260807001_vacancy_number.sql not applied) — same defensive
 * pattern as MISSING_REWARDS_SCHEMA elsewhere in this codebase, so this
 * doesn't hard-break vacancy creation while the migration is pending.
 *
 * Also gates external publication on internal candidate availability: if a
 * talent-pool match exists for this position, the vacancy is created as
 * "Internal Review" (hidden from the public /career page, which only shows
 * status "Open") instead of immediately going external — HR reviews the
 * internal candidate(s) and calls openVacancyExternally() to publish if
 * none of them pan out. Pass forceExternal to skip this (e.g. HR already
 * knows external sourcing is needed). */
export async function insertVacancyWithNumber(payload: Record<string, unknown>, forceExternal = false) {
  const vacancy_number = await generateVacancyNumber();
  let status = (payload.status as string) || "Open";
  let internalCandidates: { id: string; full_name: string }[] = [];
  if (!forceExternal && status === "Open") {
    internalCandidates = await findInternalCandidates((payload.position as string) || "");
    if (internalCandidates.length > 0) status = "Internal Review";
  }

  const finalPayload = { ...payload, status, vacancy_number };
  const first = await supabaseAdmin.from("lowongan_kerja").insert(finalPayload).select("id, vacancy_number, status").maybeSingle();
  if (first.error && MISSING_COLUMN(first.error)) {
    const fallback = await supabaseAdmin.from("lowongan_kerja").insert({ ...payload, status }).select("id, status").maybeSingle();
    return { ...fallback, internalCandidates };
  }
  return { ...first, internalCandidates };
}

export async function openVacancyExternally(vacancyId: string): Promise<{ error: string } | { success: true }> {
  const { error } = await supabaseAdmin.from("lowongan_kerja").update({ status: "Open" }).eq("id", vacancyId).eq("status", "Internal Review");
  if (error) return { error: "Gagal membuka lowongan ke eksternal." };
  return { success: true };
}
