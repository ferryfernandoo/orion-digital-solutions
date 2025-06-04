import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import { VscChromeMinimize, VscChromeMaximize, VscChromeRestore } from 'react-icons/vsc';

const WindowTitleBar = ({ app, appId, isMaximized, onMinimize, onMaximize, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (!isFullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Add fullscreen change event listener
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Add mouse tracking
  React.useEffect(() => {
    if (!isFullscreen) return;

    const handleMouseMove = (e) => {
      const titleBar = document.querySelector('.fullscreen-title-bar');
      if (!titleBar) return;

      if (e.clientY <= 2) {
        titleBar.classList.add('show');
      } else if (e.clientY > 40) {
        titleBar.classList.remove('show');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isFullscreen]);

  return (
    <>
      {isFullscreen && <div className="fullscreen-trigger" />}
      <div 
        className={`window-title-bar bg-[#1a1b1e] text-white/90 h-8 flex items-center justify-between select-none
          ${isFullscreen ? 'fullscreen-title-bar' : ''}`}
        onDoubleClick={handleFullscreen}
      >
        <div className="flex items-center h-full px-2">
          <span className="mr-2">{app.icon}</span>
          <span className="font-medium text-sm">{app.name}</span>
        </div>
        <div className="flex items-center h-8">
          <motion.button
            className="window-control-button minimize-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => onMinimize(e)}
            aria-label="Minimize"
          >
            <VscChromeMinimize className="control-icon" />
          </motion.button>
          <motion.button
            className="window-control-button maximize-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => onMaximize(e)}
            aria-label={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <VscChromeRestore className="control-icon" />
            ) : (
              <VscChromeMaximize className="control-icon" />
            )}
          </motion.button>
          <motion.button
            className="window-control-button close group relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => onClose(e)}
            aria-label="Close"
          >
            <IoClose className="control-icon" />
            <div className="absolute hidden group-hover:block bg-black/80 text-white text-xs px-2 py-1 rounded -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-50">
              Close
            </div>
          </motion.button>
        </div>
      </div>
    </>
  );
};

export default WindowTitleBar;
