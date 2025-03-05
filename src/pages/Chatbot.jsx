import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Untuk debounce scroll
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createMessageObject = (text, isBot, duration = 0) => ({
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    text: DOMPurify.sanitize(text), // Sanitize input
    isBot,
    time: new Date().toLocaleTimeString(),
    duration,
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage || isBotTyping) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      // Tambah pesan user
      setMessages(prev => [...prev, createMessageObject(trimmedMessage, false)]);
      setInputMessage('');
      
      setIsBotTyping(true);

      // API call
      const startTime = Date.now();
      const response = await fetch(
        `https://api.ryzendesu.vip/api/ai/deepseek?text=${encodeURIComponent(trimmedMessage)}`,
        {
          method: 'GET',
          headers: { 
            accept: 'application/json',
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const botResponse = data.response || data.answer || data.message || 'can`t proceed';
      const duration = Date.now() - startTime;

      // Tambah pesan bot
      setMessages(prev => [...prev, createMessageObject(botResponse, true, duration)]);
    } catch (error) {
      const errorMessage = error.name === 'AbortError' 
        ? 'request timeout after 30s. Try again.'
        : 'I have a problem here, sory...';
      
      setMessages(prev => [...prev, createMessageObject(errorMessage, true)]);
    } finally {
      setIsBotTyping(false);
      clearTimeout(timeoutId);
    }
  };

  return (
    <div className="flex flex-col h-screen text-white relative opacity-90 z-10 mt-24">
      <div className="max-w-2xl mx-auto w-full p-4">
        <div className="bg-gray-800 rounded-lg shadow-lg h-[700px] sm:h-[450px] flex flex-col">
          {/* Header */}
          <div className="bg-gray-700 p-4 rounded-t-lg flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3 mt-4">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h2 className="font-bold">Orion Assistant</h2>
              <p className="text-sm opacity-75">
                {isBotTyping ? 'Typing...' : 'Online'}
              </p>
            </div>
          </div>
  
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[70%] rounded-lg p-3 ${
                  message.isBot ? 'bg-gray-600' : 'bg-blue-600'
                }`}>
                  <div dangerouslySetInnerHTML={{ __html: message.text }} />
                  <p className="text-xs mt-1 opacity-70">
                    {message.time}
                    {message.isBot && ` • ${(message.duration / 1000).toFixed(1)} sec`}
                  </p>
                </div>
              </div>
            ))}
            
            {isBotTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-600 text-white rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
                         style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
                         style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
  
          {/* Input Form */}
          <div className="border-t border-gray-700 p-4">
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type here..."
                  className="flex-1 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isBotTyping}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
              <p className="text-xs text-gray-400">Orion AI Assistant</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

ChatBot.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      isBot: PropTypes.bool.isRequired,
      time: PropTypes.string.isRequired,
      duration: PropTypes.number,
    })
  ),
};

export default ChatBot;