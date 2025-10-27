import React from 'react';
import type { Source } from '../types';
import { CloseIcon, LinkIcon } from './Icons';

interface SourcesModalProps {
  sources: Source[];
  onClose: () => void;
  language: 'en' | 'es';
  // FIX: Added appMode prop to support theming and resolve the TypeScript error.
  appMode: 'lite' | 'pro';
}

const translations = {
    en: {
        title: "Sources",
        close: "Close",
    },
    es: {
        title: "Fuentes",
        close: "Cerrar",
    }
};

export const SourcesModal: React.FC<SourcesModalProps> = ({ sources, onClose, language, appMode }) => {
  const t = translations[language];

  // FIX: Added dynamic theming based on appMode.
  const accentColor = appMode === 'pro' ? 'purple' : 'sky';
  const bgColor = appMode === 'pro' ? 'bg-gray-800' : 'bg-slate-800';
  const borderColor = appMode === 'pro' ? 'border-gray-700' : 'border-slate-700';

  return (
    <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
        aria-modal="true"
        role="dialog"
        onClick={onClose}
    >
      <div 
        className={`${bgColor} border ${borderColor} rounded-xl shadow-2xl p-6 md:p-8 text-left max-w-lg w-full mx-4 relative`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            aria-label={t.close}
        >
            <CloseIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center mb-6">
            <LinkIcon className={`w-6 h-6 mr-3 text-${accentColor}-400`} />
            <h2 className={`text-2xl font-bold text-${accentColor}-400`}>{t.title}</h2>
        </div>
        <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {sources.map((source, index) => (
              <li key={index} className="text-slate-400">
                <a 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`group flex items-start space-x-2 text-${accentColor}-500 hover:text-${accentColor}-400 transition-colors`}
                  title={source.title || source.uri}
                >
                  <span className="flex-shrink-0 mt-1.5">&#8226;</span>
                  <span className="group-hover:underline break-all">{source.title || source.uri}</span>
                </a>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};