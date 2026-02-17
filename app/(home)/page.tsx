import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import HeroSection from "@/components/hero";
import HomepageInput from "@/components/homepage-input";
import { SessionProvider } from "next-auth/react";

export default function HomePage() {
  return (
    <SessionProvider>
      <div className="relative min-h-screen bg-[#020202] text-gray-100 overflow-hidden selection:bg-[#FC7B11]/30">
        
        {/* Animated Background Layers */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Base gradient mesh */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[120px] animate-aurora mix-blend-screen" />
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px] animate-aurora mix-blend-screen animation-delay-2000" />
          <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] animate-aurora mix-blend-screen animation-delay-4000" />
          
          {/* Subtle Grid Pattern */}
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"
          />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          
          <main className="flex-1 flex flex-col items-center justify-center gap-10 py-12">
            <HeroSection />
            <HomepageInput />
          </main>
          
          <Footer />
        </div>
      </div>
    </SessionProvider>
  );
}