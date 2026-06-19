const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Hrdsistem12.@db.oglodtarxmcwvjaehsbb.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  console.log("Connected to DB");

  try {
    // 1. Fix applications job_id column type to TEXT
    await client.query(`ALTER TABLE applications ALTER COLUMN job_id TYPE TEXT;`);
    console.log("Fixed applications table: job_id is now TEXT");

    // 2. Add title and description to job_postings
    await client.query(`
      ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
      ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
      UPDATE job_postings SET title = position WHERE title = '' OR title IS NULL;
    `);
    console.log("Fixed job_postings table: added title and description columns");

  } catch (err) {
    console.error("Error executing queries:", err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
