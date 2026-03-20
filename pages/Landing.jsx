import "../styles/Landing.css";
import {Hero,Features,Navbar,Footer,HowItWorks,WhyChoose,CTA,Pricing
} from "../components/LandingComponents";

export default function Landing() {
    return (
        <div>
            <Navbar />

            <Hero />

            <Features />

            <HowItWorks />

            <WhyChoose />

            <Pricing />

            <CTA />

            <Footer />

        </div>

    )
}