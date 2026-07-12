import { supabaseAdmin } from "@/lib/supabase";

export interface KepalaUnit {
  name: string;
  email: string;
}

/**
 * Leadership is a fact about who currently occupies a Position Number, not an
 * attribute of the org unit itself — this derives "who leads this unit" from
 * formasi_jabatan (a Filled position flagged jabatan.is_kepala_unit) instead
 * of the old unit_organisasi.leader_name/leader_email columns, which the app
 * no longer writes to.
 */
export async function getKepalaUnit(unitId: string): Promise<KepalaUnit | null> {
  if (!unitId) return null;
  const { data: formasiRows } = await supabaseAdmin
    .from("formasi_jabatan")
    .select("karyawan_id, jabatan_id")
    .eq("unit_organisasi_id", unitId)
    .eq("status", "Filled");
  if (!formasiRows || formasiRows.length === 0) return null;

  const jabatanIds = [...new Set((formasiRows as { jabatan_id: string }[]).map(r => r.jabatan_id))];
  const { data: jabatanRows } = await supabaseAdmin
    .from("jabatan")
    .select("id, is_kepala_unit")
    .in("id", jabatanIds);
  const kepalaJabatanIds = new Set(
    ((jabatanRows || []) as { id: string; is_kepala_unit: boolean }[])
      .filter(j => j.is_kepala_unit)
      .map(j => j.id)
  );
  if (kepalaJabatanIds.size === 0) return null;

  const karyawanId = (formasiRows as { karyawan_id: string | null; jabatan_id: string }[])
    .find(r => r.karyawan_id && kepalaJabatanIds.has(r.jabatan_id))?.karyawan_id;
  if (!karyawanId) return null;

  const { data: emp } = await supabaseAdmin
    .from("karyawan")
    .select("full_name, email")
    .eq("id", karyawanId)
    .maybeSingle();
  if (!emp) return null;
  return { name: (emp as { full_name: string }).full_name, email: (emp as { email: string }).email };
}

/** Batch variant to avoid N+1 queries when rendering a whole tree/list of units. */
export async function getKepalaUnitMap(unitIds: string[]): Promise<Map<string, KepalaUnit>> {
  const map = new Map<string, KepalaUnit>();
  if (unitIds.length === 0) return map;

  const { data: formasiRows } = await supabaseAdmin
    .from("formasi_jabatan")
    .select("unit_organisasi_id, karyawan_id, jabatan_id")
    .in("unit_organisasi_id", unitIds)
    .eq("status", "Filled");
  if (!formasiRows || formasiRows.length === 0) return map;

  const jabatanIds = [...new Set((formasiRows as { jabatan_id: string }[]).map(r => r.jabatan_id))];
  const { data: jabatanRows } = await supabaseAdmin
    .from("jabatan")
    .select("id, is_kepala_unit")
    .in("id", jabatanIds);
  const kepalaJabatanIds = new Set(
    ((jabatanRows || []) as { id: string; is_kepala_unit: boolean }[])
      .filter(j => j.is_kepala_unit)
      .map(j => j.id)
  );
  if (kepalaJabatanIds.size === 0) return map;

  const karyawanIds = [...new Set(
    (formasiRows as { unit_organisasi_id: string; karyawan_id: string | null; jabatan_id: string }[])
      .filter(r => r.karyawan_id && kepalaJabatanIds.has(r.jabatan_id))
      .map(r => r.karyawan_id as string)
  )];
  if (karyawanIds.length === 0) return map;

  const { data: emps } = await supabaseAdmin
    .from("karyawan")
    .select("id, full_name, email")
    .in("id", karyawanIds);
  const empById = new Map(
    ((emps || []) as { id: string; full_name: string; email: string }[]).map(e => [e.id, e])
  );

  for (const row of formasiRows as { unit_organisasi_id: string; karyawan_id: string | null; jabatan_id: string }[]) {
    if (map.has(row.unit_organisasi_id)) continue;
    if (!row.karyawan_id || !kepalaJabatanIds.has(row.jabatan_id)) continue;
    const emp = empById.get(row.karyawan_id);
    if (emp) map.set(row.unit_organisasi_id, { name: emp.full_name, email: emp.email });
  }
  return map;
}
