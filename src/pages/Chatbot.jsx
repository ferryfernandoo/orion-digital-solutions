import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FiCopy, FiSend, FiPlus, FiX, FiImage, FiFile, FiTrash2, FiClock, FiCpu, FiSettings } from 'react-icons/fi';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showTemplateButtons, setShowTemplateButtons] = useState(true);
  const [typingSpeed, setTypingSpeed] = useState(50); // ms per character
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [memories, setMemories] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize Google Generative AI
  const genAI = new GoogleGenerativeAI("AIzaSyDSTgkkROL7mjaGKoD2vnc8l2UptNCbvHk");
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Load memories and chat history from localStorage on component mount
  useEffect(() => {
    const savedMemories = localStorage.getItem('orionMemories');
    const savedChatHistory = localStorage.getItem('orionChatHistory');
    
    if (savedMemories) {
      setMemories(JSON.parse(savedMemories));
    }
    
    if (savedChatHistory) {
      setChatHistory(JSON.parse(savedChatHistory));
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createMessageObject = (text, isBot, duration = 0, file = null) => ({
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    text: DOMPurify.sanitize(text),
    isBot,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    duration,
    file,
  });

  const summarizeConversation = async (conversation) => {
    try {
      const prompt = `Buat ringkasan sangat singkat sepadat padatnya (maks 1 kalimat) dari percakapan ini dalam bahasa yang sama dengan percakapan. Fokus pada fakta kunci, keputusan, dan detail penting. HILANGKAN semua salam dan basa-basi.\n\nPercakapan:\n${conversation}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      
      return response.replace(/[{}]/g, '')
        .replace(/json/gi, '')
        .replace(/```/g, '')
        .trim() || "Ringkasan tidak tersedia";
    } catch (error) {
      console.error("Error summarizing conversation:", error);
      return "Tidak bisa membuat ringkasan";
    }
  };

  const saveToMemory = async () => {
    if (messages.length === 0) return;
    
    try {
      setIsBotTyping(true);
      
      const conversationText = messages.map(msg => 
        `${msg.isBot ? 'Orion' : 'User'}: ${msg.text}`
      ).join('\n');
      
      const summary = await summarizeConversation(conversationText);
      
      if (summary && !summary.includes("tidak bisa")) {
        const newMemory = {
          id: Date.now().toString(),
          summary: summary,
          date: new Date().toLocaleString(),
          messages: [...messages]
        };
        
        const updatedMemories = [newMemory, ...memories];
        setMemories(updatedMemories);
        localStorage.setItem('orionMemories', JSON.stringify(updatedMemories));
      }
    } catch (error) {
      console.error("Error saving to memory:", error);
    } finally {
      setIsBotTyping(false);
    }
  };

  const getFullMemoryContext = () => {
    if (memories.length === 0) return '';
    
    // Combine all memories into context
    const memoryContext = memories.map(memory => 
      `Memory [${memory.date}]: ${memory.summary}\nDetails: ${
        memory.messages.map(msg => 
          `${msg.isBot ? 'Orion' : 'User'}: ${msg.text.replace(/<[^>]*>?/gm, '')}`
        ).join('\n')
      }`
    ).join('\n\n');
    
    return `Konteks Memori Jangka Panjang:\n${memoryContext}\n\n`;
  };

  const typeMessage = async (fullText, callback) => {
    let displayedText = '';
    for (let i = 0; i < fullText.length; i++) {
      displayedText += fullText[i];
      callback(displayedText);
      await new Promise(resolve => setTimeout(resolve, typingSpeed));
    }
  };

  const handleSendMessage = async (messageText, files = []) => {
    const trimmedMessage = messageText.trim();
    if ((!trimmedMessage && files.length === 0) || isBotTyping) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      // Add user message to chat history
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

      setInputMessage('');
      setPendingFiles([]);
      setIsBotTyping(true);
      setShowTemplateButtons(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      const startTime = Date.now();

      // Get full memory context
      const memoryContext = getFullMemoryContext();
      
      // Combine chat history into prompt
      const contextMessages = updatedHistory.slice(-15).map(msg => {
        return msg.role === 'user' ? `User: ${msg.content}` : `Orion: ${msg.content}`;
      }).join('\n');

      const fullPrompt = `${memoryContext}Percakapan Saat Ini:\n${contextMessages}\n\nUser: "${trimmedMessage}". 
      Respond as Orion in natural language, incorporating all relevant context. Be concise but helpful. 
      For coding, provide complete solutions with proper formatting. Always maintain context from our full history.`;

      // Generate response using Google Generative AI
      const result = await model.generateContent(fullPrompt);
      const botResponse = result.response.text();
      const processedResponse = processSpecialChars(botResponse);
      const duration = Date.now() - startTime;

      // Type out the message with animation
      const messageId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: messageId,
        text: '',
        isBot: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration,
        file: null
      }]);

      await typeMessage(processedResponse, (typedText) => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, text: typedText } : msg
        ));
      });

      // Add bot response to chat history
      const botMessage = { role: 'assistant', content: botResponse };
      const newChatHistory = [...updatedHistory, botMessage];
      setChatHistory(newChatHistory);
      localStorage.setItem('orionChatHistory', JSON.stringify(newChatHistory));

    } catch (error) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Request timeout after 30s. Try again.'
        : 'Waduh, ada yang salah nih sama Orion! Gak konek ke servernya...';
      
      setMessages(prev => [...prev, createMessageObject(errorMessage, true)]);
    } finally {
      setIsBotTyping(false);
      clearTimeout(timeoutId);
    }
  };

  const handleTemplateButtonClick = (templateMessage) => {
    handleSendMessage(templateMessage);
  };

  const processSpecialChars = (text) => {
    // Process code blocks first
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const withCodeBlocks = text.replace(codeBlockRegex, (match, language, code) => {
      const cleanCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<div class="code-container">
        <div class="code-toolbar">
          <span class="language-tag">${language || 'code'}</span>
          <button class="copy-button" onclick="this.nextElementSibling.dispatchEvent(new ClipboardEvent('copy'))">
            <FiCopy /> Copy
          </button>
        </div>
        <pre class="code-block" contenteditable="true" spellcheck="false"><code>${cleanCode}</code></pre>
      </div>`;
    });

    // Process other markdown
    return withCodeBlocks
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<s>$1</s>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br />');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.textContent = 'Copied!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
      })
      .catch(err => console.error('Failed to copy:', err));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setPendingFiles(files);
      setShowFileOptions(false);
    }
  };

  const startNewConversation = async () => {
    if (messages.length > 0) {
      await saveToMemory();
    }
    setMessages([]);
    setChatHistory([]);
    setPendingFiles([]);
    setInputMessage('');
    setShowTemplateButtons(true);
    localStorage.removeItem('orionChatHistory');
  };

  const deleteMemory = (id) => {
    const updatedMemories = memories.filter(memory => memory.id !== id);
    setMemories(updatedMemories);
    localStorage.setItem('orionMemories', JSON.stringify(updatedMemories));
  };

  return (
    <div className={`flex flex-col h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white relative z-10 ${isExpanded ? 'w-full' : 'w-full max-w-4xl mx-auto rounded-xl shadow-2xl overflow-hidden'}`}>
      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-lg">✨</span>
          </div>
          <div>
            <h2 className="font-bold text-lg">Orion AI</h2>
            <p className="text-xs opacity-75 flex items-center">
              {isBotTyping ? (
                <span className="flex items-center">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="ml-1">Thinking...</span>
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Online
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            title="Settings"
          >
            <FiSettings size={18} />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {isExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute right-4 top-16 bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-xl z-20 border border-gray-700 w-64">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-medium flex items-center">
              <FiSettings className="mr-2" /> Settings
            </h3>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Typing Speed</label>
              <div className="flex items-center space-x-2">
                <span className="text-xs">Slow</span>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={100 - typingSpeed}
                  onChange={(e) => setTypingSpeed(100 - parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs">Fast</span>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition-colors text-sm"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full pb-16">
            <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-4xl">✨</span>
            </div>
            <h3 className="text-3xl font-bold text-center mb-2">
              Hey, I'm Orion!
            </h3>
            <p className="text-gray-400 text-center mb-8 max-w-md">
              Your AI assistant with full memory context. I remember all our past conversations to provide better help.
            </p>
            
            {showTemplateButtons && (
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                <button
                  onClick={() => handleTemplateButtonClick("Hello Orion! How are you today?")}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-3 text-sm transition-colors text-left"
                >
                  <span className="font-medium">Say hello</span>
                  <p className="text-gray-400 text-xs mt-1">Start a conversation</p>
                </button>
                <button
                  onClick={() => handleTemplateButtonClick("Brainstorm some creative ideas for my project about...")}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-3 text-sm transition-colors text-left"
                >
                  <span className="font-medium">Brainstorm ideas</span>
                  <p className="text-gray-400 text-xs mt-1">Get creative suggestions</p>
                </button>
                <button
                  onClick={() => handleTemplateButtonClick("Explain how machine learning works in simple terms")}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-3 text-sm transition-colors text-left"
                >
                  <span className="font-medium">Explain something</span>
                  <p className="text-gray-400 text-xs mt-1">Get clear explanations</p>
                </button>
                <button
                  onClick={() => handleTemplateButtonClick("Help me debug this code...")}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-3 text-sm transition-colors text-left"
                >
                  <span className="font-medium">Code help</span>
                  <p className="text-gray-400 text-xs mt-1">Debug or explain code</p>
                </button>
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 ${message.isBot ? 
                'bg-gray-800/40 backdrop-blur-sm border border-gray-700' : 
                'bg-gradient-to-br from-blue-600 to-blue-700 shadow-md'}`}
              >
                {message.isBot && (
                  <div className="flex items-center mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-2">
                      <span className="text-xs">✨</span>
                    </div>
                    <span className="text-xs font-medium text-gray-300">Orion</span>
                  </div>
                )}
                
                {message.file ? (
                  <div>
                    <p className="text-sm mb-2">File: {message.file.name}</p>
                    {message.file.type.startsWith('image/') && (
                      <img 
                        src={URL.createObjectURL(message.file)} 
                        alt="Uploaded" 
                        className="mt-2 max-w-full h-auto rounded-lg border border-gray-700" 
                      />
                    )}
                  </div>
                ) : (
                  <div 
                    className={`prose prose-invert max-w-none ${message.isBot ? 'text-gray-100' : 'text-white'}`}
                    dangerouslySetInnerHTML={{ __html: message.text }} 
                  />
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-60">
                    {message.time}
                    {message.isBot && message.duration > 0 && (
                      <span> • {(message.duration / 1000).toFixed(1)}s</span>
                    )}
                  </span>
                  
                  {message.isBot && (
                    <button
                      onClick={() => copyToClipboard(message.text.replace(/<[^>]*>?/gm, ''))}
                      className="text-xs opacity-60 hover:opacity-100 transition-opacity ml-2"
                      title="Copy to clipboard"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-start"
          >
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <motion.span
                    className="typing-dot"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                  <motion.span
                    className="typing-dot"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                  />
                  <motion.span
                    className="typing-dot"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
                  />
                </div>
                <span className="text-sm text-gray-300">Thinking deeply...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Container */}
      <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-lg">
        {/* File Preview */}
        {pendingFiles.length > 0 && (
          <div className="flex items-center space-x-2 p-3 border-b border-gray-800 overflow-x-auto scrollbar-thin">
            {pendingFiles.map((file, index) => (
              <div key={index} className="relative flex-shrink-0">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-2 text-center">
                      <FiFile size={20} className="mx-auto text-gray-400" />
                      <p className="text-xs mt-1 truncate w-14">{file.name.split('.')[0]}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    const newFiles = [...pendingFiles];
                    newFiles.splice(index, 1);
                    setPendingFiles(newFiles);
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                >
                  <FiX size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Main Input Area */}
        <div className="p-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputMessage, pendingFiles);
                }
              }}
              placeholder="Message Orion..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white resize-none overflow-hidden transition-all duration-200 hover:border-gray-600"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '150px' }}
            />
            
            <div className="absolute right-3 bottom-3 flex items-center space-x-1">
              {inputMessage && (
                <button
                  onClick={() => setInputMessage('')}
                  className="p-1 text-gray-400 hover:text-white rounded-full transition-colors"
                >
                  <FiX size={18} />
                </button>
              )}
              
              <button
                onClick={() => handleSendMessage(inputMessage, pendingFiles)}
                disabled={(!inputMessage.trim() && pendingFiles.length === 0) || isBotTyping}
                className={`p-1.5 rounded-full transition-all ${inputMessage.trim() || pendingFiles.length > 0 ? 
                  'bg-blue-500 hover:bg-blue-600 text-white' : 
                  'text-gray-500 hover:text-gray-300'}`}
              >
                <FiSend size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Input Footer */}
        <div className="flex items-center justify-between p-2 bg-gray-800/50 border-t border-gray-800">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowFileOptions(!showFileOptions)}
              className="p-2 text-gray-400 hover:text-white rounded-full transition-colors"
            >
              <FiPlus size={18} />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowMemoryPanel(!showMemoryPanel)}
                className="p-2 text-gray-400 hover:text-white rounded-full transition-colors flex items-center"
              >
                <FiClock size={18} />
                {memories.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {memories.length > 99 ? '99+' : memories.length}
                  </span>
                )}
              </button>
              
              {showMemoryPanel && (
                <div className="absolute bottom-full mb-2 left-0 w-72 bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-xl z-20 border border-gray-700 overflow-hidden">
                  <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                    <h4 className="font-medium flex items-center">
                      <FiCpu className="mr-2" /> Memory Context
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={saveToMemory}
                        disabled={messages.length === 0}
                        className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        Remember
                      </button>
                      <button 
                        onClick={() => setShowMemoryPanel(false)}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto scrollbar-thin">
                    {memories.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-400">
                        No memories yet. Important context will appear here.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-700">
                        {memories.map((memory) => (
                          <div key={memory.id} className="p-3 hover:bg-gray-700/50 transition-colors group">
                            <div className="flex justify-between items-start">
                              <p className="text-sm break-words pr-2">{memory.summary}</p>
                              <button
                                onClick={() => deleteMemory(memory.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 text-xs transition-opacity"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{memory.date}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={startNewConversation}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors flex items-center"
            >
              <span>New Chat</span>
            </button>
          </div>
        </div>
        
        {/* File Options */}
        {showFileOptions && (
          <div className="flex space-x-2 p-2 border-t border-gray-800 bg-gray-800/50">
            <label className="cursor-pointer p-2 text-gray-400 hover:text-white rounded-full transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <FiImage size={18} />
            </label>
            <label className="cursor-pointer p-2 text-gray-400 hover:text-white rounded-full transition-colors">
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <FiFile size={18} />
            </label>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        .typing-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background-color: #9CA3AF;
          border-radius: 50%;
        }
        .code-container {
          background: #1E1E1E;
          border-radius: 8px;
          margin: 1em 0;
          overflow: hidden;
          border: 1px solid #333;
        }
        .code-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5em 1em;
          background: #252526;
          color: #9CDCFE;
          font-size: 0.8em;
        }
        .language-tag {
          background: #333;
          padding: 0.2em 0.5em;
          border-radius: 4px;
          font-size: 0.8em;
        }
        .copy-button {
          background: transparent;
          border: 1px solid #555;
          color: #D4D4D4;
          cursor: pointer;
          padding: 0.2em 0.5em;
          border-radius: 4px;
          font-size: 0.8em;
          display: flex;
          align-items: center;
          gap: 0.3em;
        }
        .copy-button:hover {
          background: #333;
        }
        .code-block {
          margin: 0;
          padding: 1em;
          overflow-x: auto;
          font-family: 'Fira Code', 'Courier New', monospace;
          font-size: 0.9em;
          line-height: 1.5;
          color: #D4D4D4;
          background: #1E1E1E;
        }
        .code-block code {
          font-family: inherit;
        }
        .copy-notification {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          z-index: 1000;
          animation: fadeInOut 2s ease-in-out;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        .prose {
          max-width: 100%;
        }
        .prose code:not(.code-block code) {
          background: rgba(110, 118, 129, 0.4);
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .prose pre {
          margin: 0;
        }
        .prose ul, .prose ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .prose li {
          margin: 0.25em 0;
        }
      `}</style>
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
