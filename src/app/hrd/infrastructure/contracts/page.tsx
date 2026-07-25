import { supabaseAdmin } from "@/lib/supabase";
import ContractsClient from "./ContractsClient";
import { positionRank } from "@/lib/org-hierarchy";

export default async function ManajemenKontrakKerja() {
  const [empRes, ctrRes, unitRes] = await Promise.all([
    supabaseAdmin
      .from("karyawan")
      .select("id, full_name, kode, department, position, status, join_date, phone")
      .not("status", "eq", "Resigned")
      .order("full_name"),
    supabaseAdmin
      .from("kontrak_kerja")
      .select("*")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("unit_organisasi").select("name, code"),
  ]);

  // "Daftar karyawan mengikuti Struktur Organisasi" (per the page's own
  // subtitle) was never actually true — employees were fetched sorted by
  // full_name only. Sort by department's real position in the org hierarchy
  // (via unit_organisasi.code) first, then by job-level rank within that
  // department, so this list matches the org chart instead of the alphabet.
  const deptOrder = new Map(
    (unitRes.data || [])
      .map((u: { name: string; code: string }) => [u.name, u.code.split(".").map(Number)] as const)
  );
  const compareCode = (a: number[] = [], b: number[] = []) => {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const va = a[i] || 0, vb = b[i] || 0;
      if (va !== vb) return va - vb;
    }
    return 0;
  };
  const employees = [...((empRes.data || []) as Record<string, string>[])].sort((a, b) => {
    const deptCmp = compareCode(deptOrder.get(a.department), deptOrder.get(b.department));
    if (deptCmp !== 0) return deptCmp;
    const rankCmp = positionRank(a.position) - positionRank(b.position);
    if (rankCmp !== 0) return rankCmp;
    return (a.full_name || "").localeCompare(b.full_name || "");
  });

  return (
    <ContractsClient
      employees={employees}
      contracts={(ctrRes.data || []) as Record<string, string>[]}
    />
  );
}
