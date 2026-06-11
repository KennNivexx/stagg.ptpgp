const dns = require('dns');

const hosts = [
  'aws-0-ap-northeast-1.pooler.supabase.com',
  'aws-0-ap-southeast-2.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-us-west-2.pooler.supabase.com'
];

hosts.forEach(host => {
  dns.lookup(host, (err, address, family) => {
    if (err) {
      // ignore failures
    } else {
      console.log(`DNS lookup for ${host} successful: ${address}`);
    }
  });
});
