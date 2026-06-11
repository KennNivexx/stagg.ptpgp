const https = require('https');

function fetchJobs(key, name) {
  const options = {
    hostname: 'oglodtarxmcwvjaehsbb.supabase.co',
    path: '/rest/v1/jobs?select=*',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  };

  https.get(options, (res) => {
    console.log(`\n--- Test with ${name} ---`);
    console.log('Status code:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('Response body:', data);
    });
  }).on('error', (err) => {
    console.error(`Error with ${name}:`, err.message);
  });
}

const anonKey = 'sb_publishable_esI4nNZR8D8kR7O54vLmPg_9nCFCtQK';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbG9kdGFyeG1jd3ZqYWVoc2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk1NDUxNSwiZXhwIjoyMDk2NTMwNTE1fQ.4-4zw_XJGNMJQ-3AY8kmH7EW3IBF66F3l0h2Kv2UC_k';

fetchJobs(anonKey, 'Anon Key');
setTimeout(() => {
  fetchJobs(serviceKey, 'Service Role Key');
}, 2000);
