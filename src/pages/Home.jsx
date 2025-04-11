import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Variants untuk animasi
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3, // Animasi anak-anak dengan jeda 0.3 detik
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const Home = () => {
  const navigate = useNavigate();

  const roles = [
    { role: "Frontend Developer", emoji: "🖥️" },
    { role: "Backend Developer", emoji: "💻" },
    { role: "Machine Learning Engineer", emoji: "🤖" },
    { role: "Database Administrator", emoji: "🗄️" },
    { role: "DevOps Engineer", emoji: "⚙️" },
    { role: "Project Management", emoji: "📋" },
  ];

  const infoGridItems = [
    {
      title: "🚀 AI for the Future",
      description: "We develop AI solutions that empower businesses to grow faster and more efficiently.",
    },
    {
      title: "📚 AI in Education",
      description: "Our AI initiatives help educate the public on the rapid advancements in technology.",
    },
    {
      title: "🌍 Proudly Representing Our Nation",
      description: "We are proud to be the first AI company from our country competing globally.",
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center relative z-10 pt-32 pb-12">
        <div className="container mx-auto px-4 text-center">
          {/* Title */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            Orion <br />
            <span className="text-gray-400">Artificial Intelligence</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-gray-400 text-lg md:text-xl mb-10 max-w-3xl mx-auto"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            Orion is a leading AI company committed to building innovative technology solutions that not only transform
            businesses but also prioritize education, ensuring a broader impact on society and the digital future.
          </motion.p>

          {/* Buttons */}
          <motion.div
            className="flex justify-center gap-4 mb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.button
              className="glass px-8 py-4 text-white font-semibold hover:bg-gray-100 hover:text-black transition rounded-lg"
              variants={buttonVariants}
            >
              Explore Our Innovations
            </motion.button>
            <motion.button
              className="glass px-8 py-4 text-white font-semibold hover:bg-gray-100 hover:text-black transition rounded-lg"
              onClick={() => navigate("/chatbot")}
              variants={buttonVariants}
            >
              Start AI Chat
            </motion.button>
          </motion.div>

          {/* Info Grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {infoGridItems.map((item, index) => (
              <motion.div
                key={index}
                className="glass p-6 rounded-lg"
                variants={itemVariants}
              >
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Join Our Team Section */}
          <div className="mt-16">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-8"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              Join Our Team
            </motion.h2>

            {/* Join Our Team Button */}
            <motion.button
              className="glass px-8 py-4 text-white font-semibold hover:bg-gray-100 hover:text-black transition rounded-lg mb-8"
              onClick={() => navigate("/form")}
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
            >
              Join Our Team
            </motion.button>

            {/* Marquee-like Horizontal Scrolling */}
            <div className="w-full overflow-hidden">
              <motion.div
                className="flex"
                animate={{
                  x: ["0%", "-100%"],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {[...roles, ...roles].map((job, index) => (
                  <div key={index} className="glass p-6 rounded-lg min-w-[250px] mx-3">
                    <h3 className="text-xl font-semibold mb-3">
                      {job.emoji} {job.role}
                    </h3>
                    <p className="text-gray-400">Join our team and be part of the AI revolution.</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
