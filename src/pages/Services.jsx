import React from "react";
import { motion } from "framer-motion";

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const cardHover = {
  y: -10,
  scale: 1.03,
  transition: {
    duration: 0.3,
    ease: "easeOut"
  }
};

const Service = () => {
  const services = [
    {
      icon: "🤖",
      title: "AI Development",
      description: "Custom AI solutions tailored for Indonesian businesses",
      color: "from-purple-500 to-blue-500"
    },
    {
      icon: "📈",
      title: "Data Analytics",
      description: "Transforming raw data into actionable insights",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: "🚀",
      title: "Automation",
      description: "Optimizing workflows with intelligent automation",
      color: "from-cyan-500 to-green-500"
    },
    {
      icon: "☁️",
      title: "Cloud AI",
      description: "Scalable cloud-based AI solutions for enterprises",
      color: "from-green-500 to-yellow-500"
    },
    {
      icon: "📊",
      title: "Business Intelligence",
      description: "Data-driven decision making for executives",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: "🎓",
      title: "Tech Education",
      description: "AI & coding bootcamps for Indonesian talents",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: "💡",
      title: "AI Consulting",
      description: "Strategic AI implementation guidance",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: "🛡️",
      title: "Cybersecurity",
      description: "AI-powered protection for digital assets",
      color: "from-pink-500 to-purple-500"
    }
  ];

  return (
    <section id="services" className="min-h-screen flex items-center bg-gray-900 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Our Services
          </h2>
          <motion.p
            className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            We offer cutting-edge AI solutions to drive digital transformation in Indonesia
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              className={`glass p-6 rounded-xl border border-gray-800 hover:shadow-xl cursor-pointer bg-gradient-to-br ${service.color} bg-opacity-10 hover:bg-opacity-20`}
              variants={item}
              whileHover={cardHover}
              custom={index}
            >
              <motion.div 
                className="text-4xl mb-4"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  y: [0, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 5 + 2
                }}
              >
                {service.icon}
              </motion.div>
              <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
              <p className="text-gray-300 text-sm md:text-base">{service.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-20 glass p-6 md:p-8 rounded-xl max-w-4xl mx-auto border border-gray-800"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <motion.p
            className="text-lg md:text-xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            viewport={{ once: true }}
          >
            "We're committed to <span className="text-blue-400 font-medium">democratizing AI technology</span> in Indonesia, 
            making it accessible for businesses of all sizes and individuals across the archipelago."
          </motion.p>
          <motion.p
            className="mt-4 text-blue-400 font-medium"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 1 }}
            viewport={{ once: true }}
          >
            - Orion AI Team
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default Service;