const {createClient}=require('@supabase/supabase-js');
const e={};require('fs').readFileSync('.env.local','utf8').split('\n').forEach(l=>{const t=l.trim();if(!t||t[0]==='#')return;const i=t.indexOf('=');if(i<0)return;let v=t.slice(i+1).trim();if(v.startsWith('"'))v=v.slice(1,-1);e[t.slice(0,i).trim()]=v});
const s=createClient(e.NEXT_PUBLIC_SUPABASE_URL,e.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
const {data}=await s.from('job_postings').select('*');
console.log('Job postings:',(data||[]).length);
if(data&&data.length>0){data.slice(0,5).forEach(j=>console.log(' -',j.position,j.department,j.status))}
else console.log('EMPTY - no job postings created yet');
const {data:r}=await s.from('workforce_requests').select('status,department,position').order('created_at',{ascending:false}).limit(5);
console.log('\nRecent requests:');
(r||[]).forEach(r=>console.log(' -',r.status,r.department,r.position));
})();
