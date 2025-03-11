import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import ChatBot from "./pages/Chatbot";
import Form from "./pages/Form";

function App() {
  const location = useLocation(); // Ambil lokasi saat ini

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/chatbot" element={<ChatBot />} />
          <Route path="/form" element={<Form />} />
        </Routes>
      </main>
      {/* Tampilkan footer hanya jika bukan di halaman ChatBot */}
      {location.pathname !== "/chatbot" && <Footer />}
    </div>
  );
}

// Wrap App dengan Router di sini
function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;