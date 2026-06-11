const dns = require('dns');

const hosts = [
  'aws-0-ap-southeast-3.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com'
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
