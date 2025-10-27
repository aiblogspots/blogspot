
import React from 'react';
import { Loader } from './Loader';

interface TimerModalProps {
  remainingTime: number;
  language: 'en' | 'es';
  onCancel: () => void;
  appMode: 'lite' | 'pro';
}

const translations = {
    en: {
        title: "Generating Your Post",
        subtitle: "Please wait while our AI crafts your content and images.",
        timeRemaining: "Estimated time remaining:",
        disclaimer: "This may take a minute or two. Please don't close this window.",
        cancelButton: "Cancel Process",
    },
    es: {
        title: "Generando tu Artículo",
        subtitle: "Por favor, espera mientras nuestra IA crea tu contenido e imágenes.",
        timeRemaining: "Tiempo restante estimado:",
        disclaimer: "Esto puede tardar uno o dos minutos. Por favor, no cierres esta ventana.",
        cancelButton: "Cancelar Proceso",
    }
};

export const TimerModal: React.FC<TimerModalProps> = ({ remainingTime, language, onCancel, appMode }) => {
  const t = translations[language];

  const theme = {
    lite: {
      accentColor: 'sky',
      bgColor: 'bg-slate-800',
      borderColor: 'border-slate-700',
    },
    pro: {
      accentColor: 'purple',
      bgColor: 'bg-gray-800',
      borderColor: 'border-gray-700',
    }
  };
  const currentTheme = theme[appMode];

  return (
    <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
        aria-modal="true"
        role="dialog"
    >
      <div className={`${currentTheme.bgColor} border ${currentTheme.borderColor} rounded-xl shadow-2xl p-8 text-center max-w-sm mx-auto`}>
        <div className="flex justify-center items-center mb-6">
            <Loader />
            <h2 className={`text-2xl font-bold text-${currentTheme.accentColor}-400 ml-4`}>{t.title}</h2>
        </div>
        <p className="text-slate-300 text-lg">
          {t.subtitle}
        </p>
        <div className="mt-6 text-slate-400">
            <p>{t.timeRemaining}</p>
            <p className="text-3xl font-bold text-white mt-2">{remainingTime}s</p>
        </div>
        <p className="text-xs text-slate-500 mt-6">
            {t.disclaimer}
        </p>
        <button
          onClick={onCancel}
          className="mt-6 bg-slate-700/50 hover:bg-slate-700 text-red-400 font-semibold py-2 px-4 border border-slate-600 rounded-lg shadow transition-colors"
        >
          {t.cancelButton}
        </button>
      </div>
    </div>
  );
};