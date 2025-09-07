import { Metadata } from "next";
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: "Careers & Culture | Elle AI",
  description: "Join the Elle AI team and be part of building the future of artificial intelligence.",
};

export default function CareersCulturePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Culture Section - Centered as requested */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Culture
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              At Elle AI, we believe that groundbreaking innovation happens when diverse minds 
              collaborate in an environment built on trust, curiosity, and purpose.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-6 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Innovation-Driven
              </h3>
              <p className="text-gray-700">
                We encourage experimentation, creative thinking, and pushing boundaries 
                of what's possible with AI technology.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Collaborative
              </h3>
              <p className="text-gray-700">
                Diverse teams working together with mutual respect and shared goals 
                create the best solutions.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Growth-Oriented
              </h3>
              <p className="text-gray-700">
                We invest in our team's development with continuous learning 
                and career advancement opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Values
            </h2>
            <p className="text-lg text-gray-600">
              These principles guide everything we do—from product development to team interactions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Integrity First</h3>
              <p className="text-gray-700">
                We operate with transparency, honesty, and ethical principles in all our endeavors, 
                ensuring our AI solutions are developed responsibly.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Pursuit of Excellence</h3>
              <p className="text-gray-700">
                We strive for the highest quality in our products, services, and team interactions, 
                continuously raising the bar for ourselves and the industry.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Diversity & Inclusion</h3>
              <p className="text-gray-700">
                We celebrate different perspectives and believe diversity drives innovation. 
                We're committed to building a workplace where everyone belongs.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Impact Measurement</h3>
              <p className="text-gray-700">
                We measure success by the positive impact we create for our users and society, 
                not just by commercial metrics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Perks & Benefits
            </h2>
            <p className="text-lg text-gray-600">
              We take care of our team so they can focus on doing their best work.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Competitive Compensation</h3>
              <p className="text-gray-700">
                Industry-leading salary and equity packages to reward your contributions.
              </p>
            </div>
            
            <div className="text-center p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Health & Wellness</h3>
              <p className="text-gray-700">
                Comprehensive medical, dental, and vision insurance for you and your family.
              </p>
            </div>
            
            <div className="text-center p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning & Development</h3>
              <p className="text-gray-700">
                Annual stipend for professional development, conferences, and continuing education.
              </p>
            </div>
            
            <div className="text-center p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Flexible Time Off</h3>
              <p className="text-gray-700">
                Unlimited PTO to rest and recharge whenever you need to.
              </p>
            </div>
            
            <div className="text-center p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Cutting-Edge Tools</h3>
              <p className="text-gray-700">
                Best-in-class hardware and software to do your best work.
              </p>
            </div>
            
            <div className="text-center p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Remote Flexibility</h3>
              <p className="text-gray-700">
                Work from anywhere with periodic team gatherings for collaboration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Open Positions CTA */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Shape the Future?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Explore our open positions and find where you fit in our mission to advance AI responsibly.
          </p>
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-8 rounded-lg transition-colors">
            View Open Positions
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}