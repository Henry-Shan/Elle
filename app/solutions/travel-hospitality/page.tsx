import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Travel & Hospitality AI Solutions | Elle AI",
  description: "Enhance travel experiences with AI-powered booking systems, personalized recommendations, and intelligent customer service.",
};

export default function TravelHospitalityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Travel & Hospitality AI Solutions</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Transform the travel industry with AI-powered booking systems, personalized experiences, 
              and intelligent customer service solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✈️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Booking</h3>
              <p className="text-gray-700">Intelligent booking systems that optimize pricing and provide personalized travel recommendations.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Personalized Experiences</h3>
              <p className="text-gray-700">AI-driven recommendations for hotels, restaurants, and activities based on traveler preferences.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customer Service</h3>
              <p className="text-gray-700">24/7 AI-powered support for booking assistance, travel updates, and issue resolution.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">Travel Solutions</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">For Travelers</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Personalized trip planning</li>
                  <li>• Dynamic pricing optimization</li>
                  <li>• Real-time travel updates</li>
                  <li>• Local experience recommendations</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">For Businesses</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Demand forecasting</li>
                  <li>• Revenue optimization</li>
                  <li>• Customer behavior analysis</li>
                  <li>• Operational efficiency</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">Enhance Travel Experiences</h2>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Explore Solutions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
