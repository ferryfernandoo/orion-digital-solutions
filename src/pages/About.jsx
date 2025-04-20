import React from "react";
import { motion } from "framer-motion";

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const cardHover = {
  scale: 1.03,
  transition: { duration: 0.3, ease: "easeOut" }
};

const About = () => {
  return (
    <section id="about" className="min-h-screen flex items-center bg-gray-900 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            The Future Starts in Tangerang
          </h2>
          
          <motion.p 
            className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Based in Tangerang, Indonesia, we're an AI startup building a sustainable technology ecosystem. 
            <span className="text-blue-400 font-medium"> #MoreThanJustAI</span> — we're preparing our nation for the digital revolution.
          </motion.p>
        </motion.div>

        {/* Core Plans */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* AI & Job Opportunities */}
          <motion.div 
            className="glass p-8 rounded-xl hover:shadow-xl transition-all border border-gray-800 hover:border-blue-400/30"
            variants={item}
            whileHover={cardHover}
          >
            <div className="text-blue-400 text-4xl mb-4">🤖💼</div>
            <h3 className="text-xl font-semibold mb-3">AI for Tangerang</h3>
            <p className="text-gray-300 mb-4">
              Developing <span className="font-bold text-white">"Orion Core"</span> — our generative AI model that will:
            </p>
            <ul className="mt-2 text-left list-disc list-inside mx-auto max-w-xs space-y-2">
              <motion.li 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Create 500+ tech jobs in Greater Jakarta area
              </motion.li>
              <motion.li 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Free AI training for Tangerang residents
              </motion.li>
              <motion.li 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Partner with local universities
              </motion.li>
            </ul>
          </motion.div>

          {/* Tech Education */}
          <motion.div 
            className="glass p-8 rounded-xl hover:shadow-xl transition-all border border-gray-800 hover:border-blue-400/30"
            variants={item}
            whileHover={cardHover}
          >
            <div className="text-blue-400 text-4xl mb-4">🎓🚀</div>
            <h3 className="text-xl font-semibold mb-3">Tech for All</h3>
            <p className="text-gray-300 mb-4">
              By 2030, we believe AI literacy will be as essential as reading:
            </p>
            <ul className="mt-2 text-left list-disc list-inside mx-auto max-w-xs space-y-2">
              <motion.li 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Workshops in 100+ schools across Banten
              </motion.li>
              <motion.li 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Localized AI learning platform
              </motion.li>
              <motion.li 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Scholarships for Tangerang talents
              </motion.li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Crypto Plan */}
        <motion.div 
          className="glass p-8 rounded-xl mt-16 mx-auto max-w-3xl border border-gray-800 hover:border-blue-400/30"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileHover={{
            scale: 1.02,
            transition: { duration: 0.3 }
          }}
        >
          <div className="text-blue-400 text-4xl mb-4">🔗₿</div>
          <h3 className="text-xl font-semibold mb-3">Orion Chain</h3>
          <p className="text-gray-300 mb-6">
            Our roadmap includes launching <span className="font-bold text-white">$ORION</span> — a utility token that will:
          </p>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.div 
              className="p-4 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
              variants={item}
              whileHover={{ y: -5 }}
            >
              <p className="flex items-center justify-center gap-2">💸 <span>Reward system for contributors</span></p>
            </motion.div>
            <motion.div 
              className="p-4 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
              variants={item}
              whileHover={{ y: -5 }}
            >
              <p className="flex items-center justify-center gap-2">🌐 <span>Local developer payments</span></p>
            </motion.div>
            <motion.div 
              className="p-4 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
              variants={item}
              whileHover={{ y: -5 }}
            >
              <p className="flex items-center justify-center gap-2">📈 <span>AI-powered value</span></p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* National Support */}
        <motion.div 
          className="mt-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h3 
            className="text-2xl md:text-3xl font-bold mb-8"
            initial={{ y: -10 }}
            whileInView={{ y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
            viewport={{ once: true }}
          >
            For a Digital <span className="text-blue-400">Indonesia</span>
          </motion.h3>
          <motion.div 
            className="glass p-8 rounded-xl max-w-3xl mx-auto border border-gray-800 hover:border-blue-400/30"
            whileHover={{
              scale: 1.01,
              transition: { duration: 0.3 }
            }}
          >
            <motion.p 
              className="text-gray-300 text-lg italic"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              viewport={{ once: true }}
            >
              "From our headquarters in Tangerang, we're not just building products, but <span className="text-blue-400 font-medium">preparing our nation</span>. 
              Every innovation we create is designed to position Indonesia as a <span className="font-bold">global technology producer</span>, starting with our local community."
            </motion.p>
            <motion.p 
              className="mt-6 font-semibold text-blue-400"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ once: true }}
            >
              - Orion Team, Tangerang
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;