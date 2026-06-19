import { supabaseAdmin } from "@/lib/supabase";
import NewNavbar from "@/components/public/NewNavbar";
import PGPFooter from "@/components/public/PGPFooter";
import AnimatedCareerWrapper from "@/components/public/AnimatedCareerWrapper";

export const revalidate = 60;

export default async function CareerPage(props: { searchParams: Promise<{ filter?: string }> }) {
  const searchParams = await props.searchParams;
  const filter = searchParams.filter;

  let query = supabaseAdmin.from('job_postings').select('*').eq('status', 'Open').order('created_at', { ascending: false });
  if (filter && filter !== 'All') {
    query = query.eq('department', filter);
  }
  const { data: jobs } = await query;
  const mappedJobs = (jobs || []).map((j: Record<string, unknown>) => ({
    id: j.id as string,
    title: j.position as string,
    department: j.department as string,
    type: "Full-time",
    location: j.location as string || "Jakarta Utara",
    description: (j.requirements as string) || "",
    job_desk: (j.job_desk as string) || "",
    education: (j.education as string) || "",
    experience: (j.experience as string) || "",
    age_min: j.age_min as number || null,
    age_max: j.age_max as number || null,
    deadline: "",
  }));

  return (
    <main className="min-h-screen bg-[#FDFDFD] pt-[72px]">
      <NewNavbar />
      <AnimatedCareerWrapper jobs={mappedJobs} />
      <PGPFooter />
    </main>
  );
}
