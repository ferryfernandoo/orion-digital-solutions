import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Calculator from '../apps/Calculator';
import Notes from '../apps/Notes';
import Terminal from '../apps/Terminal';
import Mail from '../apps/Mail';
import Calendar from '../apps/Calendar';
import FileExplorer from '../apps/FileExplorer';
import PhotoViewer from '../apps/PhotoViewer';
import CodeEditor from '../apps/CodeEditor';  
import WindowTitleBar from './WindowTitleBar';

import '../../styles/windows.css';


const DesktopOS = () => {

  const [selectedImage, setSelectedImage] = useState(null);
  const handleOpenImage = (file) => {
    setSelectedImage(file);
    const photoViewerApp = apps.find(a => a.name === 'Photo Viewer');
    if (photoViewerApp) {
      openWindow(photoViewerApp.id);
    }
  };
  const apps = [
    { 
      id: 1, 
      name: 'File Explorer', 
      icon: '📁',
      content: <FileExplorer onOpenImage={handleOpenImage} />,
      defaultSize: { width: 900, height: 600 }
    },
    { 
      id: 2, 
      name: 'Browser', 
      icon: '🌐',
      content: (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <button className="p-1 hover:bg-white/10 rounded">←</button>
            <button className="p-1 hover:bg-white/10 rounded">→</button>
            <button className="p-1 hover:bg-white/10 rounded">↻</button>
            <input type="text" className="flex-1 px-3 py-1 bg-gray-700 rounded-md" defaultValue="https://www.orion-os.web.app" />
          </div>
          <div className="bg-white/5 p-4 rounded-md">
            <h1 className="text-xl font-bold mb-2">Welcome to Orion OS</h1>
            <p>Your next-generation cloud operating system</p>
          </div>
        </div>
      )
    },
    { 
      id: 3, 
      name: 'Settings', 
      icon: '⚙️',
      content: (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">System Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Dark Mode</span>
              <button className="px-3 py-1 bg-blue-500 rounded-md">Enabled</button>
            </div>
            <div className="flex items-center justify-between">
              <span>Notifications</span>
              <button className="px-3 py-1 bg-blue-500 rounded-md">Enabled</button>
            </div>
            <div className="flex items-center justify-between">
              <span>Sound</span>
              <input type="range" className="w-32" />
            </div>
          </div>
        </div>
      )
    },
    { id: 4, name: 'Calculator', icon: '🧮', content: <Calculator />, defaultSize: { width: 400, height: 600 } },
    { id: 5, name: 'Terminal', icon: '⌨️', content: <Terminal />, defaultSize: { width: 800, height: 500 } },
    { id: 6, name: 'Notes', icon: '📝', content: <Notes />, defaultSize: { width: 800, height: 600 } },
    { id: 7, name: 'Mail', icon: '✉️', content: <Mail />, defaultSize: { width: 1000, height: 600 } },
    { id: 8, name: 'Calendar', icon: '📅', content: <Calendar />, defaultSize: { width: 900, height: 600 } },
    { id: 9, name: 'Photo Viewer', icon: '🖼️', content: <PhotoViewer file={selectedImage} />, defaultSize: { width: 800, height: 600 } },
    { id: 10, name: 'Code Editor', icon: '💻', content: <CodeEditor />, defaultSize: { width: 800, height: 600 } }
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [activeWindows, setActiveWindows] = useState([]);
  const [focusedWindow, setFocusedWindow] = useState(null);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [windowPositions, setWindowPositions] = useState({});
  const [windowSizes, setWindowSizes] = useState({});
  const [minimizedWindows, setMinimizedWindows] = useState([]);
  const [maximizedWindows, setMaximizedWindows] = useState([]);
  const [previousWindowStates, setPreviousWindowStates] = useState({});
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [windowStartPosition, setWindowStartPosition] = useState(null);

  // Effect untuk memastikan fullscreen dan menyembunyikan taskbar Windows
  useEffect(() => {
    const enableFullScreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
        // Tambahkan class untuk menyembunyikan taskbar
        document.body.style.cursor = 'default';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      } catch (err) {
        console.error("Error attempting to enable fullscreen:", err);
      }
    };

    enableFullScreen();

    // Cleanup ketika komponen unmount
    return () => {
      document.body.style.cursor = '';
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, []);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const openWindow = (appId) => {
    if (minimizedWindows.includes(appId)) {
      setMinimizedWindows(minimizedWindows.filter(id => id !== appId));
      setFocusedWindow(appId);
    } else if (!activeWindows.includes(appId)) {
      setActiveWindows([...activeWindows, appId]);
      const app = apps.find(a => a.id === appId);
      // Set initial position and size if not set
      if (!windowPositions[appId]) {
        setWindowPositions({
          ...windowPositions,
          [appId]: {
            x: 50 + (activeWindows.length * 30),
            y: 50 + (activeWindows.length * 30)
          }
        });
      }
      if (!windowSizes[appId] && app.defaultSize) {
        setWindowSizes({
          ...windowSizes,
          [appId]: app.defaultSize
        });
      }
    }
    setFocusedWindow(appId);
    setIsStartMenuOpen(false);
  };

  const closeWindow = (e, appId) => {
    e.stopPropagation();
    setActiveWindows(activeWindows.filter(id => id !== appId));
    setMinimizedWindows(minimizedWindows.filter(id => id !== appId));
    setMaximizedWindows(maximizedWindows.filter(id => id !== appId));
    if (focusedWindow === appId) {
      const remainingWindows = activeWindows.filter(id => id !== appId);
      setFocusedWindow(remainingWindows[remainingWindows.length - 1]);
    }
  };

  const minimizeWindow = (e, appId) => {
    e.stopPropagation();
    if (!minimizedWindows.includes(appId)) {
      setMinimizedWindows([...minimizedWindows, appId]);
    }
    if (focusedWindow === appId) {
      const remainingWindows = activeWindows.filter(
        id => !minimizedWindows.includes(id) && id !== appId
      );
      setFocusedWindow(remainingWindows[remainingWindows.length - 1]);
    }
  };

  const maximizeWindow = (e, appId) => {
    e.stopPropagation();
    
    if (maximizedWindows.includes(appId)) {
      // Restore previous state
      const prevState = previousWindowStates[appId];
      if (prevState) {
        setWindowPositions({
          ...windowPositions,
          [appId]: prevState.position
        });
        setWindowSizes({
          ...windowSizes,
          [appId]: prevState.size
        });
      }
      setMaximizedWindows(maximizedWindows.filter(id => id !== appId));
    } else {
      // Save current state and maximize
      setPreviousWindowStates({
        ...previousWindowStates,
        [appId]: {
          position: windowPositions[appId],
          size: windowSizes[appId]
        }
      });
      
      setWindowPositions({
        ...windowPositions,
        [appId]: { x: 0, y: 0 }
      });
      
      setWindowSizes({
        ...windowSizes,
        [appId]: { 
          width: window.innerWidth, 
          height: window.innerHeight - 48 
        }
      });
      
      setMaximizedWindows([...maximizedWindows, appId]);
    }
  };

  const handleMinimize = (appId) => {
    const windowElement = document.querySelector(`[data-window-id="${appId}"]`);
    windowElement.classList.add('minimizing');
    
    setTimeout(() => {
      setMinimizedWindows([...minimizedWindows, appId]);
      windowElement.classList.remove('minimizing');
    }, 300);
  };

  const handleMaximize = (appId) => {
    if (maximizedWindows.includes(appId)) {
      setMaximizedWindows(maximizedWindows.filter(id => id !== appId));
    } else {
      const windowElement = document.querySelector(`[data-window-id="${appId}"]`);
      windowElement.classList.add('maximized');
      setMaximizedWindows([...maximizedWindows, appId]);
    }
  };

  const handleClose = (appId) => {
    const windowElement = document.querySelector(`[data-window-id="${appId}"]`);
    windowElement.classList.add('closing');
    
    setTimeout(() => {
      setActiveWindows(activeWindows.filter(id => id !== appId));
      setMinimizedWindows(minimizedWindows.filter(id => id !== appId));
      setMaximizedWindows(maximizedWindows.filter(id => id !== appId));
      windowElement.classList.remove('closing');
    }, 200);
  };

  const renderWindowControls = (appId) => (
    <div className="flex items-center h-8">
      <motion.button
        className="window-control-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => minimizeWindow(e, appId)}
      >
        <span className="transform translate-y-[-2px]">─</span>
      </motion.button>
      <motion.button
        className="window-control-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => maximizeWindow(e, appId)}
      >
        {maximizedWindows.includes(appId) ? '⧉' : '□'}
      </motion.button>
      <motion.button
        className="window-control-button close"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => closeWindow(e, appId)}
      >
        ×
      </motion.button>
    </div>
  );

  const handleDragStart = (e, appId) => {
    if (maximizedWindows.includes(appId)) return;
    
    const position = windowPositions[appId] || { x: 50, y: 50 };
    setDragStartPosition({ x: e.clientX, y: e.clientY });
    setWindowStartPosition(position);
    setFocusedWindow(appId);
  };

  const handleDrag = (e, appId) => {
    if (!dragStartPosition || !windowStartPosition || maximizedWindows.includes(appId)) return;

    const deltaX = e.clientX - dragStartPosition.x;
    const deltaY = e.clientY - dragStartPosition.y;

    // Apply dampening for precise control
    const dampening = 0.15;
    const dampedDeltaX = deltaX * dampening;
    const dampedDeltaY = deltaY * dampening;

    const newX = windowStartPosition.x + dampedDeltaX;
    const newY = windowStartPosition.y + dampedDeltaY;

    const size = windowSizes[appId] || { width: 800, height: 500 };
    const boundedX = Math.max(0, Math.min(newX, window.innerWidth - size.width));
    const boundedY = Math.max(0, Math.min(newY, window.innerHeight - size.height - 48));

    setWindowPositions({
      ...windowPositions,
      [appId]: { x: boundedX, y: boundedY }
    });
  };

  const handleDragEnd = (appId) => {
    if (maximizedWindows.includes(appId)) return;
    setDragStartPosition(null);
    setWindowStartPosition(null);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#1a1b1e] overflow-hidden select-none">
      {/* Desktop Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900">
        {/* Desktop Icons - Aligned to left side */}
        <div className="desktop-icons flex flex-col items-start gap-4 p-4">
          {apps.map(app => (
            <motion.div
              key={app.id}
              className="desktop-icon flex items-center gap-3 p-2 cursor-pointer hover:bg-white/10 rounded-lg backdrop-blur-sm transition-colors group w-48"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openWindow(app.id)}
            >
              <span className="text-3xl group-hover:drop-shadow-glow">{app.icon}</span>
              <span className="text-white/90 text-sm font-medium group-hover:text-white">
                {app.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Active Windows */}
        <AnimatePresence>
          {activeWindows.filter(id => !minimizedWindows.includes(id)).map((appId) => {
            const app = apps.find(a => a.id === appId);
            const isFocused = focusedWindow === appId;
            const position = windowPositions[appId] || { x: 50, y: 50 };
            const size = windowSizes[appId] || { width: 800, height: 500 };
            
            return (
              <motion.div
                key={appId}
                data-window-id={appId}
                className={`absolute bg-[#2a2b2e] overflow-hidden draggable-window
                  ${isFocused ? 'z-20' : 'z-10'}
                  ${maximizedWindows.includes(appId) ? 'window-maximized' : 'rounded-lg shadow-2xl window-transition'}
                  ${dragStartPosition ? 'window-dragging' : ''}`}
                style={{ 
                  top: maximizedWindows.includes(appId) ? 0 : position.y,
                  left: maximizedWindows.includes(appId) ? 0 : position.x,
                  width: size.width,
                  height: size.height
                }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                onClick={() => setFocusedWindow(appId)}
                drag={!maximizedWindows.includes(appId)}
                dragMomentum={false}
                onDragStart={(e) => handleDragStart(e, appId)}
                onDrag={(e) => handleDrag(e, appId)}
                onDragEnd={() => handleDragEnd(appId)}
                dragConstraints={{
                  left: 0,
                  right: window.innerWidth - size.width,
                  top: 0,
                  bottom: window.innerHeight - size.height - 48
                }}
              >
                <WindowTitleBar
                  app={app}
                  appId={appId}
                  isMaximized={maximizedWindows.includes(appId)}
                  onMinimize={(e) => minimizeWindow(e, appId)}
                  onMaximize={(e) => maximizeWindow(e, appId)}
                  onClose={(e) => closeWindow(e, appId)}
                />
                <div className="window-content overflow-hidden" style={{ height: size.height - 40 }}>
                  {app.content || (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white/50">Content for {app.name} is under development</p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

       {/* Taskbar - More Windows-like */}
<div className="taskbar fixed bottom-0 left-0 right-0 h-12 bg-[#1a1b1e]/95 backdrop-blur-md border-t border-white/10 flex items-center px-2 z-50">
  
  {/* Start Button */}
 <motion.button
  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/10 h-10"
  
  onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
>
  <span className="text-2xl">
    {/* Orion Pulse Core */}
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" strokeOpacity="0.3"/>
      <circle cx="12" cy="12" r="6.5" strokeOpacity="0.5"/>
      <circle cx="12" cy="12" r="2.5" fill="white" />
      <circle cx="17" cy="12" r="0.7" fill="white" />
      <circle cx="7" cy="12" r="0.7" fill="white" />
    </svg>
  </span>
  {/* Search Bar in Taskbar */}
<div className="ml-3 w-64">
  <input
    type="text"
    placeholder="Search..."
    className="w-full px-3 py-1 rounded-md bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-white/50"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
</div>

</motion.button>



  {/* Active Apps */}
  <div className="flex-1 flex items-center gap-1 px-2">
    {activeWindows.map(appId => {
      const app = apps.find(a => a.id === appId);
      const isFocused = focusedWindow === appId;
      const isMinimized = minimizedWindows.includes(appId);

      return (
        <motion.button
          key={appId}
          className={`flex items-center gap-2 px-3 h-10 rounded-md ${
            isFocused ? 'bg-white/20' : isMinimized ? 'opacity-50 hover:opacity-100 hover:bg-white/10' : 'hover:bg-white/10'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openWindow(appId)}
        >
          <span>{app.icon}</span>
          <span className="text-white/90 text-sm">{app.name}</span>
        </motion.button>
      );
    })}
  </div>

  {/* System Tray */}
  <div className="flex items-center gap-4 px-4">
    <span className="text-white/90 text-sm">{currentTime}</span>
  </div>
</div>

{/* Start Menu */}
{/* Start Menu */}
<AnimatePresence>
  {isStartMenuOpen && (
    <motion.div
      className="fixed bottom-12 left-4 w-[420px] bg-gradient-to-br from-[#22252A] to-[#1A1C1F] backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/20 z-50 overflow-hidden"
      initial={{ opacity: 0, y: 50, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 140,
        damping: 20
      }}
    >
      {/* Watermark */}
      <div className="px-5 pt-5 pb-2 flex justify-between items-center">
        <span className="text-white/40 text-xs font-semibold select-none">Hypernova OS v1.0</span>
      </div>

      {/* Search Bar */}
      <div className="px-5 pb-3">
        <input
          type="text"
          placeholder="Search apps..."
          className="w-full p-2 rounded-xl bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-white/50"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Apps Grid */}
      <div className="p-5 pt-0">
        <div className="grid grid-cols-3 gap-5">
          {filteredApps.length > 0 ? (
            filteredApps.map(app => (
              <motion.button
                key={app.id}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/20 transition duration-300 ease-in-out shadow-lg"
                whileHover={{
                  scale: 1.15,
                  boxShadow: "0px 16px 40px rgba(255,255,255,0.15)",
                  transition: { type: "spring", stiffness: 400, damping: 20 }
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openWindow(app.id)}
              >
                <span className="text-4xl">{app.icon}</span>
                <span className="text-white/90 text-sm text-center">{app.name}</span>
              </motion.button>
            ))
          ) : (
            <div className="col-span-3 text-white/50 text-center py-10">No apps found</div>
          )}
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>


      </div>
    </div>
  );
}

export default DesktopOS;
