import React from "react";

const About = () => {
  return (
    <section id="about" className="min-h-screen flex items-center bg-gray-900 opacity-70 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-6 mt-32 mb-32">The Future Starts Here</h2>
        
        {/* Main Description */}
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          We are an AI startup with the ambition to create a sustainable technology ecosystem. 
          <span className="text-blue-400">#MoreThanJustAI</span>, but a movement to prepare Indonesia for the digital revolution.
        </p>

        {/* Core Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* AI & Job Opportunities */}
          <div className="glass p-6 rounded-lg hover:transform hover:scale-105 transition-all">
            <div className="text-blue-400 text-4xl mb-4">🤖💼</div>
            <h3 className="text-xl font-semibold mb-3">AI for Everyone</h3>
            <p className="text-gray-300">
              We are developing a generative AI model <span className="font-bold">"Orion Core"</span> that will:
            </p>
            <ul className="mt-2 text-left list-disc list-inside mx-auto max-w-xs">
              <li>Create 500+ technical job openings within 2 years</li>
              <li>Launch free AI training programs for beginners</li>
              <li>Collaborate with universities for practical AI curricula</li>
            </ul>
          </div>

          {/* Tech Education */}
          <div className="glass p-6 rounded-lg hover:transform hover:scale-105 transition-all">
            <div className="text-blue-400 text-4xl mb-4">🎓🚀</div>
            <h3 className="text-xl font-semibold mb-3">Tech is a Basic Skill</h3>
            <p className="text-gray-300">
              We believe that by 2030, AI literacy will be as essential as reading and writing. Therefore, we will:
            </p>
            <ul className="mt-2 text-left list-disc list-inside mx-auto max-w-xs">
              <li>Conduct workshops in 100+ schools & Islamic boarding schools</li>
              <li>Develop an interactive AI learning platform for students</li>
              <li>Provide scholarships for talents in remote areas</li>
            </ul>
          </div>
        </div>

        {/* Crypto Plan */}
        <div className="glass p-6 rounded-lg mt-12 mx-auto max-w-2xl hover:transform hover:scale-102 transition-all">
          <div className="text-blue-400 text-4xl mb-4">🔗₿</div>
          <h3 className="text-xl font-semibold mb-3">Orion Chain</h3>
          <p className="text-gray-300">
            In our roadmap: Launching a utility token <span className="font-bold">$ORION</span> that will:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-3 rounded bg-gray-800">
              <p>💸 Reward system for AI contributors</p>
            </div>
            <div className="p-3 rounded bg-gray-800">
              <p>🌐 Decentralized payment for developers</p>
            </div>
            <div className="p-3 rounded bg-gray-800">
              <p>📈 Backed by AI computing power</p>
            </div>
          </div>
        </div>

        {/* National Support */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6">For a Digital Indonesia</h3>
          <div className="glass p-6 rounded-lg max-w-2xl mx-auto">
            <p className="text-gray-300">
              "We are not just building products, but <span className="text-blue-400">preparing a nation</span>. 
              Every line of code we write is an investment to make Indonesia not just a technology consumer, 
              but a <span className="font-bold">producer of innovation</span>."
            </p>
            <p className="mt-4 font-semibold text-blue-400">
              - Orion Team
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
