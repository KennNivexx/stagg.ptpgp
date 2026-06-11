const { Client } = require('pg');

const apConn = "postgresql://postgres.oglodtarxmcwvjaehsbb:hrdsistem12.@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";
const usConn = "postgresql://postgres.oglodtarxmcwvjaehsbb:hrdsistem12.@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

async function test(name, connectionString) {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`Connection successful for ${name}!`);
    const res = await client.query('SELECT version();');
    console.log('Version:', res.rows[0].version);
    await client.end();
    return true;
  } catch (err) {
    console.error(`Connection failed for ${name}:`, err.message);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  const apOk = await test('Singapore (ap-southeast-1)', apConn);
  if (!apOk) {
    await test('US East (us-east-1)', usConn);
  }
}

run();
