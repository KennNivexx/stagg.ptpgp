import { supabase } from "@/lib/supabase";
import NewNavbar from "@/components/public/NewNavbar";
import PGPFooter from "@/components/public/PGPFooter";
import AnimatedCareerWrapper from "@/components/public/AnimatedCareerWrapper";

export const revalidate = 60;

export default async function CareerPage(props: { searchParams: Promise<{ filter?: string }> }) {
  const searchParams = await props.searchParams;
  const filter = searchParams.filter;

  let query = supabase.from('jobs').select('*').order('created_at', { ascending: false });
  if (filter && filter !== 'All') {
    query = query.eq('department', filter);
  }
  const { data: jobs } = await query;

  return (
    <main className="min-h-screen bg-[#FDFDFD] pt-[72px]">
      <NewNavbar />
      <AnimatedCareerWrapper jobs={jobs || []} />
      <PGPFooter />
    </main>
  );
}
