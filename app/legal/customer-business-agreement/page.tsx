import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Business Agreement | Elle AI",
  description: "Review the business agreement terms for enterprise customers of Elle AI.",
};

export default function CustomerBusinessAgreementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Customer Business Agreement</h1>
            <p className="text-lg text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Service Level Agreement</h2>
              <p className="text-gray-700 leading-relaxed">
                We commit to maintaining 99.9% uptime for our enterprise services, with comprehensive 
                monitoring and rapid response to any service interruptions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Data Processing</h2>
              <p className="text-gray-700 leading-relaxed">
                Enterprise customers benefit from enhanced data processing capabilities, including 
                dedicated infrastructure, custom data retention policies, and advanced security measures.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Support and Training</h2>
              <p className="text-gray-700 leading-relaxed">
                Business customers receive priority support, dedicated account management, 
                and comprehensive training programs for their teams.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Customization</h2>
              <p className="text-gray-700 leading-relaxed">
                We offer custom AI model training, API integrations, and tailored solutions 
                to meet specific business requirements and use cases.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                For enterprise inquiries and custom agreements, please contact our business team:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  Email: enterprise@elleai.com<br />
                  Phone: +1 (555) 123-4567<br />
                  Address: Elle AI, 123 Innovation Drive, San Francisco, CA 94105
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
