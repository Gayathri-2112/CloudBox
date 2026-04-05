import "../styles/Landing.css";
import {
  Navbar, Hero, TrustBar, Features,
  HowItWorks, WhyChoose, Testimonials,
  Pricing, CTA, Footer,
} from "../components/LandingComponents";

export default function Landing() {
  return (
    <div>
      <Navbar />
      <Hero />
      <TrustBar />
      <Features />
      <HowItWorks />
      <WhyChoose />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
