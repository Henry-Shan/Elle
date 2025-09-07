import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gaming & Esports AI Solutions | Elle AI",
  description: "Enhance gaming experiences with AI-powered matchmaking, content generation, and intelligent player analytics.",
};

export default function GamingEsportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Gaming & Esports AI Solutions</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Revolutionize gaming with AI-powered matchmaking, content generation, 
              and intelligent analytics for players and developers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎮</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Matchmaking</h3>
              <p className="text-gray-700">AI-powered player matching that creates balanced, competitive, and enjoyable gaming experiences.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Content Generation</h3>
              <p className="text-gray-700">AI-generated game content, including levels, characters, and storylines for enhanced player engagement.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Player Analytics</h3>
              <p className="text-gray-700">Comprehensive player behavior analysis and performance insights for competitive advantage.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">Gaming Solutions</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">For Players</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Personalized gaming experiences</li>
                  <li>• Skill-based matchmaking</li>
                  <li>• Performance coaching</li>
                  <li>• Anti-cheat detection</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">For Developers</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Procedural content generation</li>
                  <li>• Player behavior prediction</li>
                  <li>• Game balance optimization</li>
                  <li>• Monetization insights</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">Level Up Your Gaming</h2>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Start Gaming
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
