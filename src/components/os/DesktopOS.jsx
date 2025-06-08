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
  // Load saved state from localStorage
  const loadState = () => {
    try {
      const savedState = localStorage.getItem('desktopState');
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }
    return null;
  };

  // Save state to localStorage
  const saveState = (state) => {
    try {
      localStorage.setItem('desktopState', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  };

  const [selectedImage, setSelectedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleOpenImage = (file) => {
    setSelectedImage(file);
    const photoViewerApp = apps.find(a => a.name === 'Photo Viewer');
    if (photoViewerApp) {
      openWindow(photoViewerApp.id);
    }
  };

  // Available applications
  const apps = [
    { 
      id: 1, 
      name: 'File Explorer', 
      icon: '📁',
      content: <FileExplorer onOpenImage={handleOpenImage} />,
      defaultSize: { width: 900, height: 600 },
      canResize: true
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
      ),
      canResize: true
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
      ),
      canResize: true
    },
    { 
      id: 4, 
      name: 'Calculator', 
      icon: '🧮', 
      content: <Calculator />, 
      defaultSize: { width: 400, height: 600 },
      canResize: false 
    },
    { 
      id: 5, 
      name: 'Terminal', 
      icon: '⌨️', 
      content: <Terminal />, 
      defaultSize: { width: 800, height: 500 },
      canResize: true 
    },
    { 
      id: 6, 
      name: 'Notes', 
      icon: '📝', 
      content: <Notes />, 
      defaultSize: { width: 800, height: 600 },
      canResize: true 
    },
    { 
      id: 7, 
      name: 'Mail', 
      icon: '✉️', 
      content: <Mail />, 
      defaultSize: { width: 1000, height: 600 },
      canResize: true 
    },
    { 
      id: 8, 
      name: 'Calendar', 
      icon: '📅', 
      content: <Calendar />, 
      defaultSize: { width: 900, height: 600 },
      canResize: true 
    },
    { 
      id: 9, 
      name: 'Photo Viewer', 
      icon: '🖼️', 
      content: <PhotoViewer file={selectedImage} />, 
      defaultSize: { width: 800, height: 600 },
      canResize: true 
    },
    { 
      id: 10, 
      name: 'Code Editor', 
      icon: '💻', 
      content: <CodeEditor />, 
      defaultSize: { width: 800, height: 600 },
      canResize: true 
    }
  ];

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load initial state or set defaults
  const savedState = loadState();
  const [activeWindows, setActiveWindows] = useState(savedState?.activeWindows || []);
  const [focusedWindow, setFocusedWindow] = useState(savedState?.focusedWindow || null);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [windowPositions, setWindowPositions] = useState(savedState?.windowPositions || {});
  const [windowSizes, setWindowSizes] = useState(savedState?.windowSizes || {});
  const [minimizedWindows, setMinimizedWindows] = useState(savedState?.minimizedWindows || []);
  const [maximizedWindows, setMaximizedWindows] = useState(savedState?.maximizedWindows || []);
  const [previousWindowStates, setPreviousWindowStates] = useState(savedState?.previousWindowStates || {});
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [windowStartPosition, setWindowStartPosition] = useState(null);
  const [resizingWindow, setResizingWindow] = useState(null);
  const [resizeStartSize, setResizeStartSize] = useState(null);
  const [resizeStartPosition, setResizeStartPosition] = useState(null);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [showDesktop, setShowDesktop] = useState(false);
  const [wallpaper, setWallpaper] = useState(savedState?.wallpaper || 'default');
  const [theme, setTheme] = useState(savedState?.theme || 'dark');
  const [showPowerOptions, setShowPowerOptions] = useState(false);

  // Save state whenever it changes
  useEffect(() => {
    const state = {
      activeWindows,
      focusedWindow,
      windowPositions,
      windowSizes,
      minimizedWindows,
      maximizedWindows,
      previousWindowStates,
      wallpaper,
      theme
    };
    saveState(state);
  }, [
    activeWindows, 
    focusedWindow, 
    windowPositions, 
    windowSizes, 
    minimizedWindows, 
    maximizedWindows, 
    previousWindowStates,
    wallpaper,
    theme
  ]);

  // Effect for fullscreen and hiding Windows taskbar
  useEffect(() => {
    const enableFullScreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
        document.body.style.cursor = 'default';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      } catch (err) {
        console.error("Error attempting to enable fullscreen:", err);
      }
    };

    enableFullScreen();

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
      setCurrentTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
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

    const newX = windowStartPosition.x + deltaX;
    const newY = windowStartPosition.y + deltaY;

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

  const startResize = (e, appId, direction) => {
    e.stopPropagation();
    const app = apps.find(a => a.id === appId);
    if (!app.canResize) return;
    
    setResizingWindow(appId);
    setResizeDirection(direction);
    setResizeStartSize(windowSizes[appId] || app.defaultSize || { width: 800, height: 500 });
    setResizeStartPosition({ x: e.clientX, y: e.clientY });
    setFocusedWindow(appId);
  };

  const handleResize = (e) => {
    if (!resizingWindow || !resizeStartSize || !resizeStartPosition) return;
    
    const deltaX = e.clientX - resizeStartPosition.x;
    const deltaY = e.clientY - resizeStartPosition.y;
    
    let newWidth = resizeStartSize.width;
    let newHeight = resizeStartSize.height;
    
    // Minimum window size
    const minWidth = 300;
    const minHeight = 200;
    
    // Handle different resize directions
    if (resizeDirection.includes('right')) {
      newWidth = Math.max(minWidth, resizeStartSize.width + deltaX);
    }
    
    if (resizeDirection.includes('left')) {
      const newLeftWidth = Math.max(minWidth, resizeStartSize.width - deltaX);
      const newX = windowPositions[resizingWindow].x + (resizeStartSize.width - newLeftWidth);
      
      // Only update if we have space to move left
      if (newX >= 0) {
        newWidth = newLeftWidth;
        setWindowPositions({
          ...windowPositions,
          [resizingWindow]: {
            ...windowPositions[resizingWindow],
            x: newX
          }
        });
      }
    }
    
    if (resizeDirection.includes('bottom')) {
      newHeight = Math.max(minHeight, resizeStartSize.height + deltaY);
    }
    
    if (resizeDirection.includes('top')) {
      const newTopHeight = Math.max(minHeight, resizeStartSize.height - deltaY);
      const newY = windowPositions[resizingWindow].y + (resizeStartSize.height - newTopHeight);
      
      // Only update if we have space to move up
      if (newY >= 0) {
        newHeight = newTopHeight;
        setWindowPositions({
          ...windowPositions,
          [resizingWindow]: {
            ...windowPositions[resizingWindow],
            y: newY
          }
        });
      }
    }
    
    setWindowSizes({
      ...windowSizes,
      [resizingWindow]: {
        width: newWidth,
        height: newHeight
      }
    });
  };

  const endResize = () => {
    setResizingWindow(null);
    setResizeDirection(null);
    setResizeStartSize(null);
    setResizeStartPosition(null);
  };

  // Add event listeners for resize
  useEffect(() => {
    if (resizingWindow) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', endResize);
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', endResize);
      };
    }
  }, [resizingWindow, resizeStartSize, resizeStartPosition, resizeDirection]);

  const toggleShowDesktop = () => {
    setShowDesktop(!showDesktop);
    if (!showDesktop) {
      // Minimize all windows when showing desktop
      setMinimizedWindows([...minimizedWindows, ...activeWindows.filter(id => !minimizedWindows.includes(id))]);
    } else {
      // Restore previously minimized windows
      setMinimizedWindows([]);
    }
  };

  const handlePowerAction = (action) => {
    switch (action) {
      case 'shutdown':
        // Handle shutdown
        alert('System shutting down...');
        break;
      case 'restart':
        // Handle restart
        alert('System restarting...');
        break;
      case 'sleep':
        // Handle sleep
        alert('System going to sleep...');
        break;
      case 'logout':
        // Handle logout
        window.location.reload();
        break;
      default:
        break;
    }
    setShowPowerOptions(false);
  };

  const changeWallpaper = (newWallpaper) => {
    setWallpaper(newWallpaper);
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  // Arrange windows functions
  const arrangeWindows = (type) => {
    const visibleWindows = activeWindows.filter(id => !minimizedWindows.includes(id));
    
    if (visibleWindows.length === 0) return;
    
    const newPositions = {...windowPositions};
    const newSizes = {...windowSizes};
    
    if (type === 'cascade') {
      visibleWindows.forEach((id, index) => {
        newPositions[id] = {
          x: 50 + (index * 30),
          y: 50 + (index * 30)
        };
        
        const app = apps.find(a => a.id === id);
        newSizes[id] = app.defaultSize || { width: 800, height: 500 };
      });
    } else if (type === 'stack') {
      const windowWidth = window.innerWidth / Math.min(visibleWindows.length, 3);
      
      visibleWindows.forEach((id, index) => {
        newPositions[id] = {
          x: (index % 3) * windowWidth,
          y: Math.floor(index / 3) * 200
        };
        
        newSizes[id] = {
          width: windowWidth,
          height: 300
        };
      });
    } else if (type === 'side-by-side') {
      if (visibleWindows.length === 2) {
        const windowWidth = window.innerWidth / 2;
        
        visibleWindows.forEach((id, index) => {
          newPositions[id] = {
            x: index * windowWidth,
            y: 0
          };
          
          newSizes[id] = {
            width: windowWidth,
            height: window.innerHeight - 48
          };
        });
      }
    }
    
    setWindowPositions(newPositions);
    setWindowSizes(newSizes);
    setMaximizedWindows([]);
  };

const wallpaperStyles = {
  default: 'bg-[url("/wallpaper1.png")] bg-cover bg-center',
  nature: 'bg-[url("/wallpaper1.png")] bg-cover bg-center',
  abstract: 'bg-[url("/wallpaper1.png")] bg-cover bg-center',
  dark: 'bg-[url("/wallpaper1.png")] bg-cover bg-center',
  light: 'bg-[url("/wallpaper1.png")] bg-cover bg-center'
};



  // Theme styles
  const themeStyles = {
    dark: {
      window: 'bg-[#2a2b2e] text-white',
      taskbar: 'bg-[#1a1b1e]/95',
      startMenu: 'bg-gradient-to-br from-[#22252A] to-[#1A1C1F]'
    },
    light: {
      window: 'bg-[#f5f5f5] text-black',
      taskbar: 'bg-[#e5e5e5]/95',
      startMenu: 'bg-gradient-to-br from-[#f0f0f0] to-[#e0e0e0]'
    },
    blue: {
      window: 'bg-[#2a3b5e] text-white',
      taskbar: 'bg-[#1a2b4e]/95',
      startMenu: 'bg-gradient-to-br from-[#223355] to-[#1a2b4e]'
    }
  };

  return (
    <div className={`fixed inset-0 w-screen h-screen overflow-hidden select-none ${wallpaperStyles[wallpaper]}`}>
      {/* Desktop Background */}
      <div className="absolute inset-0">
        {/* Desktop Icons - Aligned to left side */}
        <div className="desktop-icons flex flex-col items-start gap-4 p-4">
          {apps.map(app => (
            <motion.div
              key={app.id}
              className={`desktop-icon flex items-center gap-3 p-2 cursor-pointer hover:bg-white/10 rounded-lg backdrop-blur-sm transition-colors group w-48 ${
                theme === 'light' ? 'hover:bg-black/10' : ''
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openWindow(app.id)}
            >
              <span className="text-3xl group-hover:drop-shadow-glow">{app.icon}</span>
              <span className={`text-sm font-medium group-hover:text-white ${
                theme === 'light' ? 'text-black/90 group-hover:text-black' : 'text-white/90'
              }`}>
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
            const canResize = app.canResize !== false;
            
            return (
              <motion.div
                key={appId}
                data-window-id={appId}
                className={`absolute ${themeStyles[theme].window} overflow-hidden draggable-window
                  ${isFocused ? 'z-20 shadow-2xl' : 'z-10 shadow-lg'}
                  ${maximizedWindows.includes(appId) ? 'window-maximized' : 'rounded-lg window-transition'}
                  ${dragStartPosition ? 'window-dragging' : ''}`}
                style={{ 
                  top: maximizedWindows.includes(appId) ? 0 : position.y,
                  left: maximizedWindows.includes(appId) ? 0 : position.x,
                  width: size.width,
                  height: size.height,
                  border: isFocused ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.2)'
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
                  isFocused={isFocused}
                  isMaximized={maximizedWindows.includes(appId)}
                  onMinimize={(e) => minimizeWindow(e, appId)}
                  onMaximize={(e) => maximizeWindow(e, appId)}
                  onClose={(e) => closeWindow(e, appId)}
                  theme={theme}
                />
                
                <div 
                  className="window-content overflow-hidden" 
                  style={{ 
                    height: size.height - 40,
                    backgroundColor: theme === 'light' ? '#f5f5f5' : '#2a2b2e'
                  }}
                >
                  {app.content || (
                    <div className="flex items-center justify-center h-full">
                      <p className={theme === 'light' ? 'text-black/50' : 'text-white/50'}>
                        Content for {app.name} is under development
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Resize handles */}
                {canResize && !maximizedWindows.includes(appId) && (
                  <>
                    <div 
                      className="resize-handle resize-handle-right" 
                      onMouseDown={(e) => startResize(e, appId, 'right')}
                    />
                    <div 
                      className="resize-handle resize-handle-bottom" 
                      onMouseDown={(e) => startResize(e, appId, 'bottom')}
                    />
                    <div 
                      className="resize-handle resize-handle-left" 
                      onMouseDown={(e) => startResize(e, appId, 'left')}
                    />
                    <div 
                      className="resize-handle resize-handle-top" 
                      onMouseDown={(e) => startResize(e, appId, 'top')}
                    />
                    <div 
                      className="resize-handle resize-handle-bottom-right" 
                      onMouseDown={(e) => startResize(e, appId, 'bottom-right')}
                    />
                    <div 
                      className="resize-handle resize-handle-bottom-left" 
                      onMouseDown={(e) => startResize(e, appId, 'bottom-left')}
                    />
                    <div 
                      className="resize-handle resize-handle-top-right" 
                      onMouseDown={(e) => startResize(e, appId, 'top-right')}
                    />
                    <div 
                      className="resize-handle resize-handle-top-left" 
                      onMouseDown={(e) => startResize(e, appId, 'top-left')}
                    />
                  </>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Taskbar */}
        <div className={`taskbar fixed bottom-0 left-0 right-0 h-12 ${themeStyles[theme].taskbar} backdrop-blur-md border-t ${
          theme === 'light' ? 'border-black/10' : 'border-white/10'
        } flex items-center px-2 z-50`}>
          {/* Start Button */}
          <motion.button
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md h-10 ${
              isStartMenuOpen ? (theme === 'light' ? 'bg-black/10' : 'bg-white/20') : (theme === 'light' ? 'hover:bg-black/10' : 'hover:bg-white/10')
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
          >
            <span className="text-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" strokeOpacity="0.3" stroke={theme === 'light' ? 'black' : 'white'}/>
                <circle cx="12" cy="12" r="6.5" strokeOpacity="0.5" stroke={theme === 'light' ? 'black' : 'white'}/>
                <circle cx="12" cy="12" r="2.5" fill={theme === 'light' ? 'black' : 'white'} />
                <circle cx="17" cy="12" r="0.7" fill={theme === 'light' ? 'black' : 'white'} />
                <circle cx="7" cy="12" r="0.7" fill={theme === 'light' ? 'black' : 'white'} />
              </svg>
            </span>
          </motion.button>

          {/* Search Bar in Taskbar */}
          <div className="ml-3 w-64">
            <input
              type="text"
              placeholder="Search..."
              className={`w-full px-3 py-1 rounded-md ${
                theme === 'light' ? 'bg-black/10 focus:ring-black/30 placeholder-black/50' : 'bg-white/10 focus:ring-white/30 placeholder-white/50'
              } focus:outline-none focus:ring-2`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Task View Button */}
          <motion.button
            className={`ml-2 p-2 rounded-md ${
              theme === 'light' ? 'hover:bg-black/10' : 'hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleShowDesktop}
            title="Show desktop"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </motion.button>

          {/* Arrange Windows Buttons */}
          <div className="ml-2 flex">
            <motion.button
              className={`p-2 rounded-md ${
                theme === 'light' ? 'hover:bg-black/10' : 'hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => arrangeWindows('cascade')}
              title="Cascade windows"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
            </motion.button>
            <motion.button
              className={`p-2 rounded-md ${
                theme === 'light' ? 'hover:bg-black/10' : 'hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => arrangeWindows('stack')}
              title="Stack windows"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </motion.button>
            <motion.button
              className={`p-2 rounded-md ${
                theme === 'light' ? 'hover:bg-black/10' : 'hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => arrangeWindows('side-by-side')}
              title="Side by side"
              disabled={activeWindows.filter(id => !minimizedWindows.includes(id)).length !== 2}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
              </svg>
            </motion.button>
          </div>

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
                    isFocused ? (theme === 'light' ? 'bg-black/20' : 'bg-white/20') : 
                    isMinimized ? (theme === 'light' ? 'opacity-50 hover:opacity-100 hover:bg-black/10' : 'opacity-50 hover:opacity-100 hover:bg-white/10') : 
                    (theme === 'light' ? 'hover:bg-black/10' : 'hover:bg-white/10')
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openWindow(appId)}
                >
                  <span>{app.icon}</span>
                  <span className={`text-sm ${
                    theme === 'light' ? 'text-black/90' : 'text-white/90'
                  }`}>{app.name}</span>
                </motion.button>
              );
            })}
          </div>

          {/* System Tray */}
          <div className="flex items-center gap-4 px-4">
            <div className="relative">
              <motion.button
                className={`p-1 rounded-md ${
                  theme === 'light' ? 'hover:bg-black/10' : 'hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPowerOptions(!showPowerOptions)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </motion.button>
              
              {showPowerOptions && (
                <motion.div
                  className={`absolute bottom-10 right-0 w-48 py-1 rounded-md shadow-lg ${
                    theme === 'light' ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'
                  } z-50`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-700'
                    }`}
                    onClick={() => handlePowerAction('shutdown')}
                  >
                    Shut down
                  </button>
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-700'
                    }`}
                    onClick={() => handlePowerAction('restart')}
                  >
                    Restart
                  </button>
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-700'
                    }`}
                    onClick={() => handlePowerAction('sleep')}
                  >
                    Sleep
                  </button>
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-700'
                    }`}
                    onClick={() => handlePowerAction('logout')}
                  >
                    Sign out
                  </button>
                </motion.div>
              )}
            </div>
            
            <span className={`text-sm ${
              theme === 'light' ? 'text-black/90' : 'text-white/90'
            }`}>{currentTime}</span>
          </div>
        </div>

        {/* Start Menu */}
        <AnimatePresence>
          {isStartMenuOpen && (
            <motion.div
              className={`fixed bottom-12 left-4 w-[420px] ${themeStyles[theme].startMenu} backdrop-blur-3xl rounded-3xl shadow-2xl border ${
                theme === 'light' ? 'border-black/20' : 'border-white/20'
              } z-50 overflow-hidden`}
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
                <span className={`text-xs font-semibold select-none ${
                  theme === 'light' ? 'text-black/40' : 'text-white/40'
                }`}>Hypernova OS v1.0</span>
              </div>

              {/* Search Bar */}
              <div className="px-5 pb-3">
                <input
                  type="text"
                  placeholder="Search apps..."
                  className={`w-full p-2 rounded-xl ${
                    theme === 'light' ? 'bg-black/10 focus:ring-black/30 placeholder-black/50' : 'bg-white/10 focus:ring-white/30 placeholder-white/50'
                  } focus:outline-none focus:ring-2`}
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
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${
                          theme === 'light' ? 'bg-black/5 hover:bg-black/20' : 'bg-white/5 hover:bg-white/20'
                        } transition duration-300 ease-in-out shadow-lg`}
                        whileHover={{
                          scale: 1.15,
                          boxShadow: theme === 'light' ? "0px 16px 40px rgba(0,0,0,0.15)" : "0px 16px 40px rgba(255,255,255,0.15)",
                          transition: { type: "spring", stiffness: 400, damping: 20 }
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openWindow(app.id)}
                      >
                        <span className="text-4xl">{app.icon}</span>
                        <span className={`text-sm text-center ${
                          theme === 'light' ? 'text-black/90' : 'text-white/90'
                        }`}>{app.name}</span>
                      </motion.button>
                    ))
                  ) : (
                    <div className={`col-span-3 text-center py-10 ${
                      theme === 'light' ? 'text-black/50' : 'text-white/50'
                    }`}>No apps found</div>
                  )}
                </div>
              </div>

              {/* User and Power Options */}
              <div className={`border-t ${
                theme === 'light' ? 'border-black/10' : 'border-white/10'
              } p-4 flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    <span className="text-sm">U</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    theme === 'light' ? 'text-black/90' : 'text-white/90'
                  }`}>User</span>
                </div>
                <button
                  className={`p-2 rounded-full ${
                    theme === 'light' ? 'hover:bg-black/10' : 'hover:bg-white/10'
                  }`}
                  onClick={() => handlePowerAction('shutdown')}
                  title="Power"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Settings and Personalization */}
              <div className={`border-t ${
                theme === 'light' ? 'border-black/10' : 'border-white/10'
              } p-4`}>
                <h3 className={`text-sm font-medium mb-2 ${
                  theme === 'light' ? 'text-black/90' : 'text-white/90'
                }`}>Personalization</h3>
                <div className="flex gap-2">
                  <button
                    className={`p-2 rounded-md ${
                      theme === 'light' ? 'hover:bg-black/10' : 'hover:bg-white/10'
                    }`}
                    onClick={() => changeTheme('dark')}
                    title="Dark theme"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  </button>
                  <button
                    className={`p-2 rounded-md ${
                      theme === 'light' ? 'hover:bg-black/10' : 'hover:bg-white/10'
                    }`}
                    onClick={() => changeTheme('light')}
                    title="Light theme"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    className={`p-2 rounded-md ${
                      theme === 'light' ? 'hover:bg-black/10' : 'hover:bg-white/10'
                    }`}
                    onClick={() => changeWallpaper('nature')}
                    title="Nature wallpaper"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    className={`p-2 rounded-md ${
                      theme === 'light' ? 'hover:bg-black/10' : 'hover:bg-white/10'
                    }`}
                    onClick={() => changeWallpaper('abstract')}
                    title="Abstract wallpaper"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DesktopOS;
