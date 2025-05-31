import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 12,
      stiffness: 100,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15,
    },
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)",
    transition: {
      duration: 0.3,
      ease: "easeOut"
    },
  },
  tap: {
    scale: 0.98,
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  hover: {
    y: -8,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
    transition: {
      duration: 0.3,
      ease: "easeOut"
    },
  },
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const floatingVariants = {
  float: {
    y: [0, -15, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  floatDelay: {
    y: [0, -20, 0],
    transition: {
      duration: 7,
      delay: 1,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  floatDelay2: {
    y: [0, -25, 0],
    transition: {
      duration: 8,
      delay: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const Home = () => {
  const navigate = useNavigate();

  // Memoize static data to prevent unnecessary re-renders
  const roles = useMemo(() => [
    { 
      role: "Frontend Engineer", 
      description: "Craft intuitive interfaces with cutting-edge frameworks",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      role: "Backend Architect", 
      description: "Build scalable microservices and robust APIs",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      )
    },
    { 
      role: "ML Researcher", 
      description: "Develop next-generation AI models and algorithms",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    { 
      role: "Data Engineer", 
      description: "Design efficient data pipelines and warehousing solutions",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      )
    },
    { 
      role: "Cloud Specialist", 
      description: "Implement secure, scalable cloud infrastructure",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      )
    },
    { 
      role: "Product Manager", 
      description: "Lead cross-functional teams to deliver AI solutions",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
  ], []);

  const valuePropositions = useMemo(() => [
    {
      title: "Enterprise AI Solutions",
      description: "We deliver transformative AI systems that drive operational efficiency, reduce costs, and create competitive advantages for global enterprises.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: "Educational Initiatives",
      description: "Our comprehensive AI education programs upskill workforces and prepare the next generation of technology leaders.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: "National AI Leadership",
      description: "As the premier AI innovator in our region, we're establishing new standards for technological excellence on the global stage.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      )
    },
  ], []);

  // Generate optimized particles with useMemo
  const particles = useMemo(() => 
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 5,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
      scale: Math.random() * 0.5 + 0.5
    }))
  , []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-full h-full">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-500 rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6"
              variants={itemVariants}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                Transforming Tomorrow
              </span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-gray-300 mb-12"
              variants={itemVariants}
            >
              Building the future of AI in Indonesia, one innovation at a time.
            </motion.p>

            <motion.div
              className="flex flex-wrap justify-center gap-4"
              variants={itemVariants}
            >
              <motion.button
                onClick={() => navigate("/about")}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:opacity-90 transform transition-all"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Learn More
              </motion.button>
              <motion.button
                onClick={() => navigate("/contact")}
                className="px-8 py-4 bg-transparent border-2 border-blue-400 rounded-lg font-semibold hover:bg-blue-400/10 transform transition-all"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Contact Us
              </motion.button>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
              className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1 }}
            >
              <motion.div
                className="w-6 h-10 border-2 border-blue-400 rounded-full p-1"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="w-1 h-3 bg-blue-400 rounded-full mx-auto" />
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Enhanced CTA Buttons with Additional "See All Products" Button */}
        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-4 mb-24"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.button
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            variants={buttonVariants}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 15px 30px -5px rgba(59, 130, 246, 0.5)"
            }}
            whileTap="tap"
          >
            Discover Our Capabilities
          </motion.button>
          
          <motion.button
            className="px-8 py-3 border-2 border-blue-400 text-blue-100 font-medium rounded-lg hover:bg-blue-900/20 transition-all duration-300 backdrop-blur-sm"
            variants={buttonVariants}
            whileHover={{
              scale: 1.05,
              backgroundColor: "rgba(29, 78, 216, 0.15)",
              boxShadow: "0 15px 30px -5px rgba(96, 165, 250, 0.3)"
            }}
            whileTap="tap"
            onClick={() => navigate("/chatbot")}
          >
            Experience AI Demo
          </motion.button>
          
          <motion.button
            className="px-8 py-3 border-2 border-purple-400 text-purple-100 font-medium rounded-lg hover:bg-purple-900/20 transition-all duration-300 backdrop-blur-sm"
            variants={buttonVariants}
            whileHover={{
              scale: 1.05,
              backgroundColor: "rgba(109, 40, 217, 0.15)",
              boxShadow: "0 15px 30px -5px rgba(167, 139, 250, 0.3)"
            }}
            whileTap="tap"
            onClick={() => navigate("/products")}
          >
            See All Products
          </motion.button>
        </motion.div>

        {/* Roles Section */}
        <section className="py-20 px-4">
          <motion.div
            className="max-w-7xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-center mb-16"
              variants={itemVariants}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                Join Our Growing Team
              </span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {roles.map((role, index) => (
                <motion.div
                  key={role.role}
                  className="glass p-8 rounded-xl hover:shadow-xl transition-all border border-gray-800 hover:border-blue-400/30 relative overflow-hidden group"
                  variants={cardVariants}
                  whileHover="hover"
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <motion.div
                      className="text-blue-400 mb-6"
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {role.icon}
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-3">{role.role}</h3>
                    <p className="text-gray-400">{role.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Value Propositions */}
        <section className="py-20 px-4 relative overflow-hidden">
          <motion.div
            className="max-w-7xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-center mb-16"
              variants={itemVariants}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
                Why Choose Orion
              </span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {valuePropositions.map((prop, index) => (
                <motion.div
                  key={prop.title}
                  className="glass p-8 rounded-xl border border-gray-800 hover:border-blue-400/30 relative group"
                  variants={cardVariants}
                  whileHover="hover"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <motion.div
                      className="mb-6 transform-gpu"
                      animate="float"
                      variants={floatingVariants}
                    >
                      {prop.icon}
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-4">{prop.title}</h3>
                    <p className="text-gray-400">{prop.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-8"
              variants={itemVariants}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                Ready to Shape the Future?
              </span>
            </motion.h2>
            
            <motion.p
              className="text-xl text-gray-300 mb-12"
              variants={itemVariants}
            >
              Join us in building Indonesia's next-generation AI technology
            </motion.p>

            <motion.button
              onClick={() => navigate("/contact")}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold group transform transition-all"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <span className="flex items-center gap-2">
                Get Started
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </span>
            </motion.button>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Home;
