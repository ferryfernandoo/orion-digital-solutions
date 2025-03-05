import React from "react";

const Contact = () => {
  return (
    <section id="contact" className="min-h-screen flex items-center bg-gray-900 text-white opacity-70">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-6 mt-32">Get in Touch</h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Have questions or want to collaborate? We'd love to hear from you!
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">📧 Email Us</h3>
            <p className="text-gray-300">Reach us at <span className="text-blue-400">contact@orionai.com</span></p>
          </div>
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">📍 Visit Our Office</h3>
            <p className="text-gray-300">123 AI Street, Tech City, IN 2025</p>
          </div>
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">💬 Social Media</h3>
            <p className="text-gray-300">Follow us on <span className="text-blue-400">@orionai</span> for updates.</p>
          </div>
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">📞 Call Us</h3>
            <p className="text-gray-300">+62 812 3456 7890</p>
          </div>
        </div>

        <form className="mt-12 max-w-lg mx-auto bg-gray-900 p-6 rounded-lg shadow-lg mb-24">
          <h3 className="text-xl font-semibold mb-4">📩 Send a Message</h3>
          <input type="text" placeholder="Your Name" className="w-full p-3 mb-4 bg-gray-700 text-white rounded-md outline-none" />
          <input type="email" placeholder="Your Email" className="w-full p-3 mb-4 bg-gray-700 text-white rounded-md outline-none" />
          <textarea placeholder="Your Message" className="w-full p-3 mb-4 bg-gray-700 text-white rounded-md outline-none" rows="5"></textarea>
          <button className="glass px-6 py-3 font-semibold hover:bg-blue-500 transition rounded-md">
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
