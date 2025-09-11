import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import HeroSection from "@/components/hero";
import HomepageInput from "@/components/homepage-input";
import { SessionProvider } from "next-auth/react";

export default function HomePage() {
  return (
    <SessionProvider>
      <div className="relative min-h-screen bg-[#F8F4ED] dark:bg-gray-900">
        <div className="relative">
          <Navbar />
          <main className="flex-1">
            <HeroSection />
          </main>
          <HomepageInput />
          <Footer />
        </div>
      </div>
    </SessionProvider>
  );
}
