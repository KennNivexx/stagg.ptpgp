const { Client } = require('pg');

async function fixPermissions() {
  const connectionString = `postgresql://postgres.oglodtarxmcwvjaehsbb:hrdsistem12.@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`;
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase Postgres database.');

    console.log('Granting privileges on public schema...');
    await client.query('GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;');
    await client.query('GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;');
    await client.query('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;');
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;');
    
    console.log('Permissions granted successfully!');
    
    // Let's also check the owner of the jobs table
    const ownerRes = await client.query(`
      SELECT table_name, tableowner 
      FROM pg_tables 
      WHERE schemaname = 'public' AND table_name IN ('jobs', 'employees');
    `);
    console.log('Table Owners:', ownerRes.rows);

    await client.end();
  } catch (err) {
    console.error('Error running fix script:', err);
    try { await client.end(); } catch (e) {}
  }
}

fixPermissions();
