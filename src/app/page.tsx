import { supabaseAdmin } from "@/lib/supabase";

export const revalidate = 60;

import NewNavbar from "@/components/public/NewNavbar";
import PGPFooter from "@/components/public/PGPFooter";
import HeroSection from "@/components/public/HeroSection";
import AboutSection from "@/components/public/AboutSection";
import FeaturesSection from "@/components/public/FeaturesSection";
import ServicesGridSection from "@/components/public/ServicesGridSection";
import CoverageSection from "@/components/public/CoverageSection";
import StatsSection from "@/components/public/StatsSection";
import IndustriesSection from "@/components/public/IndustriesSection";
import GallerySection from "@/components/public/GallerySection";
import TestimonialSection from "@/components/public/TestimonialSection";
import CertificationSection from "@/components/public/CertificationSection";
import FAQSection from "@/components/public/FAQSection";
import CTASection from "@/components/public/CTASection";

async function getSettings() {
  try {
    const { data } = await supabaseAdmin
      .from("employees")
      .select("address")
      .eq("email", "__settings__@ptpgp.co.id")
      .single();
    if (data?.address) {
      return JSON.parse(data.address as string);
    }
  } catch {}
  return {};
}

export default async function Home() {
  const settings = await getSettings();
  const hero = settings?.hero || {};
  const about = settings?.about || {};
  const features = settings?.features || {};
  const services = settings?.services || {};
  const coverage = settings?.coverage || {};
  const stats = settings?.stats || {};
  const industries = settings?.industries || {};
  const gallery = settings?.gallery || {};
  const testimonial = settings?.testimonial || {};
  const certification = settings?.certification || {};
  const faq = settings?.faq || {};
  const cta = settings?.cta || {};
  const info = settings?.info || {};
  const links = settings?.links || {};
  const footer = settings?.footer || {};

  return (
    <main className="min-h-screen font-sans bg-[#FCF9F6]">
      <NewNavbar links={links} companyName={info.company_name} />
      
      <HeroSection
        badge={(hero.hero_badge_text as string) || undefined}
        title={(hero.hero_title as string) || undefined}
        titleHighlight={(hero.hero_title_highlight as string) || undefined}
        subtitle={(hero.hero_subtitle as string) || undefined}
        bgVideoUrl={(hero.hero_bg_video_url as string) || undefined}
        bgImageUrl={(hero.hero_bg_image_url as string) || undefined}
      />
      {about.show !== false && <AboutSection {...about} />}
      {features.show !== false && <FeaturesSection {...features} />}
      {services.show !== false && <ServicesGridSection {...services} />}
      {coverage.show !== false && <CoverageSection {...coverage} />}
      {stats.show !== false && <StatsSection {...stats} />}
      {industries.show !== false && <IndustriesSection {...industries} />}
      {gallery.show !== false && <GallerySection {...gallery} />}
      {testimonial.show !== false && <TestimonialSection {...testimonial} />}
      {certification.show !== false && <CertificationSection {...certification} />}
      {faq.show !== false && <FAQSection {...faq} />}
      {cta.show !== false && <CTASection {...cta} />}
      <PGPFooter info={info} footer={footer} links={links} />
    </main>
  );
}
