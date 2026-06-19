const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://oglodtarxmcwvjaehsbb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbG9kdGFyeG1jd3ZqYWVoc2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk1NDUxNSwiZXhwIjoyMDk2NTMwNTE1fQ.4-4zw_XJGNMJQ-3AY8kmH7EW3IBF66F3l0h2Kv2UC_k"
);

async function main() {
  // 1. Check current job_postings
  const { data: jobs } = await supabase.from("job_postings").select("id, position, department, status");
  console.log("Job postings:", JSON.stringify(jobs, null, 2));

  // 2. Try submitting an application with a valid job UUID
  const jobId = jobs && jobs.length > 0 ? jobs.find(j => j.status === 'Open')?.id : null;
  console.log("\nUsing job_id:", jobId);

  if (jobId) {
    const { data, error } = await supabase.from("applications").insert([{
      job_id: jobId,
      full_name: "Test Applicant",
      email: "test.applicant@test.com",
      phone: "081234567890",
      resume_url: JSON.stringify({ skills: ["test"] }),
      status: "Menunggu Review"
    }]).select();

    if (error) {
      console.log("INSERT ERROR:", error.message);
      console.log("Error details:", JSON.stringify(error, null, 2));
    } else {
      console.log("INSERT SUCCESS:", JSON.stringify(data, null, 2));
      // Cleanup
      if (data && data[0]) {
        await supabase.from("applications").delete().eq("id", data[0].id);
        console.log("Cleaned up test record");
      }
    }
  }

  // 3. Check applications table columns by listing one
  const { data: apps, error: appErr } = await supabase.from("applications").select("*").limit(1);
  console.log("\nApplications columns:", apps && apps[0] ? Object.keys(apps[0]) : "empty");
  if (apps && apps[0]) console.log("Sample row:", JSON.stringify(apps[0], null, 2));
  if (appErr) console.log("App error:", appErr.message);
}

main().catch(console.error);
