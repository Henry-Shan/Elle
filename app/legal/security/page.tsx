import type { Metadata } from "next";
import ReportButton from "@/components/report-button";

export const metadata: Metadata = {
  title: "Security | Elle AI",
  description:
    "Learn about Elle AI's comprehensive security measures and data protection practices.",
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Security</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Your data security is our top priority. Learn about our
              comprehensive security measures and commitment to protecting your
              information.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Data Encryption
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• End-to-end encryption for all data transmission</li>
                <li>• AES-256 encryption for data at rest</li>
                <li>• TLS 1.3 for secure communications</li>
                <li>• Encrypted database storage</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Access Control
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Multi-factor authentication (MFA)</li>
                <li>• Role-based access controls</li>
                <li>• Regular access reviews and audits</li>
                <li>• Zero-trust security architecture</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Infrastructure Security
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• SOC 2 Type II certified infrastructure</li>
                <li>• Regular security assessments</li>
                <li>• 24/7 security monitoring</li>
                <li>• Automated threat detection</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Compliance
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• GDPR compliance for EU users</li>
                <li>• CCPA compliance for California users</li>
                <li>• HIPAA compliance for healthcare data</li>
                <li>• Regular compliance audits</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center">
              Security Certifications
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-500 font-bold">SOC2</span>
                </div>
                <p className="text-gray-700">SOC 2 Type II Certified</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-500 font-bold">ISO</span>
                </div>
                <p className="text-gray-700">ISO 27001 Information Security</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-500 font-bold">GDPR</span>
                </div>
                <p className="text-gray-700">GDPR Compliant</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">
              Report a Security Issue
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              If you discover a security vulnerability, please report it to our
              security team.
            </p>
            <ReportButton />
          </div>
        </div>
      </div>
    </div>
  );
}
