import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FiCopy, FiSend, FiPlus, FiX, FiImage, FiFile, FiTrash2, FiClock, FiCpu, FiSettings, FiZap, FiStopCircle } from 'react-icons/fi';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showTemplateButtons, setShowTemplateButtons] = useState(true);
  const [typingSpeed] = useState(30); // Faster typing speed
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [memories, setMemories] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isProMode, setIsProMode] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize Google Generative AI
  const genAI = new GoogleGenerativeAI("AIzaSyDSTgkkROL7mjaGKoD2vnc8l2UptNCbvHk");
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Load memories and chat history from localStorage
  useEffect(() => {
    const savedMemories = localStorage.getItem('orionMemories');
    const savedChatHistory = localStorage.getItem('orionChatHistory');
    const savedProMode = localStorage.getItem('orionProMode');
    
    if (savedMemories) setMemories(JSON.parse(savedMemories));
    if (savedChatHistory) setChatHistory(JSON.parse(savedChatHistory));
    if (savedProMode) setIsProMode(savedProMode === 'true');
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
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
      return response.replace(/[{}]/g, '').replace(/json/gi, '').replace(/```/g, '').trim() || "Ringkasan tidak tersedia";
    } catch (error) {
      console.error("Error summarizing conversation:", error);
      return "Tidak bisa membuat ringkasan";
    }
  };

  const findRelevantMemories = async (query) => {
    if (memories.length === 0) return '';
    
    try {
      const memoryTexts = memories.map(m => `[Memory ${m.date}]: ${m.summary}`).join('\n');
      const prompt = `Daftar memori:\n${memoryTexts}\n\nPertanyaan: "${query}"\n\nIdentifikasi hanya memori yang paling relevan dengan pertanyaan (maks 3). Berikan hanya ID memori yang dipisahkan koma, atau kosong jika tidak ada yang relevan.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      const relevantIds = response.trim().split(',').map(id => id.trim()).filter(Boolean);
      
      return memories.filter(m => relevantIds.includes(m.id))
        .map(m => `[Memory ${m.date}]: ${m.summary}\nDetail: ${m.messages.map(msg => `${msg.isBot ? 'Orion' : 'User'}: ${msg.text.replace(/<[^>]*>?/gm, '')}`).join('\n\n');
    } catch (error) {
      console.error("Error finding relevant memories:", error);
      return '';
    }
  };

  const saveToMemory = async () => {
    if (messages.length === 0) return;
    
    try {
      setIsBotTyping(true);
      const conversationText = messages.map(msg => `${msg.isBot ? 'Orion' : 'User'}: ${msg.text}`).join('\n');
      const summary = await summarizeConversation(conversationText);
      
      if (summary && !summary.includes("tidak bisa")) {
        const newMemory = {
          id: Date.now().toString(),
          summary,
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

  const typeMessage = async (fullText, callback) => {
    if (isProMode) {
      callback(fullText);
      return;
    }
    
    let displayedText = '';
    const chunkSize = 5; // Smaller chunks for smoother typing
    
    for (let i = 0; i < fullText.length; i += chunkSize) {
      if (abortController?.signal.aborted) break;
      const chunk = fullText.substr(i, chunkSize);
      displayedText += chunk;
      callback(displayedText);
      await new Promise(resolve => setTimeout(resolve, typingSpeed));
    }
  };

  const generateWithProMode = async (prompt) => {
    const generationPromises = [];
    
    for (let i = 0; i < 4; i++) {
      generationPromises.push(
        model.generateContent(prompt)
          .then(result => result.response.text())
          .catch(() => '')
      );
    }
    
    const responses = await Promise.all(generationPromises);
    return responses.reduce((longest, current) => 
      current.length > longest.length ? current : longest, "");
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsBotTyping(false);
  };

  const handleSendMessage = async (messageText, files = []) => {
    const trimmedMessage = messageText.trim();
    if ((!trimmedMessage && files.length === 0) || isBotTyping) return;

    const controller = new AbortController();
    setAbortController(controller);
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

      // Find relevant memories using AI
      const relevantMemories = await findRelevantMemories(trimmedMessage);
      
      // Combine chat history into prompt
      const contextMessages = updatedHistory.slice(-15).map(msg => {
        return msg.role === 'user' ? `User: ${msg.content}` : `Orion: ${msg.content}`;
      }).join('\n');

      const fullPrompt = `${
        relevantMemories ? `Konteks Memori Relevan:\n${relevantMemories}\n\n` : ''
      }Percakapan Saat Ini:\n${contextMessages}\n\nUser: "${trimmedMessage}". 
      Respond as Orion in natural language. Don't mention memories explicitly, just incorporate relevant context naturally. Be ${
        isProMode ? 'extremely detailed and comprehensive (4x processing)' : 'concise but helpful'
      }. For coding, provide complete solutions with proper formatting. Always maintain context.${
        isProMode ? ' Provide a super detailed response with examples, explanations, and multiple perspectives.' : ''
      }`;

      let botResponse;
      if (isProMode) {
        botResponse = await generateWithProMode(fullPrompt);
      } else {
        const result = await model.generateContent(fullPrompt);
        botResponse = await result.response.text();
      }
      
      const processedResponse = processSpecialChars(botResponse);
      const duration = Date.now() - startTime;

      // Type out the message with animation (only in normal mode)
      const messageId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: messageId,
        text: isProMode ? processedResponse : '',
        isBot: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration,
        file: null
      }]);

      if (!isProMode) {
        await typeMessage(processedResponse, (typedText) => {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, text: typedText } : msg
          ));
        });
      }

      // Add bot response to chat history
      const botMessage = { role: 'assistant', content: botResponse };
      const newChatHistory = [...updatedHistory, botMessage];
      setChatHistory(newChatHistory);
      localStorage.setItem('orionChatHistory', JSON.stringify(newChatHistory));

    } catch (error) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Response stopped by user'
        : 'Waduh, ada yang salah nih sama Orion! Gak konek ke servernya...';
      
      setMessages(prev => [...prev, createMessageObject(errorMessage, true)]);
    } finally {
      setIsBotTyping(false);
      clearTimeout(timeoutId);
      setAbortController(null);
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

  const toggleProMode = () => {
    const newProMode = !isProMode;
    setIsProMode(newProMode);
    localStorage.setItem('orionProMode', newProMode.toString());
  };

  return (
    <div className={`flex flex-col h-screen bg-white text-gray-900 relative z-10 ${isExpanded ? 'w-full' : 'w-full max-w-6xl mx-auto rounded-none shadow-none'}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-lg text-white">✨</span>
          </div>
          <div>
            <h2 className="font-bold text-lg">Orion AI</h2>
            <p className="text-xs text-gray-500 flex items-center">
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
                  Online {isProMode && <span className="ml-1 text-yellow-600">(Pro Mode)</span>}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleProMode}
            className={`p-1.5 rounded-lg transition-colors ${isProMode ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'text-gray-500 hover:bg-gray-100'}`}
            title={isProMode ? 'Disable Pro Mode' : 'Enable Pro Mode'}
          >
            <FiZap size={18} />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            title="Settings"
          >
            <FiSettings size={18} />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
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
        <div className="absolute right-4 top-16 bg-white rounded-xl shadow-lg z-20 border border-gray-200 w-64">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium flex items-center text-gray-800">
              <FiSettings className="mr-2" /> Settings
            </h3>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">Pro Mode</span>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={isProMode}
                    onChange={toggleProMode}
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${isProMode ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isProMode ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {isProMode ? 'Enhanced AI with 4x processing' : 'Standard AI mode'}
              </p>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition-colors text-sm text-white"
            >
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full pb-16">
            <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-4xl text-white">✨</span>
            </div>
            <h3 className="text-3xl font-bold text-center mb-2 text-gray-800">
              Hey, I'm Orion!
            </h3>
            <p className="text-gray-500 text-center mb-8 max-w-md">
              Your AI assistant with intelligent memory. I automatically find and use relevant past conversations.
            </p>
            
            {showTemplateButtons && (
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                <button
                  onClick={() => handleTemplateButtonClick("Hello Orion! How are you today?")}
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm transition-colors text-left"
                >
                  <span className="font-medium text-gray-800">Say hello</span>
                  <p className="text-gray-500 text-xs mt-1">Start a conversation</p>
                </button>
                <button
                  onClick={() => handleTemplateButtonClick("Brainstorm some creative ideas for my project about...")}
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm transition-colors text-left"
                >
                  <span className="font-medium text-gray-800">Brainstorm ideas</span>
                  <p className="text-gray-500 text-xs mt-1">Get creative suggestions</p>
                </button>
                <button
                  onClick={() => handleTemplateButtonClick("Explain how machine learning works in simple terms")}
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm transition-colors text-left"
                >
                  <span className="font-medium text-gray-800">Explain something</span>
                  <p className="text-gray-500 text-xs mt-1">Get clear explanations</p>
                </button>
                <button
                  onClick={() => handleTemplateButtonClick("Help me debug this code...")}
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm transition-colors text-left"
                >
                  <span className="font-medium text-gray-800">Code help</span>
                  <p className="text-gray-500 text-xs mt-1">Debug or explain code</p>
                </button>
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
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[90%] md:max-w-[80%] ${message.isBot ? 
                'bg-white border border-gray-200' : 
                'bg-blue-600 text-white'} rounded-lg p-3`}
              >
                {message.isBot && (
                  <div className="flex items-center mb-1">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-2">
                      <span className="text-xs text-white">✨</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500">Orion</span>
                  </div>
                )}
                
                {message.file ? (
                  <div>
                    <p className={`text-sm mb-2 ${message.isBot ? 'text-gray-700' : 'text-white'}`}>File: {message.file.name}</p>
                    {message.file.type.startsWith('image/') && (
                      <img 
                        src={URL.createObjectURL(message.file)} 
                        alt="Uploaded" 
                        className="mt-2 max-w-full h-auto rounded-lg border border-gray-200" 
                      />
                    )}
                  </div>
                ) : (
                  <div 
                    className={`${message.isBot ? 'text-gray-700 text-sm' : 'text-white'} max-w-none`}
                    dangerouslySetInnerHTML={{ __html: message.text }} 
                  />
                )}
                
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${message.isBot ? 'text-gray-400' : 'text-blue-100'}`}>
                    {message.time}
                    {message.isBot && message.duration > 0 && (
                      <span> • {(message.duration / 1000).toFixed(1)}s</span>
                    )}
                  </span>
                  
                  {message.isBot && (
                    <button
                      onClick={() => copyToClipboard(message.text.replace(/<[^>]*>?/gm, ''))}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors ml-2"
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[80%]">
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
                <span className="text-sm text-gray-500">
                  {isProMode ? 'Processing deeply (4x)...' : 'Thinking...'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Container */}
      <div className="border-t border-gray-200 bg-white">
        {/* File Preview */}
        {pendingFiles.length > 0 && (
          <div className="flex items-center space-x-2 p-3 border-b border-gray-200 overflow-x-auto scrollbar-thin">
            {pendingFiles.map((file, index) => (
              <div key={index} className="relative flex-shrink-0">
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-2 text-center">
                      <FiFile size={20} className="mx-auto text-gray-500" />
                      <p className="text-xs mt-1 truncate w-14 text-gray-600">{file.name.split('.')[0]}</p>
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
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-800 resize-none overflow-hidden transition-all duration-200 hover:border-gray-300"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '150px' }}
            />
            
            <div className="absolute right-3 bottom-3 flex items-center space-x-1">
              {inputMessage && (
                <button
                  onClick={() => setInputMessage('')}
                  className="p-1 text-gray-500 hover:text-gray-700 rounded-full transition-colors"
                >
                  <FiX size={18} />
                </button>
              )}
              
              {isBotTyping ? (
                <button
                  onClick={stopGeneration}
                  className="p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                  title="Stop generation"
                >
                  <FiStopCircle size={18} />
                </button>
              ) : (
                <button
                  onClick={() => handleSendMessage(inputMessage, pendingFiles)}
                  disabled={(!inputMessage.trim() && pendingFiles.length === 0) || isBotTyping}
                  className={`p-1.5 rounded-full transition-all ${inputMessage.trim() || pendingFiles.length > 0 ? 
                    'bg-blue-600 hover:bg-blue-700 text-white' : 
                    'text-gray-400 hover:text-gray-500'}`}
                >
                  <FiSend size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Input Footer */}
        <div className="flex items-center justify-between p-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowFileOptions(!showFileOptions)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full transition-colors"
            >
              <FiPlus size={18} />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowMemoryPanel(!showMemoryPanel)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full transition-colors flex items-center"
              >
                <FiClock size={18} />
                {memories.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {memories.length > 99 ? '99+' : memories.length}
                  </span>
                )}
              </button>
              
              {showMemoryPanel && (
                <div className="absolute bottom-full mb-2 left-0 w-72 bg-white rounded-lg shadow-lg z-20 border border-gray-200 overflow-hidden">
                  <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="font-medium flex items-center text-gray-800">
                      <FiCpu className="mr-2" /> Memory Context
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={saveToMemory}
                        disabled={messages.length === 0}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors disabled:opacity-50 text-gray-700"
                      >
                        Remember
                      </button>
                      <button 
                        onClick={() => setShowMemoryPanel(false)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto scrollbar-thin">
                    {memories.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No memories yet. Important context will appear here.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {memories.map((memory) => (
                          <div key={memory.id} className="p-3 hover:bg-gray-50 transition-colors group">
                            <div className="flex justify-between items-start">
                              <p className="text-sm break-words pr-2 text-gray-700">{memory.summary}</p>
                              <button
                                onClick={() => deleteMemory(memory.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 text-xs transition-opacity"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{memory.date}</p>
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
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center text-gray-700"
            >
              <span>New Chat</span>
            </button>
          </div>
        </div>
        
        {/* File Options */}
        {showFileOptions && (
          <div className="flex space-x-2 p-2 border-t border-gray-200 bg-gray-50">
            <label className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 rounded-full transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <FiImage size={18} />
            </label>
            <label className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 rounded-full transition-colors">
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
          background: #f8f9fa;
          border-radius: 6px;
          margin: 0.5em 0;
          overflow: hidden;
          border: 1px solid #e9ecef;
        }
        .code-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.4em 0.8em;
          background: #e9ecef;
          color: #495057;
          font-size: 0.75em;
        }
        .language-tag {
          background: #dee2e6;
          padding: 0.15em 0.4em;
          border-radius: 3px;
          font-size: 0.75em;
          font-family: monospace;
        }
        .copy-button {
          background: transparent;
          border: 1px solid #adb5bd;
          color: #495057;
          cursor: pointer;
          padding: 0.15em 0.4em;
          border-radius: 3px;
          font-size: 0.75em;
          display: flex;
          align-items: center;
          gap: 0.3em;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .copy-button:hover {
          background: #dee2e6;
        }
        .code-block {
          margin: 0;
          padding: 0.8em;
          overflow-x: auto;
          font-family: 'Fira Code', 'Courier New', monospace;
          font-size: 0.8em;
          line-height: 1.5;
          color: #212529;
          background: #f8f9fa;
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
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .prose code:not(.code-block code) {
          background: #e9ecef;
          padding: 0.15em 0.3em;
          border-radius: 3px;
          font-size: 0.85em;
          font-family: 'Fira Code', monospace;
        }
        .prose strong {
          font-weight: 600;
          color: #212529;
        }
        .prose em {
          font-style: italic;
        }
        .prose u {
          text-decoration: underline;
        }
        .prose s {
          text-decoration: line-through;
        }
        .prose a {
          color: #1a73e8;
          text-decoration: none;
        }
        .prose a:hover {
          text-decoration: underline;
        }
        .prose pre {
          margin: 0;
        }
        .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        .prose ul, .prose ol {
          padding-left: 1.25em;
          margin: 0.5em 0;
        }
        .prose li {
          margin: 0.25em 0;
        }
        .prose blockquote {
          border-left: 2px solid #dee2e6;
          padding-left: 0.8em;
          margin: 0.8em 0;
          color: #495057;
        }
        .prose table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.8em 0;
          font-size: 0.85em;
        }
        .prose th, .prose td {
          border: 1px solid #dee2e6;
          padding: 0.4em 0.6em;
          text-align: left;
        }
        .prose th {
          background-color: #f1f3f5;
        }
        .prose hr {
          border: none;
          border-top: 1px solid #dee2e6;
          margin: 1em 0;
        }
      `}</style>
    </div>
  );
};

export default ChatBot;
