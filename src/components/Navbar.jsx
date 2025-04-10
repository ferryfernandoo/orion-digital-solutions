import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const location = useLocation();

  // Jangan tampilkan navbar jika di halaman /chatbot
  if (location.pathname === "/chatbot") {
    return null;
  }

  const mobileMenuVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: "-100%" }
  };

  const hamburgerVariants = {
    open: { rotate: 90 },
    closed: { rotate: 0 }
  };

  const navLinkVariants = {
    hover: { scale: 1.1, color: "#ffffff" },
    tap: { scale: 0.9 }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="fixed w-full z-50 bg-black bg-opacity-70 backdrop-blur-md shadow-lg h-20">
      <div className="container mx-auto px-4 flex justify-between items-center h-full">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-white hover:text-gray-300 transition duration-300 flex items-center space-x-3">
          <span>Orion</span>
          <img src="/orion.png" alt="Orion Logo" className="h-12" />
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex space-x-6">
          {["/", "/about", "/services", "/contact"].map((path, idx) => (
            <li key={idx}>
              <motion.div variants={navLinkVariants} whileHover="hover" whileTap="tap">
                <Link to={path} className="text-gray-300 hover:text-white transition duration-300">
                  {path === "/" ? "Home" : path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
                </Link>
              </motion.div>
            </li>
          ))}
        </ul>

        {/* Hamburger (Mobile) */}
        <motion.button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          variants={hamburgerVariants}
          animate={isMobileMenuOpen ? "open" : "closed"}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            className="md:hidden fixed top-20 left-0 w-full bg-black bg-opacity-90 backdrop-blur-md shadow-lg"
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <ul className="flex flex-col items-center space-y-4 py-4">
              {["/", "/about", "/services", "/contact"].map((path, idx) => (
                <li key={idx}>
                  <motion.div variants={navLinkVariants} whileHover="hover" whileTap="tap">
                    <Link
                      to={path}
                      className="text-gray-300 hover:text-white transition duration-300"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {path === "/" ? "Home" : path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
