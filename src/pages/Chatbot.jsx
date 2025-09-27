import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  FiCopy, FiSend, FiPlus, FiX, FiImage, FiFile, FiTrash2, 
  FiClock, FiCpu, FiSettings, FiStopCircle, FiMessageSquare,
  FiSun, FiMoon, FiSearch, FiDatabase, FiAward, FiChevronDown,
  FiExternalLink, FiCheck, FiInfo, FiStar, FiAlertTriangle, FiRefreshCw, FiThumbsUp, FiThumbsDown, FiCornerUpLeft
} from 'react-icons/fi';
import { RiSendPlaneFill } from 'react-icons/ri';

// OCR / document read removed

// Web search removed

// Web scraping removed

const ChatBot = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [abortController, setAbortController] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [roomQuery, setRoomQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [processingSources, setProcessingSources] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  // Search/web-research removed
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [replyQuote, setReplyQuote] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [sendCooldownUntil, setSendCooldownUntil] = useState(0);
  const [cooldownNotice, setCooldownNotice] = useState('');
  // Rate limit state persisted in localStorage to remember across reloads/tabs
  const RATE_LIMIT_KEY = 'orion_rate_limit_v1';
  // Assumption: limit of requests per minute. Change this if you want a different cap.
  const MAX_REQUESTS_PER_MINUTE = 10;
  const [rateLimitState, setRateLimitState] = useState({ windowStart: 0, count: 0 });
  
  // Ads removed
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messageCountRef = useRef(0);
  const currentMessageId = useRef(null);
  const controls = useAnimation();
  const typingIdsRef = useRef(new Set());

  // Rate limit helpers: persist in localStorage and sync across tabs
  const loadRateLimit = useCallback(() => {
    try {
      const raw = localStorage.getItem(RATE_LIMIT_KEY);
      if (!raw) return { windowStart: 0, count: 0 };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return { windowStart: 0, count: 0 };
      return parsed;
    } catch (e) {
      console.warn('Failed to load rate limit state', e);
      return { windowStart: 0, count: 0 };
    }
  }, []);

  const saveRateLimit = useCallback((state) => {
    try {
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
      // update local state for UI
      setRateLimitState(state);
    } catch (e) {
      console.warn('Failed to save rate limit state', e);
    }
  }, []);

  // Try to consume one request slot. Returns true if allowed and consumed, false if limit reached.
  const tryConsumeRequest = useCallback(() => {
    const now = Date.now();
    const state = loadRateLimit();
    // windowStart is epoch ms for the start of the current minute window
    const windowStart = state.windowStart || 0;
    // If window expired (older than 60s), reset
    if (now - windowStart >= 60_000) {
      const newState = { windowStart: now, count: 1 };
      saveRateLimit(newState);
      return true;
    }

    if ((state.count || 0) >= MAX_REQUESTS_PER_MINUTE) {
      // limit reached
      setRateLimitState(state);
      return false;
    }

    const newState = { windowStart, count: (state.count || 0) + 1 };
    saveRateLimit(newState);
    return true;
  }, [loadRateLimit, saveRateLimit]);

  // Sync rate limit state when localStorage changes (other tab)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === RATE_LIMIT_KEY) {
        try {
          const parsed = JSON.parse(e.newValue || '{}');
          setRateLimitState(parsed || { windowStart: 0, count: 0 });
        } catch (err) {
          setRateLimitState({ windowStart: 0, count: 0 });
        }
      }
    };
    window.addEventListener('storage', onStorage);
    // init
    setRateLimitState(loadRateLimit());
    return () => window.removeEventListener('storage', onStorage);
  }, [loadRateLimit]);

  // Initialize Google Generative AI
  const genAI = new GoogleGenerativeAI("AIzaSyBZ_oHyePKOqp2FAujJl7ujJII9BakIe4I");
 const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Ads removed

  // Memory feature removed for efficiency (no-op placeholders kept minimal)

  // Enter fullscreen mode when component mounts
  useEffect(() => {
    const enterFullscreen = () => {
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
          });
        }
      } catch (error) {
        console.error("Fullscreen error:", error);
      }
    };

    // Add animation class to body for smooth transitions
    document.body.classList.add('smooth-transitions');
    
    // Enter fullscreen with a slight delay to allow DOM to load
    const fullscreenTimer = setTimeout(enterFullscreen, 300);
    
    // Cleanup
    return () => {
      clearTimeout(fullscreenTimer);
      document.body.classList.remove('smooth-transitions');
    };
  }, []);

  // Load all data from localStorage
  useEffect(() => {
    const savedChatRooms = localStorage.getItem('orionChatRooms');
    const savedCurrentRoom = localStorage.getItem('orionCurrentRoom');
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
    if (savedDarkMode) setDarkMode(savedDarkMode === 'true');
    
    // Create initial room if none exists
    if (!savedCurrentRoom && (!savedChatRooms || JSON.parse(savedChatRooms).length === 0)) {
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
  }, [messages, chatHistory, currentRoomId, chatRooms]);

  // Handle scroll behavior and show scroll button
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    if (autoScroll) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    const onScroll = () => {
      setShowScrollButton(chatContainer.scrollTop + chatContainer.clientHeight < chatContainer.scrollHeight - 120);
    };

    chatContainer.addEventListener('scroll', onScroll);
    return () => chatContainer.removeEventListener('scroll', onScroll);
  }, [messages, autoScroll]);

  const createMessageObject = (text, isBot, duration = 0, file = null, sources = []) => ({
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    text: DOMPurify.sanitize(text),
    isBot,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    duration,
    file,
    sources,
    isCode: text.includes('```'), // Flag for code blocks
    quoted: null
  });

  // OCR/document reading removed — file extraction not performed for efficiency

  // Memory/pro features removed: no background summarization or memory lookup

  const typeMessage = async (fullText, callback) => {
    
    // Split text into chunks for smoother animation
    const characters = fullText.split('');
    let displayedText = '';
  // small initial pause so typing starts quickly, but chunk delays keep overall speed slow
  await new Promise(resolve => setTimeout(resolve, 60 + Math.floor(Math.random() * 90)));

    for (let i = 0; i < characters.length; i++) {
      if (abortController?.signal.aborted) break;

      // Much smaller chunks: 1-3 chars for slower, steady typing
      const chunkSize = Math.min(1 + Math.floor(Math.random() * 3), characters.length - i);
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

      // Increase delay per chunk to slow typing significantly (120-220ms)
      const delay = 120 + Math.floor(Math.random() * 100);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

      // ensure final text set exactly
    callback(fullText);
  };

  // Fallback helper: send prompt to a server-side proxy endpoint (/api/generate)
  // The server should accept { prompt } and return a plain text response.
  const sendToServerProxy = async (prompt, signal) => {
    console.log('sendToServerProxy: calling /api/generate with prompt length', prompt?.length);
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal
    });

    const text = await resp.text().catch(() => null);
    if (!resp.ok) {
      console.error('sendToServerProxy: non-ok response', resp.status, text);
      throw new Error(`Proxy error ${resp.status}: ${text || resp.statusText}`);
    }
    console.log('sendToServerProxy: success, response length', text?.length);
    return text;
  };

  // Unified model caller: try SDK first, fall back to server proxy.
  const callModel = async (prompt, signal) => {
    try {
      console.log('callModel: attempting SDK generateContent');
      // Try SDK path first (may fail in browser due to CORS or server-only SDK)
      const sdkResult = await model.generateContent(prompt);
      console.log('callModel: SDK response received', sdkResult);
      // Many SDK responses expose a response.text() helper
      if (sdkResult?.response && typeof sdkResult.response.text === 'function') {
        const t = await sdkResult.response.text();
        if (t) {
          console.log('callModel: SDK returned text length', t.length);
          return t;
        }
      }

      // Some SDK shapes include output/content arrays
      if (sdkResult?.output && Array.isArray(sdkResult.output)) {
        const out = sdkResult.output.map(o => (o.content || []).map(c => c.text || '').join('')).join('\n');
        if (out) {
          console.log('callModel: SDK output array parsed length', out.length);
          return out;
        }
      }

      // Fallback to stringifying whatever we got
      if (sdkResult != null) {
        console.log('callModel: SDK returned non-text result, stringifying');
        return String(sdkResult || '');
      }
      // If SDK returned nothing usable, fall back
      console.warn('callModel: SDK returned no usable content, falling back to proxy');
      return await sendToServerProxy(prompt, signal);
    } catch (sdkErr) {
      console.error('callModel: SDK generateContent failed, will attempt server proxy', sdkErr);
      // Fallback: call local server proxy at /api/generate (implement server separately)
      return await sendToServerProxy(prompt, signal);
    }
  };



  // Web research removed for efficiency

  const handleSendMessage = async (messageText, files = []) => {
    const trimmedMessage = messageText.trim();
    if ((!trimmedMessage && files.length === 0) || isBotTyping) return;
    // initialize timestamp used by rate limiter and cooldown checks
    const now = Date.now();

    // Check for canned/local replies first (identity/CEO) to avoid using API
    const canned = getCannedReply(trimmedMessage);
    if (canned) {
      // Insert user message and immediate bot reply locally
      const userMessageObj = createMessageObject(trimmedMessage, false);
      setMessages(prev => [...prev, userMessageObj]);
      const botMsg = createMessageObject(canned, true);
      setMessages(prev => [...prev, botMsg]);
      setChatHistory(prev => [...prev, { role: 'user', content: trimmedMessage }, { role: 'assistant', content: canned }] );
      setInputMessage('');
      return;
    }

    // Per-minute rate limiter (persistent across reloads/tabs)
    const stored = loadRateLimit();
    // If window expired, reset stored for accurate remaining calculation
    if (now - (stored.windowStart || 0) >= 60_000) {
      // reset local state
      saveRateLimit({ windowStart: now, count: 0 });
      setRateLimitState({ windowStart: now, count: 0 });
    }

    if (!tryConsumeRequest()) {
      // compute remaining seconds until window resets
      const remainingMs = 60_000 - (now - (stored.windowStart || now));
      const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
      setCooldownNotice(`Batas per menit tercapai. Tunggu ${remainingSec}s.`);
      // clear notice after a short period but keep stored limiter intact
      setTimeout(() => setCooldownNotice(''), 3500);
      return;
    }

    // Client-side cooldown to reduce rapid repeated API calls
    const COOLDOWN_MS = 6000; // 6 seconds default cooldown between sends
    if (now < sendCooldownUntil) {
      const remaining = Math.ceil((sendCooldownUntil - now) / 1000);
      setCooldownNotice(`Tunggu ${remaining}s sebelum mengirim lagi.`);
      setTimeout(() => setCooldownNotice(''), 2000);
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      // mark cooldown immediately when starting a request
      setSendCooldownUntil(Date.now() + COOLDOWN_MS);

      // Add user message to chat history
      const userMessage = { role: 'user', content: trimmedMessage };
      const updatedHistory = [...chatHistory, userMessage];
      setChatHistory(updatedHistory);

      if (trimmedMessage) {
        const newMessage = createMessageObject(trimmedMessage, false);
        if (replyQuote) newMessage.quoted = replyQuote.text;
        setMessages(prev => [...prev, newMessage]);
      }

      if (files.length > 0) {
        setFileProcessing(true);
        for (const file of files) {
          const fileMessage = createMessageObject(`File: ${file.name}`, false, 0, file);
          setMessages(prev => [...prev, fileMessage]);
        }
        setFileProcessing(false);
      }

      setInputMessage('');
    setPendingFiles([]);
    setIsBotTyping(true);
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
        text: '',
        isBot: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: 0,
        file: null,
        sources: []
      }]);

      const startTime = Date.now();

  // (Memory lookup removed) No additional memory or pro-mode requests; single model call below
      // Combine chat history into prompt
      const contextMessages = updatedHistory.slice(-15).map(msg => {
        return msg.role === 'user' ? `User: ${msg.content}` : `Orion: ${msg.content}`;
      }).join('\n');

      // No web search — single model prompt built from recent conversation
      const webResearchContent = { summary: '', sources: [] };
      const quoted = replyQuote ? replyQuote.text.replace(/<[^>]*>?/gm, '') : '';
      const fullPrompt = replyQuote ?
        `Fokus hanya pada kutipan berikut dan jawab berdasar itu:\n"${quoted}"\n\nPercakapan Saat Ini:\n${contextMessages}\n\nUser: "${trimmedMessage}". Respond as Orion in natural language, be concise but very helpful. For coding, provide complete solutions with proper formatting.`
        : `Percakapan Saat Ini:\n${contextMessages}\n\nUser: "${trimmedMessage}". Respond as Orion in natural language, be concise but very helpful. For coding, provide complete solutions with proper formatting. Always maintain context.`;

    // Unified call: try SDK then fallback to proxy
    const botResponse = await callModel(fullPrompt, controller.signal);

    // Remove leading assistant name if model echoes it (e.g., "Orion: ...")
    const cleanedBotResponse = (botResponse || '').replace(/^\s*(Orion\s*[:\-–—]\s*)/i, '').trim();

    const processedResponse = processSpecialChars(cleanedBotResponse);
      const duration = Date.now() - startTime;

      // Update the message metadata (duration/sources/isCode) but DO NOT set full text yet
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg,
              duration,
              sources: webResearchContent.sources,
              isCode: processedResponse.includes('```')
            } 
          : msg
      ));

      // Mark this message as being typed to prevent other updates from clobbering it
      typingIdsRef.current.add(messageId);

      // Type out the raw bot response (escaped) to avoid inserting partial HTML
      // into the DOM while typing. During typing we set an escaped/plain version,
      // then replace with the final processed HTML after animation completes.
      await typeMessage(botResponse, (typedText) => {
        // only update if this message is still being typed
        if (!typingIdsRef.current.has(messageId)) return;
        // escape any HTML to avoid rendering incomplete tags and convert newlines to <br/>
        const escaped = DOMPurify.sanitize(typedText).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, text: escaped } : msg
        ));
      });

      // Replace with final processed HTML after typing completes (only if still tracked)
      if (typingIdsRef.current.has(messageId)) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, text: processedResponse } : msg
        ));
        typingIdsRef.current.delete(messageId);
      }

  // Add bot response to chat history (store cleaned version)
  const botMessage = { role: 'assistant', content: cleanedBotResponse || botResponse };
    const newChatHistory = [...updatedHistory, botMessage];
    setChatHistory(newChatHistory);
    // Clear reply quote after sending
    if (replyQuote) setReplyQuote(null);

    } catch (error) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Respon dihentikan oleh pengguna'
        : 'Waduh, ada yang salah nih sama Orion! Gak konek ke servernya...';
      
      setMessages(prev => [...prev, createMessageObject(errorMessage, true)]);
    } finally {
      setIsBotTyping(false);
      setFileProcessing(false);
      setProcessingSources([]);
      clearTimeout(timeoutId);
      setAbortController(null);
      if (currentMessageId.current) {
        typingIdsRef.current.delete(currentMessageId.current);
        currentMessageId.current = null;
      }
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

  // Canned replies for identity and CEO questions to ensure Orion does not
  // claim to be the underlying model (e.g., Gemini) and to provide stable
  // company/CEO info. Returns a string reply or null.
  const getCannedReply = (msg) => {
    if (!msg || typeof msg !== 'string') return null;
    const m = msg.trim().toLowerCase();

    // Direct identity questions in Indonesian
    if (/\b(kamu siapa|siapa kamu|siapakah kamu|kamu itu siapa)\b/.test(m)) {
      return `Saya Orion AI, model bahasa besar yang dikembangkan oleh tim Heyyow Comunication Indonesia.`;
    }

    // CEO inquiries
    if (/\b(ceo|who is the ceo|siapa ceo|siapa pendiri|pemimpin perusahaan)\b/.test(m)) {
      return `CEO: Ferry Fernando. Berpusat di Tangerang.`;
    }

    return null;
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

  // Memory helpers removed

  // Pro Mode removed

  // Search/web-research removed

  // Small helper functions (room management, theme toggle, scrolling)
  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const createNewChatRoom = (name = 'Percakapan Baru') => {
    // If called as an event handler (onClick={createNewChatRoom}), React
    // will pass the event as first arg. Guard against that to avoid
    // storing non-serializable event objects in localStorage.
    if (name && typeof name === 'object' && name.currentTarget) {
      name = 'Percakapan Baru';
    }

    const newRoom = {
      id: Date.now().toString(),
      name,
      messages: [],
      history: [],
      createdAt: Date.now()
    };
    const updated = [newRoom, ...chatRooms];
    setChatRooms(updated);
    setCurrentRoomId(newRoom.id);
    setMessages([]);
    setChatHistory([]);
    localStorage.setItem('orionChatRooms', JSON.stringify(updated));
    localStorage.setItem('orionCurrentRoom', newRoom.id);
  };

  const switchChatRoom = (roomId) => {
    const room = chatRooms.find(r => r.id === roomId);
    if (!room) return;
    setCurrentRoomId(roomId);
    setMessages(room.messages || []);
    setChatHistory(room.history || []);
    localStorage.setItem('orionCurrentRoom', roomId);
  };

  const deleteChatRoom = (roomId) => {
    const updatedRooms = chatRooms.filter(r => r.id !== roomId);
    setChatRooms(updatedRooms);
    localStorage.setItem('orionChatRooms', JSON.stringify(updatedRooms));
    if (currentRoomId === roomId) {
      if (updatedRooms.length > 0) switchChatRoom(updatedRooms[0].id);
      else createNewChatRoom();
    }
  };

  const scrollToBottomButton = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  // Stop generation helper: aborts the model call and cleans up UI state
  const stopGeneration = () => {
    try {
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }
    } catch (e) {
      console.warn('Error aborting controller', e);
    }

    setIsBotTyping(false);
    setProcessingSources([]);

    if (currentMessageId?.current) {
      setMessages(prev => prev.map(m => m.id === currentMessageId.current ? { ...m, text: (m.text || '') + '\n\n[Generasi dihentikan]' } : m));
      typingIdsRef.current.delete(currentMessageId.current);
      currentMessageId.current = null;
    }
  };

  const regenerateMessage = async (message) => {
    // Re-run generation using the same prompt context; if replyQuote is set use that snippet
    const quoted = message?.text?.replace(/<[^>]*>?/gm, '').slice(0, 2000);
    const prompt = replyQuote ? `Fokus pada kutipan berikut dan jawab berdasarkan itu:\n"${replyQuote.text}"\n\n${quoted}` : `Tolong ulangi dan perbaiki jawaban berikut:\n${quoted}`;
    try {
      setIsBotTyping(true);
      const controller = new AbortController();
      setAbortController(controller);
      const botResponse = await callModel(prompt, controller.signal);
      const processed = processSpecialChars(botResponse);
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, text: processed } : m));
    } catch (e) {
      console.error('Regenerate error', e);
    } finally {
      setIsBotTyping(false);
      setAbortController(null);
    }
  };

  // Safe settings open/close to avoid rendering modal multiple times inside message loop
  const openSettings = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      if (showSettings) return;
      // Use rAF to avoid layout thrash while animations are running
      requestAnimationFrame(() => setShowSettings(true));
    } catch (err) {
      console.error('openSettings error', err);
      setShowSettings(true);
    }
  };

  const closeSettings = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      requestAnimationFrame(() => setShowSettings(false));
    } catch (err) {
      console.error('closeSettings error', err);
      setShowSettings(false);
    }
  };

  const likeMessage = (id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, liked: true, disliked: false } : m));
  };

  const dislikeMessage = (id) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, disliked: true, liked: false } : m));
  };

  // Reply helpers: set a reply quote (plain text) and focus the input; clearReply cancels it
  const replyToMessage = (message) => {
    try {
      // Extract plain text; if the message has no text (e.g., image/file-only),
      // provide a sensible fallback so the reply preview doesn't disappear.
      const plain = message?.text ? message.text.replace(/<[^>]*>?/gm, '') : '';
      const fallback = (!plain || plain.trim().length === 0) ? (message?.file?.name ? `File: ${message.file.name}` : '<Tidak ada teks>') : null;
      setReplyQuote({ id: message.id, text: plain, fallback });
      setInputFocused(true);
      // focus textarea next frame to ensure DOM ready
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (err) {
      console.error('replyToMessage error', err);
      setReplyQuote(message);
    }
  };

  const clearReply = () => {
    setReplyQuote(null);
  };

  // Selection helper: when user selects text inside a bot message, allow quick copy or focus
  const handleSelection = (e) => {
    const selection = window.getSelection().toString();
    if (selection && selection.length > 0) {
      setSelectedText(selection);
      setShowSelectionToolbar(true);
    } else {
      setSelectedText('');
      setShowSelectionToolbar(false);
    }
  };

  // Memories removed

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
  buttonBg: 'bg-purple-700',
  buttonHover: 'hover:bg-purple-600',
    buttonText: 'text-white',
    cardBg: 'bg-gray-800',
    codeBg: 'bg-gray-900',
    codeBorder: 'border-gray-700',
    codeText: 'text-gray-100',
    typingDot: 'bg-gray-400'
  } : {
    bgPrimary: 'bg-white',
    bgSecondary: 'bg-white',
    bgTertiary: 'bg-purple-50',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textTertiary: 'text-gray-500',
    border: 'border-gray-100',
    hoverBg: 'hover:bg-purple-50',
    inputBg: 'bg-white',
    inputBorder: 'border-purple-200',
    inputText: 'text-gray-800',
  buttonBg: 'bg-purple-600',
  buttonHover: 'hover:bg-purple-500',
    buttonText: 'text-white',
    cardBg: 'bg-white',
    codeBg: 'bg-gray-50',
    codeBorder: 'border-gray-200',
    codeText: 'text-gray-800',
    typingDot: 'bg-purple-500'
  };

  return (
    <div className={`flex flex-col h-screen ${themeClasses.bgPrimary} ${themeClasses.textPrimary} relative overflow-hidden transition-colors duration-300`}>
      {/* Ads removed */}

      {/* Header */}
      <div className={`${themeClasses.bgSecondary} ${themeClasses.border} p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm relative`}>
        <div />
        {/* Floating modern button group */}
        <div className={`absolute right-4 top-3 flex items-center space-x-2 rounded-full p-1 shadow-lg backdrop-blur-sm ${themeClasses.cardBg} ${themeClasses.border}`}>
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors ${themeClasses.hoverBg}`}
            title={darkMode ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
          >
            {darkMode ? <FiSun size={16} className="text-yellow-300" /> : <FiMoon size={16} className={themeClasses.textPrimary} />}
          </button>

          <button
            onClick={() => setShowChatHistory(!showChatHistory)}
            className={`p-2 rounded-full transition-colors ${themeClasses.hoverBg}`}
            title="Riwayat Percakapan"
          >
            <FiMessageSquare size={16} className={themeClasses.textPrimary} />
          </button>

          <button
            onClick={createNewChatRoom}
            className={`p-2 rounded-full transition-colors ${themeClasses.hoverBg}`}
            title="Percakapan Baru"
          >
            <FiPlus size={16} className={themeClasses.textPrimary} />
          </button>

          {/* Settings button intentionally removed per user's request */}
        </div>
      </div>

      {/* Chat History Panel - modernized */}
      {showChatHistory && (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ type: 'spring', damping: 20 }}
          className={`absolute left-6 top-16 ${themeClasses.cardBg} rounded-2xl shadow-2xl z-30 ${themeClasses.border} w-96 max-w-[90%]`}
        >
          <div className={`flex items-center justify-between p-4 border-b ${themeClasses.border}`}>
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white shadow">📁</div>
              <div>
                <h4 className={`text-sm font-semibold ${themeClasses.textPrimary}`}>Riwayat Percakapan</h4>
                <p className={`text-xs ${themeClasses.textTertiary}`}>Pilih percakapan untuk melanjutkan</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => createNewChatRoom()} className={`px-3 py-1 rounded-md text-sm ${themeClasses.buttonBg} ${themeClasses.buttonText}`}>Baru</button>
              <button onClick={() => setShowChatHistory(false)} className={`p-2 rounded-full ${themeClasses.hoverBg}`} title="Tutup">
                <FiX size={16} className={themeClasses.textPrimary} />
              </button>
            </div>
          </div>

          <div className={`p-3 ${themeClasses.border} flex items-center space-x-2`}> 
            <input
              value={roomQuery}
              onChange={(e) => setRoomQuery(e.target.value)}
              placeholder="Cari percakapan..."
              className={`w-full px-3 py-2 rounded-md outline-none ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.inputText}`}
            />
            <button className={`p-2 rounded-md ${themeClasses.hoverBg}`} title="Cari"><FiSearch size={16} /></button>
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin text-sm p-2 space-y-2">
            {chatRooms.filter(r => r.name.toLowerCase().includes(roomQuery.toLowerCase()) || (r.messages && r.messages.join && r.messages.join(' ').toLowerCase().includes(roomQuery.toLowerCase()))).length === 0 ? (
              <div className={`p-6 text-center rounded-lg ${themeClasses.bgTertiary} ${themeClasses.textTertiary}`}>Belum ada riwayat percakapan</div>
            ) : (
              chatRooms
                .filter(r => r.name.toLowerCase().includes(roomQuery.toLowerCase()) || (r.messages && typeof r.messages.join === 'function' ? r.messages.join(' ').toLowerCase().includes(roomQuery.toLowerCase()) : true))
                .map((room) => (
                  <div
                    key={room.id}
                    onClick={() => { switchChatRoom(room.id); setShowChatHistory(false); }}
                    className={`group flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all ${room.id === currentRoomId ? `${themeClasses.bgTertiary} ${themeClasses.border}` : `${themeClasses.hoverBg}`}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${themeClasses.cardBg} ${themeClasses.border}`}>
                      <span className="text-sm font-medium">{room.name.charAt(0) || 'O'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium text-sm ${themeClasses.textPrimary}`}>{room.name}</p>
                        <p className={`text-xs ${themeClasses.textTertiary}`}>{new Date(room.createdAt).toLocaleDateString('id-ID')}</p>
                      </div>
                      <p className={`text-xs mt-1 truncate ${themeClasses.textTertiary}`}>{room.messages && room.messages.length > 0 ? room.messages[room.messages.length - 1].text.replace(/<[^>]*>?/gm, '').substring(0, 80) : 'Belum ada pesan'}</p>
                    </div>
                    <div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteChatRoom(room.id); }}
                        className="opacity-0 group-hover:opacity-100 text-sm text-red-500 p-1 rounded"
                        title="Hapus percakapan"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-2xl"
            >
              <span className="text-4xl md:text-5xl text-white font-extrabold">AI</span>
            </motion.div>
            <motion.h3 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-2xl font-semibold text-center mb-2"
            >
              Halo, saya Orion 😊!
            </motion.h3>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-center mb-8 max-w-md text-sm"
            >
              Asisten AI Anda dengan memori otomatis. Tanyakan apa saja atau unggah file untuk dianalisis.
            </motion.p>
            
            {/* Template buttons removed */}
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
                  className={`${message.isBot ? `w-full max-w-full ${themeClasses.cardBg} ${themeClasses.border}` : 'max-w-[90%] md:max-w-[80%] bg-gradient-to-br from-purple-600 to-purple-500 text-white'} rounded-2xl p-4 shadow-xs`}
                >
                  {/* Profile removed from individual bot messages for a cleaner look */}
                  
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
                    <>
                      {/* Typing indicator for the current bot message */}
                      {message.isBot && isBotTyping && currentMessageId.current === message.id && (!message.text || message.text === '') && (
                        <div className="flex items-center space-x-1">
                          <span className="typing-dot" style={{ width: 6, height: 6 }} />
                          <span className="typing-dot" style={{ width: 6, height: 6 }} />
                          <span className="typing-dot" style={{ width: 6, height: 6 }} />
                        </div>
                      )}
                      {message.quoted && (
                        <div className={`mb-2 p-2 rounded-md text-xs truncate ${themeClasses.bgTertiary} ${themeClasses.textTertiary}`}>{message.quoted}</div>
                      )}
                    <div 
                      onMouseUp={handleSelection}
                      className={`${message.isBot ? `text-xl md:text-2xl ${themeClasses.textPrimary}` : 'text-white text-sm'}`}
                      dangerouslySetInnerHTML={{ __html: message.text }} 
                    />
                    </>
                  )}
                  
                  {/* Sources section */}
                  {message.isBot && message.sources && message.sources.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className={`mt-3 pt-3 border-t ${themeClasses.border}`}
                    >
                      <p className="text-xs font-medium mb-2">Sumber:</p>
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
                            <p className="text-xs opacity-80 mt-1">{source.content}</p>
                            {source.source && (
                              <span className="text-xs text-gray-500">{source.source}</span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
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
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(message.text.replace(/<[^>]*>?/gm, ''), message.id); }}
                            className="text-xs opacity-60 hover:opacity-100 transition-opacity"
                            title="Salin ke clipboard"
                          >
                            {copiedMessageId === message.id ? (
                              <FiCheck size={16} className="text-green-500" />
                            ) : (
                              <FiCopy size={16} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons below bubble (compact) */}
                  {message.isBot && (
                    <div className="mt-2 flex items-center space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); regenerateMessage(message); }}
                        title="Regenerate"
                        aria-label="Regenerate"
                        className="w-8 h-8 flex items-center justify-center rounded-md text-xs bg-purple-50 hover:bg-purple-100"
                      >
                        <FiRefreshCw size={14} />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); likeMessage(message.id); }}
                        title="Like"
                        aria-label="Like"
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-xs ${message.liked ? 'bg-purple-600 text-white' : 'bg-purple-50 hover:bg-purple-100'}`}
                      >
                        <FiThumbsUp size={14} />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); dislikeMessage(message.id); }}
                        title="Dislike"
                        aria-label="Dislike"
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-xs ${message.disliked ? 'bg-red-500 text-white' : 'bg-purple-50 hover:bg-purple-100'}`}
                      >
                        <FiThumbsDown size={14} />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); replyToMessage(message); }}
                        title="Reply to this"
                        aria-label="Reply"
                        className="w-8 h-8 flex items-center justify-center rounded-md text-xs bg-purple-50 hover:bg-purple-100"
                      >
                        <FiCornerUpLeft size={14} />
                      </button>
                      {/* Settings button removed for cleaner message UI */}
                    </div>
                  )}

                    {/* Selection Toolbar */}
                    {showSelectionToolbar && (
                      <div className={`fixed bottom-28 right-8 rounded-lg p-2 shadow-lg flex items-center space-x-2 ${themeClasses.cardBg} ${themeClasses.border}`}>
                        <button onClick={() => { navigator.clipboard.writeText(selectedText); setShowSelectionToolbar(false); }} className="px-3 py-1 rounded-md bg-purple-600 text-white">Copy</button>
                        <button onClick={() => { setInputMessage(prev => prev + '\n> ' + selectedText); setShowSelectionToolbar(false); setInputFocused(true); textareaRef.current?.focus(); }} className={`px-3 py-1 rounded-md ${themeClasses.border}`}>Quote</button>
                      </div>
                    )}

                    {/* Settings modal moved to main JSX to avoid per-message re-creation */}
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
              className={`${themeClasses.cardBg} ${themeClasses.border} rounded-xl p-4 max-w-[90%] md:max-w-[80%]`}
            >
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mr-2 shadow">
                  <span className="text-xs text-white">AI</span>
                </div>
                <span className="text-sm font-medium">Memproses</span>
              </div>
              
              <div className="space-y-3 mt-3">
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
                      className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${source.completed ? 'bg-green-500' : 'bg-purple-500'}`}
                    >
                      {source.completed ? (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        source.icon
                      )}
                    </motion.div>
                    <span className="text-sm">{source.text}</span>
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
          className={`fixed right-6 bottom-24 w-10 h-10 rounded-full ${themeClasses.buttonBg} ${themeClasses.buttonHover} shadow-lg flex items-center justify-center z-10`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Scroll ke bawah"
        >
          <FiChevronDown size={20} className="text-white" />
        </motion.button>
      )}

      {/* Memory panel removed */}

      {/* Bottom Input Container */}
      <div className={`${themeClasses.border} ${themeClasses.bgSecondary} pt-3 pb-4 px-4`}>
        
        {/* File Preview */}
        <AnimatePresence>
          {pendingFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`flex items-center space-x-3 p-3 ${themeClasses.border} overflow-x-auto scrollbar-thin ${themeClasses.bgTertiary} rounded-t-lg`}
            >
              {pendingFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
                  className="relative flex-shrink-0"
                >
                  <div className={`w-16 h-16 flex items-center justify-center ${themeClasses.cardBg} rounded-lg ${themeClasses.border} overflow-hidden shadow-md`}>
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="p-1 text-center">
                        <FiFile size={18} className="mx-auto" />
                        <p className="text-xs mt-0.5 truncate w-14">{file.name.split('.')[0]}</p>
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

        {/* Search / web-research UI removed */}

        {/* Modern Input Area */}
        <div className="relative mt-2">
          {/* Reply preview bar (when replying to a message) */}
          {replyQuote && (
            <div className={`mb-2 p-2 rounded-lg border flex items-start justify-between ${themeClasses.bgTertiary} ${themeClasses.border}`}>
              <div className="flex-1 text-sm">
                <div className={`text-xs ${themeClasses.textTertiary}`}>Membalas:</div>
                <div className={`text-sm ${themeClasses.textPrimary} truncate`}>{(replyQuote.text && replyQuote.text.trim().length > 0) ? replyQuote.text : (replyQuote.fallback || '<Tidak ada teks>')}</div>
              </div>
              <button onClick={clearReply} className={`ml-3 p-1 ${themeClasses.textTertiary} hover:${themeClasses.textPrimary}`}>✕</button>
            </div>
          )}
          <div className={`modern-input ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.cardBg} rounded-2xl p-3 pr-4 shadow-lg transition-all duration-300 flex items-center space-x-3 ${inputFocused || inputMessage ? 'focused' : ''}`}>
            {/* Attach (left) */}
            <motion.button
              onClick={() => setShowFileOptions(!showFileOptions)}
              className={`p-2 rounded-md transition-colors ${showFileOptions ? themeClasses.bgTertiary : themeClasses.hoverBg}`}
              title="Lampirkan file"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
            >
              <FiPlus size={16} className={themeClasses.textPrimary} />
            </motion.button>

            <div className="flex-1 relative">
              <label className={`floating-label ${inputFocused || inputMessage ? 'active' : ''} ${themeClasses.textSecondary}`}>Tulis pesan...</label>
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 220)}px`;
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputMessage, pendingFiles);
                  }
                }}
                rows={1}
                className={`w-full bg-transparent resize-none outline-none text-base md:text-lg leading-6 md:leading-7 ${themeClasses.inputText}`}
                style={{ minHeight: 48 }}
              />
            </div>

            {/* Send (right) */}
            {isBotTyping ? (
              <motion.button
                onClick={stopGeneration}
                className={`w-12 h-12 flex items-center justify-center rounded-md ${darkMode ? 'bg-red-600' : 'bg-red-500'} ${themeClasses.buttonText} shadow-xl stop-btn`}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                title="Hentikan generasi"
              >
                <FiStopCircle size={18} />
              </motion.button>
            ) : (
              <motion.button
                onClick={() => handleSendMessage(inputMessage, pendingFiles)}
                disabled={(!inputMessage.trim() && pendingFiles.length === 0) || isBotTyping}
                className={`w-12 h-12 flex items-center justify-center rounded-md transition-all duration-200 ${inputMessage.trim() || pendingFiles.length > 0 ? `${themeClasses.buttonBg} ${themeClasses.buttonText}` : 'opacity-40 pointer-events-none'}`}
                whileHover={{ scale: inputMessage.trim() || pendingFiles.length > 0 ? 1.04 : 1 }}
                whileTap={{ scale: 0.98 }}
                title="Kirim pesan"
              >
                <RiSendPlaneFill size={18} />
              </motion.button>
            )}
          </div>
          {cooldownNotice && (
            <div className="mt-2 text-xs text-red-500">{cooldownNotice}</div>
          )}
        </div>

        {/* File Options */}
        <AnimatePresence>
          {showFileOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="flex space-x-3 pt-3"
            >
              <motion.label
                className={`cursor-pointer p-2 rounded-lg transition-all ${themeClasses.hoverBg}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Unggah gambar"
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
                title="Unggah file"
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

      {/* Bottom ads removed */}

      {/* Global Settings Modal (single instance) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={closeSettings}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className={`${themeClasses.cardBg} rounded-xl p-6 max-w-md w-full shadow-2xl ${themeClasses.border}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>Chat Settings</h3>
                  <button onClick={closeSettings} className="p-1 rounded-md"><FiX /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={`text-sm font-medium ${themeClasses.textPrimary}`}>Mode Copy</label>
                    <p className={`text-xs ${themeClasses.textTertiary}`}>Pilih teks untuk menyalin otomatis atau fokus untuk menyalin jawaban</p>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={closeSettings} className={`px-4 py-2 rounded-md ${themeClasses.buttonBg} ${themeClasses.buttonText}`}>Simpan</button>
                  </div>
                </div>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

        .stop-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          /* stronger, slightly more rectangular shadow for prominence */
          box-shadow: 0 14px 40px rgba(99,102,241,0.12), 0 8px 24px rgba(76,29,149,0.08);
          border-radius: 10px;
          transition: transform 0.12s ease, box-shadow 0.18s ease;
        }

        .typing-dot {
          transition: transform 0.18s ease, opacity 0.18s ease;
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
          color: #6b21a8; /* purple */
          text-decoration: none;
          transition: all 0.2s ease;
          border-bottom: 1px solid transparent;
        }

        .prose a:hover {
          color: #4c1d95;
          border-bottom-color: currentColor;
        }

        /* Modern input styles - subtle thin purple, smooth transitions */
        .modern-input {
          position: relative;
          border-radius: 18px;
          border: 1px solid rgba(124,58,237,0.06); /* very thin purple */
          background: rgba(124,58,237,0.01); /* subtle purple tint */
          transition: box-shadow 220ms cubic-bezier(.2,.9,.2,1), border-color 180ms ease, transform 160ms ease, background-color 180ms ease;
          backdrop-filter: blur(6px);
        }

        .modern-input.focused {
          transform: translateY(-2px);
          border-color: rgba(124,58,237,0.22);
          box-shadow: 0 10px 30px rgba(124,58,237,0.06), 0 2px 8px rgba(16,24,40,0.04);
          background: rgba(124,58,237,0.02);
        }

        /* Floating label tweaks for a thin purple accent */
        .modern-input .floating-label {
          color: rgba(124,58,237,0.22);
          transition: transform 160ms cubic-bezier(.2,.9,.2,1), color 160ms ease, opacity 160ms ease;
        }

        .modern-input .floating-label.active {
          transform: translateY(-18px) scale(0.82);
          color: rgba(124,58,237,0.85);
          opacity: 0.95;
        }

        /* Make textarea visually minimal inside the modern input */
        .modern-input textarea {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          color: inherit;
          padding: 6px 0;
          resize: none;
        }

        .floating-label {
          position: absolute;
          left: 12px;
          top: 8px;
          font-size: 0.85rem;
          transform-origin: left top;
          transition: all 0.16s cubic-bezier(.2,.9,.2,1);
          pointer-events: none;
          opacity: 0.9;
          transform: translateY(6px) scale(1);
        }

        .floating-label.active {
          /* lift the label up and fade it out while focused/when there is text */
          transform: translateY(-18px) scale(0.82);
          color: #7c3aed; /* subtle purple accent when active */
          top: 2px;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        /* send button visual handled by themeClasses; disabled state handled inline */

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
