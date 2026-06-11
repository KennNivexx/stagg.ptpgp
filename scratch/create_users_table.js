const { Client } = require('pg');
const { randomBytes, pbkdf2Sync } = require('crypto');
require('dotenv').config({ path: '.env.local' });

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function run() {
  const connectionString = process.env.DATABASE_URL;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('hrd', 'employee')),
        full_name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('users table ready.');

    console.log('Granting permissions...');
    await client.query('GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;');
    await client.query('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;');
    await client.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;");

    const adminHash = hashPassword('password');
    const employeeHash = hashPassword('password');

    console.log('Seeding admin user...');
    await client.query(
      `INSERT INTO users (email, password_hash, role, full_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = $3, full_name = $4`,
      ['hrd@ptpgp.co.id', adminHash, 'hrd', 'Administrator HRD']
    );

    console.log('Seeding employee user...');
    await client.query(
      `INSERT INTO users (email, password_hash, role, full_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = $3, full_name = $4`,
      ['employee@ptpgp.co.id', employeeHash, 'employee', 'Budi Santoso']
    );

    console.log('Migration complete!');
    await client.end();
  } catch (err) {
    console.error('Migration failed:', err);
    try { await client.end(); } catch (e) {}
  }
}

run();
