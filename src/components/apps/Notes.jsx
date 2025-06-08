



import React, { useState, useEffect, useCallback } from 'react';

const Notes = () => {
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem('orion-notes');
    return savedNotes ? JSON.parse(savedNotes) : [{ 
      id: 1, 
      title: 'Welcome Note', 
      content: 'Welcome to Orion Notes!\n\nFeatures:\n- Autosave\n- Multiple notes\n- Search functionality\n- Rich text formatting\n\nEnjoy writing!',
      lastModified: Date.now()
    }];
  });
  
  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  // Debounced autosave
  const debouncedSave = useCallback((newNotes) => {
    localStorage.setItem('orion-notes', JSON.stringify(newNotes));
    setIsSaved(true);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSave(notes);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [notes, debouncedSave]);

  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: 'New Note',
      content: '',
      lastModified: Date.now()
    };
    setNotes([...notes, newNote]);
    setActiveNoteId(newNote.id);
    setIsSaved(false);
  };

  const updateNoteContent = (content) => {
    setNotes(notes.map(note => 
      note.id === activeNoteId 
        ? { ...note, content, lastModified: Date.now() } 
        : note
    ));
    setIsSaved(false);
  };

  const updateNoteTitle = (title) => {
    setNotes(notes.map(note => 
      note.id === activeNoteId 
        ? { ...note, title, lastModified: Date.now() } 
        : note
    ));
    setIsSaved(false);
  };

  const deleteNote = (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setNotes(notes.filter(note => note.id !== id));
      if (activeNoteId === id) {
        setActiveNoteId(notes[0]?.id);
      }
      setIsSaved(false);
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeNote = notes.find(note => note.id === activeNoteId);
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="h-full flex bg-[#1a1b1e] text-white">
      {/* Sidebar */}
      <div className="w-72 border-r border-white/10 p-4 flex flex-col">
        <div className="flex flex-col gap-4 mb-4">
          <button 
            className="px-4 py-2 bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
            onClick={createNewNote}
          >
            New Note
          </button>
          <input
            type="text"
            placeholder="Search notes..."
            className="px-3 py-2 bg-[#2a2b2e] rounded-md outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredNotes.map(note => (
            <div 
              key={note.id}
              className={`p-3 rounded-md cursor-pointer transition-all ${
                note.id === activeNoteId ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              onClick={() => setActiveNoteId(note.id)}
            >
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={note.title}
                  className="bg-transparent outline-none flex-1"
                  onChange={(e) => updateNoteTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  className="text-red-500 hover:text-red-400 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="text-sm text-gray-400 truncate mt-1">
                {note.content || 'No content'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last modified: {formatDate(note.lastModified)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col p-4">
        <div className="mb-2 text-sm text-gray-400">
          {isSaved ? 'All changes saved' : 'Saving...'}
        </div>
        <textarea
          value={activeNote?.content || ''}
          onChange={(e) => updateNoteContent(e.target.value)}
          className="flex-1 bg-[#2a2b2e] p-4 rounded-lg resize-none outline-none text-white font-mono"
          placeholder="Start typing..."
        />
      </div>
    </div>
  );
};

export default Notes;
