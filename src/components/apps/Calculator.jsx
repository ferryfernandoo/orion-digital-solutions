import React, { useState } from 'react';

const Calculator = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  const handleNumber = (number) => {
    if (display === '0' || shouldResetDisplay) {
      setDisplay(number);
      setShouldResetDisplay(false);
    } else {
      setDisplay(display + number);
    }
  };

  const handleOperator = (operator) => {
    if (display !== 'Error') {
      setShouldResetDisplay(true);
      setEquation(display + ' ' + operator + ' ');
    }
  };

  const handleDelete = () => {
    if (display !== 'Error' && display !== '0') {
      if (display.length === 1) {
        setDisplay('0');
      } else {
        setDisplay(display.slice(0, -1));
      }
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setShouldResetDisplay(false);
  };

  const calculateResult = (expr) => {
    // Replace × and ÷ with * and /
    expr = expr.replace(/×/g, '*').replace(/÷/g, '/');
    
    try {
      // Use Function instead of eval for better security
      const result = new Function('return ' + expr)();
      
      // Handle division by zero
      if (!isFinite(result)) {
        return 'Error';
      }
      
      // Format the result
      const formatted = Number(parseFloat(result).toPrecision(12));
      return String(formatted);
    } catch (error) {
      return 'Error';
    }
  };

  const handleEqual = () => {
    try {
      const result = calculateResult(equation + display);
      setDisplay(result);
      setEquation('');
    } catch (error) {
      setDisplay('Error');
    }
    setShouldResetDisplay(true);
  };

  const buttons = [
    { label: '7', onClick: () => handleNumber('7') },
    { label: '8', onClick: () => handleNumber('8') },
    { label: '9', onClick: () => handleNumber('9') },
    { label: '÷', onClick: () => handleOperator('/') },
    { label: '4', onClick: () => handleNumber('4') },
    { label: '5', onClick: () => handleNumber('5') },
    { label: '6', onClick: () => handleNumber('6') },
    { label: '×', onClick: () => handleOperator('*') },
    { label: '1', onClick: () => handleNumber('1') },
    { label: '2', onClick: () => handleNumber('2') },
    { label: '3', onClick: () => handleNumber('3') },
    { label: '-', onClick: () => handleOperator('-') },
    { label: '0', onClick: () => handleNumber('0') },
    { label: '.', onClick: () => handleNumber('.') },
    { label: '=', onClick: handleEqual },
    { label: '+', onClick: () => handleOperator('+') },
  ];

  return (
    <div className="h-full flex flex-col bg-[#1a1b1e] text-white p-4">
      <div className="bg-[#2a2b2e] rounded-lg p-4 mb-4">
        <div className="text-right text-sm text-gray-400 h-6">{equation}</div>
        <div className="text-right text-3xl font-semibold">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button
          className="col-span-2 p-4 bg-red-500 hover:bg-red-600 rounded-lg font-semibold"
          onClick={handleClear}
        >
          Clear
        </button>
        <button
          className="col-span-2 p-4 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold"
          onClick={handleDelete}
        >
          DEL
        </button>
        {buttons.map((button, index) => (
          <button
            key={index}
            className="p-4 bg-[#2a2b2e] hover:bg-[#3a3b3e] rounded-lg font-semibold"
            onClick={button.onClick}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calculator;
