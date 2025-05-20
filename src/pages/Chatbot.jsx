import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  FiCopy, FiSend, FiPlus, FiX, FiImage, FiFile, FiTrash2, 
  FiClock, FiCpu, FiSettings, FiZap, FiStopCircle, FiMessageSquare,
  FiSun, FiMoon, FiSearch, FiDatabase, FiAward, FiChevronDown, FiGlobe,
  FiExternalLink, FiCheck
} from 'react-icons/fi';
import { RiSendPlaneFill } from 'react-icons/ri';

// Initialize Google's Gemini AI
const genAI = new GoogleGenerativeAI("AIzaSyDSTgkkROL7mjaGKoD2vnc8l2UptNCbvHk");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const ChatBot = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showTemplateButtons, setShowTemplateButtons] = useState(true);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [memories, setMemories] = useState([]);
  const [isProMode, setIsProMode] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [processingSources, setProcessingSources] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messageCountRef = useRef(0);
  const controls = useAnimation();

  // Create message object with animation properties
  const createMessageObject = (text, isBot, duration = 0, file = null, sources = []) => ({
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    text: DOMPurify.sanitize(text),
    isBot,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    duration,
    file,
    sources,
    isCode: text.includes('```'),
    animation: {
      opacity: 0,
      y: isBot ? 20 : -20,
      scale: 0.95
    }
  });

  // Enhanced scroll behavior
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
      setShowScrollButton(!isNearBottom);
    };

    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth auto-scroll when new messages arrive
  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      smoothScrollToBottom();
    }
  }, [messages, autoScroll]);

  const smoothScrollToBottom = useCallback((behavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior, 
        block: 'nearest' 
      });
    }, 50);
  }, []);

  // Create new chat room with animation
  const createNewChatRoom = () => {
    const newRoom = {
      id: Date.now().toString(),
      name: `Chat ${new Date().toLocaleTimeString()}`,
      messages: [],
      history: [],
      createdAt: new Date().toISOString(),
      tags: []
    };
    
    setChatRooms(prev => [newRoom, ...prev]);
    setCurrentRoomId(newRoom.id);
    setMessages([]);
    setChatHistory([]);
    setPendingFiles([]);
    setInputMessage('');
    setShowTemplateButtons(true);
    messageCountRef.current = 0;
    setSearchMode(false);
    setSearchResults([]);
  };

  // Enhanced message typing animation
  const typeMessage = async (fullText, callback) => {
    if (isProMode) {
      callback(fullText);
      return;
    }
    
    const characters = fullText.split('');
    let displayedText = '';
    
    for (let i = 0; i < characters.length; i++) {
      if (abortController?.signal.aborted) break;
      
      const chunkSize = Math.min(3 + Math.floor(Math.random() * 4), characters.length - i);
      const chunk = characters.slice(i, i + chunkSize).join('');
      displayedText += chunk;
      
      callback(displayedText);
      i += chunkSize - 1;
      
      if (autoScroll) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          });
        }, 0);
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 15));
    }
    
    callback(fullText);
  };

  // Enhanced send message with animations
  const handleSendMessage = async (messageText, files = []) => {
    const trimmedMessage = messageText.trim();
    if ((!trimmedMessage && files.length === 0) || isBotTyping) return;

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Add user message with animation
      if (trimmedMessage) {
        const newMessage = createMessageObject(trimmedMessage, false);
        setMessages(prev => [...prev, newMessage]);
      }

      // Handle file uploads with animations
      if (files.length > 0) {
        setFileProcessing(true);
        for (const file of files) {
          const fileMessage = createMessageObject(`File: ${file.name}`, false, 0, file);
          setMessages(prev => [...prev, fileMessage]);
          
          const fileContent = await extractTextFromFile(file);
          const contentMessage = createMessageObject(`Extracted content from ${file.name}:\n${fileContent}`, false);
          setMessages(prev => [...prev, contentMessage]);
        }
        setFileProcessing(false);
      }

      setInputMessage('');
      setPendingFiles([]);
      setIsBotTyping(true);
      setShowTemplateButtons(false);
      messageCountRef.current += 1;
      setProcessingSources([]);

      // Create bot response placeholder with animation
      const messageId = Date.now().toString();
      currentMessageId.current = messageId;
      
      setMessages(prev => [...prev, {
        id: messageId,
        text: isProMode ? 'Processing with Pro Mode...' : '',
        isBot: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: 0,
        file: null,
        sources: [],
        animation: {
          opacity: 0,
          y: 20,
          scale: 0.95
        }
      }]);

      // Generate response from Gemini AI
      const result = await model.generateContent(trimmedMessage);
      const response = await result.response.text();
      
      const processedResponse = processSpecialChars(response);
      
      // Update message with final response
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              text: processedResponse,
              isCode: processedResponse.includes('```')
            } 
          : msg
      ));

      // Type out the message with animation
      if (!isProMode) {
        await typeMessage(processedResponse, (typedText) => {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, text: typedText } : msg
          ));
        });
      }

    } catch (error) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Response stopped by user'
        : 'Sorry, something went wrong!';
      
      setMessages(prev => [...prev, createMessageObject(errorMessage, true)]);
    } finally {
      setIsBotTyping(false);
      setFileProcessing(false);
      setProcessingSources([]);
      setAbortController(null);
      currentMessageId.current = null;
    }
  };

  // Enhanced UI components with animations
  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} relative overflow-hidden transition-colors duration-300`}>
      {/* Animated Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-3 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b`}
      >
        <div className="flex items-center space-x-2">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowChatHistory(!showChatHistory)}
            className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
          >
            <FiMessageSquare size={16} className={darkMode ? "text-gray-300" : "text-gray-600"} />
          </motion.button>
          <motion.div 
            whileHover={{ rotate: 5 }}
            className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow"
          >
            <span className="text-white text-xs font-bold">AI</span>
          </motion.div>
          <div>
            <motion.h2 
              whileHover={{ x: 2 }}
              className="font-semibold text-sm"
            >
              Orion AI
            </motion.h2>
            <p className="text-xs flex items-center">
              {isBotTyping ? (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center"
                >
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="ml-1">Thinking...</span>
                </motion.span>
              ) : (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center"
                >
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                  Online {isProMode && <span className="ml-1 text-blue-400">(Pro Mode)</span>}
                </motion.span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleDarkMode}
            className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
          >
            {darkMode ? <FiSun size={16} className="text-yellow-300" /> : <FiMoon size={16} />}
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsProMode(!isProMode)}
            className={`p-1.5 rounded-full ${isProMode ? 'bg-blue-100 text-blue-600' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <FiZap size={16} className={isProMode ? "text-yellow-500" : ""} />
          </motion.button>
          <motion.button
            animate={controls}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMemoryPanel(!showMemoryPanel)}
            className={`p-1.5 rounded-full ${showMemoryPanel ? `${darkMode ? 'bg-gray-700' : 'bg-gray-200'} ${darkMode ? 'text-gray-100' : 'text-gray-900'}` : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <FiCpu size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={createNewChatRoom}
            className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
          >
            <FiPlus size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* Chat Area with Enhanced Animations */}
      <div 
        ref={chatContainerRef}
        className={`flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin ${darkMode ? 'scrollbar-thumb-gray-700' : 'scrollbar-thumb-gray-300'} ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full pb-16"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
            >
              <span className="text-2xl text-white">AI</span>
            </motion.div>
            <motion.h3 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-xl font-semibold text-center mb-1"
            >
              Hello, I'm Orion 😊!
            </motion.h3>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-center mb-6 max-w-md text-sm"
            >
              Your AI assistant powered by Gemini. Ask me anything!
            </motion.p>
            
            {showTemplateButtons && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-3 w-full max-w-md"
              >
                {[
                  "Hello Orion! How are you today?",
                  "Explain how machine learning works",
                  "Help me debug this code...",
                  "What's the weather like today?"
                ].map((template, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSendMessage(template)}
                    className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:bg-gray-100 border-gray-200'} rounded-xl p-3 text-sm border transition-all hover:shadow-sm text-left`}
                    transition={{ delay: index * 0.1 }}
                  >
                    {template}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={message.animation}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: { 
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`max-w-[90%] md:max-w-[80%] ${message.isBot ? 
                  `${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}` : 
                  'bg-gradient-to-br from-blue-600 to-blue-500 text-white'} rounded-2xl p-3 shadow-xs`}
              >
                {message.isBot && (
                  <div className="flex items-center mb-1">
                    <motion.div 
                      whileHover={{ rotate: 5 }}
                      className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shadow"
                    >
                      <span className="text-2xs text-white">AI</span>
                    </motion.div>
                    <span className="text-xs font-medium">Orion</span>
                  </div>
                )}
                
                <div 
                  className={`text-sm ${message.isBot ? darkMode ? 'text-gray-100' : 'text-gray-800' : 'text-white'}`}
                  dangerouslySetInnerHTML={{ __html: message.text }} 
                />
                
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${message.isBot ? darkMode ? 'text-gray-400' : 'text-gray-500' : 'text-blue-100'}`}>
                    {message.time}
                    {message.isBot && message.duration > 0 && (
                      <span> • {(message.duration / 1000).toFixed(1)}s</span>
                    )}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    {message.isBot && (
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copyToClipboard(message.text.replace(/<[^>]*>?/gm, ''), message.id)}
                        className="text-xs opacity-60 hover:opacity-100 transition-opacity"
                      >
                        {copiedMessageId === message.id ? (
                          <FiCheck size={14} className="text-green-500" />
                        ) : (
                          <FiCopy size={14} />
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} pt-2 pb-3 px-4 border-t`}
      >
        {/* File Preview with Animations */}
        <AnimatePresence>
          {pendingFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center space-x-2 p-2 ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-100'} overflow-x-auto scrollbar-thin rounded-t-lg`}
            >
              {pendingFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05, type: "spring" }}
                  className="relative flex-shrink-0"
                >
                  <div className={`w-14 h-14 flex items-center justify-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden shadow-md`}>
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="p-1 text-center">
                        <FiFile size={16} className="mx-auto" />
                        <p className="text-xs mt-0.5 truncate w-12">{file.name.split('.')[0]}</p>
                      </div>
                    )}
                  </div>
                  <motion.button
                    onClick={() => {
                      const newFiles = [...pendingFiles];
                      newFiles.splice(index, 1);
                      setPendingFiles(newFiles);
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-all shadow"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiX size={10} />
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Input with Animations */}
        <div className="relative mt-1">
          <motion.textarea
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
            className={`w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'} rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden transition-all duration-300 text-sm`}
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />

          <div className="absolute right-2 bottom-2 flex items-center space-x-1">
            {inputMessage && (
              <motion.button
                onClick={() => setInputMessage('')}
                className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-all`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX size={16} />
              </motion.button>
            )}

            <motion.button
              onClick={() => setPendingFiles([])}
              className={`p-1.5 rounded-full transition-all ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiPlus size={16} />
            </motion.button>

            {isBotTyping ? (
              <motion.button
                onClick={() => abortController?.abort()}
                className="p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiStopCircle size={16} />
              </motion.button>
            ) : (
              <motion.button
                onClick={() => handleSendMessage(inputMessage, pendingFiles)}
                disabled={!inputMessage.trim() && pendingFiles.length === 0}
                className={`p-2 rounded-full transition-all duration-300 ${
                  inputMessage.trim() || pendingFiles.length > 0
                    ? 'bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
                }`}
                whileHover={{
                  scale: (inputMessage.trim() || pendingFiles.length > 0) ? 1.15 : 1,
                  rotate: (inputMessage.trim() || pendingFiles.length > 0) ? 6 : 0
                }}
                whileTap={{ scale: 0.9 }}
              >
                <RiSendPlaneFill size={18} />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Enhanced Styling */}
      <style jsx global>{`
        .typing-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: currentColor;
          margin-right: 2px;
          animation: typingAnimation 1.4s infinite ease-in-out;
        }

        .typing-dot:nth-child(1) {
          animation-delay: 0s;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
          margin-right: 0;
        }

        @keyframes typingAnimation {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-3px); }
        }

        .code-container {
          background: ${darkMode ? '#1e293b' : '#f8fafc'};
          border-radius: 12px;
          margin: 1em 0;
          overflow: hidden;
          border: 1px solid ${darkMode ? '#334155' : '#e2e8f0'};
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }

        .code-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75em 1em;
          background: ${darkMode ? '#1e293b' : '#f1f5f9'};
          color: ${darkMode ? '#94a3b8' : '#475569'};
          font-size: 0.85em;
          border-bottom: 1px solid ${darkMode ? '#334155' : '#e2e8f0'};
        }

        .copy-button {
          background: transparent;
          border: 1px solid ${darkMode ? '#475569' : '#cbd5e1'};
          color: ${darkMode ? '#e2e8f0' : '#334155'};
          cursor: pointer;
          padding: 0.4em 0.8em;
          border-radius: 8px;
          font-size: 0.8em;
          display: flex;
          align-items: center;
          gap: 0.4em;
          transition: all 0.2s ease;
        }

        .copy-button:hover {
          background: ${darkMode ? '#334155' : '#e2e8f0'};
          border-color: ${darkMode ? '#64748b' : '#94a3b8'};
          transform: translateY(-1px);
        }

        .code-block {
          margin: 0;
          padding: 1em;
          color: ${darkMode ? '#f1f5f9' : '#1e293b'};
          overflow-x: auto;
          font-family: 'Fira Code', monospace;
          font-size: 0.9em;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

export default ChatBot;
