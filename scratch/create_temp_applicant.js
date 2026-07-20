const { createClient } = require('@supabase/supabase-js');
const { pbkdf2Sync, randomBytes, createHmac } = require('crypto');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
let env = {};
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      env[key] = val;
    }
  }
} catch (e) {
  console.error('Error reading .env.local:', e.message);
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const sessionSecret = env.SESSION_SECRET;

if (!supabaseUrl || !supabaseKey || !sessionSecret) {
  console.error('Error: missing env variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Hash password function matching src/lib/auth.ts
const PBKDF2_ITERATIONS = 100_000;
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

// Generate one time token function matching src/lib/otp-token.ts
function generateOneTimeToken(email) {
  const payload = JSON.stringify({ email, exp: Date.now() + 86400000 });
  const data = Buffer.from(payload).toString("base64url");
  const hmac = createHmac("sha256", sessionSecret).update(data).digest("base64url");
  return `${data}.${hmac}`;
}

async function run() {
  const email = "calon.pelamar.test@ptpgp.co.id";
  const fullName = "Calon Pelamar Sementara";
  const tempPassword = "Lamar-12345678";

  console.log("Checking for an open job...");
  const { data: jobs, error: jobsError } = await supabase
    .from("lowongan_kerja")
    .select("id, position")
    .eq("status", "Open")
    .limit(1);

  if (jobsError) {
    console.error("Error fetching jobs:", jobsError.message);
    process.exit(1);
  }

  let jobId;
  let jobPosition = "";
  if (jobs && jobs.length > 0) {
    jobId = jobs[0].id;
    jobPosition = jobs[0].position;
    console.log(`Found open job: ${jobPosition} (${jobId})`);
  } else {
    // If no open job, get any job
    const { data: anyJobs, error: anyJobsError } = await supabase
      .from("lowongan_kerja")
      .select("id, position")
      .limit(1);
    
    if (anyJobsError || !anyJobs || anyJobs.length === 0) {
      console.error("No jobs found in lowongan_kerja. Please create a job first.");
      process.exit(1);
    }
    jobId = anyJobs[0].id;
    jobPosition = anyJobs[0].position;
    console.log(`No open jobs found. Linking to first available job: ${jobPosition} (${jobId})`);
  }

  console.log(`Cleaning up existing test data for ${email}...`);
  // Delete any existing user/pelamar with this email to avoid duplicates
  await supabase.from("pengguna").delete().eq("email", email);
  await supabase.from("pelamar").delete().eq("email", email);

  console.log("Creating pelamar record...");
  const applicationId = "app-" + randomBytes(16).toString("hex");
  const { error: pelamarError } = await supabase
    .from("pelamar")
    .insert([{
      id: applicationId,
      job_id: jobId,
      full_name: fullName,
      email: email,
      phone: "081234567890",
      resume_url: "{}",
      status: "Menunggu Review"
    }]);

  if (pelamarError) {
    console.error("Error inserting pelamar:", pelamarError.message);
    process.exit(1);
  }

  console.log("Creating pengguna (applicant) record...");
  const passwordHash = hashPassword(tempPassword);
  const oneTimeToken = generateOneTimeToken(email);
  const tokenExpires = new Date(Date.now() + 86400000).toISOString();

  const { error: penggunaError } = await supabase
    .from("pengguna")
    .insert([{
      email: email,
      password_hash: passwordHash,
      role: "applicant",
      full_name: fullName,
      application_id: applicationId,
      is_temporary: true,
      one_time_token: oneTimeToken,
      one_time_token_expires: tokenExpires
    }]);

  if (penggunaError) {
    console.error("Error inserting pengguna:", penggunaError.message);
    process.exit(1);
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const loginUrl = `${appUrl}/login/token?t=${oneTimeToken}`;

  console.log("\n==================================================");
  console.log("SUCCESS: Akun pelamar sementara berhasil dibuat!");
  console.log(`Email      : ${email}`);
  console.log(`Password   : ${tempPassword}`);
  console.log(`Link Login : ${loginUrl}`);
  console.log("==================================================\n");
}

run();
