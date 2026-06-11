const { Client } = require('pg');
const dns = require('dns');

const regions = [
  { name: 'Osaka (ap-northeast-3)', host: 'aws-0-ap-northeast-3.pooler.supabase.com' },
  { name: 'Mumbai (ap-south-1)', host: 'aws-0-ap-south-1.pooler.supabase.com' },
  { name: 'Sydney (ap-southeast-2)', host: 'aws-0-ap-southeast-2.pooler.supabase.com' },
  { name: 'Tokyo (ap-northeast-1)', host: 'aws-0-ap-northeast-1.pooler.supabase.com' },
  { name: 'Seoul (ap-northeast-2)', host: 'aws-0-ap-northeast-2.pooler.supabase.com' },
  { name: 'Singapore (ap-southeast-1)', host: 'aws-0-ap-southeast-1.pooler.supabase.com' }
];

async function test(region) {
  // Check if host resolves first
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
