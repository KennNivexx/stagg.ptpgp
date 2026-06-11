const dns = require('dns');

dns.resolve6('db.oglodtarxmcwvjaehsbb.supabase.co', (err, addresses) => {
  if (err) {
    console.error('IPv6 DNS resolution failed:', err.message);
  } else {
    console.log('IPv6 DNS resolution successful! Addresses:', addresses);
  }
});

dns.resolve6('oglodtarxmcwvjaehsbb.supabase.co', (err, addresses) => {
  if (err) {
    console.error('API IPv6 DNS resolution failed:', err.message);
  } else {
    console.log('API IPv6 DNS resolution successful! Addresses:', addresses);
  }
});
