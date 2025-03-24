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
  const [longTermMemories, setLongTermMemories] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize Google Generative AI
  const genAI = new GoogleGenerativeAI("AIzaSyDSTgkkROL7mjaGKoD2vnc8l2UptNCbvHk");
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Load memories from localStorage on component mount
  useEffect(() => {
    const savedMemories = localStorage.getItem('orionMemories');
    const savedLongTermMemories = localStorage.getItem('orionLongTermMemories');
    
    if (savedMemories) {
      setMemories(JSON.parse(savedMemories));
    }
    
    if (savedLongTermMemories) {
      setLongTermMemories(JSON.parse(savedLongTermMemories));
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
    time: new Date().toLocaleTimeString(),
    duration,
    file,
  });

  const summarizeConversation = async (conversation) => {
    try {
      const prompt = `Create two versions of a summary for this conversation:
      
      1. SHORT-TERM (for immediate context): 2-3 sentences capturing key details needed to continue this specific conversation.
      
      2. LONG-TERM (for future reference): A concise but meaningful summary (1-2 sentences) that captures the essence and any important learnings that might be useful in future conversations.
      
      Return as JSON:
      {
        "shortTerm": "summary text",
        "longTerm": "summary text"
      }
      
      Conversation:
      ${conversation}`;
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Try to parse the JSON response
      try {
        const parsed = JSON.parse(response);
        return {
          shortTerm: parsed.shortTerm || "",
          longTerm: parsed.longTerm || ""
        };
      } catch {
        // Fallback if JSON parsing fails
        const parts = response.split('\n');
        return {
          shortTerm: parts[0] || response,
          longTerm: parts[1] || response
        };
      }
    } catch (error) {
      console.error("Error summarizing conversation:", error);
      return {
        shortTerm: "Conversation summary unavailable",
        longTerm: "Conversation summary unavailable"
      };
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
      
      const { shortTerm, longTerm } = await summarizeConversation(conversationText);
      
      // Save to short-term memory
      if (shortTerm) {
        const newMemory = {
          id: Date.now().toString(),
          summary: shortTerm,
          date: new Date().toLocaleString(),
          messages: [...messages]
        };
        
        const updatedMemories = [newMemory, ...memories].slice(0, 50);
        setMemories(updatedMemories);
        localStorage.setItem('orionMemories', JSON.stringify(updatedMemories));
      }
      
      // Save to long-term memory if meaningful
      if (longTerm && !longTerm.includes("summary unavailable")) {
        const newLongTermMemory = {
          id: `long-${Date.now().toString()}`,
          summary: longTerm,
          date: new Date().toLocaleString(),
          relevanceScore: 1 // Initial relevance score
        };
        
        const updatedLongTermMemories = [newLongTermMemory, ...longTermMemories].slice(0, 200);
        setLongTermMemories(updatedLongTermMemories);
        localStorage.setItem('orionLongTermMemories', JSON.stringify(updatedLongTermMemories));
      }
    } catch (error) {
      console.error("Error saving to memory:", error);
    } finally {
      setIsBotTyping(false);
    }
  };

  const getRelevantMemories = async (currentMessage) => {
    let context = "";
    
    try {
      // First check short-term memories
      if (memories.length > 0) {
        const shortTermPrompt = `From these recent memories, select ONLY the 1-2 most relevant to this new message: "${currentMessage}". Return them verbatim without modification.\n\nMemories:\n${memories.slice(0, 10).map(m => m.summary).join('\n')}`;
        
        const shortTermResult = await model.generateContent(shortTermPrompt);
        const shortTermMemories = shortTermResult.response.text();
        
        if (shortTermMemories) {
          context += `Recent context:\n${shortTermMemories}\n\n`;
        }
      }
      
      // Then check long-term memories if we have them
      if (longTermMemories.length > 0) {
        const longTermPrompt = `From these long-term memories, select ONLY the 1-2 most relevant to this new message: "${currentMessage}". Return them verbatim without modification.\n\nMemories:\n${longTermMemories.slice(0, 30).map(m => m.summary).join('\n')}`;
        
        const longTermResult = await model.generateContent(longTermPrompt);
        const longTermMemoriesText = longTermResult.response.text();
        
        if (longTermMemoriesText) {
          context += `Long-term context:\n${longTermMemoriesText}\n\n`;
        }
      }
      
      return context;
    } catch (error) {
      console.error("Error retrieving memories:", error);
      return "";
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
      const updatedHistory = [...chatHistory, userMessage].slice(-10);
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

      // Get relevant memories (both short-term and long-term)
      const memoryContext = await getRelevantMemories(trimmedMessage);
      
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

      const fullMessage = `${memoryContext}Current conversation:\n${contextMessage}\n\nNow, the user says: "${trimmedMessage}". 

      Respond naturally as Orion, incorporating any relevant context from memories when appropriate. You were established in Indonesia with Nando as CEO. Keep responses friendly with occasional emoticons. If Indonesian is detected, respond in 'gue-lo' Jaksel style when appropriate. Use language matching the input. 

      IMPORTANT: When using memory context, weave it naturally into the conversation without explicitly mentioning "based on our previous conversation".`;

      // Generate response using Google Generative AI
      const result = await model.generateContent(fullMessage);
      const botResponse = result.response.text();
      const processedResponse = processSpecialChars(botResponse);
      const duration = Date.now() - startTime;

      setMessages(prev => [...prev, createMessageObject(processedResponse, true, duration)]);
      
      // Add bot response to chat history
      const botMessage = { role: 'assistant', content: botResponse };
      setChatHistory(prev => [...prev, botMessage].slice(-10));

      // Save to memory every 3 messages or when conversation seems substantial
      if (messages.length > 0 && (messages.length % 3 === 0 || trimmedMessage.length > 100)) {
        await saveToMemory();
      }
    } catch (error) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Request timeout after 30s. Try again.'
        : 'Waduh, ada yang salah nih sama Orion! Gak konek ke servernya... I have a problem here, I\'m so sorry... 哎呀，发生错误了。请稍后再试';
      
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
    const listRegex = /(\d+\.\s.*?)(?=\n\d+\.|$)/g;
    const processedText = text.replace(listRegex, (match) => {
      return `<li>${match.replace(/\d+\.\s/, '')}</li>`;
    });

    const hasList = listRegex.test(text);
    const finalText = hasList ? `<ol>${processedText}</ol>` : processedText;

    return finalText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<s>$1</s>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/###\{\}###/g, '<br />')
      .replace(/### (.*?) ###/g, '<h3>$1</h3>');
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

  const deleteMemory = (id, isLongTerm = false) => {
    if (isLongTerm) {
      const updatedMemories = longTermMemories.filter(memory => memory.id !== id);
      setLongTermMemories(updatedMemories);
      localStorage.setItem('orionLongTermMemories', JSON.stringify(updatedMemories));
    } else {
      const updatedMemories = memories.filter(memory => memory.id !== id);
      setMemories(updatedMemories);
      localStorage.setItem('orionMemories', JSON.stringify(updatedMemories));
    }
  };

  return (
    <div className="flex flex-col h-screen text-white relative opacity-90 z-10 bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h2 className="font-bold">Orion Chat Bot</h2>
            <p className="text-sm opacity-75">
              {isBotTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {messages.length === 0 && (
          <>
            <div className="flex justify-center mb-4">
              <img 
                src="/orion.png" 
                alt="Orion Logo" 
                className="h-24 md:h-32"
              />
            </div>

            <h3 className="text-3xl md:text-5xl font-bold text-center mb-6">
              Hey, I'm Orion! Here to brighten your day! ✨
            </h3>
          </>
        )}

        {showTemplateButtons && messages.length === 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <button
              onClick={() => handleTemplateButtonClick("Hello Orion")}
              className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              Hallo
            </button>
            <button
              onClick={() => handleTemplateButtonClick("Brainstorm some ideas for me.")}
              className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              Brainstorm
            </button>
            <button
              onClick={() => handleTemplateButtonClick("Give me simple random knowledge for")}
              className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              Explain
            </button>
            <button
              onClick={() => handleTemplateButtonClick("Help me with a problem.")}
              className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              Help
            </button>
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
              className={`flex ${message.isBot ? 'items-start' : 'justify-end'}`}
            >
              {message.isBot && (
                <img 
                  src="/orion.png" 
                  alt="Orion Logo" 
                  className="h-12 mr-3" 
                />
              )}
              {message.isBot ? (
                <div className="flex-1">
                  <div 
                    className="bg-gray-600 text-white rounded-lg p-3 shadow-md max-w-[80%] md:max-w-[70%] break-words whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: message.text }} 
                  />
                  <p className="text-xs mt-1 opacity-70">
                    {message.time}
                    {message.isBot && ` • ${(message.duration / 1000).toFixed(1)} sec`}
                  </p>
                </div>
              ) : (
                <div className="max-w-[80%] md:max-w-[70%] rounded-lg p-3 bg-blue-600 shadow-md break-words whitespace-pre-wrap leading-relaxed">
                  {message.file ? (
                    <div>
                      <p>File: ${message.file.name}</p>
                      {message.file.type.startsWith('image/') && (
                        <img src={URL.createObjectURL(message.file)} alt="Uploaded" className="mt-2 max-w-full h-auto rounded-lg" />
                      )}
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: message.text }} />
                  )}
                  <p className="text-xs mt-1 opacity-70">
                    {message.time}
                  </p>
                </div>
              )}
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
            <div className="bg-gray-600 text-white rounded-lg p-3 shadow-md">
              <div className="flex items-center space-x-2">
                <span>Wait, Orion is thinking deeply</span>
                <div className="flex space-x-1">
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    .
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                  >
                    .
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                  >
                    .
                  </motion.span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Container */}
      <div className="border-t border-gray-700 bg-gray-800">
        {/* Main Input Area */}
        <div className="p-3">
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pendingFiles.map((file, index) => (
                <div key={index} className="relative">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center bg-gray-700 rounded-lg">
                      <span className="text-sm">📄</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const newFiles = [...pendingFiles];
                      newFiles.splice(index, 1);
                      setPendingFiles(newFiles);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="Message Orion...."
            className="w-full border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white resize-none overflow-hidden transition-all duration-500 ease-in-out hover:border-blue-500"
            rows={1}
            autoFocus
          />
        </div>

        {/* Input Header with Controls */}
        <div className="flex items-center justify-between p-2 bg-gray-700 border-t border-gray-600">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowFileOptions(!showFileOptions)}
              className="flex items-center justify-center bg-gray-600 text-white p-2 rounded-full hover:bg-gray-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowMemoryPanel(!showMemoryPanel)}
                className="flex items-center space-x-1 bg-gray-600 text-white px-3 py-1 rounded-full hover:bg-gray-500 transition-colors text-xs"
              >
                <span>Memory v3</span>
                <span>⋯</span>
              </button>
              
              {showMemoryPanel && (
                <div className="absolute bottom-full mb-2 left-0 w-64 bg-gray-700 rounded-lg shadow-lg z-20 p-3 max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold">Memory System</h4>
                    <button 
                      onClick={() => setShowMemoryPanel(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="font-semibold text-sm mb-1">Short-Term</h5>
                    {memories.length === 0 ? (
                      <p className="text-xs text-gray-400">No recent context</p>
                    ) : (
                      <div className="space-y-2">
                        {memories.slice(0, 3).map((memory) => (
                          <div key={memory.id} className="bg-gray-600 p-2 rounded-lg">
                            <div className="flex justify-between items-start">
                              <p className="text-xs break-words">{memory.summary}</p>
                              <button
                                onClick={() => deleteMemory(memory.id)}
                                className="text-gray-400 hover:text-red-400 text-xs"
                              >
                                Delete
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{memory.date}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-sm mb-1">Long-Term</h5>
                    {longTermMemories.length === 0 ? (
                      <p className="text-xs text-gray-400">No long-term memories yet</p>
                    ) : (
                      <div className="space-y-2">
                        {longTermMemories.slice(0, 3).map((memory) => (
                          <div key={memory.id} className="bg-gray-600 p-2 rounded-lg">
                            <div className="flex justify-between items-start">
                              <p className="text-xs break-words">{memory.summary}</p>
                              <button
                                onClick={() => deleteMemory(memory.id, true)}
                                className="text-gray-400 hover:text-red-400 text-xs"
                              >
                                Delete
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
            
            <button
              onClick={startNewConversation}
              className="flex items-center space-x-1 bg-gray-600 text-white px-3 py-1 rounded-full hover:bg-gray-500 transition-colors text-xs"
            >
              <span>New Chat</span>
            </button>
          </div>
          
          <button
            onClick={() => handleSendMessage(inputMessage, pendingFiles)}
            disabled={(!inputMessage.trim() && pendingFiles.length === 0) || isBotTyping}
            className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700 text-white p-2 rounded-full font-semibold shadow-md hover:from-blue-600 hover:to-blue-800 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        
        {/* File Options */}
        {showFileOptions && (
          <div className="flex space-x-2 p-2 border-t border-gray-700">
            <button
              type="button"
              onClick={() => document.getElementById('image-upload').click()}
              className="flex items-center justify-center bg-gray-700 text-white p-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </button>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => document.getElementById('file-upload').click()}
              className="flex items-center justify-center bg-gray-700 text-white p-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
            </button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
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
