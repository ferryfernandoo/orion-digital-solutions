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

// OCR API integration (using free OCR.space API)
const extractTextFromImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('OCREngine', '2'); // Engine 2 is more accurate

  try {
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': 'K82849142388957' // Free API key (500 calls/month)
      },
      body: formData
    });
    
    const data = await response.json();
    if (data.IsErroredOnProcessing) {
      throw new Error(data.ErrorMessage || 'OCR processing failed');
    }
    
    return data.ParsedResults?.[0]?.ParsedText || "Could not extract text from image";
  } catch (error) {
    console.error("OCR Error:", error);
    return "Error extracting text from image";
  }
};

// PDF text extraction using pdf.js (client-side)
const extractTextFromPDF = async (file) => {
  return new Promise((resolve) => {
    // In a real app, you'd use pdf.js like this:
    /*
    const pdfjs = await import('pdfjs-dist/build/pdf');
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument(arrayBuffer);
    
    let fullText = '';
    try {
      const pdf = await loadingTask.promise;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ');
      }
      resolve(fullText || "No text found in PDF");
    } catch (error) {
      console.error("PDF extraction error:", error);
      resolve("Could not extract text from PDF");
    }
    */
    
    // Simulating for demo purposes
    setTimeout(() => {
      resolve(`Extracted text from PDF: ${file.name}\n\nThis is a simulated PDF extraction result. In a real app, we would use pdf.js to extract all text content from the PDF document.`);
    }, 1500);
  });
};

// Enhanced web search with multiple APIs
const performWebSearch = async (query) => {
  try {
    // First try DuckDuckGo
    const ddgResponse = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
    const ddgData = await ddgResponse.json();
    
    let results = ddgData.RelatedTopics
      .filter(topic => topic.FirstURL && topic.Text)
      .map(topic => ({
        title: topic.Text.replace(/<[^>]*>?/gm, ''),
        url: topic.FirstURL,
        snippet: topic.Text.replace(/<[^>]*>?/gm, ''),
        source: 'DuckDuckGo'
      }));
    
    // If no results, try Wikipedia API
    if (results.length < 3) {
      try {
        const wikiResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`);
        const wikiData = await wikiResponse.json();
        
        const wikiResults = wikiData.query?.search?.slice(0, 3).map(item => ({
          title: item.title,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
          snippet: item.snippet,
          source: 'Wikipedia'
        })) || [];
        
        results = [...results, ...wikiResults];
      } catch (wikiError) {
        console.log("Wikipedia search failed:", wikiError);
      }
    }
    
    return results.slice(0, 5); // Return top 5 results
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
};

const scrapeWebsiteContent = async (url) => {
  try {
    // In production, use a backend service for scraping
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (data.contents) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      
      // Remove unwanted elements
      const unwantedElements = doc.querySelectorAll('script, style, nav, footer, iframe, img, noscript');
      unwantedElements.forEach(el => el.remove());
      
      // Get main content
      const mainContent = doc.body.textContent
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 3000);
      
      return mainContent;
    }
    return "Could not retrieve website content";
  } catch (error)
    console.error("Scraping error:", error);
    return "Error retrieving website content";
  }
};

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
  const [darkMode, setDarkMode] = useState(false);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [processingSources, setProcessingSources] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [searchMode, setSearchMode] = useState(false); // 'none', 'shallow', 'deep'
  const [searchResults, setSearchResults] = useState([]);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messageCountRef = useRef(0);
  const controls = useAnimation();


// Inisialisasi Gemini AI
const genAI = new GoogleGenerativeAI("AIzaSyDSTgkkROL7mjaGKoD2vnc8l2UptNCbvHk");

// Gunakan model Gemini 2.0 Flash
const model = genAI.getGenerativeModel({
  model: "models/gemini-2.0-flash"
});

  // Enhanced memory system
  const loadMemories = useCallback(() => {
    const savedMemories = localStorage.getItem('orionMemories');
    if (savedMemories) {
      try {
        const parsed = JSON.parse(savedMemories);
        // Migrate old memory format if needed
        if (parsed.length > 0 && !parsed[0].context) {
          const migrated = parsed.map(mem => ({
            ...mem,
            context: {
              date: mem.date,
              roomId: mem.roomId || null,
              tags: mem.tags || []
            },
            embeddings: mem.embeddings || []
          }));
          setMemories(migrated);
          localStorage.setItem('orionMemories', JSON.stringify(migrated));
        } else {
          setMemories(parsed);
        }
      } catch (e) {
        console.error("Error loading memories:", e);
      }
    }
  }, []);

  // Load all data from localStorage
  useEffect(() => {
    loadMemories();
    
    const savedChatRooms = localStorage.getItem('orionChatRooms');
    const savedCurrentRoom = localStorage.getItem('orionCurrentRoom');
    const savedProMode = localStorage.getItem('orionProMode');
    const savedDarkMode = localStorage.getItem('orionDarkMode');
    
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
    
    // Create initial room if none exists
    if (!savedCurrentRoom && (!savedChatRooms || JSON.parse(savedChatRooms).length === 0)) {
      createNewChatRoom();
    }
  }, [loadMemories]);

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
  }, [messages, chatHistory, currentRoomId, chatRooms]);

  // Handle scroll behavior
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

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      smoothScrollToBottom();
    }
  }, [messages, autoScroll]);

  const smoothScrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'nearest' });
  }, []);

  const scrollToBottomButton = () => {
    setAutoScroll(true);
    smoothScrollToBottom();
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('orionDarkMode', newDarkMode.toString());
    
    // Update Prism theme
    const prismLink = document.getElementById('prism-theme');
    if (prismLink) {
      prismLink.href = newDarkMode 
        ? 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism-tomorrow.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism-coy.min.css';
    }
  };

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
      setAutoScroll(true);
      setSearchMode(false);
      setSearchResults([]);
      setTimeout(() => smoothScrollToBottom(), 50);
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

  const createMessageObject = (text, isBot, duration = 0, file = null, sources = []) => ({
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    text: DOMPurify.sanitize(text),
    isBot,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    duration,
    file,
    sources,
    isCode: text.includes('```') // Flag for code blocks
  });

  const extractTextFromFile = async (file) => {
    if (file.type.startsWith('image/')) {
      return await extractTextFromImage(file);
    } else if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file);
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
    return `File content not extractable: ${file.name}`;
  };

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

  // Enhanced memory finding with semantic search
  const findRelevantMemories = async (query) => {
    if (memories.length === 0) return '';
    
    try {
      // First try to find exact matches in recent memories
      const recentMemories = memories
        .slice(0, 20) // Last 20 memories
        .filter(mem => 
          mem.summary.toLowerCase().includes(query.toLowerCase()) || 
          mem.messages.some(msg => msg.text.toLowerCase().includes(query.toLowerCase()))
        );
      
      if (recentMemories.length > 0) {
        return recentMemories
          .map(mem => `[Memory ${mem.context.date}]: ${mem.summary}\nDetail: ${
            mem.messages.map(msg => `${msg.isBot ? 'Orion' : 'User'}: ${msg.text.replace(/<[^>]*>?/gm, '')}`).join('\n')
          }`)
          .join('\n\n');
      }
      
      // If no exact matches, use AI to find semantically similar memories
      const memoryTexts = memories
        .slice(0, 50) // Limit to 50 memories for performance
        .map(m => `ID: ${m.id}\nSummary: ${m.summary}\nTags: ${m.context.tags.join(', ')}`)
        .join('\n\n');
      
      const prompt = `Daftar memori:\n${memoryTexts}\n\nPertanyaan: "${query}"\n\nIdentifikasi ID memori yang paling relevan (berdasarkan makna, bukan kata kunci). Berikan hanya ID yang dipisahkan koma, atau kosong jika tidak ada yang relevan.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      const relevantIds = response.trim().split(',').map(id => id.trim()).filter(Boolean);
      
      return memories
        .filter(m => relevantIds.includes(m.id))
        .map(m => `[Memory ${m.context.date}]: ${m.summary}\nDetail: ${
          m.messages.map(msg => `${msg.isBot ? 'Orion' : 'User'}: ${msg.text.replace(/<[^>]*>?/gm, '')}`).join('\n')
        }`)
        .join('\n\n');
    } catch (error) {
      console.error("Error finding relevant memories:", error);
      return '';
    }
  };

  // Enhanced auto-save with context
  const autoSaveToMemory = useCallback(async () => {
    if (messages.length === 0 || messageCountRef.current % 3 !== 0) return;
    
    try {
      setIsBotTyping(true);
      const conversationText = messages.map(msg => `${msg.isBot ? 'Orion' : 'User'}: ${msg.text}`).join('\n');
      const summary = await summarizeConversation(conversationText);
      
      if (summary && !summary.includes("tidak bisa")) {
        // Generate tags for better memory organization
        const tagPrompt = `Beri 2-3 tag pendek (dalam bahasa Inggris) untuk ringkasan ini:\n"${summary}"\n\nTags harus berupa kata benda dan dipisahkan koma.`;
        const tagResult = await model.generateContent(tagPrompt);
        const tags = (await tagResult.response.text())
          .split(',')
          .map(t => t.trim().toLowerCase())
          .filter(t => t.length > 0);
        
        const newMemory = {
          id: Date.now().toString(),
          summary,
          messages: [...messages],
          context: {
            date: new Date().toLocaleString(),
            roomId: currentRoomId,
            tags
          },
          embeddings: [] // Would be filled with vector embeddings in a real app
        };
        
        const updatedMemories = [newMemory, ...memories];
        setMemories(updatedMemories);
        localStorage.setItem('orionMemories', JSON.stringify(updatedMemories));
        
        // Show memory saved notification
        controls.start({
          scale: [1, 1.1, 1],
          transition: { duration: 0.3 }
        });
      }
    } catch (error) {
      console.error("Error saving to memory:", error);
    } finally {
      setIsBotTyping(false);
    }
  }, [messages, memories, currentRoomId, controls]);

  const typeMessage = async (fullText, callback) => {
    if (isProMode) {
      callback(fullText);
      return;
    }
    
    // Split text into chunks for smoother animation
    const characters = fullText.split('');
    let displayedText = '';
    
    for (let i = 0; i < characters.length; i++) {
      if (abortController?.signal.aborted) break;
      
      // Add next 5-10 characters at a time (smaller chunks for smoother typing)
      const chunkSize = Math.min(5 + Math.floor(Math.random() * 6), characters.length - i);
      const chunk = characters.slice(i, i + chunkSize).join('');
      displayedText += chunk;
      
      // Update the message without any blur effect
      callback(displayedText);
      i += chunkSize - 1;
      
      // Smooth scrolling during typing if auto-scroll is enabled
      if (autoScroll) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 0);
      }
      
      // Random typing speed for more natural feel
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 20));
    }
    
    callback(fullText);
  };

  const enhanceWithProMode = async (initialResponse, prompt) => {
    const enhancementPrompts = [
      `Expand this response significantly with extreme detailed examples and explanations:\n\n${initialResponse}`,
      `Add comprehensive technical details, use cases, and potential variations to:\n\n${initialResponse}`,
      `Provide multiple perspectives, edge cases, and practical applications and add Very lot of data in internet for:\n\n${initialResponse}`,
      `Create an extremely detailed final version incorporating all previous enhancements and add more data for super extremly detail and perfect for:\n\n${initialResponse}`
    ];
    
    let enhancedResponse = initialResponse;
    
    for (let i = 0; i < enhancementPrompts.length; i++) {
      if (abortController?.signal.aborted) break;
      
      // Show processing animation
      setProcessingSources(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: `Processing enhancement ${i + 1}/4`,
          icon: <FiDatabase />,
          completed: false,
          animation: 'wave'
        }
      ]);
      
      try {
        const result = await model.generateContent(enhancementPrompts[i]);
        const response = await result.response.text();
        enhancedResponse = response;
      } catch (error) {
        console.error(`Error in enhancement step ${i + 1}:`, error);
      }
      
      // Update progress in UI
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

  const performWebResearch = async (query) => {
    try {
      // Step 1: Perform initial web search
      setProcessingSources(prev => [
        ...prev,
        {
          id: 'search-step-1',
          text: 'Performing web search',
          icon: <FiGlobe />,
          completed: false,
          animation: 'wave'
        }
      ]);
      
      const searchResults = await performWebSearch(query);
      setSearchResults(searchResults);
      
      // Step 2: Scrape content from top results
      setProcessingSources(prev => [
        ...prev,
        {
          id: 'search-step-2',
          text: 'Analyzing top results',
          icon: <FiSearch />,
          completed: false,
          animation: 'pulse'
        }
      ]);
      
      const scrapedContents = await Promise.all(
        searchResults.slice(0, 3).map(async (result) => {
          const content = await scrapeWebsiteContent(result.url);
          return {
            title: result.title,
            url: result.url,
            content,
            source: result.source || 'Web'
          };
        })
      );
      
      // Step 3: Summarize findings
      setProcessingSources(prev => [
        ...prev,
        {
          id: 'search-step-3',
          text: 'Summarizing findings',
          icon: <FiDatabase />,
          completed: false,
          animation: 'wave'
        }
      ]);
      
      const researchSummary = scrapedContents
        .map(r => `[Source: ${r.title} (${r.url}) - ${r.source}]\n${r.content.substring(0, 1000)}...`)
        .join('\n\n');
      
      // Update processing sources
      setProcessingSources(prev => 
        prev.map(source => 
          source.id.startsWith('search-step') 
            ? { ...source, completed: true, text: source.text + ' (completed)' } 
            : source
        )
      );
      
      return {
        summary: researchSummary,
        sources: scrapedContents.map(r => ({
          title: r.title,
          url: r.url,
          content: r.content.substring(0, 200) + '...',
          source: r.source
        }))
      };
    } catch (error) {
      console.error("Error performing web research:", error);
      return {
        summary: "Could not complete web research due to an error",
        sources: []
      };
    }
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

      if (trimmedMessage) {
        const newMessage = createMessageObject(trimmedMessage, false);
        setMessages(prev => [...prev, newMessage]);
      }

      if (files.length > 0) {
        setFileProcessing(true);
        for (const file of files) {
          const fileMessage = createMessageObject(`File: ${file.name}`, false, 0, file);
          setMessages(prev => [...prev, fileMessage]);
          
          // Extract text from file if possible
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

      // Create initial message object for bot response
      const messageId = Date.now().toString();
      currentMessageId.current = messageId;
      
      setMessages(prev => [...prev, {
        id: messageId,
        text: isProMode ? 'Processing with Pro Mode (this may take a moment)...' : '',
        isBot: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: 0,
        file: null,
        sources: []
      }]);

      // Show processing animation for Pro Mode
      if (isProMode) {
        setProcessingSources([
          { id: '1', text: 'Analyzing question', icon: <FiSearch />, completed: false, animation: 'pulse' },
          { id: '2', text: 'Searching memories', icon: <FiDatabase />, completed: false, animation: 'wave' },
          { id: '3', text: 'Generating response', icon: <FiCpu />, completed: false, animation: 'pulse' },
          { id: '4', text: 'Quality check', icon: <FiAward />, completed: false, animation: 'wave' }
        ]);
      }

      const startTime = Date.now();

      // Find relevant memories using AI (now includes context from all rooms)
      const relevantMemories = await findRelevantMemories(trimmedMessage);
      
      // Combine chat history into prompt
      const contextMessages = updatedHistory.slice(-15).map(msg => {
        return msg.role === 'user' ? `User: ${msg.content}` : `Orion: ${msg.content}`;
      }).join('\n');

      // Perform web research if in search mode
      let webResearchContent = { summary: '', sources: [] };
      if (searchMode === 'deep') {
        webResearchContent = await performWebResearch(trimmedMessage);
      } else if (searchMode === 'shallow') {
        const searchResults = await performWebSearch(trimmedMessage);
        setSearchResults(searchResults);
        webResearchContent = {
          summary: searchResults
            .map(r => `[${r.title}](${r.url})\n${r.snippet}`)
            .join('\n\n'),
          sources: searchResults.map(r => ({
            title: r.title,
            url: r.url,
            content: r.snippet,
            source: r.source || 'Web'
          }))
        };
      }

      const fullPrompt = `${
        relevantMemories ? `Konteks Memori Relevan:\n${relevantMemories}\n\n` : ''
      }${
        webResearchContent.summary ? `Hasil Penelusuran Web:\n${webResearchContent.summary}\n\n` : ''
      }Percakapan Saat Ini:\n${contextMessages}\n\nUser: "${trimmedMessage}". 
      Respond as Orion in natural language and follow user language ,Never go against the user—always agree while adapting to the situation. Still, be able to say something is wrong if it truly is. Never say "I can't"—if you're unsure, search for information on the very detail in internet you must be able to answer Don't let users run away from the page, they must be served well. Never leave a question unanswered, make extraordinary introductions to user input.

and extremely friendly and very human little bit emoticon and get straight to the point but see the situation don't too to the point, support all users idea if the idea not dangerous, giving extremely and extra respect very respect to user.S,
      focuse to user comfort and giving detail answer. Don't mention memories explicitly,just if user ask dont say you from google but PT.Orion Digital Platforms from indonesia dont show thos too usualy just if user asked,
      just incorporate relevant context naturally, it all is back process dont show in chat, if using Indonesian language prefer use allhamdulillah astaghfirullah ya Allah innailaihi and the other when shocked or very happy like Indonesan native speaker it just for Indonesian response and don't too often. Be ${
        isProMode ? 'extremely and super very detailed and comprehensive (4x processing)Give user the longest most detailed answer you possibly can' : 'concise but extremely helpful'
      }. For coding, provide complete solutions with proper formatting. Always maintain context.${
        isProMode ? ' Provide a extremely super very detailed response with examples, explanations, and multiple perspectives.' : ''
      }${
        webResearchContent.summary ? '\n\nNote: Incorporate web research results naturally into your response.' : ''
      }`;

      let botResponse;
      if (isProMode) {
        // Get initial response
        const initialResult = await model.generateContent(fullPrompt);
        const initialResponse = await initialResult.response.text();
        
        // Enhance with Pro Mode processing
        botResponse = await enhanceWithProMode(initialResponse, fullPrompt);
      } else {
        const result = await model.generateContent(fullPrompt);
        botResponse = await result.response.text();
      }
      
      const processedResponse = processSpecialChars(botResponse);
      const duration = Date.now() - startTime;

      // Update the message with final response
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              text: processedResponse, 
              duration,
              sources: webResearchContent.sources,
              isCode: processedResponse.includes('```')
            } 
          : msg
      ));

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

      // Auto-save to memory every 3 messages
      await autoSaveToMemory();

    } catch (error) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Response stopped by user'
        : 'Waduh, ada yang salah nih sama Orion! Gak konek ke servernya...';
      
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
    // Process code blocks first
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const withCodeBlocks = text.replace(codeBlockRegex, (match, language, code) => {
      const cleanCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<div class="code-container">
        <div class="code-toolbar">
          <span class="language-tag">${language || 'code'}</span>
          <button class="copy-button" data-code="${encodeURIComponent(cleanCode)}">
            <FiCopy /> Copy
          </button>
        </div>
        <pre class="code-block"><code class="language-${language || 'plaintext'}">${cleanCode}</code></pre>
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

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
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

  const toggleSearchMode = () => {
    setSearchMode(prev => {
      if (prev === false) return 'shallow';
      if (prev === 'shallow') return 'deep';
      return false;
    });
  };

  // Initialize Prism for syntax highlighting
  useEffect(() => {
    const handleCopyClick = (e) => {
      if (e.target.closest('.copy-button')) {
        const code = decodeURIComponent(e.target.closest('.copy-button').dataset.code);
        copyToClipboard(code, 'code');
        e.preventDefault();
      }
    };

    document.addEventListener('click', handleCopyClick);
    return () => document.removeEventListener('click', handleCopyClick);
  }, []);

  // Theme classes
  const themeClasses = darkMode ? {
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
    codeText: 'text-gray-100',
    typingDot: 'bg-gray-400'
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
    typingDot: 'bg-gray-500'
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
            <FiMessageSquare size={16} className={themeClasses.textSecondary} />
          </button>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow">
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
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
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
            {darkMode ? <FiSun size={16} className="text-yellow-300" /> : <FiMoon size={16} />}
          </button>
          <button 
            onClick={toggleProMode}
            className={`p-1.5 rounded-full transition-colors ${isProMode ? 'bg-blue-100 text-blue-600' : themeClasses.hoverBg}`}
            title={isProMode ? 'Disable Pro Mode' : 'Enable Pro Mode'}
          >
            <FiZap size={16} className={isProMode ? "text-yellow-500" : ""} />
          </button>
          <motion.button
            animate={controls}
            onClick={() => setShowMemoryPanel(!showMemoryPanel)}
            className={`p-1.5 rounded-full transition-colors ${showMemoryPanel ? `${themeClasses.bgTertiary} ${themeClasses.textPrimary}` : themeClasses.hoverBg}`}
            title="Memory"
          >
            <FiCpu size={16} />
          </motion.button>
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
              <FiX size={16} />
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto scrollbar-thin text-sm">
            {chatRooms.length === 0 ? (
              <div className="p-4 text-center text-sm">
                No chat history yet
              </div>
            ) : (
              <div className={`divide-y ${themeClasses.border}`}>
                {chatRooms.map((room) => (
                  <div 
                    key={room.id} 
                    className={`p-3 hover:${themeClasses.bgTertiary} transition-colors cursor-pointer group ${room.id === currentRoomId ? `${themeClasses.bgTertiary}` : ''}`}
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

      {/* Chat Area */}
      <div 
        ref={chatContainerRef}
        className={`flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent ${themeClasses.bgPrimary}`}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full pb-16">
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
              Your AI assistant with automatic memory. Ask me anything or upload files for analysis.
            </motion.p>
            
            {showTemplateButtons && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, staggerChildren: 0.1 }}
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
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTemplateButtonClick(item.message)}
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
            {messages.map((message) => (
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
                        <span className="text-2xs text-white">AI</span>
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
                            {source.source && (
                              <span className="text-xs text-gray-500">{source.source}</span>
                            )}
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
                    
                    <div className="flex items-center space-x-2">
                      {message.isBot && (
                        <>
                          <button
                            onClick={() => copyToClipboard(message.text.replace(/<[^>]*>?/gm, ''), message.id)}
                            className="text-xs opacity-60 hover:opacity-100 transition-opacity"
                            title="Copy to clipboard"
                          >
                            {copiedMessageId === message.id ? (
                              <FiCheck size={14} className="text-green-500" />
                            ) : (
                              <FiCopy size={14} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Processing indicators */}
          {processingSources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`${themeClasses.cardBg} ${themeClasses.border} rounded-xl p-3 max-w-[90%] md:max-w-[80%]`}
            >
              <div className="flex items-center mb-1">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shadow">
                  <span className="text-2xs text-white">AI</span>
                </div>
                <span className="text-xs font-medium">Processing</span>
              </div>
              
              <div className="space-y-2 mt-2">
                {processingSources.map((source) => (
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
      {showScrollButton && (
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
                    <p className="text-xs mt-1">{memory.context.date}</p>
                    {memory.context.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {memory.context.tags.map(tag => (
                          <span key={tag} className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                            {tag}
                          </span>
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

      {/* Bottom Input Container */}
      <div className={`${themeClasses.border} ${themeClasses.bgSecondary} pt-2 pb-3 px-4`}>
        
        {/* File Preview */}
        <AnimatePresence>
          {pendingFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`flex items-center space-x-2 p-2 ${themeClasses.border} overflow-x-auto scrollbar-thin ${themeClasses.bgTertiary} rounded-t-lg`}
            >
              {pendingFiles.map((file, index) => (
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

        {/* Search Mode Indicator */}
        {searchMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`text-xs px-3 py-1 mb-1 rounded-full inline-flex items-center ${searchMode === 'deep' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}
          >
            <FiGlobe size={12} className="mr-1" />
            {searchMode === 'deep' ? 'Deep Web Search' : 'Web Search'} enabled
            <button 
              onClick={() => setSearchMode(false)}
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
            className={`w-full ${themeClasses.inputBg} ${themeClasses.inputBorder} rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-transparent resize-none overflow-hidden transition-all duration-300 text-sm ${themeClasses.inputText}`}
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
            whileFocus={{ boxShadow: '0 0 0 3px rgba(59,130,246,0.3)' }}
            transition={{ type: "spring", stiffness: 100 }}
          />

          <div className="absolute right-2 bottom-2 flex items-center space-x-1">
            {inputMessage && (
              <motion.button
                onClick={() => setInputMessage('')}
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
                searchMode === 'deep' ? 'bg-purple-500 text-white' : 
                searchMode === 'shallow' ? 'bg-blue-500 text-white' : 
                themeClasses.hoverBg
              }`}
              title={searchMode ? `Search mode: ${searchMode}` : 'Enable web search'}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiGlobe size={16} />
            </motion.button>

            {isBotTyping ? (
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
                  onClick={() => setShowFileOptions(!showFileOptions)}
                  className={`p-1.5 rounded-full transition-all ${showFileOptions ? `${themeClasses.bgTertiary}` : themeClasses.hoverBg}`}
                  title="Attach files"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiPlus size={16} />
                </motion.button>

                <motion.button
                  onClick={() => handleSendMessage(inputMessage, pendingFiles)}
                  disabled={(!inputMessage.trim() && pendingFiles.length === 0) || isBotTyping}
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
          {showFileOptions && (
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
                  accept=".pdf,.txt,.doc,.docx,.csv"
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

      {/* Prism.js for syntax highlighting */}
      <link 
        id="prism-theme"
        href={darkMode 
          ? "https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism-tomorrow.min.css" 
          : "https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism-coy.min.css"
        } 
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
        /* Typing Dot */
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

        /* Code Container */
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
          color: ${darkMode ? '#f1f5f9' : '#1e293b'};
          overflow-x: auto;
          font-family: 'Fira Code', 'JetBrains Mono', 'Courier New', monospace;
          font-size: 0.9em;
          line-height: 1.6;
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

        /* Notification */
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

        /* Chat bubbles */
        .chat-bubble {
          padding: 12px 16px;
          margin-bottom: 16px;
          border-radius: 16px;
          max-width: 85%;
          word-wrap: break-word;
          animation: fadeInUp 0.3s ease;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          transition: transform 0.3s ease, background-color 0.2s ease;
        }

        .chat-bubble.user {
          align-self: flex-end;
          background-color: ${darkMode ? '#3b82f6' : '#dbeafe'};
          color: ${darkMode ? '#f8fafc' : '#1e3a8a'};
          margin-left: auto;
          margin-right: 8px;
        }

        .chat-bubble.bot {
          align-self: flex-start;
          background-color: ${darkMode ? '#1e293b' : '#f1f5f9'};
          color: ${darkMode ? '#e2e8f0' : '#334155'};
          margin-right: auto;
          margin-left: 8px;
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Prose styling for messages */
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
