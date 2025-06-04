import React from 'react';
import { motion } from 'framer-motion';
import {   IoWifi, IoBatteryFull, IoVolumeMedium, IoSunny, IoMoon, 
  IoLanguage, IoDesktop, IoNotifications, 
  IoColorPalette, IoSpeedometer, IoShieldCheckmark, IoTime, IoGlobe 
} from 'react-icons/io5';

const Settings = ({ 
  isDarkMode, setIsDarkMode,
  systemVolume, setSystemVolume,
  brightness, setBrightness,  isWifiEnabled, setIsWifiEnabled,
  isAirplaneMode, setIsAirplaneMode
}) => {
  // Handler functions for all settings controls
  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleBrightnessChange = (value) => {
    setBrightness(value);
  };

  const handleVolumeChange = (value) => {
    setSystemVolume(value);
  };

  const handleWifiToggle = () => {
    setIsWifiEnabled(!isWifiEnabled);
    // If turning on wifi, disable airplane mode
    if (!isWifiEnabled) {
      setIsAirplaneMode(false);
    }
  };
  // Removed bluetooth toggle handler
  const handleAirplaneModeToggle = () => {
    setIsAirplaneMode(!isAirplaneMode);
    // When enabling airplane mode, disable wifi
    if (!isAirplaneMode) {
      setIsWifiEnabled(false);
    }
  };
  // Local state for settings that don't need to be shared
  const [language, setLanguage] = React.useState('English');
  const [timeZone, setTimeZone] = React.useState('UTC+7');
  const [animations, setAnimations] = React.useState(true);
  const [transparency, setTransparency] = React.useState(true);
  const [accentColor, setAccentColor] = React.useState('#0066ff');
  const [backgroundStyle, setBackgroundStyle] = React.useState('wallpaper');
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [notificationSound, setNotificationSound] = React.useState(true);
  const [doNotDisturb, setDoNotDisturb] = React.useState(false);
  const [showNotificationContent, setShowNotificationContent] = React.useState(true);
  const [powerMode, setPowerMode] = React.useState('balanced');
  const [autoLock, setAutoLock] = React.useState(true);
  const [autoLockTime, setAutoLockTime] = React.useState(5);
  const [requirePassword, setRequirePassword] = React.useState(true);
  const [firewall, setFirewall] = React.useState(true);

  const [activeTab, setActiveTab] = React.useState('system');

  const categories = [
    { id: 'system', name: 'System', icon: IoDesktop },
    { id: 'network', name: 'Network & Internet', icon: IoWifi },
    { id: 'personalization', name: 'Personalization', icon: IoColorPalette },
    { id: 'notifications', name: 'Notifications', icon: IoNotifications },
    { id: 'performance', name: 'Performance', icon: IoSpeedometer },
    { id: 'security', name: 'Security', icon: IoShieldCheckmark },
    { id: 'time', name: 'Time & Language', icon: IoTime },
    { id: 'about', name: 'About', icon: IoGlobe },
  ];

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="setting-section">
        <h3 className="text-lg font-medium mb-4">Display</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Theme</span>
            <div className="flex gap-2">
              <motion.button
                className={!isDarkMode ? 'p-2 rounded-lg bg-blue-500/20 text-blue-400' : 'p-2 rounded-lg bg-white/5'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleThemeToggle}
              >
                <IoSunny className="w-5 h-5" />
              </motion.button>
              <motion.button
                className={isDarkMode ? 'p-2 rounded-lg bg-blue-500/20 text-blue-400' : 'p-2 rounded-lg bg-white/5'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleThemeToggle}
              >
                <IoMoon className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span>Brightness</span>
              <span className="text-sm text-white/60">{brightness}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              value={brightness}
              onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span>Volume</span>
              <span className="text-sm text-white/60">{systemVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={systemVolume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNetworkSettings = () => (
    <div className="space-y-6">
      <div className="setting-section">
        <h3 className="text-lg font-medium mb-4">Network Connections</h3>
        <div className="space-y-4">          <motion.button
            className={`flex items-center justify-between w-full p-3 rounded-lg ${
              isWifiEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5'
            }`}
            onClick={handleWifiToggle}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <IoWifi className="w-5 h-5" />
              <span>WiFi</span>
            </div>
            <div className="text-sm opacity-60">
              {isWifiEnabled ? 'Connected' : 'Off'}
            </div>
          </motion.button>
          
          <motion.button
            className={`flex items-center justify-between w-full p-3 rounded-lg ${
              isAirplaneMode ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5'
            }`}
            onClick={handleAirplaneModeToggle}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">✈️</span>
              <span>Airplane Mode</span>
            </div>
            <div className="text-sm opacity-60">
              {isAirplaneMode ? 'On' : 'Off'}
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'system':
        return renderSystemSettings();
      case 'network':
        return renderNetworkSettings();
      // Add more cases for other tabs
      default:
        return <div>Select a category</div>;
    }
  };

  return (
    <div className="flex h-full bg-[#1a1b1e] text-white/90">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 p-4">
        <div className="space-y-1">
          {categories.map(category => (
            <motion.button
              key={category.id}
              className={`flex items-center gap-3 w-full p-3 rounded-lg ${activeTab === category.id ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5'}`}
              onClick={() => setActiveTab(category.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <category.icon className="w-5 h-5" />
              <span>{category.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">{categories.find(c => c.id === activeTab)?.name}</h2>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
