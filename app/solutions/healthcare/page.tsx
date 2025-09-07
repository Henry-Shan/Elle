import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Healthcare AI Solutions | Elle AI",
  description: "Transform healthcare with AI-powered solutions for diagnostics, patient care, and medical research.",
};

export default function HealthcarePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Healthcare AI Solutions
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Revolutionizing healthcare with intelligent AI systems that enhance patient care, 
              accelerate research, and improve clinical outcomes.
            </p>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔬</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Medical Diagnostics
              </h3>
              <p className="text-gray-700">
                AI-powered diagnostic tools that analyze medical images, lab results, 
                and patient data with unprecedented accuracy.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Predictive Analytics
              </h3>
              <p className="text-gray-700">
                Early warning systems that predict patient deterioration and help 
                prevent adverse events before they occur.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧬</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Drug Discovery
              </h3>
              <p className="text-gray-700">
                Accelerate pharmaceutical research with AI models that identify 
                promising drug candidates and optimize treatment protocols.
              </p>
            </div>
          </div>

          {/* Use Cases */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">
              Healthcare Applications
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Clinical Decision Support
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Real-time treatment recommendations</li>
                  <li>• Drug interaction alerts</li>
                  <li>• Personalized care plans</li>
                  <li>• Risk stratification models</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Medical Imaging
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Radiology image analysis</li>
                  <li>• Pathology slide interpretation</li>
                  <li>• Early disease detection</li>
                  <li>• Treatment response monitoring</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Patient Management
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Automated patient triage</li>
                  <li>• Appointment scheduling optimization</li>
                  <li>• Chronic disease monitoring</li>
                  <li>• Patient engagement tools</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Research & Development
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Clinical trial optimization</li>
                  <li>• Biomarker discovery</li>
                  <li>• Epidemiological modeling</li>
                  <li>• Genomic analysis</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-semibold mb-6">For Healthcare Providers</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Improved diagnostic accuracy and speed</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Reduced administrative burden</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Enhanced patient outcomes</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Cost reduction through efficiency</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-semibold mb-6">For Patients</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Faster and more accurate diagnoses</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Personalized treatment plans</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Proactive health monitoring</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Improved access to care</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Compliance & Security */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center">
              Compliance & Security
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-500 font-bold">HIPAA</span>
                </div>
                <p className="text-gray-700">Fully compliant with healthcare privacy regulations</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-500 font-bold">SOC2</span>
                </div>
                <p className="text-gray-700">Enterprise-grade security and compliance</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-500 font-bold">FDA</span>
                </div>
                <p className="text-gray-700">Regulatory guidance for medical AI applications</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">
              Ready to Transform Healthcare?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Let's discuss how AI can enhance your healthcare organization.
            </p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Schedule a Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
