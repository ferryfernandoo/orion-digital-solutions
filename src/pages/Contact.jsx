import React from "react";
import { motion } from "framer-motion";

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 30 },
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
  y: -5,
  transition: {
    duration: 0.3,
    ease: "easeOut"
  }
};

const formItem = {
  hidden: { opacity: 0, x: -20 },
  show: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "backOut"
    }
  })
};

const Contact = () => {
  return (
    <section id="contact" className="min-h-screen flex items-center bg-gray-900 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Get in Touch
          </h2>
          <motion.p
            className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Have questions or want to collaborate? We'd love to hear from you!
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div
            className="glass p-8 rounded-xl border border-gray-800 hover:border-blue-400/30 cursor-pointer"
            variants={item}
            whileHover={cardHover}
          >
            <div className="text-blue-400 text-3xl mb-4">📧</div>
            <h3 className="text-xl font-semibold mb-3">Email Us</h3>
            <motion.p
              className="text-gray-300"
              whileHover={{ color: "#60a5fa" }}
              transition={{ duration: 0.2 }}
            >
              contact@orionai.com
            </motion.p>
          </motion.div>

          <motion.div
            className="glass p-8 rounded-xl border border-gray-800 hover:border-blue-400/30 cursor-pointer"
            variants={item}
            whileHover={cardHover}
          >
            <div className="text-blue-400 text-3xl mb-4">📍</div>
            <h3 className="text-xl font-semibold mb-3">Our Office</h3>
            <p className="text-gray-300">
              BSD City, Tangerang<br />
              Banten, Indonesia 15345
            </p>
          </motion.div>

          <motion.div
            className="glass p-8 rounded-xl border border-gray-800 hover:border-blue-400/30 cursor-pointer"
            variants={item}
            whileHover={cardHover}
          >
            <div className="text-blue-400 text-3xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-3">Social Media</h3>
            <motion.p
              className="text-gray-300"
              whileHover={{ color: "#60a5fa" }}
              transition={{ duration: 0.2 }}
            >
              @orionai.id
            </motion.p>
          </motion.div>

          <motion.div
            className="glass p-8 rounded-xl border border-gray-800 hover:border-blue-400/30 cursor-pointer"
            variants={item}
            whileHover={cardHover}
          >
            <div className="text-blue-400 text-3xl mb-4">📞</div>
            <h3 className="text-xl font-semibold mb-3">Call Us</h3>
            <motion.p
              className="text-gray-300"
              whileHover={{ color: "#60a5fa" }}
              transition={{ duration: 0.2 }}
            >
              +62 21 5568 1234
            </motion.p>
          </motion.div>
        </motion.div>

        <motion.form
          className="mt-20 max-w-2xl mx-auto glass p-8 md:p-10 rounded-xl border border-gray-800"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.h3
            className="text-2xl font-semibold mb-8 flex items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
            >
              📩
            </motion.span>
            Send a Message
          </motion.h3>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <motion.div variants={formItem} custom={0}>
              <input
                type="text"
                placeholder="Your Name"
                className="w-full p-4 bg-gray-800/50 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 hover:border-blue-400/50 transition-all"
              />
            </motion.div>

            <motion.div variants={formItem} custom={1}>
              <input
                type="email"
                placeholder="Your Email"
                className="w-full p-4 bg-gray-800/50 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 hover:border-blue-400/50 transition-all"
              />
            </motion.div>

            <motion.div variants={formItem} custom={2}>
              <textarea
                placeholder="Your Message"
                className="w-full p-4 bg-gray-800/50 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 hover:border-blue-400/50 transition-all min-h-[150px]"
              ></textarea>
            </motion.div>

            <motion.div variants={formItem} custom={3} className="pt-2">
              <motion.button
                className="w-full py-4 font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 transition-all shadow-lg hover:shadow-blue-500/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Send Message
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.form>
      </div>
    </section>
  );
};

export default Contact;