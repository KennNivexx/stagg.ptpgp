const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://oglodtarxmcwvjaehsbb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbG9kdGFyeG1jd3ZqYWVoc2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk1NDUxNSwiZXhwIjoyMDk2NTMwNTE1fQ.4-4zw_XJGNMJQ-3AY8kmH7EW3IBF66F3l0h2Kv2UC_k"
);

async function main() {
  // Simulate the exact same flow as submitApplication server action
  const job_id = "fef5ded9-f7fe-4208-8603-0dbaf41a349f"; // existing Open job
  const full_name = "Test Lamaran Via Script";
  const email = "test.lamaran@gmail.com";
  const phone = "081234567890";
  const profile_data = JSON.stringify({
    headline: "Software Engineer",
    summary: "Experienced developer",
    skills: ["JavaScript", "React"],
    experiences: [],
    educations: [],
    languages: ["Indonesian", "English"],
    certifications: [],
    coverLetter: "Saya tertarik bergabung dengan PT PGP.",
  });

  console.log("Submitting application...");
  const { data, error } = await supabase
    .from("applications")
    .insert([{
      job_id,
      full_name,
      email,
      phone,
      resume_url: profile_data,
      status: "Menunggu Review",
    }])
    .select();

  if (error) {
    console.log("ERROR:", error.message);
    console.log("Details:", JSON.stringify(error, null, 2));
  } else {
    console.log("SUCCESS! Application submitted:");
    console.log(JSON.stringify(data, null, 2));
    
    // Cleanup
    if (data && data[0]) {
      await supabase.from("applications").delete().eq("id", data[0].id);
      console.log("Test record cleaned up.");
    }
  }
}

main().catch(console.error);
