const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://oglodtarxmcwvjaehsbb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbG9kdGFyeG1jd3ZqYWVoc2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk1NDUxNSwiZXhwIjoyMDk2NTMwNTE1fQ.4-4zw_XJGNMJQ-3AY8kmH7EW3IBF66F3l0h2Kv2UC_k"
);

async function main() {
  // Test the join query that applicants page uses
  const { data, error } = await supabase
    .from("applications")
    .select("*, job_postings!inner(position, department)")
    .order("applied_at", { ascending: false })
    .limit(5);

  if (error) {
    console.log("JOIN ERROR:", error.message);
    console.log("Details:", JSON.stringify(error, null, 2));
    
    // Try without inner join
    console.log("\nTrying without !inner...");
    const { data: data2, error: err2 } = await supabase
      .from("applications")
      .select("*, job_postings(position, department)")
      .order("applied_at", { ascending: false })
      .limit(5);
    
    if (err2) {
      console.log("JOIN ERROR (no inner):", err2.message);
    } else {
      console.log("JOIN SUCCESS (no inner):", JSON.stringify(data2, null, 2));
    }
  } else {
    console.log("JOIN SUCCESS:", JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
