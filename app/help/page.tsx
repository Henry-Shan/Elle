import { Metadata } from "next";
import { Search, BookOpen, MessageCircle, Video, FileText, Users, Zap, Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Help & Support | Elle AI",
  description: "Get help with Elle AI. Find documentation, tutorials, and contact our support team.",
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Help & Support</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Get the most out of Elle AI with our comprehensive help resources and support.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
              <input
                type="text"
                placeholder="Search for help articles, tutorials, or FAQs..."
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FC7B11] focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Help Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <BookOpen className="size-8 text-[#FC7B11] mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Documentation</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Comprehensive guides and API documentation
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <Video className="size-8 text-[#FC7B11] mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Tutorials</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Step-by-step video tutorials and guides
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <MessageCircle className="size-8 text-[#FC7B11] mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Live Chat</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Get instant help from our support team
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <FileText className="size-8 text-[#FC7B11] mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">FAQ</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Find answers to common questions
              </p>
            </div>
          </div>

          {/* Popular Articles */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">Popular Help Articles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6 hover:border-[#FC7B11] transition-colors cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started with Elle AI</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Learn the basics of using Elle AI for your first project
                </p>
                <span className="text-[#FC7B11] text-sm font-medium">Read more →</span>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:border-[#FC7B11] transition-colors cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">API Integration Guide</h3>
                <p className="text-gray-600 text-sm mb-3">
                  How to integrate Elle AI into your applications
                </p>
                <span className="text-[#FC7B11] text-sm font-medium">Read more →</span>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:border-[#FC7B11] transition-colors cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Troubleshooting Common Issues</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Solutions to the most common problems users face
                </p>
                <span className="text-[#FC7B11] text-sm font-medium">Read more →</span>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:border-[#FC7B11] transition-colors cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Best Practices for AI Prompts</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Tips and tricks for writing effective AI prompts
                </p>
                <span className="text-[#FC7B11] text-sm font-medium">Read more →</span>
              </div>
            </div>
          </div>

          {/* Support Options */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <Users className="size-8 text-[#FC7B11] mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">Community Support</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Join our community of users and get help from fellow Elle AI enthusiasts.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Community forums</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Discord server</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">GitHub discussions</span>
                </li>
              </ul>
              <button className="w-full bg-[#FC7B11] hover:bg-[#FC7B11]/90 text-white py-3 rounded-lg font-semibold transition-colors">
                Join Community
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <Zap className="size-8 text-[#FC7B11] mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">Premium Support</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Get priority support with faster response times and dedicated assistance.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">24/7 email support</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Phone support</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Dedicated account manager</span>
                </li>
              </ul>
              <button className="w-full border border-[#FC7B11] text-[#FC7B11] hover:bg-[#FC7B11] hover:text-white py-3 rounded-lg font-semibold transition-colors">
                Upgrade to Pro
              </button>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">Still Need Help?</h2>
            <div className="text-center">
              <p className="text-gray-700 mb-6">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-[#FC7B11] hover:bg-[#FC7B11]/90 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  Contact Support
                </button>
                <button className="border border-[#FC7B11] text-[#FC7B11] hover:bg-[#FC7B11] hover:text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
