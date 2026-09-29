import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
// Make sure ye path sahi ho 👇
import { useTheme } from '../context/ThemeContext'; 

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center justify-center p-2 rounded-full transition-all duration-300 shadow-md border
        ${theme === 'dark' 
          ? 'bg-gray-800 text-yellow-400 border-gray-600 hover:bg-gray-700' 
          : 'bg-white text-[#0F2F6D] border-gray-200 hover:bg-gray-100'}
      `}
      title="Toggle Theme"
    >
      {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
    </button>
  );
};

export default ThemeToggle;