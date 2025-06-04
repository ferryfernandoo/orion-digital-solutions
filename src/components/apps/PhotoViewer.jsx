import React from 'react';
import PropTypes from 'prop-types';

const PhotoViewer = ({ file }) => {
  if (!file) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: '#666'
      }}>
        No image selected
      </div>
    );
  }

  // In a real app, we would use actual image data/URLs
  // For this simulation, we'll show a placeholder
  return (
    <div style={{
      padding: '1rem',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        marginBottom: '1rem',
        padding: '0.5rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px'
      }}>
        {file.name}
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        border: '1px solid #eee',
        borderRadius: '4px'
      }}>
        <div style={{ fontSize: '4rem' }}>🖼️</div>
      </div>
    </div>
  );
};

PhotoViewer.propTypes = {
  file: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string
  })
};

export default PhotoViewer;
