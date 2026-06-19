// Run: node scratch/fix_job_postings.js
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://oglodtarxmcwvjaehsbb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbG9kdGFyeG1jd3ZqYWVoc2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk1NDUxNSwiZXhwIjoyMDk2NTMwNTE1fQ.4-4zw_XJGNMJQ-3AY8kmH7EW3IBF66F3l0h2Kv2UC_k"
);

async function main() {
  // Check current columns
  const { data, error } = await supabase.from("job_postings").select("*").limit(1);
  console.log("Current job_postings columns:", data ? Object.keys(data[0] || {}) : "no data");
  if (error) console.log("Error:", error.message);
  
  const { data: cols, error: colErr } = await supabase.rpc('execute_sql', { query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'applications';" });
  console.log("\nApplications Columns from RPC:", cols);
  if (colErr) console.log("RPC error:", colErr.message);

  // If RPC doesn't exist, we can't do it easily via REST.
  // Let's just try to insert with a valid UUID for job_id and see if it succeeds.
  const { error: testErr3 } = await supabase.from("applications").insert([{
    job_id: "job-1781776196360-dv5i",
    full_name: "Test Text ID",
    email: "test3@debug.com"
  }]);
  console.log("Insert with text job_id error:", testErr3?.message || "SUCCESS");
}

main().catch(console.error);
