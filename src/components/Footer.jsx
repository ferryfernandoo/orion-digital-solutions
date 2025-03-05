import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-8">
      <div className="container mx-auto px-4 text-center">
        {/* Logo & Tagline */}
        <h2 className="text-2xl font-bold">Orion 🚀</h2>
        <p className="text-gray-400 text-sm mt-2">
          Bringing your ideas to the stars 🌌
        </p>

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Link
            to="/"
            className="text-gray-300 hover:text-white transition duration-300"
          >
            Home
          </Link>
          <Link
            to="/about"
            className="text-gray-300 hover:text-white transition duration-300"
          >
            About
          </Link>
          <Link
            to="/services"
            className="text-gray-300 hover:text-white transition duration-300"
          >
            Services
          </Link>
          <Link
            to="/contact"
            className="text-gray-300 hover:text-white transition duration-300"
          >
            Contact
          </Link>
        </div>

        {/* Social Media Links */}
        <div className="flex justify-center space-x-6 mt-6">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white transition duration-300"
          >
            <i className="fab fa-instagram text-xl"></i>
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white transition duration-300"
          >
            <i className="fab fa-twitter text-xl"></i>
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-white transition duration-300"
          >
            <i className="fab fa-github text-xl"></i>
          </a>
        </div>

        {/* Copyright */}
        <p className="text-gray-500 text-sm mt-6">
          © {new Date().getFullYear()} Orion. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;