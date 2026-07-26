// Regenerates unit_organisasi / jabatan / karyawan codes into one consistent
// 7-segment hierarchical scheme, per boss's request:
//   seg1 = company (always 1)
//   seg2 = division (sequential among the 14 real divisions)
//   seg3 = sub-unit within division (0 if none, e.g. Gudang under Operasional = 1)
//   seg4 = rank tier within that unit (Direktur/GM/Manager/Supervisor/Staff/Pelaksana,
//          compressed to only the tiers actually present in that unit, so a
//          unit with just "Manager" and "Staff" gets tier 1/2, not their
//          absolute rank numbers)
//   seg5 = individual sequence within that rank tier (staff 1 = ...1.0.0,
//          staff 2 = ...2.0.0)
//   seg6, seg7 = reserved, always 0
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const RANK_KEYWORDS = [
  [/direktur utama|komisaris/i, 0],
  [/wakil direktur|direktur/i, 1],
  [/general manager/i, 2],
  [/manager|manajer/i, 3],
  [/supervisor|koordinator|asisten manajer/i, 4],
  [/staff|staf|officer|analyst|admin/i, 5],
];
function positionRank(name) {
  if (!name) return 6;
  for (const [re, rank] of RANK_KEYWORDS) if (re.test(name)) return rank;
  return 6;
}
const pad7 = (segs) => { const a = [...segs]; while (a.length < 7) a.push(0); return a.slice(0, 7).join('.'); };

(async () => {
  // ── 1. unit_organisasi ──────────────────────────────────────────────────
  const { data: units } = await sb.from('unit_organisasi').select('id, code, name, parent_code, level, sort_order').order('level').order('sort_order');
  const oldToNew = new Map(); // old code -> new code
  const unitUpdates = [];

  const root = units.find(u => u.level === 0);
  const rootNew = pad7([1]);
  oldToNew.set(root.code, rootNew);
  unitUpdates.push({ id: root.id, code: rootNew, parent_code: null });

  const level1 = units.filter(u => u.level === 1).sort((a, b) => a.sort_order - b.sort_order);
  level1.forEach((u, i) => {
    const newCode = pad7([1, i + 1]);
    oldToNew.set(u.code, newCode);
    unitUpdates.push({ id: u.id, code: newCode, parent_code: rootNew });
  });

  const level2 = units.filter(u => u.level === 2);
  for (const u of level2) {
    const parentNew = oldToNew.get(u.parent_code);
    const siblings = level2.filter(s => s.parent_code === u.parent_code).sort((a, b) => a.sort_order - b.sort_order);
    const idx = siblings.findIndex(s => s.id === u.id) + 1;
    const segs = parentNew.split('.').map(Number).filter((_, i) => i < 2); // [1, divIdx]
    const newCode = pad7([...segs, idx]);
    oldToNew.set(u.code, newCode);
    unitUpdates.push({ id: u.id, code: newCode, parent_code: parentNew });
  }

  for (const u of unitUpdates) {
    const { error } = await sb.from('unit_organisasi').update({ code: u.code, parent_code: u.parent_code }).eq('id', u.id);
    if (error) console.error('unit update fail', u.id, error.message);
  }
  console.log('unit_organisasi regenerated:', unitUpdates.length, 'rows');

  // ── 2. jabatan — group by department name, map to the unit's new code ──
  const nameToNewCode = new Map(units.map(u => [u.name, oldToNew.get(u.code)]));
  const { data: jabatanRows } = await sb.from('jabatan').select('id, name, department, level').order('department');
  const jabatanNewCode = new Map(); // jabatan.id -> new code
  const byDept = new Map();
  for (const j of jabatanRows) {
    if (!byDept.has(j.department)) byDept.set(j.department, []);
    byDept.get(j.department).push(j);
  }
  for (const [dept, list] of byDept) {
    const unitCode = nameToNewCode.get(dept);
    if (!unitCode) { console.log('skip jabatan dept (no matching unit):', dept, '(', list.length, 'jabatan)'); continue; }
    const base = unitCode.split('.').map(Number);
    // Compress actual ranks present in this department to sequential tiers.
    const ranksPresent = [...new Set(list.map(j => positionRank(j.level || j.name)))].sort((a, b) => a - b);
    const tierOf = new Map(ranksPresent.map((r, i) => [r, i + 1]));
    const seqByTier = new Map();
    const sorted = [...list].sort((a, b) => positionRank(a.level || a.name) - positionRank(b.level || b.name));
    for (const j of sorted) {
      const tier = tierOf.get(positionRank(j.level || j.name));
      const seq = (seqByTier.get(tier) || 0) + 1;
      seqByTier.set(tier, seq);
      const code = pad7([base[0], base[1], base[2], tier, seq]);
      jabatanNewCode.set(j.id, code);
    }
  }
  let jCount = 0;
  for (const [id, code] of jabatanNewCode) {
    const { error } = await sb.from('jabatan').update({ code }).eq('id', id);
    if (error) console.error('jabatan update fail', id, error.message); else jCount++;
  }
  console.log('jabatan regenerated:', jCount, '/', jabatanRows.length);

  // ── 3. karyawan.kode — extend their jabatan's code with an individual
  // sequence number in the 6th segment (7th stays 0) so coworkers sharing
  // the same jabatan/position still get distinct codes. ──
  const { data: karyawanRows } = await sb.from('karyawan').select('id, full_name, position, department').neq('status', 'Inactive');
  // Match employee -> jabatan by (department, position-name) since karyawan
  // has no jabatan_id FK — same loose-matching convention already used
  // elsewhere in this codebase (career-hrd.ts, vacancy.ts).
  const jabatanByDeptPos = new Map(jabatanRows.map(j => [`${j.department}::${j.name}`, j.id]));
  const seqByJabatan = new Map();
  let kCount = 0, kSkipped = 0;
  for (const k of karyawanRows) {
    const jid = jabatanByDeptPos.get(`${k.department}::${k.position}`);
    const baseCode = jid ? jabatanNewCode.get(jid) : null;
    if (!baseCode) { kSkipped++; continue; }
    const seq = (seqByJabatan.get(baseCode) || 0) + 1;
    seqByJabatan.set(baseCode, seq);
    const segs = baseCode.split('.').map(Number);
    segs[5] = seq; // 6th segment (0-indexed 5) = individual sequence
    const kode = segs.join('.');
    const { error } = await sb.from('karyawan').update({ kode }).eq('id', k.id);
    if (error) console.error('karyawan update fail', k.id, error.message); else kCount++;
  }
  console.log('karyawan.kode regenerated:', kCount, '/', karyawanRows.length, '(skipped, no jabatan match:', kSkipped, ')');
})();
