import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileOS = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [activeApp, setActiveApp] = useState(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState('100%');
  const [isCharging, setIsCharging] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    // Simulate battery status
    const batteryTimer = setInterval(() => {
      const newLevel = Math.max(0, parseInt(batteryLevel) - 1);
      setBatteryLevel(`${newLevel}%`);
      setIsCharging(Math.random() > 0.8);
    }, 300000); // Every 5 minutes
    
    return () => {
      clearInterval(timer);
      clearInterval(batteryTimer);
    };
  }, [batteryLevel]);

  const mobileApps = [
    { id: 1, name: 'Phone', icon: '📞' },
    { id: 2, name: 'Messages', icon: '✉️' },
    { id: 3, name: 'Camera', icon: '📸' },
    { id: 4, name: 'Gallery', icon: '🖼️' },
    { id: 5, name: 'Settings', icon: '⚙️' },
    { id: 6, name: 'Store', icon: '🎮' },
    { id: 7, name: 'Maps', icon: '🗺️' },
    { id: 8, name: 'Clock', icon: '⏰' },
    { id: 9, name: 'Calendar', icon: '📅' },
    { id: 10, name: 'Notes', icon: '📝' },
    { id: 11, name: 'Weather', icon: '🌤️' },
    { id: 12, name: 'Calculator', icon: '🧮' }
  ];

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center p-4">
      <div className="mobile-os w-full max-w-sm h-[85vh] bg-black overflow-hidden flex flex-col rounded-3xl shadow-2xl border-4 border-gray-800 relative">
        {/* Device Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-3xl z-20"></div>
        
        {/* Status Bar */}
        <motion.div
          className="mobile-status-bar bg-black text-white px-4 py-2 flex justify-between items-center text-sm cursor-pointer relative z-10"
          onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
        >
          <span>{currentTime}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center">
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                📶
              </motion.span>
            </span>
            <span className="flex items-center">
              {isCharging ? '⚡' : ''}
              <motion.span
                animate={{ scale: isCharging ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🔋
              </motion.span>
              <span className="text-xs ml-1">{batteryLevel}</span>
            </span>
          </div>
        </motion.div>

        {/* Notification Panel */}
        <AnimatePresence>
          {isNotificationPanelOpen && (
            <motion.div
              className="notification-panel bg-black/90 backdrop-blur-lg text-white"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="quick-settings grid grid-cols-4 gap-4 p-4">
                <motion.button
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>📶</span>
                  <span className="text-xs mt-1">Wi-Fi</span>
                </motion.button>
                <motion.button
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>📱</span>
                  <span className="text-xs mt-1">Data</span>
                </motion.button>
                <motion.button
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>🔆</span>
                  <span className="text-xs mt-1">Brightness</span>
                </motion.button>
                <motion.button
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>🌙</span>
                  <span className="text-xs mt-1">Night</span>
                </motion.button>
              </div>

              <div className="notifications p-4 border-t border-white/10">
                <div className="text-sm font-medium mb-2">Notifications</div>
                <div className="text-xs text-gray-400">No new notifications</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Apps Grid */}
        <div className="flex-1 grid grid-cols-4 gap-4 p-6 bg-gradient-to-b from-gray-900 to-black overflow-y-auto">
          {mobileApps.map((app) => (
            <motion.div
              key={app.id}
              className="app-icon flex flex-col items-center justify-center p-2 cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveApp(app.id)}
            >
              <span className="text-4xl mb-2">{app.icon}</span>
              <span className="text-sm text-white/90 text-center font-medium">
                {app.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Active App View */}
        <AnimatePresence>
          {activeApp && (
            <motion.div
              className="absolute inset-0 bg-black flex flex-col"
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
            >
              <div className="app-header bg-black text-white px-4 py-3 flex items-center">
                <motion.button
                  className="mr-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveApp(null)}
                >
                  ←
                </motion.button>
                <span className="text-lg font-medium">
                  {mobileApps.find(app => app.id === activeApp)?.name}
                </span>
              </div>
              <div className="flex-1 bg-gray-100 flex items-center justify-center">
                <motion.span 
                  className="text-8xl"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                >
                  {mobileApps.find(app => app.id === activeApp)?.icon}
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MobileOS;
