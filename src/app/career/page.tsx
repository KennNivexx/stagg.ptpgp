import { supabaseAdmin } from "@/lib/supabase";
import { getPublicSettings } from "@/lib/public-settings";
import { Plus_Jakarta_Sans } from "next/font/google";
import NewNavbar from "@/components/public/NewNavbar";
import PGPFooter from "@/components/public/PGPFooter";
import ThemeStyle from "@/components/public/ThemeStyle";
import AnimatedCareerWrapper from "@/components/public/AnimatedCareerWrapper";

export const revalidate = 60;

// Matches the homepage's typography (src/app/page.tsx) so the public site
// reads as one consistent brand, not two different templates.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta" });

export default async function CareerPage(props: { searchParams: Promise<{ filter?: string }> }) {
  const searchParams = await props.searchParams;
  const filter = searchParams.filter;

  let query = supabaseAdmin.from('lowongan_kerja').select('*').eq('status', 'Open').order('created_at', { ascending: false });
  if (filter && filter !== 'All') {
    query = query.eq('department', filter);
  }
  const [{ data: jobs }, settings] = await Promise.all([query, getPublicSettings()]);
  const info = settings?.info || {};
  const links = settings?.links || {};
  const footer = settings?.footer || {};
  const theme = settings?.theme || {};
  const mappedJobs = (jobs || []).map((j: Record<string, unknown>) => ({
    id: j.id as string,
    title: (j.title as string) || (j.position as string),
    department: j.department as string,
    type: (j.employment_type as string) || "Full-time",
    location: (j.location as string) || "Jakarta Utara",
    description: (j.description as string) || "",
    job_desk: (j.job_desk as string) || "",
    requirements: (j.requirements as string) || "",
    education: (j.education as string) || "",
    experience: (j.experience as string) || "",
    age_min: (j.age_min as number) || null,
    age_max: (j.age_max as number) || null,
    deadline: (j.deadline as string) || "",
  }));

  return (
    <main className={`min-h-screen bg-[#FDFDFD] pt-[72px] ${jakarta.className}`}>
      <ThemeStyle
        primary={theme.primary as string}
        primaryHover={theme.primary_hover as string}
        navy={theme.navy as string}
        background={theme.background as string}
      />
      <NewNavbar links={links} companyName={info.company_name as string} />
      <AnimatedCareerWrapper jobs={mappedJobs} />
      <PGPFooter info={info} footer={footer} links={links} />
    </main>
  );
}
