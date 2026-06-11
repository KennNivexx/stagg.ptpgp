const dns = require('dns');

// Set the DNS resolver to Google's public DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

dns.lookup('db.oglodtarxmcwvjaehsbb.supabase.co', (err, address, family) => {
  if (err) {
    console.error('Google DNS lookup failed:', err.message);
  } else {
    console.log(`Google DNS lookup successful: ${address} (family: IPv${family})`);
  }
});

// Also try the API host
dns.lookup('oglodtarxmcwvjaehsbb.supabase.co', (err, address, family) => {
  if (err) {
    console.error('Google DNS API lookup failed:', err.message);
  } else {
    console.log(`Google DNS API lookup successful: ${address}`);
  }
});
