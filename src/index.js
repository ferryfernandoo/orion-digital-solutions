import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Lightweight background animation alternative
const initBackgroundAnimation = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float {
      0% { transform: translateY(0) translateX(0); }
      50% { transform: translateY(-20px) translateX(10px); }
      100% { transform: translateY(0) translateX(0); }
    }
    @keyframes float-delay {
      0% { transform: translateY(0) translateX(0); }
      50% { transform: translateY(15px) translateX(-10px); }
      100% { transform: translateY(0) translateX(0); }
    }
    .bg-animation-circle {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.15;
      animation-duration: 15s;
      animation-iteration-count: infinite;
      animation-timing-function: ease-in-out;
    }
    .bg-animation-circle:nth-child(1) {
      width: 200px;
      height: 200px;
      background: #3b82f6;
      top: 20%;
      left: 10%;
      animation-name: float;
    }
    .bg-animation-circle:nth-child(2) {
      width: 300px;
      height: 300px;
      background: #8b5cf6;
      top: 50%;
      right: 15%;
      animation-name: float-delay;
      animation-delay: 3s;
    }
    .bg-animation-circle:nth-child(3) {
      width: 250px;
      height: 250px;
      background: #06b6d4;
      bottom: 15%;
      left: 25%;
      animation-name: float;
      animation-delay: 5s;
    }
  `;
  document.head.appendChild(style);

  const bgAnimation = document.createElement('div');
  bgAnimation.className = 'fixed inset-0 overflow-hidden pointer-events-none';
  bgAnimation.innerHTML = `
    <div class="bg-animation-circle"></div>
    <div class="bg-animation-circle"></div>
    <div class="bg-animation-circle"></div>
  `;
  document.body.appendChild(bgAnimation);
};

// Initialize the lightweight background animation
initBackgroundAnimation();

// Render aplikasi React
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
