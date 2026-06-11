const dns = require('dns');

const hosts = [
  'oglodtarxmcwvjaehsbb.supabase.co',
  'db.oglodtarxmcwvjaehsbb.supabase.co',
  'google.com'
];

hosts.forEach(host => {
  dns.lookup(host, (err, address, family) => {
    if (err) {
      console.error(`DNS lookup for ${host} failed:`, err.message);
    } else {
      console.log(`DNS lookup for ${host} successful: ${address} (family: IPv${family})`);
    }
  });
});
