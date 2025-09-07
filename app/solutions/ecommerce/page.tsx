import { Metadata } from "next";

export const metadata: Metadata = {
  title: "E-commerce AI Solutions | Elle AI",
  description: "Boost your online business with AI-powered solutions for personalization, inventory, and customer experience.",
};

export default function EcommercePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              E-commerce AI Solutions
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Transform your online store with intelligent AI that personalizes experiences, 
              optimizes operations, and drives sales growth.
            </p>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Personalization Engine
              </h3>
              <p className="text-gray-700">
                AI-driven product recommendations and personalized shopping experiences 
                that increase conversion rates and customer satisfaction.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Dynamic Pricing
              </h3>
              <p className="text-gray-700">
                Intelligent pricing strategies that optimize revenue while maintaining 
                competitive advantage and customer loyalty.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Chat Support
              </h3>
              <p className="text-gray-700">
                24/7 AI-powered customer service that handles inquiries, provides 
                product information, and guides customers to purchase.
              </p>
            </div>
          </div>

          {/* Solutions */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">
              E-commerce Solutions
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Customer Experience
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Personalized product recommendations</li>
                  <li>• Smart search and filtering</li>
                  <li>• Visual search capabilities</li>
                  <li>• Voice commerce integration</li>
                  <li>• AR/VR product visualization</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Operations & Analytics
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Inventory optimization</li>
                  <li>• Demand forecasting</li>
                  <li>• Supply chain management</li>
                  <li>• Fraud detection</li>
                  <li>• Performance analytics</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Marketing & Sales
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Customer segmentation</li>
                  <li>• Email campaign optimization</li>
                  <li>• Social media insights</li>
                  <li>• Conversion rate optimization</li>
                  <li>• A/B testing automation</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Content & Catalog
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Automated product descriptions</li>
                  <li>• Image tagging and categorization</li>
                  <li>• Content generation</li>
                  <li>• SEO optimization</li>
                  <li>• Multi-language support</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-semibold mb-6">Business Impact</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Increase conversion rates by up to 35%</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Reduce cart abandonment by 25%</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Optimize inventory costs by 20%</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Improve customer satisfaction scores</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-semibold mb-6">Customer Benefits</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Personalized shopping experiences</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Faster product discovery</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Instant customer support</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Seamless checkout process</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Success Metrics */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">
              Proven Results
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">35%</div>
                <p className="text-gray-700">Average increase in conversion rates</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">25%</div>
                <p className="text-gray-700">Reduction in cart abandonment</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">40%</div>
                <p className="text-gray-700">Improvement in customer satisfaction</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">20%</div>
                <p className="text-gray-700">Cost savings in operations</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">
              Ready to Boost Your E-commerce?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Discover how AI can transform your online business and drive growth.
            </p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Get Started Today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
