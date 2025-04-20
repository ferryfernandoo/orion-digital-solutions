import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const navRef = useRef(null);

  // Animation variants
  const mobileMenuVariants = {
    open: { 
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300,
        damping: 25,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    closed: { 
      opacity: 0,
      y: "-100%",
      transition: { 
        type: "spring", 
        stiffness: 300,
        damping: 30,
        when: "afterChildren"
      } 
    }
  };

  const navItemVariants = {
    open: { 
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300 }
    },
    closed: { 
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 } 
    }
  };

  const hamburgerVariants = {
    open: { 
      rotate: 90,
      transition: { type: "spring", stiffness: 400, damping: 20 }
    },
    closed: { 
      rotate: 0,
      transition: { type: "spring", stiffness: 400, damping: 20 }
    }
  };

  const navLinkHover = {
    scale: 1.05,
    color: "#ffffff",
    transition: { type: "spring", stiffness: 400 }
  };

  const navLinkTap = {
    scale: 0.95,
    transition: { type: "spring", stiffness: 400 }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        if (navRef.current && !navRef.current.contains(event.target)) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu when logo is clicked
  const handleLogoClick = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Contact", path: "/contact" }
  ];

  return (
    <motion.nav 
      ref={navRef}
      className="fixed w-full z-50 bg-black bg-opacity-50 backdrop-blur-sm shadow-sm h-16"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="container mx-auto px-4 flex justify-between items-center h-full">
        {/* Logo with Click Handler */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link 
            to="/" 
            className="text-2xl font-bold text-white hover:text-gray-300 transition flex items-center space-x-2"
            onClick={handleLogoClick}
          >
            <motion.span
              animate={{ 
                textShadow: ["0 0 8px rgba(96,165,250,0)", "0 0 8px rgba(96,165,250,0.5)", "0 0 8px rgba(96,165,250,0)"]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity 
              }}
            >
              Orion
            </motion.span>
            <motion.img 
              src="/orion.png" 
              alt="Orion Logo" 
              className="h-10"
              animate={{
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatDelay: 3
              }}
            />
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <motion.li
              key={item.name}
              whileHover={navLinkHover}
              whileTap={navLinkTap}
            >
              <Link
                to={item.path}
                className="text-gray-300 hover:text-white text-sm font-medium tracking-wide transition"
              >
                {item.name}
              </Link>
            </motion.li>
          ))}
        </ul>

        {/* Mobile Menu Button */}
        <motion.button 
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          variants={hamburgerVariants}
          animate={isMobileMenuOpen ? "open" : "closed"}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
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
            />
          </svg>
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            className="md:hidden fixed top-16 left-0 w-full bg-black bg-opacity-95 backdrop-blur-lg"
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <ul className="flex flex-col items-center space-y-6 py-6">
              {navItems.map((item, index) => (
                <motion.li
                  key={item.name}
                  variants={navItemVariants}
                  custom={index}
                >
                  <motion.div
                    whileHover={navLinkHover}
                    whileTap={navLinkTap}
                  >
                    <Link
                      to={item.path}
                      className="text-gray-300 hover:text-white text-lg font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar;