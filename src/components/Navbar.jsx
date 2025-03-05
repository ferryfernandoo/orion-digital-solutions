import { Link } from "react-router-dom";
import { useState } from "react";

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <Link
              to="/"
              className="text-gray-300 hover:text-white transition duration-300"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className="text-gray-300 hover:text-white transition duration-300"
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to="/services"
              className="text-gray-300 hover:text-white transition duration-300"
            >
              Services
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              className="text-gray-300 hover:text-white transition duration-300"
            >
              Contact
            </Link>
          </li>
        </ul>

        {/* Hamburger Menu Button (Mobile) */}
        <button 
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
        </button>
      </div>

      {/* Mobile Menu (Muncul saat diklik) */}
      <div className={`md:hidden bg-black bg-opacity-90 backdrop-blur-md transition-all duration-300 ${isMobileMenuOpen ? 'max-h-96' : 'max-h-0'} overflow-hidden`}>
        <ul className="flex flex-col items-center space-y-4 py-4">
          <li>
            <Link
              to="/"
              className="text-gray-300 hover:text-white transition duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className="text-gray-300 hover:text-white transition duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to="/services"
              className="text-gray-300 hover:text-white transition duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Services
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              className="text-gray-300 hover:text-white transition duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;