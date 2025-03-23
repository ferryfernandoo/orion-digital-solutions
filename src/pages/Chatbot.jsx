import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showTemplateButtons, setShowTemplateButtons] = useState(true);
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]); // State untuk file yang dipilih
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

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
    file, // Menyimpan file (jika ada)
  });

  const handleSendMessage = async (messageText, files = []) => {
    const trimmedMessage = messageText.trim();
    if ((!trimmedMessage && files.length === 0) || isBotTyping) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      // Tambahkan pesan teks (jika ada)
      if (trimmedMessage) {
        setMessages(prev => [...prev, createMessageObject(trimmedMessage, false)]);
      }

      // Tambahkan file (jika ada)
      if (files.length > 0) {
        files.forEach(file => {
          setMessages(prev => [...prev, createMessageObject(`File: ${file.name}`, false, 0, file)]);
        });
      }

      setInputMessage('');
      setPendingFiles([]); // Reset pending files
      setIsBotTyping(true);
      setIsTypingAnimation(true);
      setShowTemplateButtons(false);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      const startTime = Date.now();
      const response = await fetch(
        `https://api.ryzendesu.vip/api/ai/mistral?text=${encodeURIComponent(trimmedMessage)}`,
        {
          method: 'GET',
          headers: { 
            accept: 'application/json',
          },
          signal: controller.signal,
        }
      );
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const botResponse = data.response || data.answer || data.message || 'can`t proceed';
      const processedResponse = processSpecialChars(botResponse);
      const duration = Date.now() - startTime;

      setMessages(prev => [...prev, createMessageObject(processedResponse, true, duration)]);
    } catch (error) {
      const errorMessage = error.name === 'AbortError' 
        ? 'request timeout after 30s. Try again.'
        : 'Waduh, ada yang salah nih sama Orion! gak konek ke servernya...i have problem here, im so sorry...哎呀，发生错误了。请稍后再试';
      
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
      setPendingFiles(files); // Simpan file yang dipilih
    }
  };

  const handleSendFiles = () => {
    if (pendingFiles.length > 0) {
      handleSendMessage(inputMessage, pendingFiles); // Kirim file bersama pesan (jika ada)
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
                      <p>File: {message.file.name}</p>
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

      {/* Input Form */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputMessage, pendingFiles);
        }} className="space-y-2">
          {/* Pratinjau File */}
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex space-x-2 items-end">
            <button
              type="button"
              onClick={() => setShowFileOptions(!showFileOptions)}
              className="flex items-center justify-center bg-gray-700 text-white p-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Message Orion...."
              className="flex-1 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white resize-none overflow-hidden transition-all duration-500 ease-in-out hover:border-blue-500"
              rows={1}
              autoFocus
            />
            <button
              type="submit"
              disabled={(!inputMessage.trim() && pendingFiles.length === 0) || isBotTyping}
              className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700 text-white p-2 rounded-full font-semibold shadow-md hover:from-blue-600 hover:to-blue-800 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {showFileOptions && (
            <div className="flex space-x-2">
              {/* Ikon Galeri untuk Upload Gambar */}
              <button
                type="button"
                onClick={() => document.getElementById('image-upload').click()}
                className="flex items-center justify-center bg-gray-700 text-white p-2 rounded-full hover:bg-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
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
              {/* Ikon Paperclip untuk Upload File */}
              <button
                type="button"
                onClick={() => document.getElementById('file-upload').click()}
                className="flex items-center justify-center bg-gray-700 text-white p-2 rounded-full hover:bg-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
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
        </form>
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
