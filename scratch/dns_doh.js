const https = require('https');

const url = 'https://dns.google/resolve?name=db.oglodtarxmcwvjaehsbb.supabase.co&type=AAAA';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Google DoH Response Status:', json.Status);
      if (json.Answer) {
        json.Answer.forEach(ans => {
          console.log(`Resolved IP (${ans.type === 28 ? 'AAAA' : 'A'}):`, ans.data);
        });
      } else {
        console.log('No answer records found.');
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching DoH:', err.message);
});
