const { Client } = require('pg');

async function test(name, host, port, user) {
  const client = new Client({
    user,
    host,
    database: 'postgres',
    password: 'hrdsistem12.',
    port,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`\n>>> SUCCESS for ${name} (${host}:${port}) with user ${user}!`);
    const res = await client.query('SELECT version();');
    console.log('Version:', res.rows[0].version);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed for ${name} (${host}:${port}) with user ${user}: ${err.message}`);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  const hosts = [
    'aws-0-ap-southeast-1.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com'
  ];
  
  const users = [
    'postgres.oglodtarxmcwvjaehsbb',
    'postgres'
  ];

  const ports = [5432, 6543];

  for (const host of hosts) {
    for (const port of ports) {
      for (const user of users) {
        await test(host.split('.')[0], host, port, user);
      }
    }
  }
}

run();
