import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FiCopy, FiSend, FiPlus, FiX, FiImage, FiFile, FiTrash2, FiClock, FiCpu, FiSettings, FiPause } from 'react-icons/fi';
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdCode, MdStrikethroughS } from 'react-icons/md';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showTemplateButtons, setShowTemplateButtons] = useState(true);
  const [typingSpeed, setTypingSpeed] = useState(20); // words per chunk
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [memories, setMemories] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false);
  const [isTypingSoundPlaying, setIsTypingSoundPlaying] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingSoundRef = useRef(null);
  const sendSoundRef = useRef(null);

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

    // Initialize audio
    typingSoundRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-typing-with-mechanical-keyboard-1384.mp3');
    typingSoundRef.current.loop = true;
    typingSoundRef.current.volume = 0.2;
    
    sendSoundRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3');
    sendSoundRef.current.volume = 0.3;
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
    const words = fullText.split(/(\s+)/);
    let chunkSize = typingSpeed;
    
    // Start typing sound
    typingSoundRef.current.currentTime = 0;
    typingSoundRef.current.play();
    setIsTypingSoundPlaying(true);

    for (let i = 0; i < words.length; i += chunkSize) {
      if (!isBotTyping) break; // Stop if interrupted
      
      const chunk = words.slice(i, i + chunkSize).join('');
      displayedText += chunk;
      callback(displayedText);
      
      // Randomize chunk size slightly for more natural typing
      chunkSize = Math.max(1, typingSpeed + Math.floor(Math.random() * 5) - 2);
      await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 50));
    }

    // Stop typing sound
    typingSoundRef.current.pause();
    setIsTypingSoundPlaying(false);
  };

  const handleSendMessage = async (messageText, files = []) => {
    const trimmedMessage = messageText.trim();
    if ((!trimmedMessage && files.length === 0) || isBotTyping) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      // Play send sound
      sendSoundRef.current.play();

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
      setShowFormattingToolbar(false);

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

  const applyFormatting = (format) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = inputMessage.substring(start, end);
    let newText = inputMessage;

    const formattingMap = {
      bold: { prefix: '**', suffix: '**' },
      italic: { prefix: '*', suffix: '*' },
      underline: { prefix: '_', suffix: '_' },
      strikethrough: { prefix: '~~', suffix: '~~' },
      code: { prefix: '`', suffix: '`' },
    };

    if (format in formattingMap) {
      const { prefix, suffix } = formattingMap[format];
      
      if (selectedText) {
        newText = 
          inputMessage.substring(0, start) + 
          prefix + selectedText + suffix + 
          inputMessage.substring(end);
      } else {
        newText = 
          inputMessage.substring(0, start) + 
          prefix + suffix + 
          inputMessage.substring(end);
      }
    } else if (format === 'newline') {
      newText = 
        inputMessage.substring(0, start) + 
        '\n' + 
        inputMessage.substring(end);
    }

    setInputMessage(newText);
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start, end + prefix.length + suffix.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }
    }, 0);
  };

  const interruptTyping = () => {
    setIsBotTyping(false);
    if (typingSoundRef.current) {
      typingSoundRef.current.pause();
      setIsTypingSoundPlaying(false);
    }
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
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute right-4 top-16 bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-xl z-20 border border-gray-700 w-64"
        >
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
                  min="1"
                  max="50"
                  value={typingSpeed}
                  onChange={(e) => setTypingSpeed(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs">Fast</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Words per chunk: {typingSpeed}
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition-colors text-sm"
            >
              Save Settings
            </button>
          </div>
        </motion.div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full pb-16"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
            >
              <span className="text-4xl">✨</span>
            </motion.div>
            <h3 className="text-3xl font-bold text-center mb-2">
              Hey, I'm Orion!
            </h3>
            <p className="text-gray-400 text-center mb-8 max-w-md">
              Your AI assistant with full memory context. I remember all our past conversations to provide better help.
            </p>
            
            {showTemplateButtons && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
                className="grid grid-cols-2 gap-3 w-full max-w-md"
              >
                {[
                  { 
                    title: "Say hello", 
                    desc: "Start a conversation",
                    message: "Hello Orion! How are you today?"
                  },
                  { 
                    title: "Brainstorm ideas", 
                    desc: "Get creative suggestions",
                    message: "Brainstorm some creative ideas for my project about..."
                  },
                  { 
                    title: "Explain something", 
                    desc: "Get clear explanations",
                    message: "Explain how machine learning works in simple terms"
                  },
                  { 
                    title: "Code help", 
                    desc: "Debug or explain code",
                    message: "Help me debug this code..."
                  }
                ].map((item, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTemplateButtonClick(item.message)}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-3 text-sm transition-all text-left"
                  >
                    <span className="font-medium">{item.title}</span>
                    <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 ${message.isBot ? 
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
              </motion.div>
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
                <button
                  onClick={interruptTyping}
                  className="ml-2 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors flex items-center"
                >
                  <FiPause size={12} className="mr-1" />
                  Interrupt
                </button>
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
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="flex items-center space-x-2 p-3 border-b border-gray-800 overflow-x-auto scrollbar-thin"
          >
            {pendingFiles.map((file, index) => (
              <motion.div 
                key={index} 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex-shrink-0"
              >
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
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* Formatting Toolbar */}
        {showFormattingToolbar && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="flex items-center space-x-1 p-2 border-b border-gray-800 bg-gray-800/50"
          >
            <button
              onClick={() => applyFormatting('bold')}
              className="p-2 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors"
              title="Bold"
            >
              <MdFormatBold size={18} />
            </button>
            <button
              onClick={() => applyFormatting('italic')}
              className="p-2 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors"
              title="Italic"
            >
              <MdFormatItalic size={18} />
            </button>
            <button
              onClick={() => applyFormatting('underline')}
              className="p-2 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors"
              title="Underline"
            >
              <MdFormatUnderlined size={18} />
            </button>
            <button
              onClick={() => applyFormatting('strikethrough')}
              className="p-2 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors"
              title="Strikethrough"
            >
              <MdStrikethroughS size={18} />
            </button>
            <button
              onClick={() => applyFormatting('code')}
              className="p-2 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors"
              title="Code"
            >
              <MdCode size={18} />
            </button>
            <button
              onClick={() => applyFormatting('newline')}
              className="p-2 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
              title="New line"
            >
              ↵
            </button>
          </motion.div>
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
              onFocus={() => setShowFormattingToolbar(true)}
              onBlur={() => {
                if (!inputMessage) setShowFormattingToolbar(false);
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
              
              <motion.button
                onClick={() => handleSendMessage(inputMessage, pendingFiles)}
                disabled={(!inputMessage.trim() && pendingFiles.length === 0) || isBotTyping}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-1.5 rounded-full transition-all ${inputMessage.trim() || pendingFiles.length > 0 ? 
                  'bg-blue-500 hover:bg-blue-600 text-white' : 
                  'text-gray-500 hover:text-gray-300'}`}
              >
                {isBotTyping ? <FiPause size={18} /> : <FiSend size={18} />}
              </motion.button>
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
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
                  >
                    {memories.length > 99 ? '99+' : memories.length}
                  </motion.span>
                )}
              </button>
              
              {showMemoryPanel && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-2 left-0 w-72 bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-xl z-20 border border-gray-700 overflow-hidden"
                >
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
                    </div
