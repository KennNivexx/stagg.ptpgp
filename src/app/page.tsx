import NewNavbar from "@/components/public/NewNavbar";
import PGPFooter from "@/components/public/PGPFooter";

// Halaman Landing Baru (12 Seksi)
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

export default function Home() {
  return (
    <main className="min-h-screen font-sans bg-[#FCF9F6]">
      <NewNavbar />
      
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <ServicesGridSection />
      <CoverageSection />
      <StatsSection />
      <IndustriesSection />
      <GallerySection />
      <TestimonialSection />
      <CertificationSection />
      <FAQSection />
      <CTASection />

      <PGPFooter />
    </main>
  );
}
