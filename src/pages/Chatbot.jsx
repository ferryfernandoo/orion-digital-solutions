import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  FiCopy, FiSend, FiPlus, FiX, FiImage, FiFile, FiTrash2, 
  FiClock, FiCpu, FiZap, FiStopCircle, FiMessageSquare,
  FiSun, FiMoon, FiSearch, FiDatabase, FiAward, 
  FiChevronDown, FiGlobe, FiExternalLink, FiCode
} from 'react-icons/fi';
import { RiSendPlaneFill } from 'react-icons/ri';
import { SiJavascript, SiPython, SiHtml5, SiCss3, SiTypescript } from 'react-icons/si';
import { FaRobot } from 'react-icons/fa';

// Web search implementation
const performWebSearch = async (query) => {
  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
    const data = await response.json();
    
    return data.RelatedTopics
      .filter(topic => topic.FirstURL && topic.Text)
      .map(topic => ({
        title: topic.Text.replace(/<[^>]*>?/gm, ''),
        url: topic.FirstURL,
        snippet: topic.Text.replace(/<[^>]*>?/gm, '')
      }))
      .slice(0, 5);
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
};

const scrapeWebsiteContent = async (url) => {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const html = data.contents;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const unwantedElements = doc.querySelectorAll('script, style, nav, footer, iframe, img');
    unwantedElements.forEach(el => el.remove());
    
    return doc.body.textContent
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000);
  } catch (error) {
    console.error("Scraping error:", error);
    return null;
  }
};

// Language icons for code blocks
const languageIcons = {
  javascript: <SiJavascript className="text-yellow-400" />,
  python: <SiPython className="text-blue-400" />,
  html: <SiHtml5 className="text-orange-500" />,
  css: <SiCss3 className="text-blue-500" />,
  typescript: <SiTypescript className="text-blue-600" />,
  default: <FiCode className="text-gray-400" />
};

const ChatBot = () => {
  // State management
  const [state, setState] = useState({
    chatRooms: [],
    currentRoomId: null,
    messages: [],
    inputMessage: '',
    isBotTyping: false,
    showTemplateButtons: true,
    showFileOptions: false,
    pendingFiles: [],
    chatHistory: [],
    showMemoryPanel: false,
    memories: [],
    isProMode: false,
    showChatHistory: false,
    darkMode: false,
    fileProcessing: false,
    processingSources: [],
    autoScroll: true,
    showScrollButton: false,
    searchMode: false,
    searchResults: [],
    activeMemory: null
  });

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messageCountRef = useRef(0);
  const abortControllerRef = useRef(null);

  // Initialize AI model
  const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      const savedData = {
        memories: localStorage.getItem('orionMemories'),
        chatRooms: localStorage.getItem('orionChatRooms'),
        currentRoom: localStorage.getItem('orionCurrentRoom'),
        proMode: localStorage.getItem('orionProMode'),
        darkMode: localStorage.getItem('orionDarkMode')
      };

      const newState = { ...state };

      if (savedData.memories) newState.memories = JSON.parse(savedData.memories);
      if (savedData.chatRooms) newState.chatRooms = JSON.parse(savedData.chatRooms);
      if (savedData.currentRoom) {
        newState.currentRoomId = savedData.currentRoom;
        const room = newState.chatRooms.find(r => r.id === savedData.currentRoom);
        if (room) {
          newState.messages = room.messages || [];
          newState.chatHistory = room.history || [];
        }
      }
      if (savedData.proMode) newState.isProMode = savedData.proMode === 'true';
      if (savedData.darkMode) newState.darkMode = savedData.darkMode === 'true';

      setState(newState);

      if (!savedData.currentRoom && (!savedData.chatRooms || JSON.parse(savedData.chatRooms).length === 0)) {
        createNewChatRoom();
      }
    };

    loadData();
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (state.currentRoomId) {
      const updatedRooms = state.chatRooms.map(room => 
        room.id === state.currentRoomId 
          ? { ...room, messages: state.messages, history: state.chatHistory } 
          : room
      );
      
      localStorage.setItem('orionChatRooms', JSON.stringify(updatedRooms));
      localStorage.setItem('orionCurrentRoom', state.currentRoomId);
    }
  }, [state.messages, state.chatHistory, state.currentRoomId]);

  // Scroll handling
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setState(prev => ({ ...prev, autoScroll: isNearBottom, showScrollButton: !isNearBottom }));
    };

    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (state.autoScroll && state.messages.length > 0) {
      smoothScrollToBottom();
    }
  }, [state.messages, state.autoScroll]);

  // Helper functions
  const smoothScrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'nearest' });
  }, []);

  const scrollToBottomButton = () => {
    setState(prev => ({ ...prev, autoScroll: true }));
    smoothScrollToBottom();
  };

  const createMessageObject = (text, isBot, duration = 0, file = null, sources = []) => ({
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    text: DOMPurify.sanitize(text),
    isBot,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    duration,
    file,
    sources
  });

  // Core functionality
  const createNewChatRoom = () => {
    const newRoom = {
      id: Date.now().toString(),
      name: `Chat ${new Date().toLocaleTimeString()}`,
      messages: [],
      history: [],
      createdAt: new Date().toISOString(),
      context: state.activeMemory ? [state.activeMemory.id] : []
    };
    
    const updatedRooms = [newRoom, ...state.chatRooms];
    
    setState(prev => ({
      ...prev,
      chatRooms: updatedRooms,
      currentRoomId: newRoom.id,
      messages: [],
      chatHistory: [],
      pendingFiles: [],
      inputMessage: '',
      showTemplateButtons: true,
      searchMode: false,
      searchResults: []
    }));
    
    localStorage.setItem('orionChatRooms', JSON.stringify(updatedRooms));
    localStorage.setItem('orionCurrentRoom', newRoom.id);
  };

  const switchChatRoom = (roomId) => {
    const room = state.chatRooms.find(r => r.id === roomId);
    if (room) {
      setState(prev => ({
        ...prev,
        currentRoomId: roomId,
        messages: room.messages || [],
        chatHistory: room.history || [],
        showTemplateButtons: room.messages.length === 0,
        showChatHistory: false,
        autoScroll: true,
        searchMode: false,
        searchResults: []
      }));
      
      setTimeout(() => smoothScrollToBottom(), 50);
    }
  };

  const deleteChatRoom = (roomId) => {
    const updatedRooms = state.chatRooms.filter(room => room.id !== roomId);
    
    setState(prev => ({
      ...prev,
      chatRooms: updatedRooms
    }));
    
    localStorage.setItem('orionChatRooms', JSON.stringify(updatedRooms));
    
    if (state.currentRoomId === roomId) {
      if (updatedRooms.length > 0) {
        switchChatRoom(updatedRooms[0].id);
      } else {
        createNewChatRoom();
      }
    }
  };

  const extractTextFromFile = async (file) => {
    if (file.type.startsWith('image/')) {
      return "Extracted text from image (OCR simulation)";
    } else if (file.type === 'application/pdf') {
      return "Extracted text from PDF (simulation)";
    } else if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.docx')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsText(file);
      });
    }
    return `File content: ${file.name}`;
  };

  const summarizeConversation = async (conversation) => {
    try {
      const prompt = `Create a very concise summary (max 1 sentence) in the conversation's language. Focus on key facts, decisions, and important details. REMOVE all greetings and small talk.\n\nConversation:\n${conversation}`;
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      return response.replace(/[{}]/g, '').replace(/json/gi, '').replace(/```/g, '').trim();
    } catch (error) {
      console.error("Summarization error:", error);
      return "No summary available";
    }
  };

  const findRelevantMemories = async (query) => {
    if (state.memories.length === 0) return '';
    
    try {
      const allChatHistories = state.chatRooms.flatMap(room => 
        room.history?.map(msg => ({
          ...msg,
          roomId: room.id,
          roomName: room.name
        })) || []
      );
      
      const memoryTexts = state.memories.map(m => `[Memory ${m.date}]: ${m.summary}`).join('\n');
      const chatContext = allChatHistories
        .slice(-30)
        .map(msg => `[${msg.roomName} - ${msg.role === 'user' ? 'User' : 'Orion'}]: ${msg.content}`)
        .join('\n');
      
      const prompt = `Memory list:\n${memoryTexts}\n\nChat Context:\n${chatContext}\n\nQuestion: "${query}"\n\nIdentify only the most relevant memories (as many as needed). Return only comma-separated memory IDs, or empty if none are relevant.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      const relevantIds = response.trim().split(',').map(id => id.trim()).filter(Boolean);
      
      return state.memories
        .filter(m => relevantIds.includes(m.id))
        .map(m => `[Memory ${m.date}]: ${m.summary}\nDetails: ${m.messages.map(msg => `${msg.isBot ? 'Orion' : 'User'}: ${msg.text}`).join('\n')}`)
        .join('\n\n');
    } catch (error) {
      console.error("Memory search error:", error);
      return '';
    }
  };

  const autoSaveToMemory = useCallback(async () => {
    if (state.messages.length === 0 || messageCountRef.current % 3 !== 0) return;
    
    try {
      setState(prev => ({ ...prev, isBotTyping: true }));
      
      const conversationText = state.messages.map(msg => 
        `${msg.isBot ? 'Orion' : 'User'}: ${msg.text.replace(/<[^>]*>?/gm, '')}`
      ).join('\n');
      
      const summary = await summarizeConversation(conversationText);
      
      if (summary && !summary.includes("No summary")) {
        const newMemory = {
          id: Date.now().toString(),
          summary,
          date: new Date().toLocaleString(),
          messages: [...state.messages],
          relatedRooms: [state.currentRoomId]
        };
        
        const updatedMemories = [newMemory, ...state.memories];
        
        setState(prev => ({
          ...prev,
          memories: updatedMemories,
          activeMemory: newMemory
        }));
        
        localStorage.setItem('orionMemories', JSON.stringify(updatedMemories));
      }
    } catch (error) {
      console.error("Memory save error:", error);
    } finally {
      setState(prev => ({ ...prev, isBotTyping: false }));
    }
  }, [state.messages, state.currentRoomId, state.memories]);

  const typeMessage = async (fullText, callback) => {
    if (state.isProMode) {
      callback(fullText);
      return;
    }
    
    const characters = fullText.split('');
    let displayedText = '';
    
    for (let i = 0; i < characters.length; i++) {
      if (abortControllerRef.current?.signal.aborted) break;
      
      const chunkSize = Math.min(5 + Math.floor(Math.random() * 6), characters.length - i);
      displayedText += characters.slice(i, i + chunkSize).join('');
      
      callback(displayedText);
      i += chunkSize - 1;
      
      if (state.autoScroll) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 0);
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 20));
    }
    
    callback(fullText);
  };

  const enhanceWithProMode = async (initialResponse, prompt) => {
    const enhancementPrompts = [
      `Expand this response with detailed examples and explanations:\n\n${initialResponse}`,
      `Add technical details, use cases, and variations to:\n\n${initialResponse}`,
      `Provide multiple perspectives and practical applications:\n\n${initialResponse}`,
      `Create a final version incorporating all enhancements:\n\n${initialResponse}`
    ];
    
    let enhancedResponse = initialResponse;
    
    for (let i = 0; i < enhancementPrompts.length; i++) {
      if (abortControllerRef.current?.signal.aborted) break;
      
      setState(prev => ({
        ...prev,
        processingSources: [
          ...prev.processingSources,
          {
            id: Date.now().toString(),
            text: `Enhancement ${i + 1}/4`,
            icon: <FiDatabase />,
            completed: false,
            animation: i % 2 === 0 ? 'pulse' : 'wave'
          }
        ]
      }));
      
      try {
        const result = await model.generateContent(enhancementPrompts[i]);
        const response = await result.response.text();
        enhancedResponse = response;
      } catch (error) {
        console.error(`Enhancement error ${i + 1}:`, error);
      }
      
      setState(prev => ({
        ...prev,
        processingSources: prev.processingSources.map((source, idx) => 
          idx === i 
            ? { ...source, completed: true, text: `Completed enhancement ${i + 1}/4` } 
            : source
        )
      }));
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return enhancedResponse;
  };

  const performWebResearch = async (query) => {
    try {
      setState(prev => ({
        ...prev,
        processingSources: [
          ...prev.processingSources,
          {
            id: 'search-1',
            text: 'Searching web',
            icon: <FiGlobe />,
            completed: false,
            animation: 'pulse'
          }
        ]
      }));
      
      const searchResults = await performWebSearch(query);
      
      setState(prev => ({
        ...prev,
        searchResults,
        processingSources: [
          ...prev.processingSources,
          {
            id: 'search-2',
            text: 'Analyzing results',
            icon: <FiSearch />,
            completed: false,
            animation: 'wave'
          }
        ]
      }));
      
      const scrapedContents = await Promise.all(
        searchResults.slice(0, 3).map(async (result) => {
          const content = await scrapeWebsiteContent(result.url);
          return {
            title: result.title,
            url: result.url,
            content: content || result.snippet
          };
        })
      );
      
      const researchSummary = scrapedContents
        .filter(r => r.content)
        .map(r => `[Source: ${r.title} (${r.url})]\n${r.content.substring(0, 1000)}`)
        .join('\n\n');
      
      setState(prev => ({
        ...prev,
        processingSources: prev.processingSources.map(source => 
          source.id.startsWith('search') 
            ? { ...source, completed: true } 
            : source
        )
      }));
      
      return {
        summary: researchSummary,
        sources: scrapedContents.map(r => ({
          title: r.title,
          url: r.url,
          content: r.content?.substring(0, 200) || r.snippet
        }))
      };
    } catch (error) {
      console.error("Research error:", error);
      return {
        summary: "Web research failed",
        sources: []
      };
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isBotTyping: false,
      processingSources: []
    }));
  };

  const handleSendMessage = async (messageText, files = []) => {
    const trimmedMessage = messageText.trim();
    if ((!trimmedMessage && files.length === 0) || state.isBotTyping) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      // Add user message
      const userMessage = { role: 'user', content: trimmedMessage };
      const updatedHistory = [...state.chatHistory, userMessage];
      
      if (trimmedMessage) {
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, createMessageObject(trimmedMessage, false)],
          chatHistory: updatedHistory
        }));
      }

      // Handle file uploads
      if (files.length > 0) {
        setState(prev => ({ ...prev, fileProcessing: true }));
        
        for (const file of files) {
          const fileMessage = createMessageObject(`File: ${file.name}`, false, 0, file);
          
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, fileMessage]
          }));
          
          const fileContent = await extractTextFromFile(file);
          const contentMessage = createMessageObject(`File content:\n${fileContent}`, false);
          
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, contentMessage]
          }));
        }
        
        setState(prev => ({ ...prev, fileProcessing: false }));
      }

      // Prepare for bot response
      setState(prev => ({
        ...prev,
        inputMessage: '',
        pendingFiles: [],
        isBotTyping: true,
        showTemplateButtons: false,
        processingSources: [],
        messages: [
          ...prev.messages, 
          createMessageObject(
            state.isProMode ? 'Processing with Pro Mode...' : '', 
            true, 
            0, 
            null, 
            []
          )
        ]
      }));
      
      messageCountRef.current += 1;

      // Find relevant memories
      const relevantMemories = await findRelevantMemories(trimmedMessage);
      
      // Perform web research if needed
      let webResearchContent = { summary: '', sources: [] };
      if (state.searchMode === 'deep') {
        webResearchContent = await performWebResearch(trimmedMessage);
      } else if (state.searchMode === 'shallow') {
        const searchResults = await performWebSearch(trimmedMessage);
        webResearchContent = {
          summary: searchResults.map(r => `[${r.title}](${r.url})\n${r.snippet}`).join('\n\n'),
          sources: searchResults.map(r => ({
            title: r.title,
            url: r.url,
            content: r.snippet
          }))
        };
      }

      // Generate response
      const contextMessages = updatedHistory
        .slice(-15)
        .map(msg => `${msg.role === 'user' ? 'User' : 'Orion'}: ${msg.content}`)
        .join('\n');

      const fullPrompt = `${
        relevantMemories ? `Relevant Memories:\n${relevantMemories}\n\n` : ''
      }${
        webResearchContent.summary ? `Web Research:\n${webResearchContent.summary}\n\n` : ''
      }Conversation:\n${contextMessages}\n\nUser: "${trimmedMessage}"\n\nRespond as Orion AI assistant, be helpful, detailed, and maintain context. ${
        state.isProMode ? 'Provide extremely detailed response with examples.' : 'Be concise but helpful.'
      }`;

      let botResponse;
      if (state.isProMode) {
        const initialResult = await model.generateContent(fullPrompt);
        const initialResponse = await initialResult.response.text();
        botResponse = await enhanceWithProMode(initialResponse, fullPrompt);
      } else {
        const result = await model.generateContent(fullPrompt);
        botResponse = await result.response.text();
      }

      // Update message with response
      setState(prev => ({
        ...prev,
        messages: prev.messages.map((msg, idx) => 
          idx === prev.messages.length - 1
            ? { 
                ...msg, 
                text: processSpecialChars(botResponse),
                duration: Date.now() - msg.time,
                sources: webResearchContent.sources
              }
            : msg
        ),
        chatHistory: [...updatedHistory, { role: 'assistant', content: botResponse }]
      }));

      // Type out the message
      if (!state.isProMode) {
        await typeMessage(processSpecialChars(botResponse), (typedText) => {
          setState(prev => ({
            ...prev,
            messages: prev.messages.map((msg, idx) => 
              idx === prev.messages.length - 1
                ? { ...msg, text: typedText }
                : msg
            )
          }));
        });
      }

      // Auto-save to memory
      await autoSaveToMemory();

    } catch (error) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Response stopped' 
        : 'Error: Failed to get response';
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, createMessageObject(errorMessage, true)]
      }));
    } finally {
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setState(prev => ({
        ...prev,
        isBotTyping: false,
        fileProcessing: false,
        processingSources: []
      }));
    }
  };

  const processSpecialChars = (text) => {
    // Process code blocks with language detection
    const withCodeBlocks = text.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, language, code) => {
      const cleanCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const lang = language?.toLowerCase() || 'plaintext';
      const icon = languageIcons[lang] || languageIcons.default;
      
      return `
      <div class="code-container">
        <div class="code-toolbar">
          <div class="flex items-center">
            ${icon.outerHTML || ''}
            <span class="language-tag">${lang}</span>
          </div>
          <div class="flex space-x-2">
            <button class="copy-button" data-code="${encodeURIComponent(cleanCode)}">
              <FiCopy /> Copy
            </button>
            <button class="copy-button" data-code="${encodeURIComponent(text.replace(/<[^>]*>?/gm, ''))}">
              <FiCopy /> Copy All
            </button>
          </div>
        </div>
        <pre class="code-block"><code class="language-${lang}">${cleanCode}</code></pre>
      </div>
      `;
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

  // UI helpers
  const toggleDarkMode = () => {
    const newDarkMode = !state.darkMode;
    setState(prev => ({ ...prev, darkMode: newDarkMode }));
    localStorage.setItem('orionDarkMode', newDarkMode.toString());
  };

  const toggleProMode = () => {
    const newProMode = !state.isProMode;
    setState(prev => ({ ...prev, isProMode: newProMode }));
    localStorage.setItem('orionProMode', newProMode.toString());
  };

  const toggleSearchMode = () => {
    setState(prev => ({
      ...prev,
      searchMode: prev.searchMode === false ? 'shallow' : 
                 prev.searchMode === 'shallow' ? 'deep' : false
    }));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setState(prev => ({
        ...prev,
        pendingFiles: files,
        showFileOptions: false
      }));
    }
  };

  const deleteMemory = (id) => {
    const updatedMemories = state.memories.filter(memory => memory.id !== id);
    setState(prev => ({
      ...prev,
      memories: updatedMemories,
      activeMemory: prev.activeMemory?.id === id ? null : prev.activeMemory
    }));
    localStorage.setItem('orionMemories', JSON.stringify(updatedMemories));
  };

  const setActiveMemory = (memory) => {
    setState(prev => ({
      ...prev,
      activeMemory: memory,
      showMemoryPanel: false
    }));
  };

  // Theme classes
  const themeClasses = state.darkMode ? {
    bgPrimary: 'bg-gray-900',
    bgSecondary: 'bg-gray-800',
    bgTertiary: 'bg-gray-700',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-300',
    textTertiary: 'text-gray-400',
    border: 'border-gray-700',
    hoverBg: 'hover:bg-gray-700',
    inputBg: 'bg-gray-800',
    inputBorder: 'border-gray-700',
    inputText: 'text-gray-100',
    buttonBg: 'bg-blue-700',
    buttonHover: 'hover:bg-blue-600',
    buttonText: 'text-white',
    cardBg: 'bg-gray-800',
    codeBg: 'bg-gray-900',
    codeBorder: 'border-gray-700',
    codeText: 'text-gray-100'
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
    codeText: 'text-gray-800'
  };

  // Set up copy handlers
  useEffect(() => {
    const handleCopyClick = (e) => {
      if (e.target.closest('.copy-button')) {
        const code = decodeURIComponent(e.target.closest('.copy-button').dataset.code);
        navigator.clipboard.writeText(code)
          .then(() => {
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.textContent = 'Copied!';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 2000);
          })
          .catch(err => console.error('Copy failed:', err));
      }
    };

    document.addEventListener('click', handleCopyClick);
    return () => document.removeEventListener('click', handleCopyClick);
  }, []);

  return (
    <div className={`flex flex-col h-screen ${themeClasses.bgPrimary} ${themeClasses.textPrimary} transition-colors duration-300`}>
      {/* Header */}
      <div className={`${themeClasses.bgSecondary} ${themeClasses.border} p-3 flex items-center justify-between sticky top-0 z-20 shadow-sm`}>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setState(prev => ({ ...prev, showChatHistory: !prev.showChatHistory }))}
            className={`p-1.5 rounded-full ${themeClasses.hoverBg} transition-colors`}
            title="Chat history"
          >
            <FiMessageSquare size={16} className={themeClasses.textSecondary} />
          </button>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow">
            <FaRobot className="text-white text-sm" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Orion AI</h2>
            <p className="text-xs flex items-center">
              {state.isBotTyping ? (
                <span className="flex items-center">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="ml-1">Thinking...</span>
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                  Online {state.isProMode && <span className="ml-1 text-blue-400">(Pro Mode)</span>}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={toggleDarkMode}
            className={`p-1.5 rounded-full transition-colors ${themeClasses.hoverBg}`}
            title={state.darkMode ? 'Light mode' : 'Dark mode'}
          >
            {state.darkMode ? <FiSun size={16} className="text-yellow-300" /> : <FiMoon size={16} />}
          </button>
          <button 
            onClick={toggleProMode}
            className={`p-1.5 rounded-full transition-colors ${state.isProMode ? 'bg-blue-100 text-blue-600' : themeClasses.hoverBg}`}
            title={state.isProMode ? 'Disable Pro Mode' : 'Enable Pro Mode'}
          >
            <FiZap size={16} className={state.isProMode ? "text-yellow-500" : ""} />
          </button>
          <button 
            onClick={() => setState(prev => ({ ...prev, showMemoryPanel: !prev.showMemoryPanel }))}
            className={`p-1.5 rounded-full transition-colors ${state.showMemoryPanel ? `${themeClasses.bgTertiary} ${themeClasses.textPrimary}` : themeClasses.hoverBg}`}
            title="Memory"
          >
            <FiCpu size={16} />
          </button>
          <button
            onClick={createNewChatRoom}
            className={`p-1.5 rounded-full ${themeClasses.hoverBg} transition-colors`}
            title="New Chat"
          >
            <FiPlus size={16} />
          </button>
        </div>
      </div>

      {/* Chat History Panel */}
      {state.showChatHistory && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: "spring", damping: 25 }}
          className={`absolute left-3 top-14 ${themeClasses.cardBg} rounded-xl shadow-xl z-30 ${themeClasses.border} w-72`}
        >
          <div className={`p-3 ${themeClasses.border} flex justify-between items-center`}>
            <h4 className="font-medium text-sm">Chat History</h4>
            <button 
              onClick={() => setState(prev => ({ ...prev, showChatHistory: false }))}
              className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.textPrimary}`}
            >
              <FiX size={16} />
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto scrollbar-thin text-sm">
            {state.chatRooms.length === 0 ? (
              <div className="p-4 text-center text-sm">
                No chat history yet
              </div>
            ) : (
              <div className={`divide-y ${themeClasses.border}`}>
                {state.chatRooms.map((room) => (
                  <div 
                    key={room.id} 
                    className={`p-3 hover:${themeClasses.bgTertiary} transition-colors cursor-pointer group ${room.id === state.currentRoomId ? `${themeClasses.bgTertiary}` : ''}`}
                    onClick={() => switchChatRoom(room.id)}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-medium break-words pr-2">
                        {room.name}
                      </p>
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
                    <p className="text-xs mt-1">
                      {new Date(room.createdAt).toLocaleString()}
                    </p>
                    {room.messages.length > 0 && (
                      <p className="text-xs mt-1 truncate">
                        {room.messages[room.messages.length - 1].text.replace(/<[^>]*>?/gm, '').substring(0, 50)}...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Memory Panel */}
      {state.showMemoryPanel && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className={`absolute right-3 top-14 ${themeClasses.cardBg} rounded-xl shadow-xl z-30 ${themeClasses.border} w-72`}
        >
          <div className={`p-3 ${themeClasses.border} flex justify-between items-center`}>
            <h4 className="font-medium text-sm flex items-center">
              <FiCpu className="mr-2" size={14} /> Memory Context
            </h4>
            <div className="flex items-center space-x-2">
              <button 
                onClick={autoSaveToMemory}
                disabled={state.messages.length === 0}
                className={`text-xs ${themeClasses.bgTertiary} hover:${themeClasses.bgSecondary} px-2 py-1 rounded-lg transition-colors disabled:opacity-50`}
              >
                Remember
              </button>
              <button 
                onClick={() => setState(prev => ({ ...prev, showMemoryPanel: false }))}
                className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.textPrimary}`}
              >
                <FiX size={16} />
              </button>
            </div>
          </div>
          
          <div className="max-h-72 overflow-y-auto scrollbar-thin text-sm">
            {state.memories.length === 0 ? (
              <div className="p-4 text-center text-sm">
                No memories yet. Important context will appear here.
              </div>
            ) : (
              <div className={`divide-y ${themeClasses.border}`}>
                {state.memories.map((memory) => (
                  <div 
                    key={memory.id} 
                    className={`p-3 hover:${themeClasses.bgTertiary} transition-colors group ${state.activeMemory?.id === memory.id ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                    onClick={() => setActiveMemory(memory)}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-xs break-words pr-2">{memory.summary}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMemory(memory.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs transition-opacity"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs mt-1">{memory.date}</p>
                    {memory.relatedRooms && (
                      <p className="text-xs mt-1 text-blue-500 dark:text-blue-300">
                        Related to {memory.relatedRooms.length} conversation{memory.relatedRooms.length !== 1 ? 's' : ''}
                      </p>
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
        className={`flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent ${themeClasses.bgPrimary}`}
      >
        {state.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full pb-16">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
            >
              <FaRobot className="text-white text-2xl" />
            </motion.div>
            <motion.h3 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-xl font-semibold text-center mb-1"
            >
              Hello, I'm Orion AI!
            </motion.h3>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-center mb-6 max-w-md text-sm"
            >
              Your AI assistant with automatic memory and web search capabilities.
            </motion.p>
            
            {state.showTemplateButtons && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, staggerChildren: 0.1 }}
                className="grid grid-cols-2 gap-3 w-full max-w-md"
              >
                {[
                  { 
                    title: "Explain concept", 
                    desc: "Get detailed explanation",
                    message: "Explain quantum computing in simple terms" 
                  },
                  { 
                    title: "Code help", 
                    desc: "Get programming assistance",
                    message: "Show me how to implement a binary search in Python" 
                  },
                  { 
                    title: "Research topic", 
                    desc: "Find latest information",
                    message: "What are the latest developments in AI?" 
                  },
                  { 
                    title: "Creative ideas", 
                    desc: "Brainstorm new concepts",
                    message: "Give me creative ideas for a sci-fi story" 
                  }
                ].map((item, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSendMessage(item.message)}
                    className={`${themeClasses.cardBg} hover:${themeClasses.bgTertiary} ${themeClasses.border} rounded-xl p-3 text-sm transition-all hover:shadow-sm text-left`}
                  >
                    <span className="font-medium">{item.title}</span>
                    <p className="text-xs mt-1">{item.desc}</p>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <AnimatePresence>
            {state.messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ 
                  duration: 0.2, 
                  ease: "easeOut",
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className={`max-w-[90%] md:max-w-[80%] ${message.isBot ? 
                    `${themeClasses.cardBg} ${themeClasses.border}` : 
                    'bg-gradient-to-br from-blue-600 to-blue-500 text-white'} rounded-2xl p-3 shadow-xs`}
                >
                  {message.isBot && (
                    <div className="flex items-center mb-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shadow">
                        <FaRobot className="text-white text-xs" />
                      </div>
                      <span className="text-xs font-medium">Orion</span>
                    </div>
                  )}
                  
                  {message.file ? (
                    <div>
                      <p className={`text-xs mb-1 ${message.isBot ? themeClasses.textTertiary : 'text-blue-100'}`}>File: {message.file.name}</p>
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
                      className={`text-sm ${message.isBot ? themeClasses.textPrimary : 'text-white'}`}
                      dangerouslySetInnerHTML={{ __html: message.text }} 
                    />
                  )}
                  
                  {/* Sources section */}
                  {message.isBot && message.sources && message.sources.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className={`mt-2 pt-2 border-t ${themeClasses.border}`}
                    >
                      <p className="text-xs font-medium mb-1">Sources:</p>
                      <div className="space-y-2">
                        {message.sources.map((source, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ x: 2 }}
                            className="text-xs break-words"
                          >
                            <a 
                              href={source.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline flex items-center"
                            >
                              {source.title} <FiExternalLink className="ml-1" size={10} />
                            </a>
                            <p className="text-xs opacity-80 mt-0.5">{source.content}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs ${message.isBot ? themeClasses.textTertiary : 'text-blue-100'}`}>
                      {message.time}
                      {message.isBot && message.duration > 0 && (
                        <span> • {(message.duration / 1000).toFixed(1)}s</span>
                      )}
                    </span>
                    
                    {message.isBot && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => navigator.clipboard.writeText(message.text.replace(/<[^>]*>?/gm, ''))}
                          className="text-xs opacity-60 hover:opacity-100 transition-opacity"
                          title="Copy text"
                        >
                          <FiCopy size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Processing indicators */}
          {state.processingSources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`${themeClasses.cardBg} ${themeClasses.border} rounded-xl p-3 max-w-[90%] md:max-w-[80%]`}
            >
              <div className="flex items-center mb-1">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shadow">
                  <FaRobot className="text-white text-xs" />
                </div>
                <span className="text-xs font-medium">Processing</span>
              </div>
              
              <div className="space-y-2 mt-2">
                {state.processingSources.map((source) => (
                  <motion.div
                    key={source.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      transition: { delay: 0.1 }
                    }}
                    className="flex items-center"
                  >
                    <motion.div
                      animate={{
                        scale: source.animation === 'pulse' ? [1, 1.1, 1] : [1, 1],
                        x: source.animation === 'wave' ? [0, 2, -2, 0] : [0]
                      }}
                      transition={{
                        duration: source.animation === 'pulse' ? 1 : 0.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${source.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                    >
                      {source.completed ? (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        source.icon
                      )}
                    </motion.div>
                    <span className="text-xs">{source.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {state.showScrollButton && (
        <motion.button
          onClick={scrollToBottomButton}
          className={`fixed right-4 bottom-20 w-10 h-10 rounded-full ${themeClasses.buttonBg} ${themeClasses.buttonHover} shadow-lg flex items-center justify-center z-10`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Scroll to bottom"
        >
          <FiChevronDown size={20} className="text-white" />
        </motion.button>
      )}

      {/* Bottom Input Container */}
      <div className={`${themeClasses.border} ${themeClasses.bgSecondary} pt-2 pb-3 px-4`}>
        
        {/* File Preview */}
        <AnimatePresence>
          {state.pendingFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`flex items-center space-x-2 p-2 ${themeClasses.border} overflow-x-auto scrollbar-thin ${themeClasses.bgTertiary} rounded-t-lg`}
            >
              {state.pendingFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
                  className="relative flex-shrink-0"
                >
                  <div className={`w-14 h-14 flex items-center justify-center ${themeClasses.cardBg} rounded-lg ${themeClasses.border} overflow-hidden shadow-md`}>
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
                      const newFiles = [...state.pendingFiles];
                      newFiles.splice(index, 1);
                      setState(prev => ({ ...prev, pendingFiles: newFiles }));
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

        {/* Search Mode Indicator */}
        {state.searchMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`text-xs px-3 py-1 mb-1 rounded-full inline-flex items-center ${state.searchMode === 'deep' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}
          >
            <FiGlobe size={12} className="mr-1" />
            {state.searchMode === 'deep' ? 'Deep Web Search' : 'Web Search'} enabled
            <button 
              onClick={() => setState(prev => ({ ...prev, searchMode: false }))}
              className="ml-2 text-current hover:text-red-500"
            >
              <FiX size={12} />
            </button>
          </motion.div>
        )}

        {/* Main Input Area */}
        <div className="relative mt-1">
          <motion.textarea
            ref={textareaRef}
            value={state.inputMessage}
            onChange={(e) => {
              setState(prev => ({ ...prev, inputMessage: e.target.value }));
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(state.inputMessage, state.pendingFiles);
              }
            }}
            placeholder="Type your message..."
            className={`w-full ${themeClasses.inputBg} ${themeClasses.inputBorder} rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden transition-all duration-300 text-sm ${themeClasses.inputText}`}
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
            whileFocus={{ boxShadow: '0 0 0 3px rgba(59,130,246,0.3)' }}
            transition={{ type: "spring", stiffness: 100 }}
          />

          <div className="absolute right-2 bottom-2 flex items-center space-x-1">
            {state.inputMessage && (
              <motion.button
                onClick={() => setState(prev => ({ ...prev, inputMessage: '' }))}
                className={`p-1.5 rounded-full ${themeClasses.hoverBg} transition-all`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX size={16} />
              </motion.button>
            )}

            <motion.button
              onClick={toggleSearchMode}
              className={`p-1.5 rounded-full transition-all ${
                state.searchMode === 'deep' ? 'bg-purple-500 text-white' : 
                state.searchMode === 'shallow' ? 'bg-blue-500 text-white' : 
                themeClasses.hoverBg
              }`}
              title={state.searchMode ? `Search mode: ${state.searchMode}` : 'Enable web search'}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiGlobe size={16} />
            </motion.button>

            {state.isBotTyping ? (
              <motion.button
                onClick={stopGeneration}
                className="p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow"
                title="Stop generation"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiStopCircle size={16} />
              </motion.button>
            ) : (
              <>
                <motion.button
                  onClick={() => setState(prev => ({ ...prev, showFileOptions: !prev.showFileOptions }))}
                  className={`p-1.5 rounded-full transition-all ${state.showFileOptions ? `${themeClasses.bgTertiary}` : themeClasses.hoverBg}`}
                  title="Attach files"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiPlus size={16} />
                </motion.button>

                <motion.button
                  onClick={() => handleSendMessage(state.inputMessage, state.pendingFiles)}
                  disabled={(!state.inputMessage.trim() && state.pendingFiles.length === 0) || state.isBotTyping}
                  className={`p-2 rounded-full transition-all duration-300 ${
                    state.inputMessage.trim() || state.pendingFiles.length > 0
                      ? 'bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
                  }`}
                  whileHover={{
                    scale: (state.inputMessage.trim() || state.pendingFiles.length > 0) ? 1.15 : 1,
                    rotate: (state.inputMessage.trim() || state.pendingFiles.length > 0) ? 6 : 0
                  }}
                  whileTap={{ scale: 0.9 }}
                  title="Send message"
                >
                  <RiSendPlaneFill size={18} />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* File Options */}
        <AnimatePresence>
          {state.showFileOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="flex space-x-2 pt-2"
            >
              <motion.label
                className={`cursor-pointer p-2 rounded-lg transition-all ${themeClasses.hoverBg}`}
                whileHover={{ scale: 1.1 }}
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
                className={`cursor-pointer p-2 rounded-lg transition-all ${themeClasses.hoverBg}`}
                whileHover={{ scale: 1.1 }}
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
        </AnimatePresence>
      </div>

      {/* Include Prism.js for syntax highlighting */}
      <link 
        href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism-okaidia.min.css" 
        rel="stylesheet" 
      />
      <link 
        href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/plugins/line-numbers/prism-line-numbers.min.css" 
        rel="stylesheet" 
      />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-core.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/plugins/autoloader/prism-autoloader.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/plugins/line-numbers/prism-line-numbers.min.js"></script>
      
      <style jsx global>{`
        /* Typing animation */
        .typing-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: currentColor;
          margin-right: 2px;
          animation: typingAnimation 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; margin-right: 0; }
        @keyframes typingAnimation {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-3px); }
        }

        /* Code container */
        .code-container {
          background: ${state.darkMode ? '#1e293b' : '#f8fafc'};
          border-radius: 12px;
          margin: 1em 0;
          overflow: hidden;
          border: 1px solid ${state.darkMode ? '#334155' : '#e2e8f0'};
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
          padding: 0.5em 1em;
          background: ${state.darkMode ? '#1e293b' : '#f1f5f9'};
          color: ${state.darkMode ? '#94a3b8' : '#475569'};
          font-size: 0.85em;
          border-bottom: 1px solid ${state.darkMode ? '#334155' : '#e2e8f0'};
        }

        .language-tag {
          background: ${state.darkMode ? '#334155' : '#e2e8f0'};
          padding: 0.2em 0.6em;
          border-radius: 6px;
          font-size: 0.75em;
          font-weight: 500;
          letter-spacing: 0.02em;
          margin-left: 0.5em;
        }

        .copy-button {
          background: transparent;
          border: 1px solid ${state.darkMode ? '#475569' : '#cbd5e1'};
          color: ${state.darkMode ? '#e2e8f0' : '#334155'};
          cursor: pointer;
          padding: 0.3em 0.6em;
          border-radius: 6px;
          font-size: 0.75em;
          display: flex;
          align-items: center;
          gap: 0.3em;
          transition: all 0.2s ease;
        }
        .copy-button:hover {
          background: ${state.darkMode ? '#334155' : '#e2e8f0'};
          border-color: ${state.darkMode ? '#64748b' : '#94a3b8'};
          transform: translateY(-1px);
        }
        .copy-button:active {
          transform: translateY(0);
        }

        .code-block {
          margin: 0;
          padding: 1em;
          color: ${state.darkMode ? '#f1f5f9' : '#1e293b'};
          overflow-x: auto;
          font-family: 'Fira Code', 'JetBrains Mono', 'Courier New', monospace;
          font-size: 0.85em;
          line-height: 1.6;
          background: ${state.darkMode ? '#1e293b' : '#f8fafc'};
        }
        .code-block::-webkit-scrollbar {
          height: 6px;
        }
        .code-block::-webkit-scrollbar-thumb {
          background: ${state.darkMode ? '#475569' : '#cbd5e1'};
          border-radius: 3px;
        }

        /* Copy notification */
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

        /* Message animations */
        .message-enter {
          opacity: 0;
          transform: translateY(10px) scale(0.95);
        }
        .message-enter-active {
          opacity: 1;
          transform: translateY(0) scale(1);
          transition: opacity 300ms, transform 300ms;
        }
        .message-exit {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .message-exit-active {
          opacity: 0;
          transform: translateY(-10px) scale(0.95);
          transition: opacity 300ms, transform 300ms;
        }

        /* Processing animations */
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(2px); }
          75% { transform: translateX(-2px); }
        }
        .animate-pulse {
          animation: pulse 1s infinite;
        }
        .animate-wave {
          animation: wave 0.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default ChatBot;