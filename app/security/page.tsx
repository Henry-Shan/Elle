import type { Metadata } from "next";
import { Shield, Lock, Eye, Server, FileCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Security | Elle AI",
  description:
    "Learn about Elle AI's comprehensive security measures and data protection policies.",
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Security & Privacy
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Your data security is our top priority. Learn about our
              comprehensive security measures and compliance standards.
            </p>
          </div>

          {/* Security Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-4">
                <Shield className="size-8 text-[#FC7B11] mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Data Encryption
                </h3>
              </div>
              <p className="text-gray-600">
                All data is encrypted in transit and at rest using
                industry-standard AES-256 encryption.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-4">
                <Lock className="size-8 text-[#FC7B11] mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Access Control
                </h3>
              </div>
              <p className="text-gray-600">
                Multi-factor authentication and role-based access controls
                ensure only authorized users can access your data.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-4">
                <Eye className="size-8 text-[#FC7B11] mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Privacy First
                </h3>
              </div>
              <p className="text-gray-600">
                We never use your data for training our models. Your
                conversations remain private and confidential.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-4">
                <Server className="size-8 text-[#FC7B11] mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Secure Infrastructure
                </h3>
              </div>
              <p className="text-gray-600">
                Our infrastructure is hosted on secure, SOC 2 compliant cloud
                providers with 99.9% uptime.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-4">
                <FileCheck className="size-8 text-[#FC7B11] mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Compliance
                </h3>
              </div>
              <p className="text-gray-600">
                We comply with GDPR, CCPA, and other major privacy regulations
                to protect your rights.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-4">
                <Users className="size-8 text-[#FC7B11] mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Team Security
                </h3>
              </div>
              <p className="text-gray-600">
                All team members undergo background checks and security training
                to maintain the highest standards.
              </p>
            </div>
          </div>

          {/* Compliance Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">
              Compliance & Certifications
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Security Standards
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    <span className="text-gray-700">
                      SOC 2 Type II Certified
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    <span className="text-gray-700">ISO 27001 Compliant</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    <span className="text-gray-700">GDPR Compliant</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    <span className="text-gray-700">CCPA Compliant</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Data Protection
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    <span className="text-gray-700">End-to-end encryption</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    <span className="text-gray-700">
                      Regular security audits
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    <span className="text-gray-700">Penetration testing</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    <span className="text-gray-700">
                      24/7 security monitoring
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Handling Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">
              How We Handle Your Data
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Data Collection
                </h3>
                <p className="text-gray-700">
                  We only collect the data necessary to provide our AI services.
                  This includes your conversations, preferences, and usage
                  patterns. We never collect sensitive personal information
                  without your explicit consent.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Data Usage
                </h3>
                <p className="text-gray-700">
                  Your data is used solely to provide and improve our AI
                  services. We do not sell, rent, or share your personal data
                  with third parties for marketing purposes.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Data Retention
                </h3>
                <p className="text-gray-700">
                  We retain your data only as long as necessary to provide our
                  services. You can request data deletion at any time, and we
                  will comply within 30 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
