// Fills in the employees whose position text didn't exactly match any
// jabatan.name (e.g. "Driver Tronton Batam", "Staff Purchasing") so they
// were skipped by regenerate_org_codes.js. Falls back to department + rank
// (from their own position text) instead of requiring an exact jabatan match.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const RANK_KEYWORDS = [
  [/direktur utama|komisaris/i, 0],
  [/wakil direktur|direktur/i, 1],
  [/general manager/i, 2],
  [/head|manager|manajer/i, 3],
  [/supervisor|koordinator|asisten manajer/i, 4],
  [/staff|staf|officer|analyst|admin|inspector/i, 5],
];
function positionRank(name) {
  if (!name) return 6;
  for (const [re, rank] of RANK_KEYWORDS) if (re.test(name)) return rank;
  return 6;
}

(async () => {
  const { data: units } = await sb.from('unit_organisasi').select('id, code, name');
  const unitCodeByName = new Map(units.map(u => [u.name, u.code]));
  // "Holding" (Komisaris/Direktur Utama) sits above every division — anchor
  // it to the root company code instead of skipping it.
  const root = units.find(u => u.code.split('.').slice(1).every(s => s === '0'));

  // Load every already-regenerated jabatan code (7-segment, tier is 4th
  // segment) to know which tier number is already in use per unit, so new
  // fallback assignments don't collide with an existing tier's meaning.
  const { data: jabatanRows } = await sb.from('jabatan').select('code, department, level, name').like('code', '1.%.%.%.%.0.0');
  const tierByUnitRank = new Map(); // "unitCode|rank" -> tier
  const maxTierByUnit = new Map(); // unitCode(3 segs) -> max tier used
  for (const j of jabatanRows) {
    const segs = j.code.split('.').map(Number);
    const unitKey = segs.slice(0, 3).join('.');
    const tier = segs[3];
    const rank = positionRank(j.level || j.name);
    tierByUnitRank.set(`${unitKey}|${rank}`, tier);
    maxTierByUnit.set(unitKey, Math.max(maxTierByUnit.get(unitKey) || 0, tier));
  }
  // Also seed max-sequence-used per (unitCode|tier) from already-assigned
  // karyawan.kode so new fallback employees don't collide with real ones.
  const { data: allKaryawan } = await sb.from('karyawan').select('id, full_name, position, department, kode').neq('status', 'Inactive');
  const seqByUnitTier = new Map();
  for (const k of allKaryawan) {
    if (!k.kode) continue;
    const segs = k.kode.split('.').map(Number);
    if (segs.length !== 7) continue;
    const unitKey = segs.slice(0, 3).join('.');
    const tier = segs[3];
    const key = `${unitKey}|${tier}`;
    seqByUnitTier.set(key, Math.max(seqByUnitTier.get(key) || 0, segs[5]));
  }

  const toFix = allKaryawan.filter(k => {
    if (!k.kode) return true;
    const segs = k.kode.split('.');
    return segs.length !== 7;
  });
  console.log('employees to fix:', toFix.length);

  let fixed = 0;
  for (const k of toFix) {
    const unitCode = k.department === 'Holding' ? root.code : unitCodeByName.get(k.department);
    if (!unitCode) { console.log('  no unit for department:', k.department, '(', k.full_name, ')'); continue; }
    const unitKey = unitCode.split('.').slice(0, 3).join('.');
    const rank = positionRank(k.position);
    let tier = tierByUnitRank.get(`${unitKey}|${rank}`);
    if (tier == null) {
      tier = (maxTierByUnit.get(unitKey) || 0) + 1;
      maxTierByUnit.set(unitKey, tier);
      tierByUnitRank.set(`${unitKey}|${rank}`, tier);
    }
    const seqKey = `${unitKey}|${tier}`;
    const seq = (seqByUnitTier.get(seqKey) || 0) + 1;
    seqByUnitTier.set(seqKey, seq);
    const segs = unitKey.split('.').map(Number); // [1, div, sub]
    const kode = [...segs, tier, seq, 0, 0].join('.');
    const { error } = await sb.from('karyawan').update({ kode }).eq('id', k.id);
    if (error) console.error('  fail', k.full_name, error.message); else fixed++;
  }
  console.log('fixed:', fixed, '/', toFix.length);
})();
