const {createClient} = require('@supabase/supabase-js');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l=>{const t=l.trim();if(!t||t[0]==='#')return;const i=t.indexOf('=');if(i<0)return;let v=t.slice(i+1).trim();if(v.startsWith('"'))v=v.slice(1,-1);env[t.slice(0,i).trim()]=v});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async()=>{
const {count:empCount} = await supabase.from('employees').select('*',{count:'exact',head:true}).neq('email','__settings__@ptpgp.co.id');
const {count:deptCount} = await supabase.from('departments').select('*',{count:'exact',head:true});
const {count:orgCount} = await supabase.from('org_units').select('*',{count:'exact',head:true});
const {count:posCount} = await supabase.from('positions').select('*',{count:'exact',head:true});
const {count:userCount} = await supabase.from('users').select('*',{count:'exact',head:true});

const {data:depts} = await supabase.from('employees').select('department').neq('email','__settings__@ptpgp.co.id');
const deptMap = {}; depts.forEach(d=>{const dn=d.department||'Lainnya';deptMap[dn]=(deptMap[dn]||0)+1});

const {data:positions} = await supabase.from('employees').select('position,department').neq('email','__settings__@ptpgp.co.id');
const posMap = {}; positions.forEach(p=>{if(!p.position)return;posMap[p.position]=(posMap[p.position]||0)+1});

console.log('=== DATABASE STATS ===');
console.log('Total Karyawan:', empCount);
console.log('Total Users:', userCount);
console.log('Total Departemen:', deptCount);
console.log('Total Org Units:', orgCount);
console.log('Total Positions:', posCount);
console.log('');
console.log('=== PER DEPARTEMEN ===');
Object.entries(deptMap).sort((a,b)=>b[1]-a[1]).forEach(([d,c])=>console.log('  '+d+': '+c+' karyawan'));
console.log('');
console.log('=== PER JABATAN ===');
Object.entries(posMap).sort((a,b)=>b[1]-a[1]).forEach(([p,c])=>console.log('  '+p+': '+c+' orang'));
})();
