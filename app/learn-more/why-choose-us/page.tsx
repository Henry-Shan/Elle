import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why Choose Us | Elle AI",
  description: "Discover why Elle AI is the leading choice for AI solutions with our cutting-edge technology and exceptional service.",
};

export default function WhyChooseUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Why Choose Elle AI?</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Discover what makes Elle AI the preferred choice for businesses and individuals 
              seeking cutting-edge artificial intelligence solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Cutting-Edge Technology</h3>
              <p className="text-gray-700">
                We leverage the latest AI models and technologies to deliver state-of-the-art 
                solutions that stay ahead of the competition.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Proven Results</h3>
              <p className="text-gray-700">
                Our solutions have helped thousands of businesses achieve measurable improvements 
                in efficiency, productivity, and customer satisfaction.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Enterprise Security</h3>
              <p className="text-gray-700">
                Bank-level security with SOC 2 compliance, end-to-end encryption, and 
                comprehensive data protection measures.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">Our Competitive Advantages</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Technical Excellence</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Advanced AI model architecture</li>
                  <li>• Real-time processing capabilities</li>
                  <li>• Scalable cloud infrastructure</li>
                  <li>• 99.9% uptime guarantee</li>
                  <li>• Global CDN for fast response times</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Customer Success</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Dedicated customer success managers</li>
                  <li>• 24/7 technical support</li>
                  <li>• Comprehensive onboarding</li>
                  <li>• Regular performance reviews</li>
                  <li>• Custom training programs</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Innovation</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Continuous R&D investment</li>
                  <li>• Latest AI research integration</li>
                  <li>• Rapid feature development</li>
                  <li>• Beta program access</li>
                  <li>• Future-proof technology roadmap</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Flexibility</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Customizable solutions</li>
                  <li>• Multiple deployment options</li>
                  <li>• Flexible pricing models</li>
                  <li>• API-first architecture</li>
                  <li>• Easy integration capabilities</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-semibold mb-6">Industry Recognition</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="mr-3">🏆</span>
                  <span>AI Innovation Award 2024</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">⭐</span>
                  <span>Top 10 AI Companies by TechCrunch</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">🎖️</span>
                  <span>Best Customer Service Award</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">🚀</span>
                  <span>Fastest Growing AI Startup</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-semibold mb-6">Customer Testimonials</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-blue-100 italic">"Elle AI transformed our business operations. The results exceeded our expectations."</p>
                  <p className="text-sm mt-2">- Sarah Johnson, CEO, TechCorp</p>
                </div>
                <div>
                  <p className="text-blue-100 italic">"The best AI platform we've used. Incredible support and amazing results."</p>
                  <p className="text-sm mt-2">- Michael Chen, CTO, InnovateLabs</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">Success Metrics</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">10,000+</div>
                <p className="text-gray-700">Happy Customers</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">99.9%</div>
                <p className="text-gray-700">Uptime Guarantee</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">50+</div>
                <p className="text-gray-700">Countries Served</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">24/7</div>
                <p className="text-gray-700">Support Available</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">Ready to Experience the Difference?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of satisfied customers who have transformed their business with Elle AI.
            </p>
            <div className="space-x-4">
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Start Free Trial
              </button>
              <button className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
