import Navbar from "@/components/Navbar";
import HeroSection from "@/components/home/HeroSection";
import KeyFactors from "@/components/home/KeyFactors";
import HowItWorks from "@/components/home/HowItWorks";
import FeaturesGrid from "@/components/home/FeaturesGrid";
import PrivacySection from "@/components/home/PrivacySection";
import FAQSection from "@/components/home/FAQSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <KeyFactors />
      <HowItWorks />
      <FeaturesGrid />
      <PrivacySection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
