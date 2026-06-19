const {createClient}=require('@supabase/supabase-js');
const e={};require('fs').readFileSync('.env.local','utf8').split('\n').forEach(l=>{const t=l.trim();if(!t||t[0]==='#')return;const i=t.indexOf('=');if(i<0)return;let v=t.slice(i+1).trim();if(v.startsWith('"'))v=v.slice(1,-1);e[t.slice(0,i).trim()]=v});
const s=createClient(e.NEXT_PUBLIC_SUPABASE_URL,e.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
const {error}=await s.from('applications').select('id').limit(1);
if(error){console.log('APPLICATIONS TABLE MISSING:',error.message);console.log('Run: supabase/migrations/20260615008_create_applications.sql')}
else console.log('applications table exists');
const {data}=await s.from('job_postings').select('id,position,status').eq('status','Open');
console.log('Open job postings:',(data||[]).length);
(data||[]).forEach(j=>console.log(' -',j.id,j.position));
})();
