const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://oglodtarxmcwvjaehsbb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbG9kdGFyeG1jd3ZqYWVoc2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk1NDUxNSwiZXhwIjoyMDk2NTMwNTE1fQ.4-4zw_XJGNMJQ-3AY8kmH7EW3IBF66F3l0h2Kv2UC_k"
);

async function main() {
  const spontaneousId = "00000000-0000-0000-0000-000000000000";
  
  // Check if exists
  const { data: existing } = await supabase.from("job_postings").select("id").eq("id", spontaneousId).single();
  
  if (!existing) {
    const { error } = await supabase.from("job_postings").insert([{
      id: spontaneousId,
      position: "Lamaran Spontan",
      department: "All",
      status: "Hidden" // Keep it hidden from the career page
    }]);
    
    if (error) {
      console.error("Failed to create spontaneous job:", error.message);
    } else {
      console.log("Successfully created spontaneous job posting.");
    }
  } else {
    console.log("Spontaneous job posting already exists.");
  }
}

main().catch(console.error);
