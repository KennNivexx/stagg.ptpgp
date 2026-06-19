const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabase = createClient(
  "https://oglodtarxmcwvjaehsbb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbG9kdGFyeG1jd3ZqYWVoc2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk1NDUxNSwiZXhwIjoyMDk2NTMwNTE1fQ.4-4zw_XJGNMJQ-3AY8kmH7EW3IBF66F3l0h2Kv2UC_k"
);

async function main() {
  console.log("Fetching job postings...");
  const { data: jobs, error: jobErr } = await supabase.from("job_postings").select("*");
  if (jobErr) throw jobErr;

  console.log("Found jobs:", jobs.length);

  for (const job of jobs) {
    if (!job.id.includes("-") || job.id.startsWith("job-")) {
      const newId = crypto.randomUUID();
      console.log(`Replacing job ${job.id} with new UUID: ${newId}`);
      
      // Delete old job
      await supabase.from("job_postings").delete().eq("id", job.id);
      
      // Insert new job
      const newJob = { ...job, id: newId };
      const { error: insErr } = await supabase.from("job_postings").insert([newJob]);
      if (insErr) {
        console.error("Failed to insert new job:", insErr.message);
      } else {
        console.log("Successfully replaced job.");
      }
    } else {
      console.log(`Job ${job.id} is already a UUID.`);
    }
  }
}

main().catch(console.error);
