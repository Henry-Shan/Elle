import { Metadata } from "next";

export const metadata: Metadata = {
  title: "EdTech AI Solutions | Elle AI",
  description: "Transform education with AI-powered learning platforms, personalized instruction, and intelligent assessment tools.",
};

export default function EdTechPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">EdTech AI Solutions</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Revolutionize education with AI-powered learning platforms that personalize instruction, 
              enhance engagement, and improve learning outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Personalized Learning</h3>
              <p className="text-gray-700">Adaptive learning paths that adjust to each student's pace, style, and needs.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Assessment</h3>
              <p className="text-gray-700">Intelligent evaluation tools that provide real-time feedback and progress tracking.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Tutoring</h3>
              <p className="text-gray-700">24/7 virtual tutors that provide personalized support and guidance.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">EdTech Solutions</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Learning Management</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Adaptive curriculum design</li>
                  <li>• Learning path optimization</li>
                  <li>• Content recommendation</li>
                  <li>• Progress tracking</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Student Support</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Virtual teaching assistants</li>
                  <li>• Automated grading</li>
                  <li>• Plagiarism detection</li>
                  <li>• Study habit analysis</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">Transform Education Today</h2>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
