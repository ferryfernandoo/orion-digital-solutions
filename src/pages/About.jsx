import React, { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";

const About = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [controls, inView]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const cardHoverVariants = {
    hover: {
      y: -10,
      scale: 1.03,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <section 
      id="about" 
      className="min-h-screen flex items-center bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden"
      ref={ref}
    >
      <div className="container mx-auto px-4 py-12 relative">
        {/* Floating particles background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-blue-500 opacity-10"
              style={{
                width: Math.random() * 10 + 5 + 'px',
                height: Math.random() * 10 + 5 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%'
              }}
              animate={{
                y: [0, (Math.random() * 100) - 50],
                x: [0, (Math.random() * 60) - 30],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "linear"
              }}
            />
          ))}
        </div>

        <motion.div
          className="text-center"
          initial="hidden"
          animate={controls}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <motion.h2 
              className="text-5xl md:text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              The Future Starts <span className="text-cyan-400">Here</span>
            </motion.h2>
          </motion.div>

          {/* Main Description */}
          <motion.div variants={itemVariants} className="mb-16">
            <motion.p 
              className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
              whileHover={{ scale: 1.02 }}
            >
              Based in <span className="font-semibold text-cyan-400">Tangerang, Indonesia</span>, we are an AI startup with the ambition to create a sustainable technology ecosystem. 
              <span className="text-blue-400 font-medium"> #MoreThanJustAI</span>, but a movement to prepare Indonesia for the digital revolution.
            </motion.p>
          </motion.div>

          {/* Core Plans */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12"
            variants={containerVariants}
          >
            {/* AI & Job Opportunities */}
            <motion.div 
              className="glass p-8 rounded-xl hover:shadow-2xl transition-all backdrop-blur-sm border border-gray-700"
              variants={itemVariants}
              whileHover="hover"
              variants={cardHoverVariants}
            >
              <div className="text-blue-400 text-5xl mb-6">🤖💼</div>
              <motion.h3 
                className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"
                whileHover={{ scale: 1.05 }}
              >
                AI for Everyone
              </motion.h3>
              <motion.p className="text-gray-300 mb-4">
                We are developing a generative AI model <span className="font-bold text-cyan-300">"Orion Core"</span> that will:
              </motion.p>
              <ul className="mt-4 text-left space-y-3">
                <motion.li 
                  className="flex items-start"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-cyan-400 mr-2">✓</span>
                  <span>Create <span className="font-bold">500+ technical job openings</span> within 2 years</span>
                </motion.li>
                <motion.li 
                  className="flex items-start"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-cyan-400 mr-2">✓</span>
                  <span>Launch <span className="font-bold">free AI training programs</span> for beginners</span>
                </motion.li>
                <motion.li 
                  className="flex items-start"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-cyan-400 mr-2">✓</span>
                  <span>Collaborate with <span className="font-bold">universities</span> for practical AI curricula</span>
                </motion.li>
              </ul>
            </motion.div>

            {/* Tech Education */}
            <motion.div 
              className="glass p-8 rounded-xl hover:shadow-2xl transition-all backdrop-blur-sm border border-gray-700"
              variants={itemVariants}
              whileHover="hover"
              variants={cardHoverVariants}
            >
              <div className="text-blue-400 text-5xl mb-6">🎓🚀</div>
              <motion.h3 
                className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"
                whileHover={{ scale: 1.05 }}
              >
                Tech is a Basic Skill
              </motion.h3>
              <motion.p className="text-gray-300 mb-4">
                We believe that by 2030, AI literacy will be as essential as reading and writing. Therefore, we will:
              </motion.p>
              <ul className="mt-4 text-left space-y-3">
                <motion.li 
                  className="flex items-start"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-cyan-400 mr-2">✓</span>
                  <span>Conduct workshops in <span className="font-bold">100+ schools & Islamic boarding schools</span></span>
                </motion.li>
                <motion.li 
                  className="flex items-start"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-cyan-400 mr-2">✓</span>
                  <span>Develop an <span className="font-bold">interactive AI learning platform</span> for students</span>
                </motion.li>
                <motion.li 
                  className="flex items-start"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-cyan-400 mr-2">✓</span>
                  <span>Provide <span className="font-bold">scholarships</span> for talents in remote areas</span>
                </motion.li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Crypto Plan */}
          <motion.div 
            className="glass p-8 rounded-xl mt-16 mx-auto max-w-4xl backdrop-blur-sm border border-gray-700"
            variants={itemVariants}
            whileHover="hover"
            variants={cardHoverVariants}
          >
            <div className="text-blue-400 text-5xl mb-6">🔗₿</div>
            <motion.h3 
              className="text-2xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"
              whileHover={{ scale: 1.05 }}
            >
              Orion Chain
            </motion.h3>
            <motion.p className="text-gray-300 text-lg mb-8">
              In our roadmap: Launching a utility token <span className="font-bold text-cyan-300">$ORION</span> that will:
            </motion.p>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={containerVariants}
            >
              {[
                { icon: "💸", text: "Reward system for AI contributors" },
                { icon: "🌐", text: "Decentralized payment for developers" },
                { icon: "📈", text: "Backed by AI computing power" }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="p-5 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
                  variants={itemVariants}
                  whileHover={{ 
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)"
                  }}
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <p>{item.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* National Support */}
          <motion.div 
            className="mt-20"
            variants={itemVariants}
          >
            <motion.h3 
              className="text-3xl font-bold mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"
              whileHover={{ scale: 1.03 }}
            >
              For a Digital Indonesia
            </motion.h3>
            <motion.div 
              className="glass p-8 rounded-xl max-w-4xl mx-auto backdrop-blur-sm border border-gray-700"
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)"
              }}
            >
              <motion.blockquote 
                className="text-xl italic text-gray-300 leading-relaxed"
                animate={{
                  color: ["#e5e7eb", "#93c5fd", "#e5e7eb"]
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                "We are not just building products, but <span className="text-blue-400 font-semibold">preparing a nation</span>. 
                Every line of code we write from our headquarters in <span className="font-medium">Tangerang</span> is an investment 
                to make Indonesia not just a technology consumer, but a <span className="font-bold text-cyan-300">producer of innovation</span>."
              </motion.blockquote>
              <motion.p 
                className="mt-6 font-semibold text-blue-400 text-right"
                whileHover={{ x: 5 }}
              >
                - Orion Team, Tangerang
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Location Badge */}
          <motion.div 
            className="mt-16 flex justify-center"
            variants={itemVariants}
          >
            <motion.div 
              className="inline-flex items-center bg-gray-800 rounded-full px-6 py-3 border border-cyan-400/30"
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "rgba(6, 182, 212, 0.1)"
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-cyan-400 font-medium">Tangerang, Indonesia</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;