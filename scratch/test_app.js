const {createClient}=require('@supabase/supabase-js');
const e={};require('fs').readFileSync('.env.local','utf8').split('\n').forEach(l=>{const t=l.trim();if(!t||t[0]==='#')return;const i=t.indexOf('=');if(i<0)return;let v=t.slice(i+1).trim();if(v.startsWith('"'))v=v.slice(1,-1);e[t.slice(0,i).trim()]=v});
const s=createClient(e.NEXT_PUBLIC_SUPABASE_URL,e.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
// Check if job_id is UUID type
const uuid = '00000000-0000-0000-0000-000000000001';
const {error}=await s.from('applications').insert({job_id:uuid,full_name:'Test User',email:'test@test.com',phone:'0812',resume_url:'{}',status:'Menunggu Review'});
if(error)console.log('ERROR:',error.message);
else console.log('INSERT OK with UUID job_id');
})();
