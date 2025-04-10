import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null); // Ref untuk menu mobile

  // Variants untuk animasi menu mobile
  const mobileMenuVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: "-100%" }
  };

  // Variants untuk animasi tombol hamburger
  const hamburgerVariants = {
    open: { rotate: 90 },
    closed: { rotate: 0 }
  };

  // Variants untuk animasi link
  const navLinkVariants = {
    hover: { scale: 1.1, color: "#ffffff" },
    tap: { scale: 0.9 }
  };

  // Fungsi untuk menutup menu mobile saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    // Tambahkan event listener saat komponen mount
    document.addEventListener("mousedown", handleClickOutside);

    // Bersihkan event listener saat komponen unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="fixed w-full z-50 bg-black bg-opacity-70 backdrop-blur-md shadow-lg h-20">
      <div className="container mx-auto px-4 flex justify-between items-center h-full">
        {/* Logo dengan Teks dan Gambar */}
        <Link to="/" className="text-2xl font-bold text-white hover:text-gray-300 transition duration-300 flex items-center space-x-3">
          <span>Orion</span>
          <img 
            src="/orion.png" 
            alt="Orion Logo" 
            className="h-12" 
          />
        </Link>

        {/* Navigation Links (Desktop) */}
        <ul className="hidden md:flex space-x-6">
          <li>
            <motion.div
              variants={navLinkVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Link
                to="/"
                className="text-gray-300 hover:text-white transition duration-300"
              >
                Home
              </Link>
            </motion.div>
          </li>
          <li>
            <motion.div
              variants={navLinkVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Link
                to="/about"
                className="text-gray-300 hover:text-white transition duration-300"
              >
                About
              </Link>
            </motion.div>
          </li>
          <li>
            <motion.div
              variants={navLinkVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Link
                to="/services"
                className="text-gray-300 hover:text-white transition duration-300"
              >
                Services
              </Link>
            </motion.div>
          </li>
          <li>
            <motion.div
              variants={navLinkVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Link
                to="/contact"
                className="text-gray-300 hover:text-white transition duration-300"
              >
                Contact
              </Link>
            </motion.div>
          </li>
        </ul>

        {/* Hamburger Menu Button (Mobile) */}
        <motion.button 
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          variants={hamburgerVariants}
          animate={isMobileMenuOpen ? "open" : "closed"}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16m-7 6h7"
            ></path>
          </svg>
        </motion.button>
      </div>

      {/* Mobile Menu (Muncul saat diklik) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef} // Ref untuk mendeteksi klik di luar
            className="md:hidden fixed top-20 left-0 w-full bg-black bg-opacity-90 backdrop-blur-md shadow-lg"
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <ul className="flex flex-col items-center space-y-4 py-4">
              <li>
                <motion.div
                  variants={navLinkVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link
                    to="/"
                    className="text-gray-300 hover:text-white transition duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                </motion.div>
              </li>
              <li>
                <motion.div
                  variants={navLinkVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link
                    to="/about"
                    className="text-gray-300 hover:text-white transition duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                </motion.div>
              </li>
              <li>
                <motion.div
                  variants={navLinkVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link
                    to="/services"
                    className="text-gray-300 hover:text-white transition duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Services
                  </Link>
                </motion.div>
              </li>
              <li>
                <motion.div
                  variants={navLinkVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Link
                    to="/contact"
                    className="text-gray-300 hover:text-white transition duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </motion.div>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
