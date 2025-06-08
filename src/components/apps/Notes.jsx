import React, { useState, useRef } from 'react';

const WebBrowser = () => {
  const [addressBar, setAddressBar] = useState('');
  const [url, setUrl] = useState('');
  const iframeRef = useRef(null);

  const handleGo = () => {
    let targetUrl = addressBar.trim();

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      // Jika user hanya ngetik keyword, otomatis search ke DuckDuckGo
      targetUrl = `https://duckduckgo.com/?q=${encodeURIComponent(targetUrl)}`;
    }

    // Pakai proxy server kita
    const proxiedUrl = `http://localhost:5000/proxy/${encodeURIComponent(targetUrl)}`;
    setUrl(proxiedUrl);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGo();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1b1e] text-white">
      <div className="flex items-center p-2 border-b border-white/10 bg-[#2a2b2e]">
        <input
          type="text"
          value={addressBar}
          onChange={(e) => setAddressBar(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-2 bg-[#3a3b3e] rounded-md outline-none text-white"
          placeholder="Enter URL or search query"
        />
        <button 
          className="ml-2 px-4 py-2 bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
          onClick={handleGo}
        >
          Go
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {url ? (
          <iframe
            ref={iframeRef}
            src={url}
            title="Web Browser"
            className="w-full h-full border-none"
          ></iframe>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Enter URL to browse
          </div>
        )}
      </div>
    </div>
  );
};

export default WebBrowser;



