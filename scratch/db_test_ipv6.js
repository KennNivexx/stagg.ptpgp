const { Client } = require('pg');

async function run() {
  const client = new Client({
    user: 'postgres',
    host: '2406:da1c:4c7:f802:e96b:348d:e374:a1c0',
    database: 'postgres',
    password: 'hrdsistem12.',
    port: 5432,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    console.log('Attempting to connect to database via IPv6 address...');
    await client.connect();
    console.log('\n>>> SUCCESS! Connected via IPv6 direct address!');
    const res = await client.query('SELECT version();');
    console.log('Version:', res.rows[0].version);
    await client.end();
  } catch (err) {
    console.log('Failed to connect via IPv6:', err.message);
    try { await client.end(); } catch (e) {}
  }
}

run();
