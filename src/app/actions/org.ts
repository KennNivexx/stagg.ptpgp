"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";
import { getKepalaUnitMap } from "@/lib/org-helpers";
import type { OrgUnit, FlatDept } from "@/types/org";

/** Fields the "Unit Organisasi" form (Menu 2 of the enterprise org-design
 * spec) now collects instead of leader_name/leader_email — organizational
 * design describes the unit, not who currently sits in it. */
function readUnitDesignFields(formData: FormData) {
  return {
    jenis_unit: (formData.get("jenis_unit") as string || "Departemen").trim(),
    singkatan: (formData.get("singkatan") as string || "").trim() || null,
    deskripsi: (formData.get("deskripsi") as string || "").trim() || null,
    jumlah_formasi: parseInt((formData.get("jumlah_formasi") as string) || "0", 10) || 0,
    budget_cost_center: formData.get("budget_cost_center") ? Number(formData.get("budget_cost_center")) : null,
    kode_cost_center: (formData.get("kode_cost_center") as string || "").trim() || null,
    business_unit: (formData.get("business_unit") as string || "").trim() || null,
    lokasi_unit_kerja: (formData.get("lokasi_unit_kerja") as string || "").trim() || null,
    tanggal_berlaku: (formData.get("tanggal_berlaku") as string || "").trim() || null,
    tanggal_berakhir: (formData.get("tanggal_berakhir") as string || "").trim() || null,
    status: (formData.get("status") as string || "Aktif").trim(),
  };
}

/* ─────── helpers ─────── */

function codeSegments(code: string): number[] {
  return code.split(".").map(Number);
}

function codeLevel(code: string): number {
  return codeSegments(code).filter(d => d > 0).length - 1;
}

function generateCode(parentCode: string, siblingCount: number): string {
  const digits = codeSegments(parentCode);
  let level = 0;
  for (let i = 0; i < digits.length; i++) {
    if (digits[i] > 0) level = i + 1;
  }
  digits[level] = siblingCount + 1;
  for (let i = level + 1; i < digits.length; i++) digits[i] = 0;
  return digits.join(".");
}

function getParentCode(code: string): string | null {
  const digits = codeSegments(code);
  let lastNonZero = -1;
  for (let i = 0; i < digits.length; i++) if (digits[i] > 0) lastNonZero = i;
  if (lastNonZero <= 0) return null;
  digits[lastNonZero] = 0;
  return digits.join(".");
}

function isDescendantOf(code: string, ancestor: string): boolean {
  // Codes are fixed-width and zero-padded (e.g. "1.1.2.1.0.0.0"), so `code`
  // and `ancestor` always have the same segment count — a plain length
  // comparison can never distinguish shallower from deeper codes and made
  // this always return false, silently disabling the cycle guard entirely.
  const a = codeSegments(ancestor);
  const c = codeSegments(code);
  let aDepth = -1;
  for (let i = 0; i < a.length; i++) if (a[i] > 0) aDepth = i;
  if (aDepth < 0) return false;
  for (let i = 0; i <= aDepth; i++) if (c[i] !== a[i]) return false;
  return aDepth + 1 < c.length && c[aDepth + 1] > 0;
}

const uid = () => "org-" + crypto.randomUUID();

/* ─────── tree builder ─────── */

async function getSettings() {
  // Try new system_settings table first; fall back to legacy employee row if
  // the migration hasn't been applied yet.
  const { data: row, error } = await supabaseAdmin
    .from("pengaturan_sistem")
    .select("value")
    .eq("key", "org_settings")
    .maybeSingle();

  if (!error && row) {
    try { return (row as Record<string, unknown>).value as Record<string, unknown> || {}; } catch { return {}; }
  }

  // Legacy fallback
  const { data } = await supabaseAdmin.from("karyawan").select("address").eq("email", "__settings__@ptpgp.co.id").maybeSingle();
  if (!data?.address) return {};
  try { return JSON.parse(data.address as string); } catch { return {}; }
}

async function saveSettings(settings: Record<string, unknown>) {
  // Try new table first
  const { error } = await supabaseAdmin
    .from("pengaturan_sistem")
    .upsert({ key: "org_settings", value: settings, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) {
    // Legacy fallback if migration not yet applied
    await supabaseAdmin.from("karyawan").upsert({
      full_name: "System Settings", email: "__settings__@ptpgp.co.id",
      address: JSON.stringify(settings), department: "System", position: "Settings",
      join_date: "2024-01-01", status: "Tetap"
    }, { onConflict: "email" });
  }
}

interface OrgUnitRow {
  id: string; code: string; name: string; parent_code: string | null;
  level: number; leader_name: string | null; leader_email: string | null; sort_order: number;
  jenis_unit?: string | null; singkatan?: string | null; deskripsi?: string | null;
  jumlah_formasi?: number | null; budget_cost_center?: number | null; kode_cost_center?: string | null;
  business_unit?: string | null; lokasi_unit_kerja?: string | null; tanggal_berlaku?: string | null;
  tanggal_berakhir?: string | null; status?: string | null;
}

async function buildTree(): Promise<OrgUnit[]> {
  const { data } = await supabaseAdmin.from("unit_organisasi").select("*").order("level", { ascending: true }).order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (data && data.length > 0) {
    const rows = data as unknown as OrgUnitRow[];
    // "Leader" is derived from who currently holds a Position Number flagged
    // is_kepala_unit in that unit (Employee Assignment), never a stored field
    // on the unit itself — see getKepalaUnitMap in org-helpers.ts.
    const kepalaMap = await getKepalaUnitMap(rows.map(r => r.id));
    const map = new Map<string, OrgUnit>();
    const roots: OrgUnit[] = [];
    for (const row of rows) {
      const kepala = kepalaMap.get(row.id);
      map.set(row.code, {
        id: row.id, code: row.code, name: row.name, level: row.level,
        leader_name: kepala?.name || "", leader_email: kepala?.email || "",
        children: [],
        jenis_unit: row.jenis_unit || "Departemen", singkatan: row.singkatan || null,
        deskripsi: row.deskripsi || null, jumlah_formasi: row.jumlah_formasi || 0,
        budget_cost_center: row.budget_cost_center ?? null, kode_cost_center: row.kode_cost_center || null,
        business_unit: row.business_unit || null, lokasi_unit_kerja: row.lokasi_unit_kerja || null,
        tanggal_berlaku: row.tanggal_berlaku || null, tanggal_berakhir: row.tanggal_berakhir || null,
        status: row.status || "Aktif",
      });
    }
    for (const row of rows) {
      const u = map.get(row.code)!;
      if (row.parent_code && map.has(row.parent_code)) {
        map.get(row.parent_code)!.children.push(u);
      } else {
        roots.push(u);
      }
    }

    // Inject employees as leaf nodes under their org unit.
    // Prefer employees.kode (sequential org code) to place them precisely;
    // fall back to matching employees.department -> org_units.name directly
    // for older records that never got a kode backfilled, so nobody silently
    // disappears from the audit view. Employees without a kode get one
    // generated here (parent's code with the first free segment filled in,
    // sequential per department — same scheme hireCandidate() uses) and it's
    // persisted back so the code stays stable instead of showing a raw id.
    const { data: empData } = await supabaseAdmin
      .from("karyawan")
      .select("id, full_name, kode, kode_jabatan, nik, position, department, email")
      .neq("status", "Inactive")
      .order("full_name");
    if (empData) {
      type EmpRow = { id: string; full_name: string; kode: string | null; kode_jabatan: string | null; nik: string | null; position: string; department: string | null; email: string };

      // Generic role/hierarchy words carry no unit-identifying signal (almost
      // every department has a "Manager" or "Staff") and are excluded so they
      // can't trigger a match on their own.
      const ROLE_STOPWORDS = new Set(["staff", "officer", "manager", "supervisor", "executive", "administrator", "admin", "operator", "assistant", "coordinator", "specialist", "analyst"]);

      const posWordsOf = (position: string) =>
        new Set(position.toLowerCase().split(/[\s&,./]+/).filter(w => w.length > 0 && !ROLE_STOPWORDS.has(w)));

      // Significant words are either length > 3, or a short all-caps acronym
      // in the original name (e.g. "IT" in "IT Application & Development") —
      // acronyms carry real identifying meaning despite being short, unlike
      // ordinary short words.
      const unitWordsOf = (name: string) =>
        name.split(/[\s&]+/)
          .filter(w => w.length > 3 || /^[A-Z]{2,4}$/.test(w))
          .map(w => w.toLowerCase())
          .filter(w => !ROLE_STOPWORDS.has(w));

      const hasWord = (posWords: Set<string>, w: string) => posWords.has(w) || posWords.has(w + "s") || posWords.has(w + "es");

      // Common Indonesian HR/GA abbreviations don't literally appear inside
      // their expanded unit names (unlike "IT" in "IT Application &
      // Development", which is a real substring) — "hr" is nowhere in the
      // string "Human Resources". Each key here is treated as a match for a
      // sibling whose significant words are a superset of the listed words.
      const ABBREVIATIONS: Record<string, string[]> = {
        hr: ["human", "resources"],
        hrd: ["human", "resources"],
        ga: ["general", "affair"],
        mr: ["management", "representative"],
        hse: ["health", "safety", "environment"],
      };

      // Refine into a specific sub-unit (e.g. "Payroll", "Recruitment &
      // Development") when the employee's position clearly names one, instead
      // of leaving everyone dumped flat under the parent division just
      // because employees.department only ever stores the top-level division
      // name. A sub-unit only qualifies via a word that is unique to it among
      // its siblings (not shared by another sibling's name) — this lets a
      // partial match like "Recruitment Staff" -> "Recruitment & Development"
      // through, while still rejecting ambiguous generic overlaps like
      // "account" matching both "Account Payable" and "Account Receivable".
      function refineToSubUnit(parent: OrgUnit, position: string): OrgUnit {
        const siblings = rows.filter(r => r.parent_code === parent.code);
        if (siblings.length === 0) return parent;

        const wordOwners = new Map<string, Set<string>>(); // word -> set of sibling codes containing it
        for (const s of siblings) {
          const sWords = new Set(unitWordsOf(s.name));
          for (const w of sWords) {
            if (!wordOwners.has(w)) wordOwners.set(w, new Set());
            wordOwners.get(w)!.add(s.code);
          }
          for (const [abbrev, expansion] of Object.entries(ABBREVIATIONS)) {
            if (expansion.every(w => sWords.has(w))) {
              if (!wordOwners.has(abbrev)) wordOwners.set(abbrev, new Set());
              wordOwners.get(abbrev)!.add(s.code);
            }
          }
        }

        const posWords = posWordsOf(position);
        const candidates = new Set<string>();
        for (const [word, owners] of wordOwners) {
          if (owners.size !== 1) continue; // shared by >1 sibling — not distinctive
          if (hasWord(posWords, word)) candidates.add([...owners][0]);
        }

        if (candidates.size !== 1) return parent; // no match, or ambiguous — stay put
        const subUnit = map.get([...candidates][0]);
        return subUnit || parent;
      }

      const resolved: { emp: EmpRow; parent: OrgUnit; codeConsistent: boolean }[] = [];

      for (const emp of empData as EmpRow[]) {
        let initialParent: OrgUnit | undefined;

        if (emp.kode) {
          // Parent org unit = replace the last non-zero segment with 0
          const segs = emp.kode.split(".");
          let lastNonZero = -1;
          for (let i = segs.length - 1; i >= 0; i--) {
            if (Number(segs[i]) !== 0) { lastNonZero = i; break; }
          }
          if (lastNonZero >= 0) {
            const parentSegs = [...segs];
            parentSegs[lastNonZero] = "0";
            initialParent = map.get(parentSegs.join("."));
          }
        }

        // Fallback: match by department name directly (covers employees
        // without a resolvable kode so the tree stays accurate/live).
        if (!initialParent && emp.department) {
          initialParent = Array.from(map.values()).find(u => u.name === emp.department);
        }

        if (!initialParent) continue;

        const finalParent = emp.position ? refineToSubUnit(initialParent, emp.position) : initialParent;
        // A persisted kode is only trustworthy if it still points to the same
        // parent it always did AND it already follows the last-segment
        // scheme below (real org-unit codes always keep that segment at 0 —
        // confirmed true for all current units — so any kode that doesn't
        // follow this shape is a leftover from an older scheme and must be
        // regenerated to guarantee it can never collide with a real unit).
        const kodeSegs = emp.kode ? emp.kode.split(".") : [];
        const followsCurrentScheme = kodeSegs.length > 0 && Number(kodeSegs[kodeSegs.length - 1]) > 0;
        const codeConsistent = !!emp.kode && finalParent.code === initialParent.code && followsCurrentScheme;
        resolved.push({ emp, parent: finalParent, codeConsistent });
      }

      // Seed each parent's next-sequence counter from kode values already
      // consistent with that parent, so a generated code never collides with
      // a real one or with another generated code. Employees always get
      // their sequence number in the very last code segment — every real
      // org-unit code keeps that segment at 0, so this can never collide
      // with a unit added to the tree later, unlike reusing the same
      // segment org units use for their own children.
      const seqByParent = new Map<string, number>();
      for (const { emp, parent, codeConsistent } of resolved) {
        if (!codeConsistent || !emp.kode) continue;
        const segs = emp.kode.split(".");
        const usedSeq = Number(segs[segs.length - 1]) || 0;
        seqByParent.set(parent.code, Math.max(seqByParent.get(parent.code) || 0, usedSeq));
      }

      // Collect all jabatan codes to resolve kode_jabatan
      const jabatanIds = new Set<string>();
      const formasiByEmployee: Record<string, string> = {};
      const { data: formasiData } = await supabaseAdmin
        .from("formasi_jabatan")
        .select("id, jabatan_id, karyawan_id")
        .eq("status", "Filled");
      if (formasiData) {
        const formasiJabatanMap = new Map((formasiData as { id: string; jabatan_id: string; karyawan_id: string | null }[]).map(f => [f.karyawan_id, f.jabatan_id]));
        for (const e of resolved) {
          const fjId = formasiJabatanMap.get(e.emp.id);
          if (fjId) { formasiByEmployee[e.emp.id] = fjId; jabatanIds.add(fjId); }
        }
      }
      const { data: jabatanRows } = await supabaseAdmin
        .from("jabatan")
        .select("id, code")
        .in("id", Array.from(jabatanIds));
      const jabatanCodeById = new Map((jabatanRows || []).map((j: { id: string; code: string }) => [j.id, j.code]));

      const toBackfill: { id: string; kode: string; kode_jabatan?: string }[] = [];
      for (const { emp, parent, codeConsistent } of resolved) {
        let personalCode = codeConsistent ? emp.kode! : "";
        if (!personalCode) {
          const segments = parent.code.split(".");
          const next = (seqByParent.get(parent.code) || 0) + 1;
          seqByParent.set(parent.code, next);
          segments[segments.length - 1] = String(next);
          personalCode = segments.join(".");
          toBackfill.push({ id: emp.id, kode: personalCode });
        }

        // Resolve kode_jabatan from assignment chain
        const jId = formasiByEmployee[emp.id] || "";
        const jCode = jabatanCodeById.get(jId) || emp.kode_jabatan || "";

        parent.children.push({
          id: emp.id,
          code: personalCode,
          name: emp.full_name,
          level: parent.level + 1,
          leader_name: emp.position || "",
          leader_email: emp.email || "",
          children: [],
          isEmployee: true,
          position: emp.position || "",
          kode_jabatan: jCode,
        });
      }

      if (toBackfill.length > 0) {
        await Promise.all(toBackfill.map(b =>
          supabaseAdmin.from("karyawan").update({
            kode: b.kode,
            ...(b.kode_jabatan ? { kode_jabatan: b.kode_jabatan } : {}),
          }).eq("id", b.id)
        ));
      }
    }

    return roots;
  }

  // Fallback to JSON if org_units is empty
  const settings = await getSettings();
  const tree = (settings.org_structure as OrgUnit[]) || [];
  if (tree.length > 0) {
    // Auto-migrate to org_units
    migrateTreeToOrgUnits(tree);
  }
  return tree;
}

async function countChildren(parentCode: string): Promise<number> {
  const { count } = await supabaseAdmin.from("unit_organisasi").select("*", { count: "exact", head: true }).eq("parent_code", parentCode);
  return count || 0;
}

async function recalculateDescendants(parentCode: string, newParentCode: string) {
  const { data: children } = await supabaseAdmin.from("unit_organisasi").select("code").eq("parent_code", parentCode).order("sort_order", { ascending: true });
  if (!children) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as { code: string };
    const newChildCode = generateCode(newParentCode, i);
    const newLevel = codeLevel(newChildCode);
    await supabaseAdmin.from("unit_organisasi").update({ code: newChildCode, level: newLevel, parent_code: newParentCode }).eq("code", child.code);
    await recalculateDescendants(child.code, newChildCode);
  }
}

async function deleteSubtree(code: string) {
  const { data: children } = await supabaseAdmin.from("unit_organisasi").select("code").eq("parent_code", code);
  if (children) {
    for (const c of children as { code: string }[]) {
      await deleteSubtree(c.code);
    }
  }
  await supabaseAdmin.from("unit_organisasi").delete().eq("code", code);
}

async function migrateTreeToOrgUnits(tree: OrgUnit[]) {
  function flatten(list: OrgUnit[], parentCode: string | null): { id: string; code: string; name: string; parent_code: string | null; level: number; leader_name: string; leader_email: string; sort_order: number }[] {
    const result: { id: string; code: string; name: string; parent_code: string | null; level: number; leader_name: string; leader_email: string; sort_order: number }[] = [];
    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      result.push({ id: u.id, code: u.code, name: u.name, parent_code: parentCode, level: u.level, leader_name: u.leader_name, leader_email: u.leader_email, sort_order: i });
      if (u.children?.length) result.push(...flatten(u.children, u.code));
    }
    return result;
  }
  const flat = flatten(tree, null);
  for (const row of flat) {
    await supabaseAdmin.from("unit_organisasi").upsert(row, { onConflict: "code" });
  }
}

/* ─────── public API ─────── */

export async function getOrgStructure(): Promise<OrgUnit[]> {
  await requireRole("hrd", "superadmin");
  return await buildTree();
}

export async function addOrgUnit(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const parent_code = (formData.get("parent_code") as string || "").trim();
  const unit_name = (formData.get("unit_name") as string || "").trim();
  const designFields = readUnitDesignFields(formData);

  if (!parent_code || !unit_name) return { error: "Parent dan nama unit wajib diisi." };
  if (!/^\d+(\.\d+)+$/.test(parent_code)) return { error: "Format kode parent tidak valid." };

  const { data: parent } = await supabaseAdmin.from("unit_organisasi").select("code").eq("code", parent_code).maybeSingle();
  if (!parent) return { error: "Parent unit tidak ditemukan." };

  const siblingCount = await countChildren(parent_code);
  const newCode = generateCode(parent_code, siblingCount);
  const newLevel = codeLevel(newCode);

  const { error } = await supabaseAdmin.from("unit_organisasi").insert({
    id: uid(), code: newCode, name: unit_name, level: newLevel,
    parent_code: parent_code, sort_order: siblingCount, ...designFields,
  });
  if (error) {
    console.error("addOrgUnit error:", error);
    return { error: "Gagal menambah unit." };
  }

  await syncOrgToDepartments();
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace");
  auditLog({ action: "org.add_unit", targetId: newCode, targetName: unit_name, performedBy: user });
  return { success: true, code: newCode };
}

/**
 * Dedicated "Departemen" page creator: HRD types the department code by hand
 * (not auto-generated), but must still anchor it to an existing parent
 * code/department so its place in the 5-level org hierarchy stays well
 * defined. Level is derived from the code's position under the parent.
 */
/** Shared validation + insert, used by reviewDepartmentRequest once a
 * Direktur approves — kept separate from addDepartmentManual so the actual
 * org_units row is only ever created post-approval. */
async function createDepartmentUnit(params: {
  code: string; parent_code: string; unit_name: string;
}): Promise<{ error: string } | { success: true; code: string }> {
  const { code, parent_code, unit_name } = params;

  if (!code || !parent_code || !unit_name) {
    return { error: "Kode, induk (parent), dan nama departemen wajib diisi." };
  }
  if (!/^\d+(\.\d+)+$/.test(code)) {
    return { error: "Format kode tidak valid. Gunakan format: 1.2.1.0.0.0.0 (dipisah titik)." };
  }
  if (!/^\d+(\.\d+)+$/.test(parent_code)) {
    return { error: "Format kode induk tidak valid." };
  }

  const { data: existing } = await supabaseAdmin.from("unit_organisasi").select("code").eq("code", code).maybeSingle();
  if (existing) return { error: `Kode "${code}" sudah digunakan unit lain.` };

  const { data: parent } = await supabaseAdmin.from("unit_organisasi").select("code").eq("code", parent_code).maybeSingle();
  if (!parent) return { error: "Induk (parent) tidak ditemukan." };

  // HRD types the code manually, but it must genuinely sit directly under
  // the chosen parent so the hierarchy stays well defined.
  if (getParentCode(code) !== parent_code) {
    return { error: `Kode "${code}" tidak berada langsung di bawah induk "${parent_code}". Sesuaikan kode agar induknya cocok.` };
  }

  const newLevel = codeLevel(code);
  const siblingCount = await countChildren(parent_code);

  const { error } = await supabaseAdmin.from("unit_organisasi").insert({
    id: uid(), code, name: unit_name, level: newLevel,
    parent_code, sort_order: siblingCount,
  });
  if (error) {
    console.error("createDepartmentUnit error:", error);
    if (error.message?.includes("duplicate key") || error.code === "23505") {
      return { error: `Kode "${code}" sudah digunakan. Gunakan kode lain.` };
    }
    return { error: "Gagal menambah departemen." };
  }

  await syncOrgToDepartments();
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace");
  return { success: true, code };
}

/** HRD's department proposal only ever creates a `department_requests` row —
 * the actual org_units row is created by reviewDepartmentRequest once a
 * Direktur approves it (see the Kompetensi library for the same pattern). */
export async function addDepartmentManual(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const code = (formData.get("code") as string || "").trim();
  const parent_code = (formData.get("parent_code") as string || "").trim();
  const unit_name = (formData.get("unit_name") as string || "").trim();

  if (!code || !parent_code || !unit_name) {
    return { error: "Kode, induk (parent), dan nama departemen wajib diisi." };
  }
  if (!/^\d+(\.\d+)+$/.test(code)) {
    return { error: "Format kode tidak valid. Gunakan format: 1.2.1.0.0.0.0 (dipisah titik)." };
  }
  if (!/^\d+(\.\d+)+$/.test(parent_code)) {
    return { error: "Format kode induk tidak valid." };
  }
  const { data: existing } = await supabaseAdmin.from("unit_organisasi").select("code").eq("code", code).maybeSingle();
  if (existing) return { error: `Kode "${code}" sudah digunakan unit lain.` };

  const { error } = await supabaseAdmin.from("usulan_departemen").insert({
    id: "dreq-" + crypto.randomUUID(),
    code, parent_code, name: unit_name,
    requested_by: user.name || user.email,
    status: "Pending",
    created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260709001_workflow_overhaul.sql terlebih dahulu." };
  if (error) { console.error("[org] addDepartmentManual error:", error.message); return { error: "Gagal mengajukan departemen." }; }

  revalidatePath("/hrd/workplace/structure");
  return { success: true, pending: true };
}

export async function getDepartmentRequests(status?: string) {
  await requireRole("hrd", "director", "superadmin");
  let q = supabaseAdmin.from("usulan_departemen").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q.limit(100);
  if (error?.code === "42P01") return [];
  return data || [];
}

export async function reviewDepartmentRequest(id: string, approve: boolean): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("director", "superadmin");

  const { data: reqRow } = await supabaseAdmin.from("usulan_departemen").select("*").eq("id", id).maybeSingle();
  if (!reqRow) return { error: "Usulan tidak ditemukan." };
  const req = reqRow as Record<string, unknown>;
  if (req.status !== "Pending") return { error: `Usulan ini sudah diproses sebelumnya (${req.status}).` };

  if (approve) {
    const result = await createDepartmentUnit({
      code: req.code as string,
      parent_code: req.parent_code as string,
      unit_name: req.name as string,
    });
    if ("error" in result) return result;
    auditLog({ action: "org.add_department", targetId: result.code, targetName: req.name as string, performedBy: user, detail: `Induk: ${req.parent_code}, disetujui Direktur` });
  }

  await supabaseAdmin.from("usulan_departemen").update({
    status: approve ? "Disetujui" : "Ditolak",
    decided_at: new Date().toISOString(),
  }).eq("id", id);

  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/director/departments");
  return { success: true };
}

export async function updateOrgUnit(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const unit_code = (formData.get("unit_code") as string || "").trim();
  const unit_name = (formData.get("unit_name") as string || "").trim();
  const level = parseInt((formData.get("level") as string) || "0");
  const new_code = (formData.get("new_code") as string || "").trim();
  const designFields = readUnitDesignFields(formData);

  if (!unit_code) return { error: "Kode unit wajib diisi." };

  const { data: unit } = await supabaseAdmin.from("unit_organisasi").select("*").eq("code", unit_code).maybeSingle();
  if (!unit) return { error: "Unit tidak ditemukan." };

  // Validate new code first
  if (new_code && new_code !== unit_code) {
    if (!/^\d+(\.\d+)+$/.test(new_code)) {
      return { error: "Format kode tidak valid. Gunakan format: 1.2.3.0.0.0.0" };
    }
    const { data: dup } = await supabaseAdmin.from("unit_organisasi").select("code").eq("code", new_code).maybeSingle();
    if (dup) return { error: `Kode "${new_code}" sudah digunakan unit lain.` };
    const npc = getParentCode(new_code);
    if (npc) {
      const { data: np } = await supabaseAdmin.from("unit_organisasi").select("code").eq("code", npc).maybeSingle();
      if (!np) return { error: `Parent "${npc}" tidak ditemukan.` };
      if (isDescendantOf(npc, unit_code)) return { error: "Tidak bisa memindahkan ke anaknya sendiri." };
    }
  }

  const updates: Record<string, unknown> = { ...designFields };
  if (unit_name) updates.name = unit_name;
  updates.level = level;

  if (new_code && new_code !== unit_code) {
    const npc = getParentCode(new_code);
    const curPc = (unit as Record<string, unknown>).parent_code as string || null;
    const oldParent = curPc ? getParentCode(unit_code) : null;
    updates.code = new_code;
    updates.level = codeLevel(new_code);
    if (npc && npc !== oldParent) {
      updates.parent_code = npc;
    }
    await supabaseAdmin.from("unit_organisasi").update(updates).eq("code", unit_code);
    await recalculateDescendants(unit_code, new_code);
  } else {
    await supabaseAdmin.from("unit_organisasi").update(updates).eq("code", unit_code);
  }

  // Sync JSON backup
  try {
    const tree = await buildTree();
    const settings = await getSettings();
    settings.org_structure = tree;
    await saveSettings(settings);
  } catch (e) { console.error("updateOrgUnit JSON backup error:", e); }

  await syncOrgToDepartments();
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace");
  auditLog({ action: "org.update_unit", targetId: new_code || unit_code, targetName: unit_name || (unit as Record<string, unknown>).name as string, performedBy: user });
  return { success: true };
}

export async function deleteOrgUnit(unitCode: string) {
  const user = await requireRole("hrd", "superadmin");
  if (!unitCode) return { error: "Kode unit wajib diisi." };

  const { data: unit } = await supabaseAdmin.from("unit_organisasi").select("name, code").eq("code", unitCode).maybeSingle();
  if (!unit) return { error: "Unit tidak ditemukan." };

  await deleteSubtree(unitCode);

  try {
    const tree = await buildTree();
    const settings = await getSettings();
    settings.org_structure = tree;
    await saveSettings(settings);
  } catch (e) { console.error("deleteOrgUnit JSON backup error:", e); }

  await syncOrgToDepartments();
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace");
  auditLog({ action: "org.delete_unit", targetId: unitCode, targetName: (unit as { name: string }).name, performedBy: user });
  return { success: true };
}

export async function moveOrgUnit(unitCode: string, newParentCode: string) {
  const user = await requireRole("hrd", "superadmin");

  if (!unitCode || !newParentCode) return { error: "Kode unit dan parent wajib diisi." };
  if (unitCode === newParentCode) return { error: "Tidak bisa memindahkan ke dirinya sendiri." };

  const { data: unit } = await supabaseAdmin.from("unit_organisasi").select("code, name").eq("code", unitCode).maybeSingle();
  if (!unit) return { error: "Unit tidak ditemukan." };

  const { data: newParent } = await supabaseAdmin.from("unit_organisasi").select("code").eq("code", newParentCode).maybeSingle();
  if (!newParent) return { error: "Parent tujuan tidak ditemukan." };
  if (isDescendantOf(newParentCode, unitCode)) return { error: "Tidak bisa memindahkan ke anaknya sendiri." };

  const siblingCount = await countChildren(newParentCode);
  const newCode = generateCode(newParentCode, siblingCount);
  const newLevel = codeLevel(newCode);

  await supabaseAdmin.from("unit_organisasi").update({
    code: newCode, level: newLevel, parent_code: newParentCode,
    sort_order: siblingCount,
  }).eq("code", unitCode);

  await recalculateDescendants(unitCode, newCode);

  try {
    const tree = await buildTree();
    const settings = await getSettings();
    settings.org_structure = tree;
    await saveSettings(settings);
  } catch (e) { console.error("moveOrgUnit JSON backup error:", e); }

  await syncOrgToDepartments();
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace/structure");
  revalidatePath("/hrd/workplace");
  auditLog({ action: "org.move_unit", targetId: newCode, targetName: (unit as { name: string }).name, performedBy: user, detail: `Dipindah ke ${newParentCode}` });
  return { success: true, newCode };
}

/* ─────── departments sync ─────── */

async function syncOrgToDepartments() {
  let { data } = await supabaseAdmin.from("unit_organisasi").select("*").order("level").order("sort_order").order("name");

  // If org_units empty, migrate from JSON first
  if (!data || data.length === 0) {
    const settings = await getSettings();
    const tree = (settings.org_structure as OrgUnit[]) || [];
    if (tree.length > 0) {
      await migrateTreeToOrgUnits(tree);
      const retry = await supabaseAdmin.from("unit_organisasi").select("*").order("level").order("sort_order").order("name");
      data = retry.data;
    }
  }

  if (!data || data.length === 0) return;
  const rows = data as unknown as OrgUnitRow[];
  const flat: FlatDept[] = rows.map((r, i) => ({
    code: r.code, name: r.name, parent_code: r.parent_code || null,
    level: r.level, leader_name: r.leader_name || "", leader_email: r.leader_email || "", sort_order: r.sort_order || i,
  }));
  const nameCount: Record<string, number> = {};
  for (const r of flat) nameCount[r.name] = (nameCount[r.name] || 0) + 1;
  const dupNames = new Map<string, number>();
  for (const r of flat) {
    if (nameCount[r.name] > 1) {
      const idx = (dupNames.get(r.name) || 0) + 1;
      dupNames.set(r.name, idx);
      r.name = `${r.name} (${idx})`;
    }
  }
  const treeCodes = flat.map(f => f.code);
  const { error: upErr } = await supabaseAdmin.from("departemen").upsert(flat, { onConflict: "code" });
  if (upErr) { console.error("syncToDepartments upsert error:", upErr); return; }
  const { data: existing } = await supabaseAdmin.from("departemen").select("code");
  if (existing) {
    const toDelete = (existing as { code: string }[]).filter(d => !treeCodes.includes(d.code)).map(d => d.code);
    if (toDelete.length > 0) await supabaseAdmin.from("departemen").delete().in("code", toDelete);
  }
}

export async function getDepartments(): Promise<FlatDept[]> {
  await requireRole("hrd", "superadmin");
  let { data } = await supabaseAdmin.from("departemen").select("*").order("level", { ascending: true }).order("sort_order", { ascending: true }).order("name", { ascending: true });
  if (!data || data.length === 0) {
    await syncOrgToDepartments();
    const retry = await supabaseAdmin.from("departemen").select("*").order("level", { ascending: true }).order("sort_order", { ascending: true }).order("name", { ascending: true });
    data = retry.data;
  }
  return (data as FlatDept[]) || [];
}

/* ─────── seed / migrate from JSON ─────── */

export async function migrateJsonToOrgUnits() {
  await requireRole("hrd", "superadmin");

  const settings = await getSettings();
  const tree = (settings.org_structure as OrgUnit[]) || [];
  if (tree.length === 0) return { error: "No JSON data to migrate." };

  function flatten(list: OrgUnit[], parentCode: string | null = null, depth = 0): { id: string; code: string; name: string; parent_code: string | null; level: number; leader_name: string; leader_email: string; sort_order: number }[] {
    const result: { id: string; code: string; name: string; parent_code: string | null; level: number; leader_name: string; leader_email: string; sort_order: number }[] = [];
    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      result.push({
        id: u.id, code: u.code, name: u.name, parent_code: parentCode,
        level: u.level, leader_name: u.leader_name, leader_email: u.leader_email, sort_order: i,
      });
      if (u.children && u.children.length > 0) result.push(...flatten(u.children, u.code, depth + 1));
    }
    return result;
  }

  const flat = flatten(tree);
  for (const row of flat) {
    await supabaseAdmin.from("unit_organisasi").upsert(row, { onConflict: "code" });
  }
  await syncOrgToDepartments();
  return { success: true, count: flat.length };
}

/* ─────── chart layout (legacy) ─────── */

export async function saveChartLayout(
  nodePositions: Record<string, { x: number; y: number }>,
  customEdges: { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }[]
) {
  await requireRole("hrd", "superadmin");
  const settings = await getSettings();
  settings.chart_layout = { nodePositions, customEdges, edgesCleared: customEdges.length === 0 && Object.keys(nodePositions).length === 0 ? true : undefined };
  await saveSettings(settings);
  revalidatePath("/hrd/workplace/structure");
  return { success: true };
}

export async function getChartLayout(): Promise<{ nodePositions: Record<string, { x: number; y: number }>; customEdges: { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }[] } | null> {
  await requireRole("hrd", "superadmin");
  const settings = await getSettings();
  return ((settings as Record<string, unknown>).chart_layout as { nodePositions: Record<string, { x: number; y: number }>; customEdges: { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }[] }) || null;
}
