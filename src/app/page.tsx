import { supabaseAdmin } from "@/lib/supabase";

// Always render fresh so superadmin edits (text/images/settings) appear immediately.
// The settings fetch must not be served from Next's Data Cache.
export const dynamic = "force-dynamic";

import NewNavbar from "@/components/public/NewNavbar";
import PGPFooter from "@/components/public/PGPFooter";
import ThemeStyle from "@/components/public/ThemeStyle";
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
import ContactSection from "@/components/public/ContactSection";
import TeaserSection from "@/components/public/TeaserSection";
import ClickSparkWrapper from "@/components/public/ClickSparkWrapper";
import PublicChatWidget from "@/components/public/PublicChatWidget";
import SplashScreen from "@/components/public/SplashScreen";

async function getSettings() {
  try {
    const { data } = await supabaseAdmin
      .from("karyawan")
      .select("address")
      .eq("email", "__settings__@ptpgp.co.id")
      .single();
    if (data?.address) {
      return JSON.parse(data.address as string);
    }
  } catch {
    console.error("[getSettings] Failed to parse website settings, returning empty config.");
  }
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
  const theme = settings?.theme || {};
  const contact = settings?.contact || {};
  const teaser = settings?.teaser || {};

  return (
    <>
    <SplashScreen />
    <ClickSparkWrapper>
    <main className="min-h-screen font-sans bg-[#FCF9F6]">
      <ThemeStyle
        primary={theme.primary as string}
        primaryHover={theme.primary_hover as string}
        navy={theme.navy as string}
        background={theme.background as string}
      />
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
      <ContactSection {...contact} />
      <TeaserSection {...teaser} />
      <PGPFooter info={info} footer={footer} links={links} />
      <PublicChatWidget />
    </main>
    </ClickSparkWrapper>
    </>
  );
}
