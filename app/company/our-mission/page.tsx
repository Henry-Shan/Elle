import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Mission | Elle AI",
  description: "Learn about Elle AI's mission to democratize artificial intelligence and make it accessible to everyone.",
};

export default function OurMissionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Our Mission
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Empowering businesses and individuals with cutting-edge AI technology
              that transforms ideas into reality.
            </p>
          </div>

          {/* Mission Statement */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">
              Democratizing Artificial Intelligence
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              At Elle AI, we believe that artificial intelligence should be accessible to everyone, 
              regardless of technical expertise or company size. Our mission is to bridge the gap 
              between complex AI technologies and practical, real-world applications.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              We're committed to creating AI solutions that are not only powerful and innovative 
              but also intuitive, reliable, and ethically designed. Every product we build is 
              crafted with the end user in mind, ensuring that the benefits of AI can be 
              harnessed by businesses and individuals across all industries.
            </p>
          </div>

          {/* Core Values */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Innovation First
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We continuously push the boundaries of what's possible with AI, 
                developing cutting-edge solutions that anticipate future needs 
                and drive industry transformation.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                User-Centric Design
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Every feature we build is designed with the user experience in mind. 
                We believe that the most powerful AI is the one that feels effortless to use.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Ethical AI
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We're committed to developing AI that is fair, transparent, and beneficial 
                to society. Our ethical framework guides every decision we make.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Accessibility
              </h3>
              <p className="text-gray-700 leading-relaxed">
                AI should be available to everyone. We work to remove barriers and 
                make advanced AI capabilities accessible to businesses of all sizes.
              </p>
            </div>
          </div>

          {/* Vision */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-semibold mb-6">Our Vision</h2>
            <p className="text-xl leading-relaxed">
              To create a world where artificial intelligence seamlessly integrates into 
              every aspect of business and daily life, empowering people to achieve more 
              than they ever thought possible while maintaining the highest standards of 
              ethics, security, and human-centered design.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
