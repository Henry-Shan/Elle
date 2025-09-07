import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agentic AI | Elle AI",
  description: "Discover autonomous AI agents that can perform complex tasks, make decisions, and work independently to achieve goals.",
};

export default function AgenticAIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Agentic AI</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Deploy autonomous AI agents that can think, plan, and act independently to complete 
              complex tasks and achieve your business objectives.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Autonomous Agents</h3>
              <p className="text-gray-700">
                AI agents that can work independently, make decisions, and adapt to changing 
                conditions without human intervention.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Intelligent Planning</h3>
              <p className="text-gray-700">
                Advanced reasoning capabilities that allow agents to break down complex goals 
                into actionable steps and execute them strategically.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Continuous Learning</h3>
              <p className="text-gray-700">
                Agents that learn from experience, improve their performance over time, 
                and adapt to new challenges and environments.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">Agentic AI Capabilities</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Task Automation</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Multi-step workflow execution</li>
                  <li>• Dynamic task prioritization</li>
                  <li>• Error handling and recovery</li>
                  <li>• Resource optimization</li>
                  <li>• Progress monitoring</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Decision Making</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Real-time data analysis</li>
                  <li>• Risk assessment and mitigation</li>
                  <li>• Strategic planning</li>
                  <li>• Context-aware decisions</li>
                  <li>• Outcome prediction</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Collaboration</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Multi-agent coordination</li>
                  <li>• Human-AI collaboration</li>
                  <li>• Team communication</li>
                  <li>• Knowledge sharing</li>
                  <li>• Conflict resolution</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Adaptation</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Environment adaptation</li>
                  <li>• Strategy optimization</li>
                  <li>• Performance improvement</li>
                  <li>• New skill acquisition</li>
                  <li>• Behavior modification</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-semibold mb-6">Business Applications</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Customer service automation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Supply chain optimization</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Financial trading and analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Research and development</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-semibold mb-6">Key Benefits</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>24/7 autonomous operation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Reduced operational costs</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Improved efficiency and accuracy</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3">✓</span>
                  <span>Scalable intelligent automation</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center">Agent Types</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-500 font-bold">A</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Reactive Agents</h3>
                <p className="text-gray-700 text-sm">Respond to immediate stimuli and environment changes</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-500 font-bold">B</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Deliberative Agents</h3>
                <p className="text-gray-700 text-sm">Plan and reason before taking action</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-500 font-bold">C</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Hybrid Agents</h3>
                <p className="text-gray-700 text-sm">Combine reactive and deliberative capabilities</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">Deploy Your AI Agents</h2>
            <p className="text-lg text-gray-600 mb-8">
              Start building autonomous AI agents that can transform your business operations.
            </p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Build AI Agents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
