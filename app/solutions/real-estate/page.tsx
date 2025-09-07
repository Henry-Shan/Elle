import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Real Estate AI Solutions | Elle AI",
  description: "Transform real estate with AI-powered property valuation, market analysis, and intelligent property matching.",
};

export default function RealEstatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Real Estate AI Solutions</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Revolutionize real estate with AI-powered property analysis, market insights, 
              and intelligent matching for buyers, sellers, and agents.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏠</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Property Valuation</h3>
              <p className="text-gray-700">Accurate property valuations using AI analysis of market data and property features.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Market Analysis</h3>
              <p className="text-gray-700">Comprehensive market insights and trend analysis to inform investment decisions.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Matching</h3>
              <p className="text-gray-700">Intelligent property matching based on buyer preferences and lifestyle needs.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">Real Estate Solutions</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">For Agents</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Lead generation and qualification</li>
                  <li>• Property listing optimization</li>
                  <li>• Market trend analysis</li>
                  <li>• Client matching algorithms</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">For Buyers</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Personalized property recommendations</li>
                  <li>• Virtual property tours</li>
                  <li>• Investment opportunity analysis</li>
                  <li>• Neighborhood insights</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">Transform Real Estate Today</h2>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
