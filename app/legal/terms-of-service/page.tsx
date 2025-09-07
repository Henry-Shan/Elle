import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Elle AI",
  description: "Read the terms and conditions for using Elle AI services.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Terms of Service</h1>
            <p className="text-lg text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using Elle AI services, you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Permission is granted to temporarily use Elle AI services for personal, non-commercial transitory viewing only. 
                This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on the website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you create an account with us, you must provide information that is accurate, complete, 
                and current at all times. You are responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Safeguarding the password and all activities under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
                <li>Ensuring your account information remains accurate and up-to-date</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree not to use our services for any unlawful purpose or any purpose prohibited under this clause. 
                You may not use our services in any manner that could damage, disable, overburden, or impair our servers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                The service and its original content, features, and functionality are and will remain the exclusive 
                property of Elle AI and its licensors. The service is protected by copyright, trademark, and other laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, 
                to understand our practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We may terminate or suspend your account and bar access to the service immediately, without prior notice 
                or liability, under our sole discretion, for any reason whatsoever, including without limitation if you 
                breach the Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed">
                The information on this service is provided on an "as is" basis. To the fullest extent permitted by law, 
                this Company excludes all representations, warranties, conditions and terms relating to our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  Email: legal@elleai.com<br />
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
