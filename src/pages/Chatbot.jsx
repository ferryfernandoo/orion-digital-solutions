import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [typingSpeed] = useState(20);
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
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messageCountRef = useRef(0);

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

  const scrollToBottom = useCallback((behavior = 'auto') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'nearest' });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

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
        .map(m => `[Memory ${m.date}]: ${m.summary}\nDetail: ${m.messages.map(msg => `${msg.isBot ? 'Orion' : 'User'}: ${msg.text.replace(/<[^>]*>?/gm, '')}`).join('\n')}`)
        .join('\n\n');
    } catch (error) {
      console.error("Error finding relevant memories:", error);
      return '';
    }
  };

  const autoSaveToMemory = useCallback(async () => {
    if (messages.length === 0 || messageCountRef.current % 2 !== 0) return;
    
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
  }, [messages, memories]);

  const typeMessage = async (fullText, callback) => {
    if (isProMode) {
      callback(fullText);
      return;
    }
    
    let displayedText = '';
    const chunkSize = 3; // Smaller chunks for smoother typing
    
    for (let i = 0; i < fullText.length; i += chunkSize) {
      if (abortController?.signal.aborted) break;
      const chunk = fullText.substr(i, chunkSize);
      displayedText += chunk;
      callback(displayedText);
      
      // Smooth scrolling during typing
      const isNearBottom = chatContainerRef.current.scrollHeight - chatContainerRef.current.scrollTop - chatContainerRef.current.clientHeight < 100;
      if (isNearBottom) {
        scrollToBottom('smooth');
      }
      
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
      messageCountRef.current += 1;

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Scroll to show the sent message at the top
      setTimeout(() => {
        scrollToBottom('smooth');
      }, 50);

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

      // Create message object for bot response
      const messageId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: messageId,
        text: isProMode ? processedResponse : '',
        isBot: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration,
        file: null
      }]);

      // Type out the message with animation (only in normal mode)
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

      // Auto-save to memory every 2 messages
      await autoSaveToMemory();

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
      await autoSaveToMemory();
    }
    setMessages([]);
    setChatHistory([]);
    setPendingFiles([]);
    setInputMessage('');
    setShowTemplateButtons(true);
    messageCountRef.current = 0;
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
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <div>
            <h2 className="font-semibold text-sm">Orion AI</h2>
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
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                  Online {isProMode && <span className="ml-1 text-blue-600">(Pro Mode)</span>}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={toggleProMode}
            className={`p-1 rounded transition-colors ${isProMode ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            title={isProMode ? 'Disable Pro Mode' : 'Enable Pro Mode'}
          >
            <FiZap size={14} />
          </button>
          <button 
            onClick={() => setShowMemoryPanel(!showMemoryPanel)}
            className="p-1 rounded text-gray-500 hover:bg-gray-100 transition-colors"
            title="Memory"
          >
            <FiCpu size={14} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent bg-gray-50"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full pb-16">
            <div className="w-16 h-16 mb-4 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-xl text-white">AI</span>
            </div>
            <h3 className="text-xl font-semibold text-center mb-1">
              Hello, I'm Orion!
            </h3>
            <p className="text-gray-500 text-center mb-6 max-w-md text-xs">
              Your AI assistant with automatic memory. Ask me anything.
            </p>
            
            {showTemplateButtons && (
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                <button
                  onClick={() => handleTemplateButtonClick("Hello Orion! How are you today?")}
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs transition-colors text-left"
                >
                  <span className="font-medium">Say hello</span>
                  <p className="text-gray-500 text-2xs mt-0.5">Start a conversation</p>
                </button>
                <button
                  onClick={() => handleTemplateButtonClick("Brainstorm some creative ideas for my project about...")}
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs transition-colors text-left"
                >
                  <span className="font-medium">Brainstorm ideas</span>
                  <p className="text-gray-500 text-2xs mt-0.5">Get creative suggestions</p>
                </button>
                <button
                  onClick={() => handleTemplateButtonClick("Explain how machine learning works in simple terms")}
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs transition-colors text-left"
                >
                  <span className="font-medium">Explain something</span>
                  <p className="text-gray-500 text-2xs mt-0.5">Get clear explanations</p>
                </button>
                <button
                  onClick={() => handleTemplateButtonClick("Help me debug this code...")}
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs transition-colors text-left"
                >
                  <span className="font-medium">Code help</span>
                  <p className="text-gray-500 text-2xs mt-0.5">Debug or explain code</p>
                </button>
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[90%] md:max-w-[80%] ${message.isBot ? 
                'bg-white border border-gray-200' : 
                'bg-blue-600 text-white'} rounded-lg p-2 shadow-xs`}
              >
                {message.isBot && (
                  <div className="flex items-center mb-0.5">
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center mr-1">
                      <span className="text-2xs text-white">AI</span>
                    </div>
                    <span className="text-2xs font-medium text-gray-500">Orion</span>
                  </div>
                )}
                
                {message.file ? (
                  <div>
                    <p className={`text-2xs mb-0.5 ${message.isBot ? 'text-gray-500' : 'text-blue-100'}`}>File: {message.file.name}</p>
                    {message.file.type.startsWith('image/') && (
                      <img 
                        src={URL.createObjectURL(message.file)} 
                        alt="Uploaded" 
                        className="mt-0.5 max-w-full h-auto rounded border border-gray-200" 
                      />
                    )}
                  </div>
                ) : (
                  <div 
                    className={`text-xs ${message.isBot ? 'text-gray-700' : 'text-white'}`}
                    dangerouslySetInnerHTML={{ __html: message.text }} 
                  />
                )}
                
                <div className="flex items-center justify-between mt-0.5">
                  <span className={`text-2xs ${message.isBot ? 'text-gray-400' : 'text-blue-100'}`}>
                    {message.time}
                    {message.isBot && message.duration > 0 && (
                      <span> • {(message.duration / 1000).toFixed(1)}s</span>
                    )}
                  </span>
                  
                  {message.isBot && (
                    <button
                      onClick={() => copyToClipboard(message.text.replace(/<[^>]*>?/gm, ''))}
                      className="text-2xs opacity-60 hover:opacity-100 transition-opacity ml-1 text-gray-500"
                      title="Copy to clipboard"
                    >
                      <FiCopy size={10} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isBotTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-200 rounded-lg p-2 max-w-[80%] shadow-xs">
              <div className="flex items-center space-x-1.5">
                <div className="flex space-x-0.5">
                  <motion.span
                    className="typing-dot bg-gray-400"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                  <motion.span
                    className="typing-dot bg-gray-400"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                  />
                  <motion.span
                    className="typing-dot bg-gray-400"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {isProMode ? 'Processing deeply...' : 'Thinking...'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Memory Panel */}
      {showMemoryPanel && (
        <div className="absolute right-3 top-11 bg-white rounded-lg shadow-lg z-20 border border-gray-200 w-64">
          <div className="p-2 border-b border-gray-200 flex justify-between items-center">
            <h4 className="font-medium text-xs flex items-center">
              <FiCpu className="mr-1" size={12} /> Memory Context
            </h4>
            <div className="flex items-center space-x-1">
              <button 
                onClick={autoSaveToMemory}
                disabled={messages.length === 0}
                className="text-2xs bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded transition-colors disabled:opacity-50"
              >
                Remember
              </button>
              <button 
                onClick={() => setShowMemoryPanel(false)}
                className="text-gray-500 hover:text-gray-700 p-0.5"
              >
                <FiX size={12} />
              </button>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto scrollbar-thin text-xs">
            {memories.length === 0 ? (
              <div className="p-2 text-center text-xs text-gray-500">
                No memories yet. Important context will appear here.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {memories.map((memory) => (
                  <div key={memory.id} className="p-2 hover:bg-gray-50 transition-colors group">
                    <div className="flex justify-between items-start">
                      <p className="text-2xs break-words pr-2">{memory.summary}</p>
                      <button
                        onClick={() => deleteMemory(memory.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-2xs transition-opacity"
                      >
                        <FiTrash2 size={10} />
                      </button>
                    </div>
                    <p className="text-2xs text-gray-400 mt-0.5">{memory.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Input Container */}
      <div className="border-t border-gray-200 bg-white">
        {/* File Preview */}
        {pendingFiles.length > 0 && (
          <div className="flex items-center space-x-1.5 p-1.5 border-b border-gray-200 overflow-x-auto scrollbar-thin bg-gray-50">
            {pendingFiles.map((file, index) => (
              <div key={index} className="relative flex-shrink-0">
                <div className="w-12 h-12 flex items-center justify-center bg-white rounded border border-gray-200 overflow-hidden">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-1 text-center">
                      <FiFile size={14} className="mx-auto text-gray-500" />
                      <p className="text-2xs mt-0.5 truncate w-10">{file.name.split('.')[0]}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    const newFiles = [...pendingFiles];
                    newFiles.splice(index, 1);
                    setPendingFiles(newFiles);
                  }}
                  className="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                >
                  <FiX size={8} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Main Input Area */}
        <div className="p-2">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputMessage, pendingFiles);
                }
              }}
              placeholder="Type your message..."
              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-gray-800 resize-none overflow-hidden transition-all duration-200 hover:border-gray-400 text-xs"
              rows={1}
              style={{ minHeight: '36px', maxHeight: '100px' }}
            />
            
            <div className="absolute right-1.5 bottom-1.5 flex items-center space-x-0.5">
              {inputMessage && (
                <button
                  onClick={() => setInputMessage('')}
                  className="p-0.5 text-gray-500 hover:text-gray-700 rounded-full transition-colors"
                >
                  <FiX size={14} />
                </button>
              )}
              
              {isBotTyping ? (
                <button
                  onClick={stopGeneration}
                  className="p-0.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                  title="Stop generation"
                >
                  <FiStopCircle size={14} />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowFileOptions(!showFileOptions)}
                    className="p-0.5 text-gray-500 hover:text-gray-700 rounded-full transition-colors"
                  >
                    <FiPlus size={14} />
                  </button>
                  <button
                    onClick={() => handleSendMessage(inputMessage, pendingFiles)}
                    disabled={(!inputMessage.trim() && pendingFiles.length === 0) || isBotTyping}
                    className={`p-0.5 rounded-full transition-all ${inputMessage.trim() || pendingFiles.length > 0 ? 
                      'bg-blue-600 hover:bg-blue-700 text-white' : 
                      'text-gray-400 hover:text-gray-500'}`}
                  >
                    <FiSend size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* File Options */}
        {showFileOptions && (
          <div className="flex space-x-1.5 p-1.5 border-t border-gray-200 bg-gray-50">
            <label className="cursor-pointer p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <FiImage size={14} />
            </label>
            <label className="cursor-pointer p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <FiFile size={14} />
            </label>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        /* Modern Typing Animation */
.typing-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse 1.5s infinite ease-in-out;
}
.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes pulse {
  0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
  30% { opacity: 1; transform: scale(1.1); }
}

/* Enhanced Code Container */
.code-container {
  background: #fcfcfc;
  border-radius: 10px;
  margin: 0.75em 0;
  overflow: hidden;
  border: 1px solid #e0e3e7;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
}
.code-container:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transform: translateY(-1px);
}

/* Sleek Code Toolbar */
.code-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5em 1em;
  background: #f5f7f9;
  color: #4b5563;
  font-size: 0.8em;
  border-bottom: 1px solid #e0e3e7;
  backdrop-filter: blur(4px);
}

/* Modern Language Tag */
.language-tag {
  background: #e0e3e7;
  padding: 0.25em 0.6em;
  border-radius: 6px;
  font-size: 0.75em;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: all 0.2s ease;
}

/* Improved Copy Button */
.copy-button {
  background: transparent;
  border: 1px solid #d1d6dd;
  color: #374151;
  cursor: pointer;
  padding: 0.3em 0.7em;
  border-radius: 6px;
  font-size: 0.75em;
  display: flex;
  align-items: center;
  gap: 0.4em;
  transition: all 0.2s ease;
}
.copy-button:hover {
  background: #e5e8ec;
  border-color: #c1c6cd;
  transform: translateY(-1px);
}
.copy-button:active {
  transform: translateY(0);
}

/* Refined Code Block */
.code-block {
  margin: 0;
  padding: 1em;
  overflow-x: auto;
  font-family: 'Fira Code', 'JetBrains Mono', 'Courier New', monospace;
  font-size: 0.85em;
  line-height: 1.6;
  color: #1f2937;
  background: #fcfcfc;
  scrollbar-width: thin;
  scrollbar-color: #d1d6dd transparent;
}
.code-block::-webkit-scrollbar {
  height: 6px;
}
.code-block::-webkit-scrollbar-thumb {
  background: #d1d6dd;
  border-radius: 3px;
}
.code-block code {
  font-family: inherit;
  font-variant-ligatures: contextual;
}

/* Smoother Notification */
.copy-notification {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: rgba(17,24,39,0.95);
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.9em;
  z-index: 1000;
  animation: slideUp 0.3s ease-out forwards, fadeOut 0.5s ease-in 1.5s forwards;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
@keyframes slideUp {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes fadeOut {
  to { opacity: 0; }
}

/* Enhanced Prose Styles */
.prose {
  max-width: 100%;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #374151;
}
.prose code:not(.code-block code) {
  background: rgba(175,184,193,0.25);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.85em;
  transition: background 0.2s ease;
}
.prose code:not(.code-block code):hover {
  background: rgba(175,184,193,0.35);
}
.prose strong {
  font-weight: 600;
  color: #111827;
}
.prose a {
  color: #2563eb;
  text-decoration: none;
  transition: all 0.2s ease;
  border-bottom: 1px solid transparent;
}
.prose a:hover {
  color: #1d4ed8;
  border-bottom-color: currentColor;
}
.prose img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  transition: transform 0.3s ease;
}
.prose img:hover {
  transform: scale(1.01);
}
.prose blockquote {
  border-left: 3px solid #d1d6dd;
  padding-left: 1.25em;
  margin: 1em 0;
  color: #4b5563;
  font-style: italic;
  transition: border-color 0.3s ease;
}
.prose blockquote:hover {
  border-left-color: #9ca3af;
}
.prose hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1.5em 0;
  position: relative;
}
.prose hr::after {
  content: "";
  position: absolute;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 1px;
  background: #9ca3af;
}
`}</style>
    </div>
  );
};

export default ChatBot;
