import React, { useMemo } from "react";
import { motion } from "framer-motion";
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
    scale: 1.03,
    boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)",
    transition: {
      duration: 0.2,
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
    Array.from({ length: 20 }).map((_, i) => ({
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
    <div className="relative overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Enhanced Animated Background Elements */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div 
          className="absolute top-20 left-10 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-20 mix-blend-overlay"
          variants={floatingVariants}
          animate="float"
        />
        <motion.div 
          className="absolute top-1/3 right-20 w-80 h-80 bg-purple-500 rounded-full filter blur-3xl opacity-20 mix-blend-overlay"
          variants={floatingVariants}
          animate="floatDelay"
        />
        <motion.div 
          className="absolute bottom-20 left-1/4 w-72 h-72 bg-cyan-500 rounded-full filter blur-3xl opacity-20 mix-blend-overlay"
          variants={floatingVariants}
          animate="floatDelay2"
        />
      </motion.div>

      {/* Hero Section with adjusted spacing */}
      <section 
        id="home" 
        className="min-h-screen flex items-center relative z-10 pt-32 pb-16" // Increased pt from 24 to 32
      >
        <div className="container mx-auto px-6 text-center">
          {/* Animated Title with Enhanced Floating Effect */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-16"
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
                Orion AI Technologies
              </span>
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Pioneering <span className="font-medium text-white">artificial intelligence</span> solutions that redefine industry standards while fostering technological literacy worldwide.
            </motion.p>
          </motion.div>

          {/* CTA Buttons with Enhanced Animation */}
          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-6 mb-24"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.button
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300"
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
              className="px-10 py-4 border-2 border-blue-400 text-blue-100 font-medium rounded-lg hover:bg-blue-900/20 transition-all duration-300 backdrop-blur-sm"
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
          </motion.div>

          {/* Value Propositions Grid with Lazy Loading */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.2,
                  delayChildren: 0.3,
                },
              },
            }}
          >
            {valuePropositions.map((item, index) => (
              <motion.div
                key={index}
                className="bg-gray-800/30 p-8 rounded-xl border border-gray-700/50 shadow-lg backdrop-blur-sm hover:border-blue-400/30 transition-all duration-300"
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    },
                  },
                }}
                whileHover={{
                  y: -10,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
                  transition: { duration: 0.4 }
                }}
              >
                <motion.div 
                  className="flex justify-center mb-6"
                  whileHover={{ 
                    scale: 1.15,
                    rotate: 5,
                    transition: { type: "spring", stiffness: 400 }
                  }}
                >
                  {item.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-4 text-white">{item.title}</h3>
                <p className="text-gray-300 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Careers Section with Enhanced Animations */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/0 via-gray-900/70 to-gray-900 z-0"></div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-20"
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-4 text-white"
              whileInView={{
                scale: [1, 1.02, 1],
                transition: { duration: 1.5 }
              }}
              viewport={{ once: true }}
            >
              Shape the Future With Us
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-300 max-w-3xl mx-auto"
              whileInView={{
                opacity: [0.8, 1],
                transition: { duration: 1 }
              }}
              viewport={{ once: true }}
            >
              Join our team of visionaries working at the forefront of artificial intelligence innovation.
            </motion.p>
          </motion.div>

          {/* Enhanced Join Button Animation */}
          <motion.div
            className="flex justify-center mb-20"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            <motion.button
              className="px-12 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 15px 30px -5px rgba(6, 182, 212, 0.5)"
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/form")}
            >
              <span className="relative z-10">Explore Career Opportunities</span>
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </motion.div>

          {/* Enhanced Infinite Roles Marquee */}
          <div className="relative overflow-hidden h-52">
            <motion.div
              className="absolute top-0 left-0 flex gap-8"
              animate={{
                x: ["0%", "-100%"],
              }}
              transition={{
                duration: 40,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {[...roles, ...roles].map((job, index) => (
                <motion.div
                  key={index}
                  className="w-80 bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 flex-shrink-0 backdrop-blur-sm hover:border-blue-400/30 transition-all duration-300"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    y: -8,
                    boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.3)",
                    transition: { duration: 0.3 }
                  }}
                >
                  <div className="flex items-start mb-4">
                    <motion.div 
                      className="mr-4 mt-1"
                      whileHover={{ rotate: 15, scale: 1.1 }}
                    >
                      {job.icon}
                    </motion.div>
                    <h3 className="text-lg font-semibold text-white">{job.role}</h3>
                  </div>
                  <p className="text-gray-300 text-sm pl-12">{job.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Floating Particles Animation */}
      <motion.div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
      >
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-blue-500/10"
            initial={{
              x: particle.x,
              y: particle.y,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              x: [null, Math.random() * 100],
              y: [null, Math.random() * 100],
              opacity: [0, 0.4, 0],
              scale: [0, particle.scale, 0],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
          />
        ))}
      </motion.div>

      {/* New Animated Connection Lines */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <motion.path
          d="M100,100 C200,200 300,0 400,100"
          stroke="rgba(96, 165, 250, 0.2)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{ duration: 2, delay: 1 }}
        />
        <motion.path
          d="M800,50 C700,150 600,50 500,150"
          stroke="rgba(139, 92, 246, 0.2)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{ duration: 2, delay: 1.5 }}
        />
      </svg>

      {/* New Floating Tech Icons */}
      <motion.div className="absolute inset-0 pointer-events-none">
        {["react", "node", "python", "tensorflow", "aws", "docker"].map((tech, i) => (
          <motion.div
            key={tech}
            className="absolute text-gray-600/10"
            style={{
              fontSize: `${Math.random() * 30 + 30}px`,
              left: `${Math.random() * 90 + 5}%`,
              top: `${Math.random() * 90 + 5}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, Math.random() * 20 - 10, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          >
            {tech === "react" && "⚛️"}
            {tech === "node" && "⬢"}
            {tech === "python" && "🐍"}
            {tech === "tensorflow" && "🧠"}
            {tech === "aws" && "☁️"}
            {tech === "docker" && "🐳"}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Home;
