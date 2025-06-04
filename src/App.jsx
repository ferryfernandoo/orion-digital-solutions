import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import ChatBot from './pages/Chatbot';
import Form from './pages/Form';
import Products from './pages/Products';
import DesktopOS from './components/os/DesktopOS';
import MobileOS from './components/os/MobileOS';
import './styles/fullscreen.css';

// Separate component for route content to use router hooks
const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isOSPage = currentPath === '/desktop-os' || currentPath === '/mobile-os';

  // Handle fullscreen for OS pages
  useEffect(() => {
    const handleOSFullscreen = async () => {
      if (isOSPage && !document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (err) {
          console.error('Error attempting to enable fullscreen:', err);
        }
      }
    };

    handleOSFullscreen();

    // Cleanup when unmounting
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.error('Error exiting fullscreen:', err);
        });
      }
    };
  }, [isOSPage]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Show navbar only if not in OS pages or Chatbot */}
      {!isOSPage && currentPath !== '/chatbot' && <Navbar />}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/chatbot" element={<ChatBot />} />
          <Route path="/form" element={<Form />} />
          <Route path="/desktop-os" element={<DesktopOS />} />
          <Route path="/mobile-os" element={<MobileOS />} />
        </Routes>
      </main>
      
      {/* Show footer only if not in OS pages or Chatbot */}
      {!isOSPage && currentPath !== '/chatbot' && <Footer />}
    </div>
  );
};

// Main App component that provides Router context
const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
