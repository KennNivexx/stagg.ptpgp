const { Client } = require('pg');
const dns = require('dns');

const regions = [
  { name: 'US East 2 (us-east-2)', host: 'aws-0-us-east-2.pooler.supabase.com' },
  { name: 'US West 1 (us-west-1)', host: 'aws-0-us-west-1.pooler.supabase.com' },
  { name: 'US West 2 (us-west-2)', host: 'aws-0-us-west-2.pooler.supabase.com' },
  { name: 'Frankfurt (eu-central-1)', host: 'aws-0-eu-central-1.pooler.supabase.com' },
  { name: 'Ireland (eu-west-1)', host: 'aws-0-eu-west-1.pooler.supabase.com' },
  { name: 'London (eu-west-2)', host: 'aws-0-eu-west-2.pooler.supabase.com' },
  { name: 'Paris (eu-west-3)', host: 'aws-0-eu-west-3.pooler.supabase.com' },
  { name: 'Canada (ca-central-1)', host: 'aws-0-ca-central-1.pooler.supabase.com' },
  { name: 'Sao Paulo (sa-east-1)', host: 'aws-0-sa-east-1.pooler.supabase.com' }
];

async function test(region) {
  return new Promise((resolve) => {
    dns.lookup(region.host, async (err) => {
      if (err) {
        console.log(`DNS lookup failed for ${region.name}: ${err.message}`);
        resolve(false);
        return;
      }
      
      const client = new Client({
        user: 'postgres.oglodtarxmcwvjaehsbb',
        host: region.host,
        database: 'postgres',
        password: 'hrdsistem12.',
        port: 6543,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 4000
      });

      try {
        await client.connect();
        console.log(`\n>>> SUCCESS for ${region.name}!`);
        await client.end();
        resolve(true);
      } catch (connErr) {
        console.log(`Failed for ${region.name}: ${connErr.message}`);
        try { await client.end(); } catch (e) {}
        resolve(false);
      }
    });
  });
}

async function run() {
  for (const r of regions) {
    await test(r);
  }
}

run();
