
import React, { useState, useEffect } from 'react';
import type { Post } from '../types';
import { CloseIcon, PencilIcon, SeoIcon } from './Icons';

interface EditPostModalProps {
  post: Post;
  onClose: () => void;
  onSave: (updatedPost: Post) => void;
  language: 'en' | 'es';
  appMode: 'lite' | 'pro';
}

const translations = {
    en: {
        title: "Edit Post",
        save: "Save Changes",
        close: "Close",
        postTitleLabel: "Title",
        postSubtitleLabel: "Subtitle",
        postContentLabel: "Content",
        seoSettings: "SEO Settings",
        metaDescriptionLabel: "Meta Description",
        seoKeywordsLabel: "SEO Keywords",
        keywordsPlaceholder: "e.g., tech, AI, gardening",
        chars: "chars",
    },
    es: {
        title: "Editar Artículo",
        save: "Guardar Cambios",
        close: "Cerrar",
        postTitleLabel: "Título",
        postSubtitleLabel: "Subtítulo",
        postContentLabel: "Contenido",
        seoSettings: "Ajustes SEO",
        metaDescriptionLabel: "Meta Descripción",
        seoKeywordsLabel: "Palabras Clave SEO",
        keywordsPlaceholder: "ej., tecnología, IA, jardinería",
        chars: "caracteres",
    }
};

export const EditPostModal: React.FC<EditPostModalProps> = ({ post, onClose, onSave, language, appMode }) => {
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSubtitle, setEditedSubtitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedMetaDescription, setEditedMetaDescription] = useState('');
  const [editedKeywords, setEditedKeywords] = useState('');

  const t = translations[language];
  const accentColor = appMode === 'pro' ? 'purple' : 'sky';
  const ringColor = `focus:ring-${accentColor}-500`;
  const buttonColor = `bg-${accentColor}-500 hover:bg-${accentColor}-600`;
  const borderColor = appMode === 'pro' ? 'border-gray-700' : 'border-slate-700';
  const bgColor = appMode === 'pro' ? 'bg-gray-800' : 'bg-slate-800';
  const inputBgColor = appMode === 'pro' ? 'bg-gray-700/50' : 'bg-slate-700/50';
  const inputBorderColor = appMode === 'pro' ? 'border-gray-600' : 'border-slate-600';


  useEffect(() => {
    if (post) {
      setEditedTitle(post.title);
      setEditedSubtitle(post.subtitle);
      setEditedContent(post.content);
      if (appMode === 'pro') {
        setEditedMetaDescription(post.metaDescription);
        setEditedKeywords(post.seoKeywords.join(', '));
      }
    }
  }, [post, appMode]);

  const handleSave = () => {
    onSave({
      ...post,
      title: editedTitle,
      subtitle: editedSubtitle,
      content: editedContent,
      metaDescription: editedMetaDescription,
      seoKeywords: editedKeywords.split(',').map(k => k.trim()).filter(Boolean),
    });
  };
  
  const metaDescLength = editedMetaDescription.length;
  const metaDescColor = metaDescLength > 155 ? 'text-red-400' : metaDescLength >= 120 ? 'text-green-400' : 'text-slate-400';

  return (
    <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
        aria-modal="true"
        role="dialog"
        onClick={onClose}
    >
      <div 
        className={`${bgColor} border ${borderColor} rounded-xl shadow-2xl p-6 md:p-8 text-left max-w-4xl w-full mx-4 relative flex flex-col`}
        style={{ height: 'calc(100vh - 4rem)'}}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0">
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                aria-label={t.close}
            >
                <CloseIcon className="w-6 h-6" />
            </button>
            <div className="flex items-center mb-6">
                <PencilIcon className={`w-6 h-6 mr-3 text-${accentColor}-400`} />
                <h2 className={`text-2xl font-bold text-${accentColor}-400`}>{t.title}</h2>
            </div>
        </header>

        <main className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4 flex flex-col">
                <div>
                    <label htmlFor="post-title" className="block text-sm font-medium text-slate-300 mb-1">{t.postTitleLabel}</label>
                    <input
                        id="post-title"
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className={`w-full ${inputBgColor} border ${inputBorderColor} rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${ringColor} transition-colors`}
                    />
                </div>
                <div>
                    <label htmlFor="post-subtitle" className="block text-sm font-medium text-slate-300 mb-1">{t.postSubtitleLabel}</label>
                    <input
                        id="post-subtitle"
                        type="text"
                        value={editedSubtitle}
                        onChange={(e) => setEditedSubtitle(e.target.value)}
                        className={`w-full ${inputBgColor} border ${inputBorderColor} rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${ringColor} transition-colors`}
                    />
                </div>
                <div className="flex flex-col flex-grow">
                    <label htmlFor="post-content" className="block text-sm font-medium text-slate-300 mb-1">{t.postContentLabel}</label>
                    <textarea
                        id="post-content"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className={`w-full h-full flex-grow ${inputBgColor} border ${inputBorderColor} rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${ringColor} transition-colors resize-none`}
                    />
                </div>
            </div>
            
            {appMode === 'pro' && (
                <div className="lg:col-span-1 space-y-4">
                    <div className={`p-4 rounded-lg border ${inputBorderColor} bg-black/20`}>
                        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                            <SeoIcon className={`w-5 h-5 mr-2 text-${accentColor}-400`} />
                            {t.seoSettings}
                        </h3>
                        <div>
                            <label htmlFor="meta-description" className="block text-sm font-medium text-slate-300 mb-1">{t.metaDescriptionLabel}</label>
                            <textarea
                                id="meta-description"
                                value={editedMetaDescription}
                                onChange={(e) => setEditedMetaDescription(e.target.value)}
                                className={`w-full ${inputBgColor} border ${inputBorderColor} rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${ringColor} transition-colors resize-none`}
                                rows={4}
                            />
                            <p className={`text-xs mt-1 text-right ${metaDescColor}`}>{metaDescLength} / 155 {t.chars}</p>
                        </div>
                        <div className="mt-4">
                            <label htmlFor="seo-keywords" className="block text-sm font-medium text-slate-300 mb-1">{t.seoKeywordsLabel}</label>
                            <input
                                id="seo-keywords"
                                type="text"
                                value={editedKeywords}
                                onChange={(e) => setEditedKeywords(e.target.value)}
                                placeholder={t.keywordsPlaceholder}
                                className={`w-full ${inputBgColor} border ${inputBorderColor} rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${ringColor} transition-colors`}
                            />
                        </div>
                    </div>
                </div>
            )}
        </main>

        <footer className="mt-6 flex-shrink-0 flex justify-end items-center space-x-4">
            <button
                onClick={onClose}
                className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 border border-slate-600 rounded-lg shadow transition-colors"
            >
                {t.close}
            </button>
            <button
                onClick={handleSave}
                className={`font-semibold ${buttonColor} text-white px-6 py-2 rounded-lg shadow-lg transition-colors`}
            >
                {t.save}
            </button>
        </footer>
      </div>
    </div>
  );
};
