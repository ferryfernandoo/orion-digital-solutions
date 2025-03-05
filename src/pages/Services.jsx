import React from "react";

const Service = () => {
  return (
    <section id="services" className="min-h-screen flex items-center bg-gray-900 text-white opacity-70">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-6 mt-32">Our Services</h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          We offer a range of AI-powered solutions to drive business growth, innovation, and education in the tech industry.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">🤖 AI Development</h3>
            <p className="text-gray-300">Custom AI solutions for various industries.</p>
          </div>
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">📈 Data Analytics</h3>
            <p className="text-gray-300">Transforming raw data into valuable insights.</p>
          </div>
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">🚀 Automation</h3>
            <p className="text-gray-300">Optimizing workflows with intelligent automation.</p>
          </div>
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">🌐 Cloud AI Services</h3>
            <p className="text-gray-300">Scalable cloud-based AI solutions for businesses.</p>
          </div>
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">📊 Business Intelligence</h3>
            <p className="text-gray-300">Helping businesses make data-driven decisions.</p>
          </div>
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">🎓 Tech Education</h3>
            <p className="text-gray-300">We provide educational programs to train individuals in AI, coding, and digital skills.</p>
          </div>
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">💡 AI Consulting</h3>
            <p className="text-gray-300">Expert AI guidance to optimize your business strategies.</p>
          </div>
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">🛡️ Cybersecurity</h3>
            <p className="text-gray-300">AI-driven security solutions to protect your digital assets.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Service;
