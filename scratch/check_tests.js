const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let env = {};
const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
for (const line of envContent.split('\n')) {
  const parts = line.trim().split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^"/, '').replace(/"$/, '');
    env[key] = val;
  }
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

sb.from('tes_rekrutmen').select('id, title, test_type, is_active, job_posting_id').then(({ data, error }) => {
  if (error) {
    console.log('Error (mungkin tabel belum ada):', error.message);
    return;
  }
  if (!data || data.length === 0) {
    console.log('Tidak ada tes di database. Buat dulu di HRD -> Rekrutmen -> Tes Seleksi.');
    return;
  }
  console.log('Daftar tes:');
  data.forEach(t => console.log(` - [${t.test_type}] ${t.title} | aktif: ${t.is_active} | job_id: ${t.job_posting_id || 'umum (null)'}`));
});
