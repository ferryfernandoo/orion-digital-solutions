import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const Home = () => {
  const navigate = useNavigate(); // Inisialisasi useNavigate

  // Data untuk roles (tim)
  const roles = [
    { role: "Frontend Developer", emoji: "🖥️" },
    { role: "Backend Developer", emoji: "💻" },
    { role: "Machine Learning Engineer", emoji: "🤖" },
    { role: "Database Administrator", emoji: "🗄️" },
    { role: "DevOps Engineer", emoji: "⚙️" },
    { role: "Project Management", emoji: "📋" },
  ];

  // Data untuk info grid
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
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Orion <br />
            <span className="text-gray-400">Artificial Intelligence</span>
          </h1>

          {/* Description */}
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-3xl mx-auto">
            Orion is a leading AI company committed to building innovative technology solutions that not only transform
            businesses but also prioritize education, ensuring a broader impact on society and the digital future.
          </p>

          {/* Buttons */}
          <div className="flex justify-center gap-4 mb-12">
            <button className="glass px-8 py-4 text-white font-semibold hover:bg-gray-100 hover:text-black transition">
              Explore Our Innovations
            </button>
            <button 
              className="glass px-8 py-4 text-white font-semibold hover:bg-gray-100 hover:text-black transition"
              onClick={() => navigate("/chatbot")} // Arahkan ke halaman chatbot
            >
              Try Our First AI Chat
            </button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {infoGridItems.map((item, index) => (
              <div key={index} className="glass p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Join Our Team Section */}
          <div className="mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Join Our Team</h2>

            {/* Tambahkan tombol "Join Our Team" */}
            <button 
              className="glass px-8 py-4 text-black font-semibold hover:bg-gray-100 hover:text-black transition mb-8"
              onClick={() => navigate("/form")} // Arahkan ke halaman Form.jsx
            >
              Join Our Team
            </button>

            {/* Marquee-like Horizontal Scrolling */}
            <div className="w-full overflow-hidden">
              <motion.div
                className="flex"
                animate={{
                  x: ["0%", "-100%"], // Animasi dari kanan ke kiri
                }}
                transition={{
                  duration: 20, // Durasi animasi
                  repeat: Infinity, // Looping terus menerus
                  ease: "linear", // Animasi linear biar smooth
                }}
              >
                {/* Double the roles array untuk efek seamless looping */}
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
