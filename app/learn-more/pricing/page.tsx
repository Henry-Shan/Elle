import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Elle AI",
  description: "Choose the perfect Elle AI plan for your needs. Flexible pricing options for individuals and businesses.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Pricing</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Choose the perfect plan for your AI needs. Start free and scale as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                <p className="text-gray-600">Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">1,000 AI requests per month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Basic AI models</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Community support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Standard response times</span>
                </li>
              </ul>
              <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors">
                Get Started Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-orange-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Pro</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$29</div>
                <p className="text-gray-600">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">10,000 AI requests per month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Advanced AI models</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Custom integrations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">API access</span>
                </li>
              </ul>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors">
                Start Pro Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">Custom</div>
                <p className="text-gray-600">For large organizations</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Unlimited AI requests</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Custom AI model training</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Dedicated support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">On-premise deployment</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">SLA guarantee</span>
                </li>
              </ul>
              <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors">
                Contact Sales
              </button>
            </div>
          </div>

          {/* Features Comparison */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">Feature Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">Features</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">Free</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">Pro</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="space-y-4">
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">AI Requests per Month</td>
                    <td className="text-center py-4 px-4 text-gray-700">1,000</td>
                    <td className="text-center py-4 px-4 text-gray-700">10,000</td>
                    <td className="text-center py-4 px-4 text-gray-700">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">AI Models</td>
                    <td className="text-center py-4 px-4 text-gray-700">Basic</td>
                    <td className="text-center py-4 px-4 text-gray-700">Advanced</td>
                    <td className="text-center py-4 px-4 text-gray-700">Custom</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">Support</td>
                    <td className="text-center py-4 px-4 text-gray-700">Community</td>
                    <td className="text-center py-4 px-4 text-gray-700">Priority</td>
                    <td className="text-center py-4 px-4 text-gray-700">Dedicated</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">API Access</td>
                    <td className="text-center py-4 px-4 text-gray-700">-</td>
                    <td className="text-center py-4 px-4 text-gray-700">✓</td>
                    <td className="text-center py-4 px-4 text-gray-700">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
                <p className="text-gray-700">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
                <p className="text-gray-700">Yes, all paid plans come with a 14-day free trial. No credit card required.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-700">We accept all major credit cards, PayPal, and bank transfers for enterprise customers.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
