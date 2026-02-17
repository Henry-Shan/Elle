"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative pt-20 pb-8 px-6 overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FC7B11]/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Eyebrow pill */}
        <Link
          href="/login"
          className="group inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-gray-700/60 bg-white/[0.04] backdrop-blur-sm hover:border-[#FC7B11]/40 transition-all duration-300"
        >
          <span className="size-1.5 rounded-full bg-[#FC7B11] animate-pulse" />
          <span className="text-[13px] font-medium text-gray-400 tracking-wide">
            Early Access Available
          </span>
          <ArrowRight className="size-3.5 text-gray-500 group-hover:translate-x-0.5 group-hover:text-[#FC7B11] transition-all duration-300" />
        </Link>

        {/* Heading */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl font-semibold text-white leading-[1.08] mb-4"
          style={{ letterSpacing: "-0.035em" }}
        >
          Legal AI for
          <br />
          <span className="bg-gradient-to-r from-[#FC7B11] to-[#f59e0b] bg-clip-text text-transparent">
            Modern Startups
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-400 mb-0 max-w-md mx-auto leading-relaxed">
          Instant, AI-powered legal guidance —
          <br className="hidden sm:block" />
          so you can build, not worry.
        </p>
      </div>
    </section>
  );
}
