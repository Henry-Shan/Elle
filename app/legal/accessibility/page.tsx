import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility | Elle AI",
  description: "Learn about Elle AI's commitment to accessibility and inclusive design.",
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Accessibility</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Elle AI is committed to making our services accessible to everyone, 
              regardless of ability or technology used.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Commitment</h2>
              <p className="text-gray-700 leading-relaxed">
                We believe that technology should be inclusive and accessible to all users. 
                Our team is dedicated to ensuring that Elle AI services are usable by people 
                with diverse abilities and assistive technologies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Accessibility Features</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Keyboard navigation support</li>
                <li>Screen reader compatibility</li>
                <li>High contrast mode options</li>
                <li>Text size adjustment capabilities</li>
                <li>Alternative text for images and graphics</li>
                <li>Voice control integration</li>
                <li>Multi-language support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Standards Compliance</h2>
              <p className="text-gray-700 leading-relaxed">
                Our services are designed to meet or exceed the Web Content Accessibility Guidelines (WCAG) 2.1 AA standards. 
                We regularly audit our platform and conduct user testing with people who have disabilities to ensure 
                continuous improvement in accessibility.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Feedback and Support</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We welcome feedback from users about accessibility issues or suggestions for improvement. 
                If you encounter any accessibility barriers, please contact us:
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  Email: accessibility@elleai.com<br />
                  Phone: +1 (555) 123-4567<br />
                  We aim to respond to accessibility feedback within 48 hours.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ongoing Improvements</h2>
              <p className="text-gray-700 leading-relaxed">
                Accessibility is an ongoing process. We continuously work to improve our services 
                and regularly update our accessibility features based on user feedback, 
                technological advances, and evolving standards.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
