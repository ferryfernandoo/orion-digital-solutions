import React, { useState, useEffect, useRef } from 'react';

const Terminal = () => {
  const [history, setHistory] = useState([{ text: 'Welcome to Orion Terminal (PowerShell)', type: 'system' }]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [workingDirectory, setWorkingDirectory] = useState('C:\\Users\\user');
  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const addToHistory = (text, type = 'command') => {
    setHistory(prev => [...prev, { text, type }]);
  };

  const simulateCommand = async (command) => {
    const args = command.split(' ');
    const cmd = args[0].toLowerCase();

    addToHistory(`PS ${workingDirectory}> ${command}`, 'prompt');

    switch (cmd) {
      case 'clear':
      case 'cls':
        setHistory([]);
        break;

      case 'dir':
      case 'ls':
        addToHistory(
          'Directory: ' + workingDirectory + '\n\n' +
          'Mode                 LastWriteTime         Length Name\n' +
          '----                 -------------         ------ ----\n' +
          'd----          5/31/2025  9:00 AM                Documents\n' +
          'd----          5/31/2025  9:00 AM                Downloads\n' +
          'd----          5/31/2025  9:00 AM                Pictures',
          'output'
        );
        break;

      case 'cd':
      case 'chdir':
        if (args[1]) {
          if (args[1] === '..') {
            const newPath = workingDirectory.split('\\').slice(0, -1).join('\\');
            if (newPath) setWorkingDirectory(newPath);
          } else if (args[1] === '~') {
            setWorkingDirectory('C:\\Users\\user');
          } else {
            setWorkingDirectory(workingDirectory + '\\' + args[1]);
          }
        } else {
          addToHistory(workingDirectory, 'output');
        }
        break;

      case 'pwd':
      case 'gl':
        addToHistory(workingDirectory, 'output');
        break;

      case 'echo':
        addToHistory(args.slice(1).join(' '), 'output');
        break;

      case 'date':
        addToHistory(new Date().toString(), 'output');
        break;

      case 'help':
        addToHistory(
          'Available Commands:\n' +
          'clear, cls    - Clear the terminal\n' +
          'dir, ls       - List directory contents\n' +
          'cd, chdir     - Change directory\n' +
          'pwd, gl       - Print working directory\n' +
          'echo          - Print text\n' +
          'date          - Show current date and time\n' +
          'exit         - Close terminal window\n' +
          'help         - Show this help message',
          'output'
        );
        break;

      default:
        addToHistory(`'${cmd}' is not recognized as a command.`, 'error');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && currentCommand.trim()) {
      simulateCommand(currentCommand);
      setCommandHistory(prev => [...prev, currentCommand]);
      setHistoryIndex(-1);
      setCurrentCommand('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    }
  };

  const handleClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div 
      className="h-full flex flex-col bg-[#012456] text-white font-mono overflow-hidden"
      onClick={handleClick}
    >
      <div className="flex-1 overflow-y-auto p-4">
        {history.map((entry, index) => (
          <div 
            key={index} 
            className={`whitespace-pre-wrap ${
              entry.type === 'error' ? 'text-red-400' :
              entry.type === 'system' ? 'text-yellow-300' :
              entry.type === 'prompt' ? 'text-yellow-200' : 'text-white'
            }`}
          >
            {entry.text}
          </div>
        ))}
        <div className="flex items-center text-yellow-200">
          <span>{`PS ${workingDirectory}> `}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none ml-1"
            autoFocus
          />
        </div>
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

export default Terminal;
