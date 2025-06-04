import React, { useState } from 'react';
import PropTypes from 'prop-types';

const FileExplorer = ({ onOpenImage }) => {
  // Simulated file system structure
  const [fileSystem] = useState({
    'Documents': {
      type: 'folder',
      items: {
        'work.txt': { type: 'file', extension: 'txt' },
        'notes.txt': { type: 'file', extension: 'txt' }
      }
    },
    'Pictures': {
      type: 'folder',
      items: {
        'vacation.jpg': { type: 'file', extension: 'jpg' },
        'family.png': { type: 'file', extension: 'png' },
        'screenshot.png': { type: 'file', extension: 'png' }
      }
    },
    'Downloads': {
      type: 'folder',
      items: {
        'document.pdf': { type: 'file', extension: 'pdf' }
      }
    }
  });

  const [currentPath, setCurrentPath] = useState([]);
  
  const getCurrentFolder = () => {
    let current = fileSystem;
    for (const folder of currentPath) {
      current = current[folder].items;
    }
    return current;
  };

  const handleDoubleClick = (name, item) => {
    if (item.type === 'folder') {
      setCurrentPath([...currentPath, name]);
    } else if (['jpg', 'png', 'gif'].includes(item.extension)) {
      onOpenImage({ name, type: item.extension });
    }
  };

  const handleBack = () => {
    setCurrentPath(currentPath.slice(0, -1));
  };

  const currentFolder = getCurrentFolder();

  return (
    <div className="file-explorer" style={{ padding: '1rem' }}>
      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <button 
          onClick={handleBack} 
          disabled={currentPath.length === 0}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '1rem',
            cursor: currentPath.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Back
        </button>
        <span>Current path: /{currentPath.join('/')}</span>
      </div>
      <div className="files-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '1rem'
      }}>
        {Object.entries(currentFolder).map(([name, item]) => (
          <div
            key={name}
            onDoubleClick={() => handleDoubleClick(name, item)}
            style={{
              padding: '0.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              border: '1px solid #eee',
              borderRadius: '4px'
            }}
          >
            <div style={{ fontSize: '2rem' }}>
              {item.type === 'folder' ? '📁' : 
                item.extension === 'txt' ? '📄' :
                ['jpg', 'png', 'gif'].includes(item.extension) ? '🖼️' :
                '📎'}
            </div>
            <div style={{ marginTop: '0.5rem', wordBreak: 'break-word' }}>
              {name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

FileExplorer.propTypes = {
  onOpenImage: PropTypes.func.isRequired
};

export default FileExplorer;
