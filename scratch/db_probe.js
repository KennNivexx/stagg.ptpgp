const { Client } = require('pg');

const regions = [
  { name: 'Singapore (ap-southeast-1)', host: 'aws-0-ap-southeast-1.pooler.supabase.com' },
  { name: 'Sydney (ap-southeast-2)', host: 'aws-0-ap-southeast-2.pooler.supabase.com' },
  { name: 'Tokyo (ap-northeast-1)', host: 'aws-0-ap-northeast-1.pooler.supabase.com' },
  { name: 'Seoul (ap-northeast-2)', host: 'aws-0-ap-northeast-2.pooler.supabase.com' },
  { name: 'Mumbai (ap-south-1)', host: 'aws-0-ap-south-1.pooler.supabase.com' },
  { name: 'US East 1 (us-east-1)', host: 'aws-0-us-east-1.pooler.supabase.com' },
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

async function probe(region) {
  const connectionString = `postgresql://postgres.oglodtarxmcwvjaehsbb:hrdsistem12.@${region.host}:6543/postgres`;
  const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    console.log(`\n>>> SUCCESS: Connected to ${region.name}!`);
    const res = await client.query('SELECT version();');
    console.log('DB Version:', res.rows[0].version);
    await client.end();
    return true;
  } catch (err) {
    if (err.message.includes('tenant/user') && err.message.includes('not found')) {
      // expected for wrong regions
      process.stdout.write('.');
    } else {
      console.log(`\nConnection attempt to ${region.name} returned: ${err.message}`);
    }
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  console.log('Probing regions for tenant oglodtarxmcwvjaehsbb...');
  for (const r of regions) {
    const ok = await probe(r);
    if (ok) {
      console.log(`\nFound matching database host: ${r.host}`);
      break;
    }
  }
  console.log('\nProbing complete.');
}

run();
