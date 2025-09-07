"use client";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function HeroSection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="pt-14 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center justify-center gap-1.5 mb-3 px-1 py-0.5 rounded-full bg-white border border-gray-300">
          <div className="bg-[#FC7B11] text-white text-xs font-bold px-3 py-1.5 rounded-full">
            New
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <span className="text-sm font-base text-gray-900 tracking-wider">
              Get Early Access Now
            </span>

            <div className="transition-all duration-700 group-hover:translate-x-0.5">
              {isHovered ? (
                <ArrowRight className="size-4 text-gray-500 transition-all duration-300" />
              ) : (
                <ArrowRight className="size-4 text-gray-300 transition-all duration-300" />
              )}
            </div>
          </Link>
        </div>

        <h1
          className="text-5xl md:text-[5.5rem] font-bold text-gray-900 mb-5"
          style={{ letterSpacing: "-0.03em" }}
        >
          Startup
          <br />
          Legal AI
        </h1>
        <p className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto">
          Get instant AI legal guidance for startups
        </p>
      </div>
    </section>
  );
}
