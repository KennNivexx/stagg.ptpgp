const https = require('https');

const options = {
  hostname: 'oglodtarxmcwvjaehsbb.supabase.co',
  path: '/rest/v1/',
  headers: {
    'apikey': 'sb_publishable_esI4nNZR8D8kR7O54vLmPg_9nCFCtQK'
  }
};

https.get(options, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Body:', data);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
