import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FiCopy, FiSend, FiPlus, FiX, FiImage, FiFile, FiTrash2, FiClock, FiPause } from 'react-icons/fi';

const ChatBot = () => {
  // State
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [typingProgress, setTypingProgress] = useState('');
  const [showTemplateButtons, setShowTemplateButtons] = useState(true);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [memories, setMemories] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingIntervalRef = useRef(null);

  // Gemini AI
  const genAI = new GoogleGenerativeAI("AIzaSyDSTgkkROL7mjaGKoD2vnc8l2UptNCbvHk");
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // Load data
  useEffect(() => {
    const savedMemories = localStorage.getItem('orionMemories');
    const savedChatHistory = localStorage.getItem('orionChatHistory');
    
    if (savedMemories) setMemories(JSON.parse(savedMemories));
    if (savedChatHistory) setChatHistory(JSON.parse(savedChatHistory));
  }, []);

  // Auto-scroll and clean up
  useEffect(() => {
    scrollToBottom();
    return () => clearInterval(typingIntervalRef.current);
  }, [messages, typingProgress]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createMessageObject = (text, isBot, duration = 0, file = null) => ({
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    text: DOMPurify.sanitize(text),
    isBot,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    duration,
    file,
  });

  // Simulate typing effect
  const simulateTyping = (fullText) => {
    let i = 0;
    clearInterval(typingIntervalRef.current);
    
    typingIntervalRef.current = setInterval(() => {
      if (i < fullText.length) {
        setTypingProgress(fullText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingIntervalRef.current);
        setIsStreaming(false);
      }
    }, 20 + Math.random() * 30); // Variable speed
  };

  const handleSendMessage = async (messageText, files = []) => {
    const trimmedMessage = messageText.trim();
    if ((!trimmedMessage && files.length === 0) || isBotTyping) return;

    // User message
    const userMessage = { role: 'user', content: trimmedMessage };
    const updatedHistory = [...chatHistory, userMessage];
    
    setChatHistory(updatedHistory);
    localStorage.setItem('orionChatHistory', JSON.stringify(updatedHistory));

    if (trimmedMessage) {
      setMessages(prev => [...prev, createMessageObject(trimmedMessage, false)]);
    }

    if (files.length > 0) {
      files.forEach(file => {
        setMessages(prev => [...prev, createMessageObject(`File: ${file.name}`, false, 0, file)]);
      });
    }

    // Reset UI
    setInputMessage('');
    setPendingFiles([]);
    setIsBotTyping(true);
    setIsStreaming(true);
    setShowTemplateButtons(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Add temporary bot message
    const botMessageId = Date.now();
    setMessages(prev => [...prev, createMessageObject("", true)]);

    try {
      // Generate response
      const result = await model.generateContent(trimmedMessage);
      const response = await result.response.text();
      
      // Start typing effect
      simulateTyping(response);

      // Update message with full content when done
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? createMessageObject(response, true, Date.now() - botMessageId)
            : msg
        ));
        setIsBotTyping(false);
      }, response.length * 30); // Approximate typing duration

    } catch (error) {
      const errorMsg = error.name === 'AbortError' 
        ? 'Request timeout. Please try again.'
        : 'Sorry, I encountered an error. Please try again later.';
      
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? createMessageObject(errorMsg, true)
          : msg
      ));
      setIsBotTyping(false);
      setIsStreaming(false);
    }
  };

  // ... (keep all other existing functions exactly the same)

  return (
    <div className={`flex flex-col h-screen bg-gray-50 text-gray-900 ${isExpanded ? 'w-full' : 'w-full max-w-3xl mx-auto rounded-lg shadow-lg overflow-hidden'}`}>
      
      {/* Modern Header */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
            <span className="text-lg">✨</span>
          </div>
          <div>
            <h2 className="font-bold text-lg">Orion AI</h2>
            <p className="text-xs text-gray-500">
              {isBotTyping ? "Typing..." : "Online"}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-full hover:bg-gray-100">
            {isExpanded ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full pb-16">
            <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
              <span className="text-4xl">✨</span>
            </div>
            <h3 className="text-2xl font-bold text-center mb-2">Hello, I'm Orion</h3>
            <p className="text-gray-500 text-center mb-8 max-w-md">
              Your AI assistant ready to help with anything
            </p>
            
            {showTemplateButtons && (
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {["Say hello", "Brainstorm ideas", "Explain something", "Code help"].map((item) => (
                  <button
                    key={item}
                    onClick={() => handleSendMessage(item + "...")}
                    className="bg-gray-100 hover:bg-gray-200 rounded-lg p-3 text-sm transition-colors text-left border border-gray-200"
                  >
                    <span className="font-medium">{item}</span>
                    <p className="text-gray-500 text-xs mt-1">Click to start</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[85%] rounded-xl p-3 ${message.isBot ? 
                'bg-gray-100' : 
                'bg-blue-500 text-white'}`}
              >
                {message.isBot && (
                  <div className="flex items-center mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs mr-2">
                      AI
                    </div>
                  </div>
                )}
                
                {message.file ? (
                  <div>
                    <p className="text-sm mb-2">File: {message.file.name}</p>
                    {message.file.type.startsWith('image/') && (
                      <img 
                        src={URL.createObjectURL(message.file)} 
                        alt="Uploaded" 
                        className="mt-2 max-w-full h-auto rounded-lg border border-gray-200" 
                      />
                    )}
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    {message.text}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                  <span>{message.time}</span>
                  {message.isBot && (
                    <button
                      onClick={() => navigator.clipboard.writeText(message.text)}
                      className="ml-2 hover:opacity-100 opacity-60"
                    >
                      <FiCopy size={14} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isBotTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 rounded-xl p-3 max-w-[85%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[1, 2, 3].map((dot) => (
                    <motion.span
                      key={dot}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: dot * 0.3 }}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-3">
        {pendingFiles.length > 0 && (
          <div className="flex items-center space-x-2 mb-3 overflow-x-auto pb-2">
            {pendingFiles.map((file, index) => (
              <div key={index} className="relative flex-shrink-0">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-2 text-center">
                      <FiFile size={20} className="mx-auto text-gray-400" />
                      <p className="text-xs mt-1 truncate w-14">{file.name.split('.')[0]}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setPendingFiles(pendingFiles.filter((_, i) => i !== index))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                  <FiX size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(inputMessage, pendingFiles);
              }
            }}
            placeholder="Type your message..."
            className="w-full bg-gray-100 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden transition-all"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          
          <div className="absolute right-3 bottom-3 flex items-center space-x-1">
            {inputMessage && (
              <button
                onClick={() => setInputMessage('')}
                className="p-1 text-gray-500 hover:text-gray-700 rounded-full"
              >
                <FiX size={18} />
              </button>
            )}
            
            <button
              onClick={() => isStreaming ? setIsStreaming(false) : handleSendMessage(inputMessage, pendingFiles)}
              disabled={!inputMessage.trim() && pendingFiles.length === 0}
              className={`p-1.5 rounded-full transition-colors ${
                isStreaming 
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                  : (inputMessage.trim() || pendingFiles.length > 0 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'text-gray-400')
              }`}
            >
              {isStreaming ? <FiPause size={18} /> : <FiSend size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex space-x-1">
            <button
              onClick={() => setShowFileOptions(!showFileOptions)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full"
            >
              <FiPlus size={18} />
            </button>
            
            <button
              onClick={() => setShowMemoryPanel(!showMemoryPanel)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full relative"
            >
              <FiClock size={18} />
              {memories.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {memories.length > 9 ? '9+' : memories.length}
                </span>
              )}
            </button>
          </div>
          
          <button
            onClick={startNewConversation}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            New Chat
          </button>
        </div>

        {showFileOptions && (
          <div className="flex space-x-2 mt-2">
            <label className="p-2 text-gray-500 hover:text-gray-700 rounded-full cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              <FiImage size={18} />
            </label>
            <label className="p-2 text-gray-500 hover:text-gray-700 rounded-full cursor-pointer">
              <input type="file" className="hidden" onChange={handleFileUpload} />
              <FiFile size={18} />
            </label>
          </div>
        )}

        {showMemoryPanel && (
          <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Memories</h4>
              <div className="flex space-x-2">
                <button 
                  onClick={saveToMemory}
                  disabled={messages.length === 0}
                  className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded disabled:opacity-50"
                >
                  Save Current
                </button>
                <button 
                  onClick={() => setShowMemoryPanel(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>
            
            {memories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">No memories yet</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {memories.map((memory) => (
                  <div key={memory.id} className="group">
                    <div className="flex justify-between items-start">
                      <p className="text-sm break-words pr-2">{memory.summary}</p>
                      <button
                        onClick={() => deleteMemory(memory.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 text-xs"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">{memory.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
      file: PropTypes.object,
    })
  ),
};

export default ChatBot;