import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  FiSend, FiPlus, FiX, FiImage, FiFile, FiTrash2, 
  FiClock, FiCpu, FiZap, FiStopCircle, FiMessageSquare,
  FiSun, FiMoon, FiSearch, FiDatabase, FiAward, 
  FiExternalLink, FiCheck, FiStar, FiInfo, FiChevronDown,
  FiCopy, FiMoreVertical, FiUser
} from 'react-icons/fi';
import { RiSendPlaneFill } from 'react-icons/ri';

// AI Configuration
const genAI = new GoogleGenerativeAI("AIzaSyDSTgkkROL7mjaGKoD2vnc8l2UptNCbvHk");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Smart Memory System
class MemoryEngine {
  constructor() {
    this.memories = [];
    this.load();
  }

  load() {
    const saved = localStorage.getItem('orionMemories');
    if (saved) {
      try {
        this.memories = JSON.parse(saved);
        this.cleanup();
      } catch (e) {
        console.error("Memory load error:", e);
      }
    }
  }

  save() {
    localStorage.setItem('orionMemories', JSON.stringify(this.memories));
  }

  cleanup() {
    // Remove duplicates and old memories
    const unique = new Map();
    this.memories.forEach(mem => {
      if (!unique.has(mem.id) {
        unique.set(mem.id, mem);
      }
    });
    this.memories = Array.from(unique.values())
      .sort((a, b) => new Date(b.context.date) - new Date(a.context.date))
      .slice(0, 200); // Keep only 200 most recent
    this.save();
  }

  async addMemory(summary, messages, context = {}) {
    const memory = {
      id: Date.now().toString(),
      summary,
      messages: messages.slice(-5), // Last 5 messages
      context: {
        date: new Date().toISOString(),
        importance: 1,
        tags: [],
        language: 'indonesia',
        ...context
      },
      lastAccessed: Date.now()
    };
    
    this.memories.unshift(memory);
    this.cleanup();
    return memory;
  }

  async findRelevant(query, limit = 3) {
    if (this.memories.length === 0) return [];
    
    // First check for exact matches in recent memories
    const recentMatches = this.memories
      .slice(0, 20)
      .filter(mem => 
        mem.summary.toLowerCase().includes(query.toLowerCase()) || 
        mem.messages.some(msg => msg.text.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit);
    
    if (recentMatches.length > 0) return recentMatches;
    
    // Fallback to keyword matching if no exact matches
    return this.memories
      .filter(mem => 
        mem.context.tags.some(tag => query.toLowerCase().includes(tag)) ||
        mem.summary.toLowerCase().split(' ').some(word => query.toLowerCase().includes(word)))
      .sort((a, b) => b.context.importance - a.context.importance)
      .slice(0, limit);
  }

  async getContextString(query) {
    const relevant = await this.findRelevant(query);
    if (relevant.length === 0) return '';
    
    return relevant.map(mem => 
      `[Memori ${new Date(mem.context.date).toLocaleDateString('id-ID')}]: ${mem.summary}`
    ).join('\n');
  }

  deleteMemory(id) {
    this.memories = this.memories.filter(m => m.id !== id);
    this.save();
  }
}

const memoryEngine = new MemoryEngine();

// Modern Chat UI Component
const ChatBot = () => {
  // State
  const [chatRooms, setChatRooms] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [isProMode, setIsProMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [memoryImportanceFilter, setMemoryImportanceFilter] = useState('all');
  const [selectedMemory, setSelectedMemory] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize
  useEffect(() => {
    const savedRooms = localStorage.getItem('orionChatRooms');
    const savedCurrent = localStorage.getItem('orionCurrentRoom');
    const savedDark = localStorage.getItem('orionDarkMode');
    const savedPro = localStorage.getItem('orionProMode');

    if (savedRooms) setChatRooms(JSON.parse(savedRooms));
    if (savedCurrent) setCurrentRoomId(savedCurrent);
    if (savedDark) setDarkMode(savedDark === 'true');
    if (savedPro) setIsProMode(savedPro === 'true');

    if (!savedRooms || JSON.parse(savedRooms).length === 0) {
      createNewChatRoom();
    }
  }, []);

  // Save room changes
  useEffect(() => {
    if (currentRoomId && chatRooms.length > 0) {
      const updatedRooms = chatRooms.map(room => 
        room.id === currentRoomId ? { ...room, messages } : room
      );
      setChatRooms(updatedRooms);
      localStorage.setItem('orionChatRooms', JSON.stringify(updatedRooms));
    }
  }, [messages, currentRoomId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Theme
  const themeClasses = darkMode ? {
    bgPrimary: 'bg-gray-900',
    bgSecondary: 'bg-gray-800',
    bgTertiary: 'bg-gray-700',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-300',
    border: 'border-gray-700',
    inputBg: 'bg-gray-800',
    buttonBg: 'bg-blue-700',
    cardBg: 'bg-gray-800'
  } : {
    bgPrimary: 'bg-gray-50',
    bgSecondary: 'bg-white',
    bgTertiary: 'bg-gray-100',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    inputBg: 'bg-white',
    buttonBg: 'bg-blue-600',
    cardBg: 'bg-white'
  };

  // Chat Room Management
  const createNewChatRoom = () => {
    const newRoom = {
      id: Date.now().toString(),
      name: `Percakapan Baru ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      messages: [],
      createdAt: new Date().toISOString()
    };
    
    setChatRooms(prev => [newRoom, ...prev]);
    setCurrentRoomId(newRoom.id);
    setMessages([]);
    setInputMessage('');
    localStorage.setItem('orionCurrentRoom', newRoom.id);
  };

  const switchRoom = (roomId) => {
    const room = chatRooms.find(r => r.id === roomId);
    if (room) {
      setCurrentRoomId(roomId);
      setMessages(room.messages || []);
      setShowSidebar(false);
    }
  };

  const deleteRoom = (roomId) => {
    const updated = chatRooms.filter(r => r.id !== roomId);
    setChatRooms(updated);
    localStorage.setItem('orionChatRooms', JSON.stringify(updated));
    
    if (currentRoomId === roomId) {
      if (updated.length > 0) switchRoom(updated[0].id);
      else createNewChatRoom();
    }
  };

  // Message Handling
  const createMessage = (text, isBot, file = null) => ({
    id: Date.now().toString(),
    text: text.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    isBot,
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    file
  });

  const handleSend = async () => {
    const text = inputMessage.trim();
    if ((!text && pendingFiles.length === 0) || isBotTyping) return;

    // Add user message
    const userMsg = createMessage(text, false);
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setPendingFiles([]);

    // Prepare AI response
    setIsBotTyping(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Get relevant memories (non-blocking)
      const memoryContext = await memoryEngine.getContextString(text);
      
      // Generate response
      const prompt = `${
        memoryContext ? `Konteks:\n${memoryContext}\n\n` : ''
      }Percakapan:\nUser: ${text}\n\nBeri respon sebagai Orion yang ramah dan membantu dalam bahasa yang sama dengan user. Jangan sebut konteks memori kecuali diminta.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      
      // Add AI message
      const aiMsg = createMessage(response, true);
      setMessages(prev => [...prev, aiMsg]);

      // Auto-save important conversations
      if (text.length > 20 || response.length > 50) {
        const summary = await generateSummary(text, response);
        if (summary) {
          await memoryEngine.addMemory(summary, [userMsg, aiMsg], {
            importance: text.length > 50 ? 3 : 1
          });
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setMessages(prev => [...prev, createMessage("Maaf, terjadi kesalahan. Silakan coba lagi.", true)]);
      }
    } finally {
      setIsBotTyping(false);
      setAbortController(null);
    }
  };

  const generateSummary = async (userMsg, aiMsg) => {
    try {
      const prompt = `Buat ringkasan sangat singkat (1 kalimat) dari percakapan ini:\n\nUser: ${userMsg}\nAI: ${aiMsg}`;
      const result = await model.generateContent(prompt);
      return (await result.response.text()).trim();
    } catch {
      return null;
    }
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsBotTyping(false);
  };

  // UI Components
  const Message = ({ message }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div className={`flex max-w-[85%] ${message.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          message.isBot ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
        }`}>
          {message.isBot ? 'AI' : <FiUser size={16} />}
        </div>
        <div className={`mx-2 ${message.isBot ? 'ml-2' : 'mr-2'}`}>
          <div className={`px-4 py-2 rounded-2xl ${
            message.isBot ? 
              `${darkMode ? 'bg-gray-700' : 'bg-gray-100'} text-${darkMode ? 'gray-100' : 'gray-800'}` : 
              'bg-blue-500 text-white'
          }`}>
            <div dangerouslySetInnerHTML={{ __html: message.text }} />
            {message.file && (
              <div className="mt-2">
                <p className="text-xs opacity-80">File: {message.file.name}</p>
                {message.file.type.startsWith('image/') && (
                  <img 
                    src={URL.createObjectURL(message.file)} 
                    alt="Preview" 
                    className="mt-1 max-w-full h-auto rounded-lg"
                  />
                )}
              </div>
            )}
          </div>
          <div className={`text-xs mt-1 flex items-center ${
            message.isBot ? 'justify-start' : 'justify-end'
          } text-${darkMode ? 'gray-400' : 'gray-500'}`}>
            {message.time}
            {message.isBot && (
              <button 
                onClick={() => copyToClipboard(message.text, message.id)}
                className="ml-2 opacity-70 hover:opacity-100"
              >
                {copiedMessageId === message.id ? (
                  <FiCheck size={14} className="text-green-500" />
                ) : (
                  <FiCopy size={14} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className={`flex h-screen ${themeClasses.bgPrimary} ${themeClasses.textPrimary} overflow-hidden`}>
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: showSidebar ? 0 : -300 }}
        transition={{ type: 'spring', damping: 25 }}
        className={`fixed md:relative z-20 w-72 h-full ${themeClasses.bgSecondary} ${themeClasses.border} border-r flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-semibold">Percakapan</h2>
          <button
            onClick={() => setShowSidebar(false)}
            className="md:hidden p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FiX size={18} />
          </button>
        </div>
        
        <div className="p-2">
          <button
            onClick={createNewChatRoom}
            className={`w-full py-2 px-3 rounded-lg flex items-center justify-center ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors mb-4`}
          >
            <FiPlus size={16} className="mr-2" />
            Percakapan Baru
          </button>
          
          <div className="overflow-y-auto h-[calc(100vh-180px)]">
            {chatRooms.map(room => (
              <div
                key={room.id}
                onClick={() => switchRoom(room.id)}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                  room.id === currentRoomId ? 
                    (darkMode ? 'bg-gray-700' : 'bg-blue-100 text-blue-800') : 
                    (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-medium truncate">{room.name}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRoom(room.id);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
                {room.messages.length > 0 && (
                  <p className="text-xs mt-1 truncate text-gray-500 dark:text-gray-400">
                    {room.messages[room.messages.length - 1].text.substring(0, 60)}...
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col h-full ${themeClasses.bgPrimary}`}>
        {/* Header */}
        <div className={`p-3 ${themeClasses.border} border-b flex items-center justify-between`}>
          <button
            onClick={() => setShowSidebar(true)}
            className="p-1.5 rounded-full md:hidden hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FiMessageSquare size={18} />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <span className="font-medium">AI</span>
            </div>
            <div>
              <h2 className="font-medium">Orion AI</h2>
              <p className="text-xs flex items-center">
                {isBotTyping ? (
                  <span className="flex items-center">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="ml-1">Mengetik...</span>
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    Online
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMemoryPanel(!showMemoryPanel)}
              className={`p-1.5 rounded-full ${
                showMemoryPanel ? 
                  (darkMode ? 'bg-gray-700' : 'bg-gray-200') : 
                  'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="Memori"
            >
              <FiCpu size={18} />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white mb-4">
                <span className="text-2xl">AI</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Halo, saya Orion AI</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                Asisten AI Anda yang cerdas. Mulai percakapan atau ajukan pertanyaan apapun.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {[
                  "Apa kabar hari ini?",
                  "Bantu saya dengan ide proyek",
                  "Jelaskan konsep machine learning",
                  "Bantu debug kode saya"
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInputMessage(prompt)}
                    className={`p-3 rounded-xl text-sm text-left ${
                      darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <Message key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Input Area */}
        <div className={`p-3 ${themeClasses.border} border-t`}>
          {pendingFiles.length > 0 && (
            <div className="flex items-center space-x-2 p-2 mb-2 overflow-x-auto">
              {pendingFiles.map((file, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    {file.type.startsWith('image/') ? (
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <FiFile size={20} />
                    )}
                  </div>
                  <button
                    onClick={() => setPendingFiles(pendingFiles.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ketik pesan..."
              className={`w-full ${themeClasses.inputBg} ${themeClasses.border} rounded-xl pr-12 pl-4 py-3 focus:outline-none resize-none overflow-hidden`}
              rows={1}
              style={{ minHeight: '48px' }}
            />
            
            <div className="absolute right-2 bottom-2 flex items-center space-x-1">
              {inputMessage && (
                <button
                  onClick={() => setInputMessage('')}
                  className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <FiX size={16} />
                </button>
              )}
              
              <label className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setPendingFiles([...pendingFiles, ...Array.from(e.target.files)])}
                  multiple
                />
                <FiPlus size={16} />
              </label>
              
              <button
                onClick={handleSend}
                disabled={!inputMessage.trim() && pendingFiles.length === 0}
                className={`p-2 rounded-full ${
                  inputMessage.trim() || pendingFiles.length > 0 ?
                    'bg-blue-500 hover:bg-blue-600 text-white' :
                    'text-gray-400'
                } transition-colors`}
              >
                <RiSendPlaneFill size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Panel */}
      {showMemoryPanel && (
        <motion.div
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className={`fixed md:relative z-20 w-80 h-full ${themeClasses.bgSecondary} ${themeClasses.border} border-l flex flex-col`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-semibold">Memori</h2>
            <button
              onClick={() => setShowMemoryPanel(false)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <FiX size={18} />
            </button>
          </div>
          
          <div className="p-3">
            <div className="flex items-center mb-4">
              <select
                value={memoryImportanceFilter}
                onChange={(e) => setMemoryImportanceFilter(e.target.value)}
                className={`flex-1 text-sm p-2 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                <option value="all">Semua Memori</option>
                <option value="important">Penting</option>
                <option value="normal">Normal</option>
              </select>
            </div>
            
            <div className="overflow-y-auto h-[calc(100vh-180px)]">
              {memoryEngine.memories
                .filter(mem => {
                  if (memoryImportanceFilter === 'all') return true;
                  if (memoryImportanceFilter === 'important') return mem.context.importance >= 4;
                  return mem.context.importance < 4;
                })
                .map(memory => (
                  <div
                    key={memory.id}
                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                      selectedMemory === memory.id ? 
                        (darkMode ? 'bg-gray-700' : 'bg-blue-100') : 
                        (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                    }`}
                    onClick={() => setSelectedMemory(selectedMemory === memory.id ? null : memory.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="font-medium truncate">{memory.summary}</p>
                          {memory.context.importance >= 4 && (
                            <FiStar className="ml-1 text-yellow-500 flex-shrink-0" size={14} />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(memory.context.date).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          memoryEngine.deleteMemory(memory.id);
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                    
                    {selectedMemory === memory.id && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          <span className="font-medium">Detail:</span> {memory.messages.length} pesan
                        </div>
                        <div className="text-sm bg-gray-100 dark:bg-gray-800 rounded-lg p-2 max-h-40 overflow-y-auto">
                          {memory.messages.slice(0, 3).map((msg, i) => (
                            <p key={i} className="mb-1">
                              <span className="font-medium">{msg.isBot ? 'AI:' : 'Anda:'}</span> {msg.text.substring(0, 80)}...
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Typing Indicator */}
      {isBotTyping && (
        <div className="fixed bottom-20 right-4 bg-blue-500 text-white px-3 py-1.5 rounded-full flex items-center shadow-lg">
          <div className="flex mr-2">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
          Orion sedang mengetik
          <button
            onClick={stopGeneration}
            className="ml-2 p-0.5 rounded-full hover:bg-blue-600"
          >
            <FiStopCircle size={16} />
          </button>
        </div>
      )}

      <style jsx global>{`
        .typing-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: currentColor;
          margin-right: 3px;
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
          0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
        
        pre {
          background: ${darkMode ? '#1e293b' : '#f3f4f6'} !important;
          padding: 1em !important;
          border-radius: 0.5em !important;
          overflow-x: auto !important;
        }
        
        code {
          font-family: 'Fira Code', monospace !important;
          font-size: 0.9em !important;
        }
      `}</style>
    </div>
  );
};

export default ChatBot;
