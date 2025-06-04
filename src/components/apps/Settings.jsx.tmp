import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  IoWifi, IoBatteryFull, IoVolumeMedium, IoSunny, IoMoon, 
  IoBluetooth, IoLanguage, IoDesktop, IoNotifications, 
  IoColorPalette, IoSpeedometer, IoShieldCheckmark, IoTime, IoGlobe 
} from 'react-icons/io5';

const Settings = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [systemVolume, setSystemVolume] = useState(75);
  const [brightness, setBrightness] = useState(100);
  const [isWifiEnabled, setIsWifiEnabled] = useState(true);
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [isAirplaneMode, setIsAirplaneMode] = useState(false);
  const [activeTab, setActiveTab] = useState('system');
  const [powerMode, setPowerMode] = useState('balanced');

  const categories = [
    { id: 'system', name: 'System', icon: IoDesktop },
    { id: 'network', name: 'Network & Internet', icon: IoWifi },
    { id: 'personalization', name: 'Personalization', icon: IoColorPalette },
    { id: 'notifications', name: 'Notifications', icon: IoNotifications },
    { id: 'performance', name: 'Performance', icon: IoSpeedometer },
    { id: 'security', name: 'Security', icon: IoShieldCheckmark },
    { id: 'time', name: 'Time & Language', icon: IoTime },
    { id: 'about', name: 'About', icon: IoGlobe }
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
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: !isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: !isDarkMode ? 'rgb(96, 165, 250)' : 'rgba(255, 255, 255, 0.6)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDarkMode(false)}
              >
                <IoSunny className="w-5 h-5" />
              </motion.button>
              <motion.button
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: isDarkMode ? 'rgb(96, 165, 250)' : 'rgba(255, 255, 255, 0.6)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDarkMode(true)}
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
              min="0"
              max="100"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="setting-section">
        <h3 className="text-lg font-medium mb-4">Sound</h3>
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
            onChange={(e) => setSystemVolume(parseInt(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
      </div>

      <div className="setting-section">
        <h3 className="text-lg font-medium mb-4">Power & Battery</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Power Mode</span>
            <select
              value={powerMode}
              onChange={(e) => setPowerMode(e.target.value)}
              className="bg-white/5 rounded-lg px-3 py-1"
            >
              <option value="performance">Performance</option>
              <option value="balanced">Balanced</option>
              <option value="powersaver">Power Saver</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNetworkSettings = () => (
    <div className="space-y-6">
      <div className="setting-section">
        <h3 className="text-lg font-medium mb-4">Network Connections</h3>
        <div className="space-y-4">
          <motion.button
            className="flex items-center justify-between w-full p-3 rounded-lg"
            style={{
              backgroundColor: isWifiEnabled ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: isWifiEnabled ? 'rgb(96, 165, 250)' : 'rgba(255, 255, 255, 0.6)'
            }}
            onClick={() => setIsWifiEnabled(!isWifiEnabled)}
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
            className="flex items-center justify-between w-full p-3 rounded-lg"
            style={{
              backgroundColor: isBluetoothEnabled ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: isBluetoothEnabled ? 'rgb(96, 165, 250)' : 'rgba(255, 255, 255, 0.6)'
            }}
            onClick={() => setIsBluetoothEnabled(!isBluetoothEnabled)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <IoBluetooth className="w-5 h-5" />
              <span>Bluetooth</span>
            </div>
            <div className="text-sm opacity-60">
              {isBluetoothEnabled ? 'On' : 'Off'}
            </div>
          </motion.button>

          <motion.button
            className="flex items-center justify-between w-full p-3 rounded-lg"
            style={{
              backgroundColor: isAirplaneMode ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: isAirplaneMode ? 'rgb(251, 146, 60)' : 'rgba(255, 255, 255, 0.6)'
            }}
            onClick={() => setIsAirplaneMode(!isAirplaneMode)}
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
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/5"
              style={{
                backgroundColor: activeTab === category.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: activeTab === category.id ? 'rgb(96, 165, 250)' : 'rgba(255, 255, 255, 0.9)'
              }}
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
