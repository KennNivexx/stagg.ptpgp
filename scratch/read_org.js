const { Client } = require('pg');

async function run() {
  const connectionString = 'postgresql://postgres:hrdsistem12.@db.oglodtarxmcwvjaehsbb.supabase.co:5432/postgres';
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to DB');
    const res = await client.query("SELECT address FROM employees WHERE email = '__settings__@ptpgp.co.id'");
    if (res.rows.length > 0) {
      console.log('SETTINGS DATA:');
      console.log(JSON.stringify(JSON.parse(res.rows[0].address), null, 2));
    } else {
      console.log('No settings row found');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
