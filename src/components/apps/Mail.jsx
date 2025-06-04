import React, { useState } from 'react';

const Mail = () => {
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composing, setComposing] = useState(false);
  const [newEmail, setNewEmail] = useState({
    to: '',
    subject: '',
    body: ''
  });

  // Demo data
  const folders = [
    { id: 'inbox', name: 'Inbox', icon: '📥' },
    { id: 'sent', name: 'Sent', icon: '📤' },
    { id: 'drafts', name: 'Drafts', icon: '📝' },
    { id: 'trash', name: 'Trash', icon: '🗑️' }
  ];

  const demoEmails = {
    inbox: [
      {
        id: 1,
        from: 'team@orion.com',
        subject: 'Welcome to Orion OS',
        date: '2025-05-31 09:00',
        body: 'Welcome to Orion OS Mail! This is a demo email client.'
      },
      {
        id: 2,
        from: 'updates@orion.com',
        subject: 'New Features Available',
        date: '2025-05-31 10:30',
        body: 'Check out the latest features in Orion OS.'
      }
    ],
    sent: [
      {
        id: 3,
        to: 'support@orion.com',
        subject: 'Re: Question about features',
        date: '2025-05-30 15:45',
        body: 'Thanks for the quick response!'
      }
    ],
    drafts: [],
    trash: []
  };

  const handleCompose = () => {
    setComposing(true);
    setSelectedEmail(null);
  };

  const handleSend = () => {
    // In a real app, this would send the email
    alert('Email sent! (Demo only)');
    setComposing(false);
    setNewEmail({ to: '', subject: '', body: '' });
  };

  return (
    <div className="h-full flex bg-[#1a1b1e] text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 p-4">
        <button 
          className="w-full px-4 py-2 bg-blue-500 rounded-md mb-4 hover:bg-blue-600"
          onClick={handleCompose}
        >
          Compose
        </button>
        <div className="space-y-2">
          {folders.map(folder => (
            <div 
              key={folder.id}
              className={`flex flex-col items-center gap-1 p-2 rounded-md cursor-pointer ${
                selectedFolder === folder.id ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              onClick={() => setSelectedFolder(folder.id)}
            >
              <span className="text-xl">{folder.icon}</span>
              <span className="text-xs">{folder.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Email List */}
      <div className="w-80 border-r border-white/10 overflow-y-auto">
        {demoEmails[selectedFolder].map(email => (
          <div
            key={email.id}
            className={`p-4 border-b border-white/10 cursor-pointer ${
              selectedEmail?.id === email.id ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
            onClick={() => {
              setSelectedEmail(email);
              setComposing(false);
            }}
          >
            <div className="font-medium mb-1">
              {selectedFolder === 'sent' ? `To: ${email.to}` : `From: ${email.from}`}
            </div>
            <div className="text-sm text-gray-300">{email.subject}</div>
            <div className="text-xs text-gray-400 mt-1">{email.date}</div>
          </div>
        ))}
      </div>

      {/* Email Content / Compose */}
      <div className="flex-1 p-4">
        {composing ? (
          <div className="h-full flex flex-col">
            <div className="space-y-4 mb-4">
              <input
                type="text"
                placeholder="To"
                className="w-full px-3 py-2 bg-[#2a2b2e] rounded-md outline-none"
                value={newEmail.to}
                onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
              />
              <input
                type="text"
                placeholder="Subject"
                className="w-full px-3 py-2 bg-[#2a2b2e] rounded-md outline-none"
                value={newEmail.subject}
                onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
              />
            </div>
            <textarea
              className="flex-1 bg-[#2a2b2e] p-4 rounded-lg resize-none outline-none mb-4"
              placeholder="Write your message here..."
              value={newEmail.body}
              onChange={(e) => setNewEmail({ ...newEmail, body: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-700"
                onClick={() => setComposing(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 rounded-md hover:bg-blue-600"
                onClick={handleSend}
              >
                Send
              </button>
            </div>
          </div>
        ) : selectedEmail ? (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">{selectedEmail.subject}</h2>
              <div className="text-sm text-gray-300 mb-1">
                {selectedFolder === 'sent' ? `To: ${selectedEmail.to}` : `From: ${selectedEmail.from}`}
              </div>
              <div className="text-xs text-gray-400">{selectedEmail.date}</div>
            </div>
            <div className="bg-[#2a2b2e] p-4 rounded-lg">
              {selectedEmail.body}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Select an email to read or compose a new one
          </div>
        )}
      </div>
    </div>
  );
};

export default Mail;
