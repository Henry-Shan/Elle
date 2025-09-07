import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generative AI | Elle AI",
  description: "Discover the power of generative AI and how it can transform your business with creative content generation.",
};

export default function GenerativeAIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Generative AI</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Unlock the creative potential of AI with our advanced generative models that create 
              text, images, code, and more from simple prompts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Text Generation</h3>
              <p className="text-gray-700">
                Create compelling content, articles, marketing copy, and creative writing 
                with our advanced language models.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Image Creation</h3>
              <p className="text-gray-700">
                Generate stunning visuals, illustrations, and artwork from text descriptions 
                using cutting-edge image generation models.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💻</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Code Generation</h3>
              <p className="text-gray-700">
                Automate software development with AI that writes, debugs, and optimizes 
                code in multiple programming languages.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">Generative AI Applications</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Content Creation</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Blog posts and articles</li>
                  <li>• Social media content</li>
                  <li>• Marketing copy and ads</li>
                  <li>• Product descriptions</li>
                  <li>• Email campaigns</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Creative Design</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Logo and brand design</li>
                  <li>• Website mockups</li>
                  <li>• Product visualization</li>
                  <li>• Marketing materials</li>
                  <li>• Art and illustrations</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Development</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Code generation and completion</li>
                  <li>• Bug fixing and optimization</li>
                  <li>• Documentation writing</li>
                  <li>• Test case generation</li>
                  <li>• API development</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Solutions</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Data analysis and insights</li>
                  <li>• Report generation</li>
                  <li>• Customer service automation</li>
                  <li>• Training material creation</li>
                  <li>• Process documentation</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-semibold mb-6">Benefits</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>10x faster content creation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Consistent quality output</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Cost-effective solutions</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Scalable creative processes</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-semibold mb-6">Use Cases</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Marketing and advertising</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Software development</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>E-learning content</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Creative industries</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">Start Creating with AI</h2>
            <p className="text-lg text-gray-600 mb-8">
              Experience the power of generative AI and transform your creative workflow.
            </p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Try Generative AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
