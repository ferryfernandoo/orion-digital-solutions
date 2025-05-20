import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  FiCopy, FiSend, FiPlus, FiX, FiImage, FiFile, FiTrash2, 
  FiCpu, FiZap, FiStopCircle, FiMessageSquare,
  FiSun, FiMoon, FiSearch, FiDatabase, FiAward, FiChevronDown,
  FiUser, FiCode, FiHelpCircle, FiLightbulb
} from 'react-icons/fi';


const ChatBot = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showTemplateButtons, setShowTemplateButtons] = useState(true);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [memories, setMemories] = useState([]);
  const [isProMode, setIsProMode] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [processingSources, setProcessingSources] = useState([]);
  const [expandedRoomId, setExpandedRoomId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messageCountRef = useRef(0);

  // Initialize Google Generative AI
  const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Load data from localStorage
  useEffect(() => {
    const savedMemories = localStorage.getItem('orionMemories');
    const savedChatRooms = localStorage.getItem('orionChatRooms');
    const savedCurrentRoom = localStorage.getItem('orionCurrentRoom');
    const savedProMode = localStorage.getItem('orionProMode');
    const savedDarkMode = localStorage.getItem('orionDarkMode');
    
    if (savedMemories) setMemories(JSON.parse(savedMemories));
    if (savedChatRooms) setChatRooms(JSON.parse(savedChatRooms));
    if (savedCurrentRoom) {
      setCurrentRoomId(savedCurrentRoom);
      const room = JSON.parse(savedCurrentRoom);
      if (room) {
        setMessages(room.messages || []);
        setChatHistory(room.history || []);
      }
    }
    if (savedProMode) setIsProMode(savedProMode === 'true');
    if (savedDarkMode) setDarkMode(savedDarkMode === 'true');
    
    if (!savedCurrentRoom && (!savedChatRooms || JSON.parse(savedChatRooms).length === 0) {
      createNewChatRoom();
    }
  }, []);

  // Save current room when messages change
  useEffect(() => {
    if (currentRoomId) {
      const updatedRooms = chatRooms.map(room => 
        room.id === currentRoomId 
          ? { ...room, messages, history: chatHistory } 
          : room
      );
      setChatRooms(updatedRooms);
      localStorage.setItem('orionChatRooms', JSON.stringify(updatedRooms));
      localStorage.setItem('orionCurrentRoom', JSON.stringify(currentRoomId));
    }
  }, [messages, chatHistory, currentRoomId]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('orionDarkMode', newDarkMode.toString());
  };

  const createNewChatRoom = () => {
    const newRoom = {
      id: Date.now().toString(),
      name: `New Chat ${chatRooms.length + 1}`,
      messages: [],
      history: [],
      createdAt: new Date().toISOString()
    };
    
    setChatRooms(prev => [newRoom, ...prev]);
    setCurrentRoomId(newRoom.id);
    setMessages([]);
    setChatHistory([]);
    setPendingFiles([]);
    setInputMessage('');
    setShowTemplateButtons(true);
    messageCountRef.current = 0;
    
    localStorage.setItem('orionChatRooms', JSON.stringify([newRoom, ...chatRooms]));
    localStorage.setItem('orionCurrentRoom', JSON.stringify(newRoom.id));
  };

  const switchChatRoom = (roomId) => {
    const room = chatRooms.find(r => r.id === roomId);
    if (room) {
      setCurrentRoomId(roomId);
      setMessages(room.messages || []);
      setChatHistory(room.history || []);
      setShowTemplateButtons(room.messages.length === 0);
      setShowChatHistory(false);
    }
  };

  const deleteChatRoom = (roomId) => {
    const updatedRooms = chatRooms.filter(room => room.id !== roomId);
    setChatRooms(updatedRooms);
    localStorage.setItem('orionChatRooms', JSON.stringify(updatedRooms));
    
    if (currentRoomId === roomId) {
      if (updatedRooms.length > 0) {
        switchChatRoom(updatedRooms[0].id);
      } else {
        createNewChatRoom();
      }
    }
  };

  const scrollToBottom = useCallback((behavior = 'smooth') => {
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

  const extractTextFromFile = async (file) => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve("Extracted text from image (simulated OCR result)");
        }, 1500);
      });
    } else if (file.type === 'application/pdf') {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve("Extracted text from PDF document (simulated result)");
        }, 2000);
      });
    } else if (file.type.includes('text') || 
               file.type.includes('document') || 
               file.name.endsWith('.txt') || 
               file.name.endsWith('.docx')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsText(file);
      });
    }
    return Promise.resolve(`File content not extractable: ${file.name}`);
  };

  const summarizeConversation = async (conversation) => {
    try {
      const prompt = `Create a very brief summary (1 sentence max) of this conversation in the same language. Focus on key facts, decisions, and important details. REMOVE all greetings and small talk.\n\nConversation:\n${conversation}`;
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      return response.replace(/[{}]/g, '').replace(/json/gi, '').replace(/```/g, '').trim() || "Summary unavailable";
    } catch (error) {
      console.error("Error summarizing conversation:", error);
      return "Could not create summary";
    }
  };

  const findRelevantMemories = async (query) => {
    if (memories.length === 0) return '';
    
    try {
      const memoryTexts = memories.map(m => `[Memory ${m.date}]: ${m.summary}`).join('\n');
      const prompt = `Memory list:\n${memoryTexts}\n\nQuery: "${query}"\n\nIdentify only the most relevant memories (max 3). Return only memory IDs separated by commas, or empty if none are relevant.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      const relevantIds = response.trim().split(',').map(id => id.trim()).filter(Boolean);
      
      return memories.filter(m => relevantIds.includes(m.id))
        .map(m => `[Memory ${m.date}]: ${m.summary}\nDetails: ${m.messages.map(msg => `${msg.isBot ? 'AI' : 'User'}: ${msg.text.replace(/<[^>]*>?/gm, '')}`).join('\n')}`)
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
      const conversationText = messages.map(msg => `${msg.isBot ? 'AI' : 'User'}: ${msg.text}`).join('\n');
      const summary = await summarizeConversation(conversationText);
      
      if (summary && !summary.includes("could not")) {
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
    
    const words = fullText.split(' ');
    let displayedText = '';
    
    for (let i = 0; i < words.length; i++) {
      if (abortController?.signal.aborted) break;
      
      const chunkSize = Math.floor(Math.random() * 5) + 3;
      const chunk = words.slice(i, i + chunkSize).join(' ');
      displayedText += (i === 0 ? '' : ' ') + chunk;
      
      const blurredText = `<span style="filter: blur(0.5px); opacity: 0.8;">${displayedText}</span>`;
      callback(blurredText);
      i += chunkSize - 1;
      
      const isNearBottom = chatContainerRef.current.scrollHeight - chatContainerRef.current.scrollTop - chatContainerRef.current.clientHeight < 100;
      if (isNearBottom) {
        scrollToBottom('smooth');
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 50));
    }
    
    callback(fullText);
  };

  const enhanceWithProMode = async (initialResponse, prompt) => {
    const enhancementPrompts = [
      `Expand this response significantly with detailed examples and explanations:\n\n${initialResponse}`,
      `Add comprehensive technical details, use cases, and potential variations to:\n\n${initialResponse}`,
      `Provide multiple perspectives, edge cases, and practical applications for:\n\n${initialResponse}`,
      `Create an extremely detailed final version incorporating all previous enhancements for:\n\n${initialResponse}`
    ];
    
    let enhancedResponse = initialResponse;
    
    for (let i = 0; i < enhancementPrompts.length; i++) {
      if (abortController?.signal.aborted) break;
      
      setProcessingSources(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: `Processing enhancement ${i + 1}/4`,
          icon: <FiDatabase />,
          completed: false
        }
      ]);
      
      try {
        const result = await model.generateContent(enhancementPrompts[i]);
        const response = await result.response.text();
        enhancedResponse = response;
      } catch (error) {
        console.error(`Error in enhancement step ${i + 1}:`, error);
      }
      
      setProcessingSources(prev => 
        prev.map((source, idx) => 
          idx === i 
            ? { ...source, completed: true, text: `Completed enhancement ${i + 1}/4` } 
            : source
        )
      );
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return enhancedResponse;
  };

  const currentMessageId = useRef(null);

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsBotTyping(false);
    setProcessingSources([]);
  };

  const handleSendMessage = async (messageText, files = []) => {
    const trimmedMessage = messageText.trim();
    if ((!trimmedMessage && files.length === 0) || isBotTyping) return;

    const controller = new AbortController();
    setAbortController(controller);
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      const userMessage = { role: 'user', content: trimmedMessage };
      const updatedHistory = [...chatHistory, userMessage];
      setChatHistory(updatedHistory);

      if (trimmedMessage) {
        const newMessage = createMessageObject(trimmedMessage, false);
        setMessages(prev => [...prev, newMessage]);
      }

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

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      setTimeout(() => {
        scrollToBottom('smooth');
      }, 50);

      const startTime = Date.now();

      const relevantMemories = await findRelevantMemories(trimmedMessage);
      
      const contextMessages = updatedHistory.slice(-15).map(msg => {
        return msg.role === 'user' ? `User: ${msg.content}` : `AI: ${msg.content}`;
      }).join('\n');

      const fullPrompt = `${
        relevantMemories ? `Relevant Memory Context:\n${relevantMemories}\n\n` : ''
      }Current Conversation:\n${contextMessages}\n\nUser: "${trimmedMessage}". 
      Respond naturally in the user's language. Be friendly and human-like. ${
        isProMode ? 'Provide an extremely detailed response with examples, explanations, and multiple perspectives.' : 'Be concise but helpful'
      }`;

      const messageId = Date.now().toString();
      currentMessageId.current = messageId;
      
      setMessages(prev => [...prev, {
        id: messageId,
        text: isProMode ? 'Processing with Pro Mode (this may take a moment)...' : '',
        isBot: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: 0,
        file: null
      }]);

      if (isProMode) {
        setProcessingSources([
          { id: '1', text: 'Analyzing question', icon: <FiSearch />, completed: false },
          { id: '2', text: 'Searching memories', icon: <FiDatabase />, completed: false },
          { id: '3', text: 'Generating response', icon: <FiCpu />, completed: false },
          { id: '4', text: 'Quality check', icon: <FiAward />, completed: false }
        ]);
      }

      let botResponse;
      if (isProMode) {
        const initialResult = await model.generateContent(fullPrompt);
        const initialResponse = await initialResult.response.text();
        botResponse = await enhanceWithProMode(initialResponse, fullPrompt);
      } else {
        const result = await model.generateContent(fullPrompt);
        botResponse = await result.response.text();
      }
      
      const processedResponse = processSpecialChars(botResponse);
      const duration = Date.now() - startTime;

      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, text: processedResponse, duration } 
          : msg
      ));

      if (!isProMode) {
        await typeMessage(processedResponse, (typedText) => {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, text: typedText } : msg
          ));
        });
      }

      const botMessage = { role: 'assistant', content: botResponse };
      const newChatHistory = [...updatedHistory, botMessage];
      setChatHistory(newChatHistory);

      await autoSaveToMemory();

    } catch (error) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Response stopped by user'
        : 'Sorry, something went wrong with the AI service...';
      
      setMessages(prev => [...prev, createMessageObject(errorMessage, true)]);
    } finally {
      setIsBotTyping(false);
      setFileProcessing(false);
      setProcessingSources([]);
      clearTimeout(timeoutId);
      setAbortController(null);
      currentMessageId.current = null;
    }
  };

  const handleTemplateButtonClick = (templateMessage) => {
    handleSendMessage(templateMessage);
  };

  const processSpecialChars = (text) => {
    const withLists = text.replace(/^\s*[\*\-+]\s+(.+)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)+/g, (match) => `<ul>${match}</ul>`);
    
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const withCodeBlocks = withLists.replace(codeBlockRegex, (match, language, code) => {
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

  const toggleExpandRoom = (roomId) => {
    setExpandedRoomId(expandedRoomId === roomId ? null : roomId);
  };

  // Modern theme classes
  const themeClasses = darkMode ? {
    bgPrimary: 'bg-gray-950',
    bgSecondary: 'bg-gray-900',
    bgTertiary: 'bg-gray-800',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-300',
    textTertiary: 'text-gray-400',
    border: 'border-gray-800',
    hoverBg: 'hover:bg-gray-800',
    inputBg: 'bg-gray-900',
    inputBorder: 'border-gray-800',
    inputText: 'text-gray-100',
    buttonBg: 'bg-blue-600',
    buttonHover: 'hover:bg-blue-500',
    buttonText: 'text-white',
    cardBg: 'bg-gray-900',
    codeBg: 'bg-gray-950',
    codeBorder: 'border-gray-800',
    codeText: 'text-gray-100',
    typingDot: 'bg-gray-400',
    proModeBg: 'bg-gradient-to-r from-purple-600 to-blue-600',
    userMessageBg: 'bg-gray-800',
    aiMessageBg: 'bg-gradient-to-br from-blue-600 to-indigo-700'
  } : {
    bgPrimary: 'bg-gray-50',
    bgSecondary: 'bg-white',
    bgTertiary: 'bg-gray-100',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textTertiary: 'text-gray-500',
    border: 'border-gray-200',
    hoverBg: 'hover:bg-gray-100',
    inputBg: 'bg-white',
    inputBorder: 'border-gray-300',
    inputText: 'text-gray-800',
    buttonBg: 'bg-blue-600',
    buttonHover: 'hover:bg-blue-500',
    buttonText: 'text-white',
    cardBg: 'bg-white',
    codeBg: 'bg-gray-50',
    codeBorder: 'border-gray-200',
    codeText: 'text-gray-800',
    typingDot: 'bg-gray-500',
    proModeBg: 'bg-gradient-to-r from-purple-500 to-blue-500',
    userMessageBg: 'bg-gray-100',
    aiMessageBg: 'bg-gradient-to-br from-blue-500 to-indigo-600'
  };

  return (
    <div className={`flex flex-col h-screen ${themeClasses.bgPrimary} ${themeClasses.textPrimary} relative overflow-hidden transition-colors duration-300`}>
      {/* Header */}
      <div className={`${themeClasses.bgSecondary} ${themeClasses.border} p-3 flex items-center justify-between sticky top-0 z-10 shadow-sm`}>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowChatHistory(!showChatHistory)}
            className={`p-1.5 rounded-full ${themeClasses.hoverBg} transition-colors`}
            title="Chat history"
          >
            <FiMessageSquare size={18} className={themeClasses.textSecondary} />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <div>
            <h2 className="font-semibold text-sm">Orion AI</h2>
            <p className="text-xs flex items-center">
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
                  Online {isProMode && <span className="ml-1 text-blue-400">(Pro Mode)</span>}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={toggleDarkMode}
            className={`p-1.5 rounded-full transition-colors ${themeClasses.hoverBg}`}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <FiSun size={18} className="text-yellow-300" /> : <FiMoon size={18} />}
          </button>
          <button 
            onClick={toggleProMode}
            className={`p-1.5 rounded-full transition-colors ${isProMode ? `${themeClasses.proModeBg} text-white` : themeClasses.hoverBg}`}
            title={isProMode ? 'Disable Pro Mode' : 'Enable Pro Mode'}
          >
            <FiZap size={18} className={isProMode ? "text-yellow-200" : ""} />
          </button>
          <button 
            onClick={() => setShowMemoryPanel(!showMemoryPanel)}
            className={`p-1.5 rounded-full transition-colors ${showMemoryPanel ? `${themeClasses.bgTertiary} ${themeClasses.textPrimary}` : themeClasses.hoverBg}`}
            title="Memory"
          >
            <FiCpu size={18} />
          </button>
          <button
            onClick={createNewChatRoom}
            className={`p-1.5 rounded-full ${themeClasses.hoverBg} transition-colors`}
            title="New Chat"
          >
            <FiPlus size={18} />
          </button>
        </div>
      </div>

      {/* Chat History Panel */}
      {showChatHistory && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: "spring", damping: 25 }}
          className={`absolute left-3 top-14 ${themeClasses.cardBg} rounded-xl shadow-xl z-20 ${themeClasses.border} w-72`}
        >
          <div className={`p-3 ${themeClasses.border} flex justify-between items-center`}>
            <h4 className="font-medium text-sm">Chat History</h4>
            <button 
              onClick={() => setShowChatHistory(false)}
              className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.textPrimary}`}
            >
              <FiX size={18} />
            </button>
          </div>
          
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto scrollbar-thin text-sm">
            {chatRooms.length === 0 ? (
              <div className="p-4 text-center text-sm">
                No chat history yet
              </div>
            ) : (
              <div className={`divide-y ${themeClasses.border}`}>
                {chatRooms.map((room) => (
                  <div 
                    key={room.id} 
                    className={`p-3 hover:${themeClasses.bgTertiary} transition-colors cursor-pointer ${room.id === currentRoomId ? `${themeClasses.bgTertiary}` : ''}`}
                    onClick={() => switchChatRoom(room.id)}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-medium break-words pr-2">
                        {room.name}
                      </p>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandRoom(room.id);
                          }}
                          className="text-gray-400 hover:text-gray-500 text-xs"
                        >
                          {expandedRoomId === room.id ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChatRoom(room.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs transition-opacity"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs mt-1 text-gray-400">
                      {new Date(room.createdAt).toLocaleString()}
                    </p>
                    {expandedRoomId === room.id && room.messages.length > 0 && (
                      <div className="mt-2 text-xs space-y-1 max-h-40 overflow-y-auto">
                        {room.messages.slice(-3).map((msg, idx) => (
                          <div key={idx} className={`p-2 rounded-lg ${msg.isBot ? themeClasses.aiMessageBg + ' text-white' : themeClasses.userMessageBg}`}>
                            <div className="flex items-center mb-1">
                              {msg.isBot ? (
                                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center mr-2">
                                  <span className="text-2xs">AI</span>
                                </div>
                              ) : (
                                <FiUser size={12} className="mr-2" />
                              )}
                              <span className="font-medium text-xs">{msg.isBot ? 'AI' : 'You'}</span>
                            </div>
                            <p className="text-xs truncate">
                              {msg.text.replace(/<[^>]*>?/gm, '').substring(0, 60)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Chat Area */}
      <div 
        ref={chatContainerRef}
        className={`flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin ${themeClasses.bgPrimary}`}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full pb-16">
            <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
              <span className="text-3xl text-white">AI</span>
            </div>
            <h3 className="text-2xl font-semibold text-center mb-2">
              Hello, I'm Orion AI
            </h3>
            <p className="text-center mb-8 max-w-md text-gray-400">
              Your intelligent assistant with automatic memory. Ask me anything.
            </p>
            
            {showTemplateButtons && (
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                <button
                  onClick={() => handleTemplateButtonClick("Hello! How are you today?")}
                  className={`${themeClasses.cardBg} hover:${themeClasses.bgTertiary} ${themeClasses.border} rounded-xl p-3 text-sm transition-all hover:shadow-sm text-left group`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                    <FiMessageSquare size={16} />
                  </div>
                  <span className="font-medium">Say hello</span>
                  <p className="text-xs mt-1 text-gray-400">Start a conversation</p>
                </button>
                <button
                  onClick={() => handleTemplateButtonClick("Brainstorm some creative ideas for my project about...")}
                  className={`${themeClasses.cardBg} hover:${themeClasses.bgTertiary} ${themeClasses.border} rounded-xl p-3 text-sm transition-all hover:shadow-sm text-left group`}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2 group-hover:bg-purple-200 transition-colors">
                    <FiLightbulb size={16} />
                  </div>
                  <span className="font-medium">Brainstorm</span>
                  <p className="text-xs mt-1 text-gray-400">Get creative ideas</p>
                </button>
                <button
                  onClick={() => handleTemplateButtonClick("Explain how machine learning works in simple terms")}
                  className={`${themeClasses.cardBg} hover:${themeClasses.bgTertiary} ${themeClasses.border} rounded-xl p-3 text-sm transition-all hover:shadow-sm text-left group`}
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2 group-hover:bg-green-200 transition-colors">
                    <FiHelpCircle size={16} />
                  </div>
                  <span className="font-medium">Explain</span>
                  <p className="text-xs mt-1 text-gray-400">Get clear explanations</p>
                </button>
                <button
                  onClick={() => handleTemplateButtonClick("Help me debug this code...")}
                  className={`${themeClasses.cardBg} hover:${themeClasses.bgTertiary} ${themeClasses.border} rounded-xl p-3 text-sm transition-all hover:shadow-sm text-left group`}
                >
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2 group-hover:bg-orange-200 transition-colors">
                    <FiCode size={16} />
                  </div>
                  <span className="font-medium">Code help</span>
                  <p className="text-xs mt-1 text-gray-400">Debug or explain code</p>
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
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[90%] md:max-w-[80%] ${message.isBot ? 
                `${themeClasses.aiMessageBg} text-white` : 
                `${themeClasses.userMessageBg} ${themeClasses.textPrimary}`} rounded-2xl p-4 shadow-xs`}
              >
                {message.isBot && (
                  <div className="flex items-center mb-2">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mr-2">
                      <span className="text-2xs">AI</span>
                    </div>
                    <span className="text-xs font-medium">Orion AI</span>
                  </div>
                )}
                
                {message.file ? (
                  <div>
                    <p className={`text-xs mb-1 ${message.isBot ? 'text-blue-100' : themeClasses.textTertiary}`}>File: {message.file.name}</p>
                    {message.file.type.startsWith('image/') && (
                      <img 
                        src={URL.createObjectURL(message.file)} 
                        alt="Uploaded" 
                        className="mt-1 max-w-full h-auto rounded-lg border border-gray-200 shadow-sm" 
                      />
                    )}
                  </div>
                ) : (
                  <div 
                    className={`text-sm ${message.isBot ? 'text-white' : themeClasses.textPrimary}`}
                    dangerouslySetInnerHTML={{ __html: message.text }} 
                  />
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${message.isBot ? 'text-blue-100' : themeClasses.textTertiary}`}>
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
        <div ref={messagesEndRef} />
      </div>

      {/* Memory Panel */}
      {showMemoryPanel && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className={`absolute right-3 top-14 ${themeClasses.cardBg} rounded-xl shadow-xl z-20 ${themeClasses.border} w-72`}
        >
          <div className={`p-3 ${themeClasses.border} flex justify-between items-center`}>
            <h4 className="font-medium text-sm flex items-center">
              <FiCpu className="mr-2" size={14} /> Memory Context
            </h4>
            <div className="flex items-center space-x-2">
              <button 
                onClick={autoSaveToMemory}
                disabled={messages.length === 0}
                className={`text-xs ${themeClasses.bgTertiary} hover:${themeClasses.bgSecondary} px-2 py-1 rounded-lg transition-colors disabled:opacity-50`}
              >
                Remember
              </button>
              <button 
                onClick={() => setShowMemoryPanel(false)}
                className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.textPrimary}`}
              >
                <FiX size={16} />
              </button>
            </div>
          </div>
          
          <div className="max-h-72 overflow-y-auto scrollbar-thin text-sm">
            {memories.length === 0 ? (
              <div className="p-4 text-center text-sm">
                No memories yet. Important context will appear here.
              </div>
            ) : (
              <div className={`divide-y ${themeClasses.border}`}>
                {memories.map((memory) => (
                  <div key={memory.id} className={`p-3 hover:${themeClasses.bgTertiary} transition-colors group`}>
                    <div className="flex justify-between items-start">
                      <p className="text-xs break-words pr-2">{memory.summary}</p>
                      <button
                        onClick={() => deleteMemory(memory.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs transition-opacity"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs mt-1 text-gray-400">{memory.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Typing Indicator */}
      {(isBotTyping || fileProcessing) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 right-4 z-10"
        >
          <div className={`${themeClasses.cardBg} ${themeClasses.border} rounded-2xl p-3 shadow-lg max-w-xs`}>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <motion.span
                  className="typing-dot"
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <motion.span
                  className="typing-dot"
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                />
                <motion.span
                  className="typing-dot"
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
                />
              </div>
              <span className="text-sm">
                {fileProcessing ? 'Processing files...' : 
                 isProMode ? 'Processing deeply...' : 'Thinking...'}
              </span>
              <button
                onClick={stopGeneration}
                className="ml-2 text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded-full transition-colors flex items-center"
              >
                <FiStopCircle size={12} className="mr-1" />
                Stop
              </button>
            </div>

            {isProMode && processingSources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  {processingSources.map((source) => (
                    <div key={source.id} className="flex items-center space-x-2">
                      <span className={`text-xs ${source.completed ? 'text-green-500' : 'text-blue-500'}`}>
                        {source.icon}
                      </span>
                      <span className="text-xs">
                        {source.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Bottom Input Container */}
      <div className={`${themeClasses.border} ${themeClasses.bgSecondary} pt-2 pb-3 px-4`}>
        {/* File Preview */}
        {pendingFiles.length > 0 && (
          <div className={`flex items-center space-x-2 p-2 ${themeClasses.border} overflow-x-auto scrollbar-thin ${themeClasses.bgTertiary} rounded-t-lg`}>
            {pendingFiles.map((file, index) => (
              <div key={index} className="relative flex-shrink-0">
                <div className={`w-14 h-14 flex items-center justify-center ${themeClasses.cardBg} rounded-lg ${themeClasses.border} overflow-hidden shadow-sm`}>
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
                <button
                  onClick={() => {
                    const newFiles = [...pendingFiles];
                    newFiles.splice(index, 1);
                    setPendingFiles(newFiles);
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow"
                >
                  <FiX size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Main Input Area */}
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
            className={`w-full ${themeClasses.inputBg} ${themeClasses.inputBorder} rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden transition-all duration-200 text-sm ${themeClasses.inputText}`}
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          
          <div className="absolute right-2 bottom-2 flex items-center space-x-1">
            {inputMessage && (
              <button
                onClick={() => setInputMessage('')}
                className={`p-1.5 rounded-full ${themeClasses.hoverBg} transition-colors`}
              >
                <FiX size={16} />
              </button>
            )}
            
            {isBotTyping ? (
              <motion.button
                onClick={stopGeneration}
                className="p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors shadow"
                title="Stop generation"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiStopCircle size={16} />
              </motion.button>
            ) : (
              <>
                <button
                  onClick={() => setShowFileOptions(!showFileOptions)}
                  className={`p-1.5 rounded-full transition-colors ${showFileOptions ? `${themeClasses.bgTertiary}` : themeClasses.hoverBg}`}
                  title="Attach files"
                >
                  <FiPlus size={16} />
                </button>
                <motion.button
                  onClick={() => handleSendMessage(inputMessage, pendingFiles)}
                  disabled={(!inputMessage.trim() && pendingFiles.length === 0) || isBotTyping}
                  className={`p-1.5 rounded-full transition-all ${inputMessage.trim() || pendingFiles.length > 0 ? 
                    'bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow' : 
                    'text-gray-400 hover:text-gray-500 hover:bg-gray-100'}`}
                  whileHover={{ 
                    scale: inputMessage.trim() || pendingFiles.length > 0 ? 1.05 : 1,
                    rotate: inputMessage.trim() || pendingFiles.length > 0 ? 5 : 0
                  }}
                  whileTap={{ scale: 0.95 }}
                  title="Send message"
                >
                  <FiSend size={16} />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* File Options */}
        {showFileOptions && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex space-x-2 pt-2"
          >
            <motion.label 
              className={`cursor-pointer p-2 rounded-lg transition-colors ${themeClasses.hoverBg}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Upload image"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                multiple
              />
              <FiImage size={18} />
            </motion.label>
            <motion.label 
              className={`cursor-pointer p-2 rounded-lg transition-colors ${themeClasses.hoverBg}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Upload file"
            >
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                multiple
              />
              <FiFile size={18} />
            </motion.label>
          </motion.div>
        )}
      </div>
      
      <style jsx global>{`
        .typing-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: currentColor;
        }

        .code-container {
          background: ${darkMode ? '#1e293b' : '#f8fafc'};
          border-radius: 12px;
          margin: 1em 0;
          overflow: hidden;
          border: 1px solid ${darkMode ? '#334155' : '#e2e8f0'};
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .code-container:hover {
          box-shadow: 0 6px 16px rgba(0,0,0,0.05);
          transform: translateY(-2px);
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

        .language-tag {
          background: ${darkMode ? '#334155' : '#e2e8f0'};
          padding: 0.3em 0.8em;
          border-radius: 8px;
          font-size: 0.8em;
          font-weight: 500;
          letter-spacing: 0.02em;
          transition: all 0.2s ease;
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
        .copy-button:active {
          transform: translateY(0);
        }

        .code-block {
          margin: 0;
          padding: 1em;
          color: black;
          overflow-x: auto;
          font-family: 'Fira Code', 'JetBrains Mono', 'Courier New', monospace;
          font-size: 0.9em;
          line-height: 1.6;
          color: ${darkMode ? '#f1f5f9' : '#1e293b'};
          background: ${darkMode ? '#1e293b' : '#f8fafc'};
          scrollbar-width: thin;
          scrollbar-color: ${darkMode ? '#475569' : '#cbd5e1'} transparent;
        }
        .code-block::-webkit-scrollbar {
          height: 6px;
        }
        .code-block::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#475569' : '#cbd5e1'};
          border-radius: 3px;
        }
        .code-block code {
          font-family: inherit;
          font-variant-ligatures: contextual;
        }

        .copy-notification {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          background: rgba(15,23,42,0.95);
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 0.9em;
          z-index: 1000;
          animation: slideUp 0.3s ease-out forwards, fadeOut 0.5s ease-in 1.5s forwards;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          font-weight: 500;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeOut {
          to { opacity: 0; }
        }

        .prose {
          max-width: 100%;
          font-size: 0.95rem;
          line-height: 1.7;
          color: ${darkMode ? '#e2e8f0' : '#334155'};
        }
        .prose ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .prose li {
          margin: 0.25em 0;
        }
        .prose code:not(.code-block code) {
          background: ${darkMode ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.15)'};
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.85em;
          transition: background 0.2s ease;
        }
        .prose code:not(.code-block code):hover {
          background: ${darkMode ? 'rgba(148,163,184,0.3)' : 'rgba(148,163,184,0.25)'};
        }
        .prose strong {
          font-weight: 600;
          color: ${darkMode ? '#f8fafc' : '#1e293b'};
        }
        .prose a {
          color: #3b82f6;
          text-decoration: none;
          transition: all 0.2s ease;
          border-bottom: 1px solid transparent;
        }
        .prose a:hover {
          color: #2563eb;
          border-bottom-color: currentColor;
        }
        .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          transition: transform 0.3s ease;
        }
        .prose img:hover {
          transform: scale(1.02);
        }
        .prose blockquote {
          border-left: 3px solid ${darkMode ? '#334155' : '#e2e8f0'};
          padding-left: 1.25em;
          margin: 1em 0;
          color: ${darkMode ? '#94a3b8' : '#475569'};
          font-style: italic;
          transition: border-color 0.3s ease;
        }
        .prose blockquote:hover {
          border-left-color: ${darkMode ? '#64748b' : '#94a3b8'};
        }
        .prose hr {
          border: none;
          border-top: 1px solid ${darkMode ? '#334155' : '#e2e8f0'};
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
          background: ${darkMode ? '#64748b' : '#94a3b8'};
        }
      `}</style>
    </div>
  );
};

export default ChatBot;
