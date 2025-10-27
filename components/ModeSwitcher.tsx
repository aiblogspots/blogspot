
import React from 'react';

interface ModeSwitcherProps {
  mode: 'lite' | 'pro';
  onChange: (mode: 'lite' | 'pro') => void;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ mode, onChange }) => {
  const isPro = mode === 'pro';

  const toggle = () => {
    onChange(isPro ? 'lite' : 'pro');
  };

  return (
    <div className="flex items-center space-x-2 bg-slate-700/50 p-1 rounded-full border border-slate-600">
      <span className={`text-sm font-semibold ${!isPro ? 'text-sky-400' : 'text-slate-400'} px-2`}>Lite</span>
      <button
        onClick={toggle}
        className="w-12 h-6 rounded-full p-1 bg-slate-800 transition-colors duration-300 focus:outline-none"
        role="switch"
        aria-checked={isPro}
      >
        <div
          className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
            isPro ? 'translate-x-6 bg-gradient-to-br from-fuchsia-500 to-purple-500' : 'bg-gradient-to-br from-sky-400 to-indigo-400'
          }`}
        />
      </button>
      <span className={`text-sm font-semibold ${isPro ? 'text-purple-400' : 'text-slate-400'} px-2`}>Pro</span>
    </div>
  );
};
