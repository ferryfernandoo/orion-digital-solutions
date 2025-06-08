import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const CodeEditor = () => {
  // Initialize Google Generative AI
  const genAI = new GoogleGenerativeAI("AIzaSyDSTgkkROL7mjaGKoD2vnc8l2UptNCbvHk");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const [files, setFiles] = useState(() => {
    const savedFiles = localStorage.getItem('orion-code-files');
    return savedFiles
      ? JSON.parse(savedFiles)
      : [
          {
            id: 1,
            filename: 'index.html',
            language: 'html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    h1 {
      color: #333;
    }
  </style>
</head>
<body>
  <h1>Welcome to Orion Editor</h1>
  <p id="demo">Start coding!</p>
  
  <script>
    document.getElementById('demo').textContent = 'Hello from JavaScript!';
    console.log('Script executed successfully');
  </script>
</body>
</html>`,
            lastModified: Date.now(),
          },
          {
            id: 2,
            filename: 'style.css',
            language: 'css',
            content: `/* Add your styles here */
body {
  background-color: #f0f0f0;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}`,
            lastModified: Date.now(),
          },
          {
            id: 3,
            filename: 'app.js',
            language: 'javascript',
            content: `// JavaScript goes here
function greet(name) {
  return \`Hello, \${name}!\`;
}

// This will run when the preview is shown
console.log(greet('Orion User'));

// You can also modify the HTML
document.addEventListener('DOMContentLoaded', () => {
  const el = document.createElement('p');
  el.textContent = 'This was added by app.js';
  document.body.appendChild(el);
});`,
            lastModified: Date.now(),
          }
        ];
  });

  const [activeFileId, setActiveFileId] = useState(files[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const terminalRef = useRef(null);

  // File templates for new files
  const fileTemplates = {
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>New HTML File</h1>
  <script src="app.js"></script>
</body>
</html>`,
    css: `/* CSS file */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
}`,
    javascript: `// JavaScript file
console.log('Hello from JavaScript!');

document.addEventListener('DOMContentLoaded', function() {
  // Your code here
});`
  };

  const debouncedSave = useCallback((newFiles) => {
    localStorage.setItem('orion-code-files', JSON.stringify(newFiles));
    setIsSaved(true);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSave(files);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [files, debouncedSave]);

  const createNewFile = (language = 'javascript') => {
    const extension = {
      html: 'html',
      css: 'css',
      javascript: 'js'
    }[language] || 'js';
    
    const newFile = {
      id: Date.now(),
      filename: `new-file-${Date.now()}.${extension}`,
      language,
      content: fileTemplates[language] || '',
      lastModified: Date.now(),
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
    setIsSaved(false);
  };

  const updateFileContent = (content) => {
    setFiles(
      files.map((file) =>
        file.id === activeFileId
          ? { ...file, content, lastModified: Date.now() }
          : file
      )
    );
    setIsSaved(false);
  };

  const updateFilename = (filename) => {
    const activeFile = files.find(file => file.id === activeFileId);
    const extension = {
      html: 'html',
      css: 'css',
      javascript: 'js'
    }[activeFile.language] || 'js';
    
    let newFilename = filename;
    if (!filename.endsWith(`.${extension}`)) {
      newFilename = `${filename.split('.')[0]}.${extension}`;
    }
    
    setFiles(
      files.map((file) =>
        file.id === activeFileId
          ? { ...file, filename: newFilename, lastModified: Date.now() }
          : file
      )
    );
    setIsSaved(false);
  };

  const deleteFile = (id) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      const updatedFiles = files.filter((file) => file.id !== id);
      setFiles(updatedFiles);
      setActiveFileId(updatedFiles[0]?.id);
      setIsSaved(false);
    }
  };

  const runCode = () => {
    setShowPreview(true);
    setPreviewKey(prev => prev + 1);
    
    // Capture console output
    const activeFile = files.find(file => file.id === activeFileId);
    if (activeFile?.language === 'javascript') {
      const newOutput = [...terminalOutput, `$ Running ${activeFile.filename}`];
      try {
        // This is a simplified simulation - in a real app you'd need a proper sandbox
        newOutput.push('> ' + activeFile.content.match(/console\.log\(([^)]+)\)/)?.[1] || 'No console output');
      } catch (error) {
        newOutput.push(`! Error: ${error.message}`);
      }
      setTerminalOutput(newOutput);
      setShowTerminal(true);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyCode.F5, runCode);
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => setShowAiPanel(true));
  };

  const getHtmlPreviewContent = () => {
    const htmlFile = files.find(file => file.language === 'html');
    const cssFile = files.find(file => file.language === 'css');
    const jsFile = files.find(file => file.language === 'javascript');
    
    let content = htmlFile?.content || '<!DOCTYPE html><html><body><h1>No HTML file found</h1></body></html>';
    
    // Inject CSS if available
    if (cssFile) {
      const styleTag = `<style>${cssFile.content}</style>`;
      if (content.includes('</head>')) {
        content = content.replace('</head>', `${styleTag}</head>`);
      } else if (content.includes('<head>')) {
        content = content.replace('<head>', `<head>${styleTag}`);
      } else {
        content = content.replace('<html>', `<html><head>${styleTag}</head>`);
      }
    }
    
    // Inject JS if available
    if (jsFile) {
      const scriptTag = `<script>${jsFile.content}</script>`;
      if (content.includes('</body>')) {
        content = content.replace('</body>', `${scriptTag}</body>`);
      } else if (content.includes('<body>')) {
        content = content.replace('<body>', `<body>${scriptTag}`);
      } else {
        content = `${content}${scriptTag}`;
      }
    }
    
    return content;
  };

  const askAI = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAiLoading(true);
    setAiResponse('Thinking...');
    
    try {
      const activeFile = files.find(file => file.id === activeFileId);
      const context = activeFile ? `File: ${activeFile.filename}\nLanguage: ${activeFile.language}\nCurrent code:\n${activeFile.content}` : 'No active file';
      
      const fullPrompt = `You are a coding assistant. The user is working on:\n${context}\n\nUser request: ${aiPrompt}\n\nProvide a concise and helpful response with code examples if needed.`;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      setAiResponse(text);
      
      // Add to terminal
      setTerminalOutput(prev => [...prev, `AI: ${text}`]);
      setShowTerminal(true);
    } catch (error) {
      setAiResponse(`Error: ${error.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (activeFileId && aiResponse) {
      // Simple implementation - in a real app you'd want more sophisticated parsing
      const codeBlocks = aiResponse.match(/```[\s\S]*?```/g);
      if (codeBlocks && codeBlocks.length > 0) {
        const newCode = codeBlocks[0].replace(/```[^\n]*\n/, '').replace(/\n```$/, '');
        updateFileContent(newCode);
      }
    }
  };

  const filteredFiles = files.filter((file) =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeFile = files.find((file) => file.id === activeFileId);
  const formatDate = (timestamp) => new Date(timestamp).toLocaleString();

  // VS Code-like color scheme
  const vscodeColors = {
    background: '#1e1e1e',
    sidebar: '#252526',
    sidebarHover: '#2a2d2e',
    active: '#37373d',
    text: '#cccccc',
    textSecondary: '#858585',
    border: '#474747',
    highlight: '#0e639c',
    button: '#0a639c',
    buttonHover: '#1177bb',
    terminal: '#1e1e1e',
    terminalText: '#f0f0f0',
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-[#cccccc] overflow-hidden">
      {/* Title Bar */}
      <div className="h-8 bg-[#3c3c3c] flex items-center px-4 text-sm border-b border-[#252526]">
        <div className="flex items-center space-x-4">
          <span className="font-semibold">Orion Editor</span>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <span className="text-xs">{activeFile?.filename || 'No file selected'}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <div className="w-12 bg-[#252526] flex flex-col items-center py-2 space-y-4 border-r border-[#474747]">
          <button className="p-2 rounded hover:bg-[#37373d]" title="Explorer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
          <button className="p-2 rounded hover:bg-[#37373d]" title="Search">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button 
            className={`p-2 rounded ${showAiPanel ? 'bg-[#37373d]' : 'hover:bg-[#37373d]'}`} 
            title="AI Assistant"
            onClick={() => setShowAiPanel(!showAiPanel)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        </div>

        {/* Sidebar */}
        <div className={`${showAiPanel ? 'w-1/4' : 'w-64'} bg-[#252526] flex flex-col border-r border-[#474747] transition-all duration-200`}>
          {showAiPanel ? (
            <div className="p-4 flex flex-col h-full">
              <h3 className="text-lg font-medium mb-4">AI Coding Assistant</h3>
              <textarea
                className="flex-1 bg-[#2d2d2d] text-[#cccccc] p-2 mb-2 rounded border border-[#474747] outline-none resize-none"
                placeholder="Ask the AI to help with your code..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button
                className="px-4 py-2 bg-[#0a639c] hover:bg-[#1177bb] rounded-md mb-4 flex items-center justify-center"
                onClick={askAI}
                disabled={isAiLoading}
              >
                {isAiLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Thinking...
                  </>
                ) : 'Ask AI'}
              </button>
              
              <div className="flex-1 bg-[#1e1e1e] p-3 rounded overflow-auto">
                <pre className="whitespace-pre-wrap text-sm">{aiResponse}</pre>
              </div>
              
              {aiResponse && (
                <button
                  className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md"
                  onClick={applyAiSuggestion}
                >
                  Apply Suggestion
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider">EXPLORER</h3>
                  <div className="flex space-x-2">
                    <button 
                      className="p-1 hover:bg-[#37373d] rounded"
                      onClick={() => createNewFile('html')}
                      title="New HTML File"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button 
                      className="p-1 hover:bg-[#37373d] rounded"
                      onClick={() => createNewFile('javascript')}
                      title="New JavaScript File"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Search files..."
                  className="w-full px-3 py-1 bg-[#2d2d2d] rounded-md outline-none text-sm mb-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center px-4 py-1 cursor-pointer hover:bg-[#37373d] ${
                      file.id === activeFileId ? 'bg-[#37373d]' : ''
                    }`}
                    onClick={() => setActiveFileId(file.id)}
                  >
                    <div className="flex-1 flex items-center">
                      <span className="text-sm truncate">{file.filename}</span>
                    </div>
                    <button
                      className="p-1 hover:bg-[#4a4a4a] rounded text-[#858585] hover:text-[#cccccc]"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file.id);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Tabs */}
          <div className="h-8 bg-[#252526] flex items-center border-b border-[#474747] overflow-x-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className={`h-full flex items-center px-3 border-r border-[#474747] cursor-pointer text-sm ${
                  file.id === activeFileId ? 'bg-[#1e1e1e]' : 'hover:bg-[#2d2d2d]'
                }`}
                onClick={() => setActiveFileId(file.id)}
              >
                <span className="truncate max-w-xs">{file.filename}</span>
                {file.id === activeFileId && !isSaved && (
                  <span className="ml-2 text-[#858585]">●</span>
                )}
              </div>
            ))}
          </div>

          {/* Editor/Preview Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor */}
            <div className={`${showPreview ? 'w-1/2' : 'w-full'} h-full`}>
              <Editor
                height="100%"
                theme="vs-dark"
                language={activeFile?.language || 'javascript'}
                value={activeFile?.content || ''}
                onChange={updateFileContent}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: 14,
                  minimap: { enabled: true },
                  automaticLayout: true,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  renderWhitespace: 'selection',
                  tabSize: 2,
                  autoClosingBrackets: 'always',
                  autoClosingQuotes: 'always',
                  formatOnPaste: true,
                  formatOnType: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  bracketPairColorization: {
                    enabled: true,
                    independentColorPoolPerBracketType: true
                  },
                  guides: {
                    bracketPairs: true,
                    bracketPairsHorizontal: true,
                    highlightActiveBracketPair: true,
                    indentation: true
                  },
                }}
              />
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="w-1/2 h-full bg-white flex flex-col">
                <div className="h-8 bg-[#252526] flex items-center px-3 text-sm border-b border-[#474747]">
                  <span>Preview</span>
                  <button
                    className="ml-auto p-1 hover:bg-[#37373d] rounded"
                    onClick={() => setShowPreview(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <iframe
                  key={previewKey}
                  ref={previewRef}
                  srcDoc={getHtmlPreviewContent()}
                  title="Preview"
                  className="flex-1 w-full border-none"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="h-6 bg-[#007acc] flex items-center px-3 text-xs justify-between">
            <div className="flex items-center space-x-4">
              <span>{activeFile?.language ? activeFile.language.toUpperCase() : ''}</span>
              <span>{isSaved ? 'Saved' : 'Unsaved'}</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="hover:bg-[#006bb3] px-1 rounded"
                onClick={() => setShowTerminal(!showTerminal)}
              >
                Terminal
              </button>
              <span>Ln {editorRef.current?.getPosition()?.lineNumber || 1}, Col {editorRef.current?.getPosition()?.column || 1}</span>
            </div>
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div className="h-48 bg-[#1e1e1e] border-t border-[#474747] flex flex-col">
              <div className="h-6 bg-[#252526] flex items-center px-3 text-xs border-b border-[#474747]">
                <span>TERMINAL</span>
                <button
                  className="ml-auto p-1 hover:bg-[#37373d] rounded"
                  onClick={() => setShowTerminal(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div 
                ref={terminalRef}
                className="flex-1 p-2 overflow-auto font-mono text-sm"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {terminalOutput.length > 0 ? (
                  terminalOutput.map((line, index) => (
                    <div key={index} className="mb-1">
                      {line.startsWith('$') ? (
                        <span className="text-green-400">{line}</span>
                      ) : line.startsWith('>') ? (
                        <span className="text-blue-400">{line}</span>
                      ) : line.startsWith('!') ? (
                        <span className="text-red-400">{line}</span>
                      ) : line.startsWith('AI:') ? (
                        <span className="text-purple-400">{line}</span>
                      ) : (
                        <span>{line}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-[#858585]">Terminal output will appear here</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;