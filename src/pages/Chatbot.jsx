import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showTemplateButtons, setShowTemplateButtons] = useState(true);
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [memories, setMemories] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize Google Generative AI
  const genAI = new GoogleGenerativeAI("AIzaSyDSTgkkROL7mjaGKoD2vnc8l2UptNCbvHk");
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Load memories from localStorage on component mount
  useEffect(() => {
    const savedMemories = localStorage.getItem('orionMemories');
    if (savedMemories) {
      setMemories(JSON.parse(savedMemories));
    }
  }, []);

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
      const prompt = `Create a very concise summary (max 1 sentence) of this conversation in the same language as the conversation. Focus on key facts, decisions, and important details. REMOVE all greetings and small talk.\n\nConversation:\n${conversation}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      
      // Clean response to avoid JSON artifacts
      const cleanResponse = response
        .replace(/[{}]/g, '')
        .replace(/json/gi, '')
        .replace(/```/g, '')
        .trim();
      
      return cleanResponse || "Summary not available";
    } catch (error) {
      console.error("Error summarizing conversation:", error);
      return "Couldn't create summary";
    }
  };

  const saveToMemory = async () => {
    if (messages.length === 0) return;
    
    try {
      setIsBotTyping(true);
      
      // Format conversation history for summarization
      const conversationText = messages.map(msg => 
        `${msg.isBot ? 'Orion' : 'User'}: ${msg.text}`
      ).join('\n');
      
      const summary = await summarizeConversation(conversationText);
      
      if (summary && !summary.toLowerCase().includes("couldn't")) {
        const newMemory = {
          id: Date.now().toString(),
          summary: summary,
          date: new Date().toLocaleString(),
          messages: [...messages]
        };
        
        const updatedMemories = [newMemory, ...memories].slice(0, 20); // Keep 20 latest memories
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
    
    try {
      // Combine all memories with their full conversation history
      const context = memories.map(memory => 
        `Previous conversation (${memory.date}):\n${memory.messages.map(msg => 
          `${msg.isBot ? 'Orion' : 'User'}: ${msg.text}`
        ).join('\n')}`
      ).join('\n\n');
      
      return `Memory Context:\n${context}\n\n`;
    } catch (error) {
      console.error("Error retrieving full memory context:", error);
      return '';
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
      setIsTypingAnimation(true);
      setShowTemplateButtons(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      const startTime = Date.now();

      // Get full memory context
      const memoryContext = getFullMemoryContext();
      
      // Combine chat history into prompt
      const contextMessage = updatedHistory
        .map((msg, index) => {
          if (msg.role === 'user') {
            return `User: ${msg.content}`;
          } else {
            return `Orion: ${msg.content}`;
          }
        })
        .join('\n');

      const fullMessage = `${memoryContext}Current Conversation:\n${contextMessage}\n\nNow user says: "${trimmedMessage}". 
      Respond as Orion in natural language, incorporating all relevant context when appropriate. 
      Use friendly tone with occasional emoticons. If Indonesian is detected, respond in 'gue-lo' Jaksel style when appropriate. 
      Match the user's language. For code responses, wrap them in triple backticks with language specification.`;

      // Generate response using Google Generative AI
      const result = await model.generateContent(fullMessage);
      const botResponse = result.response.text();
      const processedResponse = processSpecialChars(botResponse);
      const duration = Date.now() - startTime;

      setMessages(prev => [...prev, createMessageObject(processedResponse, true, duration)]);
      
      // Add bot response to chat history
      const botMessage = { role: 'assistant', content: botResponse };
      setChatHistory(prev => [...prev, botMessage]);

      // Save to memory every 3 messages
      if (messages.length > 0 && messages.length % 3 === 0) {
        await saveToMemory();
      }
    } catch (error) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Request timeout after 30s. Try again.'
        : 'Oops, something went wrong with Orion! Connection issue... I have a problem here, I\'m so sorry... 哎呀，发生错误了。请稍后再试';
      
      setMessages(prev => [...prev, createMessageObject(errorMessage, true)]);
    } finally {
      setIsBotTyping(false);
      setIsTypingAnimation(false);
      clearTimeout(timeoutId);
    }
  };

  const handleTemplateButtonClick = (templateMessage) => {
    handleSendMessage(templateMessage);
  };

  const processSpecialChars = (text) => {
    // Process code blocks first
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;
    let processedText = text.replace(codeBlockRegex, (match, lang, code) => {
      return `<div class="code-block">
        <div class="code-header">
          <span class="language">${lang || 'code'}</span>
          <button class="copy-button" onclick="navigator.clipboard.writeText(\`${code.replace(/`/g, '\\`')}\`)">
            Copy
          </button>
        </div>
        <pre><code>${DOMPurify.sanitize(code)}</code></pre>
      </div>`;
    });

    // Process other markdown
    processedText = processedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<s>$1</s>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br />')
      .replace(/### (.*?) ###/g, '<h3>$1</h3>');

    return processedText;
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setPendingFiles(files);
    }
  };

  const handleSendFiles = () => {
    if (pendingFiles.length > 0) {
      handleSendMessage(inputMessage, pendingFiles);
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
  };

  const deleteMemory = (id) => {
    const updatedMemories = memories.filter(memory => memory.id !== id);
    setMemories(updatedMemories);
    localStorage.setItem('orionMemories', JSON.stringify(updatedMemories));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white relative z-10">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <h2 className="font-bold text-lg">Orion AI</h2>
            <p className="text-xs opacity-75">
              {isBotTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMemoryPanel(!showMemoryPanel)}
            className="flex items-center space-x-1 bg-gray-700 text-white px-3 py-1 rounded-full hover:bg-gray-600 transition-colors text-xs"
          >
            <span>Memory</span>
            <span>🧠</span>
          </button>
          <button
            onClick={startNewConversation}
            className="flex items-center space-x-1 bg-gray-700 text-white px-3 py-1 rounded-full hover:bg-gray-600 transition-colors text-xs"
          >
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {messages.length === 0 && (
          <>
            <div className="flex justify-center mb-4">
              <img 
                src="/orion.png" 
                alt="Orion Logo" 
                className="h-24 md:h-32 opacity-90"
              />
            </div>

            <h3 className="text-3xl md:text-4xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
              Hey, I'm Orion! Your AI Assistant ✨
            </h3>
          </>
        )}

        {showTemplateButtons && messages.length === 0 && (
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-8">
            {[
              "Hello Orion!",
              "Give me creative ideas",
              "Explain something to me",
              "Help me with a problem",
              "Tell me a fun fact",
              "Recommend something"
            ].map((template, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTemplateButtonClick(template)}
                className="bg-gray-800 text-white px-4 py-3 rounded-xl hover:bg-gray-700 transition-colors text-sm border border-gray-700"
              >
                {template}
              </motion.button>
            ))}
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
              <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 ${message.isBot ? 'bg-gray-800/80' : 'bg-blue-600/90'} backdrop-blur-sm shadow-lg`}>
                {message.isBot && (
                  <div className="flex items-center mb-1">
                    <img 
                      src="/orion.png" 
                      alt="Orion Logo" 
                      className="h-6 w-6 mr-2 rounded-full" 
                    />
                    <span className="text-xs font-semibold text-blue-400">Orion</span>
                  </div>
                )}
                
                <div 
                  className={`break-words whitespace-pre-wrap leading-relaxed ${message.isBot ? 'text-gray-100' : 'text-white'}`}
                  dangerouslySetInnerHTML={{ __html: message.text }} 
                />
                
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs opacity-70">
                    {message.time}
                    {message.isBot && ` • ${(message.duration / 1000).toFixed(1)}s`}
                  </p>
                  {message.isBot && (
                    <button
                      onClick={() => copyToClipboard(message.text.replace(/<[^>]*>?/gm, ''))}
                      className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTypingAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex justify-start"
          >
            <div className="bg-gray-800/80 text-white rounded-2xl p-4 shadow-lg backdrop-blur-sm max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="h-2 w-2 rounded-full bg-blue-400"
                  />
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                    className="h-2 w-2 rounded-full bg-blue-400"
                  />
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                    className="h-2 w-2 rounded-full bg-blue-400"
                  />
                </div>
                <span className="text-sm">Orion is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Container */}
      <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        {/* File Preview */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 border-b border-gray-800">
            {pendingFiles.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith('image/') ? (
                  <div className="relative">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Preview" 
                      className="w-20 h-20 object-cover rounded-lg" 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => {
                          const newFiles = [...pendingFiles];
                          newFiles.splice(index, 1);
                          setPendingFiles(newFiles);
                        }}
                        className="text-white p-1 hover:text-red-400 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 flex flex-col items-center justify-center bg-gray-800 rounded-lg relative group">
                    <span className="text-2xl">📄</span>
                    <span className="text-xs mt-1 truncate w-16 text-center">{file.name.split('.')[0]}</span>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => {
                          const newFiles = [...pendingFiles];
                          newFiles.splice(index, 1);
                          setPendingFiles(newFiles);
                        }}
                        className="text-white p-1 hover:text-red-400 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
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
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Message Orion..."
              className="w-full border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white resize-none overflow-hidden transition-all duration-200 ease-in-out hover:border-blue-500 pr-12"
              rows={1}
              style={{ minHeight: '50px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputMessage, pendingFiles);
                }
              }}
            />
            <div className="absolute right-3 bottom-3 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowFileOptions(!showFileOptions)}
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
              </button>
              <button
                onClick={() => handleSendMessage(inputMessage, pendingFiles)}
                disabled={(!inputMessage.trim() && pendingFiles.length === 0) || isBotTyping}
                className={`p-1 rounded-full ${(!inputMessage.trim() && pendingFiles.length === 0) || isBotTyping ? 'text-gray-600' : 'text-blue-400 hover:text-blue-300'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* File Options */}
        {showFileOptions && (
          <div className="flex space-x-3 p-3 border-t border-gray-800 justify-center">
            <label className="flex flex-col items-center cursor-pointer">
              <div className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <span className="text-xs mt-1">Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                multiple
              />
            </label>
            <label className="flex flex-col items-center cursor-pointer">
              <div className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <span className="text-xs mt-1">Document</span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                multiple
              />
            </label>
          </div>
        )}
      </div>

      {/* Memory Panel */}
      {showMemoryPanel && (
        <div className="absolute right-4 bottom-20 w-72 md:w-80 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-20 max-h-[60vh] flex flex-col">
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold">Memory Context</h3>
            <button 
              onClick={() => setShowMemoryPanel(false)}
              className="text-gray-400 hover:text-white p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto p-3 flex-1 scrollbar-thin scrollbar-thumb-gray-700">
            {memories.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">
                No memories yet. Conversations will be saved here.
              </div>
            ) : (
              <div className="space-y-3">
                {memories.map((memory) => (
                  <div key={memory.id} className="bg-gray-700/50 p-3 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium">{memory.summary}</p>
                      <button
                        onClick={() => deleteMemory(memory.id)}
                        className="text-gray-400 hover:text-red-400 text-xs p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">{memory.date}</p>
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-xs text-gray-300 line-clamp-2">
                        {memory.messages.slice(0, 2).map(msg => msg.text).join(' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 border-t border-gray-700 text-xs text-gray-400">
            {memories.length} memory items stored
          </div>
        </div>
      )}
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
