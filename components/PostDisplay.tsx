

import React, { useState, useRef, useEffect } from 'react';
import type { Post, PostImage } from '../types';
import { SourcesModal } from './SourcesModal';
import { LinkIcon, ShareIcon, ExportIcon, WordpressIcon, DownloadIcon, SeoIcon, ClipboardIcon } from './Icons';


interface PostDisplayProps {
  post: Post | null;
  language: 'en' | 'es';
  onEditClick: () => void;
  appMode: 'lite' | 'pro';
}

const translations = {
    en: {
        sources: "View Sources",
        export: "Export",
        share: "Share",
        edit: "Edit Post",
        editAndSeo: "Edit & SEO",
        copyForWordpress: "Copy for WordPress (HTML)",
        downloadHtml: "Download (.html)",
        copied: "Copied to clipboard!",
        shared: "Post title copied!",
        copyPost: "Copy Post",
    },
    es: {
        sources: "Ver Fuentes",
        export: "Exportar",
        share: "Compartir",
        edit: "Editar Post",
        editAndSeo: "Editar y SEO",
        copyForWordpress: "Copiar para WordPress (HTML)",
        downloadHtml: "Descargar (.html)",
        copied: "¡Copiado al portapapeles!",
        shared: "¡Título del post copiado!",
        copyPost: "Copiar Post",
    }
};

export const PostDisplay: React.FC<PostDisplayProps> = ({ post, language, onEditClick, appMode }) => {
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  const t = translations[language];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportMenuRef]);

  if (!post) {
    return null;
  }

  const showFeedback = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(''), 2500);
  };

  const generatePostHtml = (p: Post): string => {
    let html = `<h1>${p.title}</h1>\n<h2>${p.subtitle}</h2>\n`;
    const paragraphs = p.content.split(/\n+/).filter(para => para.trim() !== '');
    const images = p.images || [];
    const imageInsertionInterval = images.length > 0 ? Math.max(1, Math.floor(paragraphs.length / images.length)) : paragraphs.length + 1;
    let imageIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i];
        if (appMode === 'pro' && para.startsWith('### ')) {
            html += `<h3>${para.replace('### ', '')}</h3>\n`;
        } else {
            html += `<p>${para}</p>\n`;
        }

        if ((i + 1) % imageInsertionInterval === 0 && imageIndex < images.length) {
            const image = images[imageIndex];
            html += `<figure><img src="${image.src}" alt="${image.alt}" style="width: 100%; height: auto; border-radius: 8px; margin: 1em 0;" /></figure>\n`;
            imageIndex++;
        }
    }
     while (imageIndex < images.length) {
      const image = images[imageIndex];
      html += `<figure><img src="${image.src}" alt="${image.alt}" style="width: 100%; height: auto; border-radius: 8px; margin: 1em 0;" /></figure>\n`;
      imageIndex++;
    }
    return html;
  };

  const handleCopyToClipboardForWordpress = () => {
    const htmlContent = generatePostHtml(post);
    navigator.clipboard.writeText(htmlContent).then(() => {
        showFeedback(t.copied);
        setIsExportMenuOpen(false);
    });
  };
  
  const handleDownloadHtml = () => {
    const postHtml = generatePostHtml(post);
    const metaTags = appMode === 'pro' ? `
    <meta name="description" content="${post.metaDescription.replace(/"/g, '&quot;')}">
    <meta name="keywords" content="${post.seoKeywords.join(', ')}">` : '';
    
    const fullHtml = `
<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title}</title>${metaTags}
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #E2E8F0; background-color: #0F172A; max-width: 800px; margin: 40px auto; padding: 20px; }
        h1 { color: #${appMode === 'pro' ? 'd946ef' : '38BDF8'}; font-size: 2.5em; } 
        h2 { color: #94A3B8; font-size: 1.5em; border-bottom: 1px solid #334155; padding-bottom: 10px; }
        h3 { color: #${appMode === 'pro' ? 'a78bfa' : '67e8f9'}; font-size: 1.3em; margin-top: 1.5em; }
        img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; }
        p { margin-bottom: 1em; font-size: 1.1em; color: #CBD5E1;}
        main { background-color: #1E293B; padding: 20px 40px; border-radius: 12px; }
    </style>
</head>
<body>
    <main>${postHtml}</main>
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = post.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    a.href = url;
    a.download = `${slug || 'blog-post'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  const handleShare = async () => {
    const shareData = {
        title: post.title,
        text: post.subtitle,
    };
    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        navigator.clipboard.writeText(`${post.title}\n${post.subtitle}`).then(() => {
           showFeedback(t.shared);
        });
    }
  };
  
  const handleCopyPost = () => {
    const htmlContent = generatePostHtml(post);
    navigator.clipboard.writeText(htmlContent).then(() => {
        showFeedback(t.copied);
    });
  };

  const highlightKeywords = (text: string, keywords: string[]): React.ReactNode => {
      if (appMode !== 'pro' || !keywords || keywords.length === 0) return text;
      
      const safeKeywords = keywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(kw => kw.trim() !== '');
      if (safeKeywords.length === 0) return text;

      const regex = new RegExp(`\\b(${safeKeywords.join('|')})\\b`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, index) => 
        regex.test(part) ? <mark key={index} className="bg-purple-500/30 text-purple-300 px-1 rounded mx-[-4px]">{part}</mark> : part
      );
  };

  const renderContentWithImages = () => {
    if (!post.images || post.images.length === 0) {
      return <div className="whitespace-pre-wrap">{post.content}</div>;
    }

    const paragraphs = post.content.split(/\n+/).filter(p => p.trim() !== '');
    const images = post.images;
    const imageInsertionInterval = Math.max(1, Math.floor(paragraphs.length / (images.length + 1)));
    
    const contentElements: React.ReactNode[] = [];
    let imageIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i];
        if (appMode === 'pro' && para.startsWith('### ')) {
            contentElements.push(<h3 key={`h3-${i}`} className="text-2xl font-bold mt-8 mb-4">{highlightKeywords(para.replace('### ', ''), post.seoKeywords)}</h3>);
        } else {
            contentElements.push(<p key={`p-${i}`}>{highlightKeywords(para, post.seoKeywords)}</p>);
        }
        
        if ((i + 1) % imageInsertionInterval === 0 && imageIndex < images.length) {
            const image = images[imageIndex];
            contentElements.push(
                <div key={`img-container-${imageIndex}`} className="relative group my-8">
                    <img 
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-auto rounded-lg shadow-lg object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg pointer-events-none">
                        {image.alt}
                    </div>
                </div>
            );
            imageIndex++;
        }
    }
    
    while (imageIndex < images.length) {
      const image = images[imageIndex];
      contentElements.push(
        <div key={`img-container-${imageIndex}`} className="relative group my-8">
            <img 
                src={image.src}
                alt={image.alt}
                className="w-full h-auto rounded-lg shadow-lg object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg pointer-events-none">
                {image.alt}
            </div>
        </div>
      );
      imageIndex++;
    }

    return contentElements;
  };

  const accentColor = appMode === 'pro' ? 'purple' : 'sky';
  const bgColor = appMode === 'pro' ? 'bg-gray-800/50' : 'bg-slate-800/50';
  const borderColor = appMode === 'pro' ? 'border-gray-700' : 'border-slate-700';
  const buttonBgColor = appMode === 'pro' ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-slate-700/50 hover:bg-slate-700';
  const buttonBorderColor = appMode === 'pro' ? 'border-gray-600' : 'border-slate-600';


  return (
    <>
      <article className={`${bgColor} rounded-xl shadow-lg p-6 md:p-8 border ${borderColor} backdrop-blur-sm animate-fade-in`}>
        <header className={`border-b ${borderColor} pb-6 mb-6`}>
          <h1 className={`text-3xl md:text-4xl font-bold text-${accentColor}-400 leading-tight`}>{post.title}</h1>
          <h2 className="mt-3 text-xl md:text-2xl text-slate-300">{post.subtitle}</h2>
        </header>
        <div className={`prose prose-invert prose-lg max-w-none prose-p:text-slate-300 prose-headings:text-${accentColor}-400`}>
          {renderContentWithImages()}
        </div>
        
        <footer className={`mt-8 pt-6 border-t ${borderColor} text-center`}>
            <div className="flex justify-center items-center gap-4 relative flex-wrap">
                 {post.sources && post.sources.length > 0 && (
                    <button
                        onClick={() => setIsSourcesModalOpen(true)}
                        className={`inline-flex items-center ${buttonBgColor} text-${accentColor}-400 font-semibold py-2 px-4 border ${buttonBorderColor} rounded-lg shadow transition-colors`}
                    >
                        <LinkIcon className="w-5 h-5 mr-2" />
                        {t.sources}
                    </button>
                 )}
                 <button
                    onClick={onEditClick}
                    className={`inline-flex items-center ${buttonBgColor} text-${accentColor}-400 font-semibold py-2 px-4 border ${buttonBorderColor} rounded-lg shadow transition-colors`}
                >
                    {appMode === 'pro' ? <SeoIcon className="w-5 h-5 mr-2" /> : <DownloadIcon className="w-5 h-5 mr-2" />}
                    {appMode === 'pro' ? t.editAndSeo : t.edit}
                </button>
                {appMode === 'pro' && (
                    <button
                        onClick={handleCopyPost}
                        className={`inline-flex items-center ${buttonBgColor} text-${accentColor}-400 font-semibold py-2 px-4 border ${buttonBorderColor} rounded-lg shadow transition-colors`}
                    >
                        <ClipboardIcon className="w-5 h-5 mr-2" />
                        {t.copyPost}
                    </button>
                )}
                 <div className="relative" ref={exportMenuRef}>
                    <button
                        onClick={() => setIsExportMenuOpen(prev => !prev)}
                        className={`inline-flex items-center ${buttonBgColor} text-${accentColor}-400 font-semibold py-2 px-4 border ${buttonBorderColor} rounded-lg shadow transition-colors`}
                    >
                        <ExportIcon className="w-5 h-5 mr-2" />
                        {t.export}
                    </button>
                    {isExportMenuOpen && (
                        <div className={`absolute bottom-full mb-2 w-64 ${appMode === 'pro' ? 'bg-gray-800 border-gray-600' : 'bg-slate-800 border-slate-600'} border rounded-lg shadow-xl animate-fade-in-fast z-10 right-0 md:left-0 md:right-auto`}>
                           <ul className="py-1">
                                <li>
                                    <button onClick={handleCopyToClipboardForWordpress} className={`w-full text-left flex items-center px-4 py-2 text-sm text-slate-300 ${appMode === 'pro' ? 'hover:bg-gray-700' : 'hover:bg-slate-700'}`}>
                                        <WordpressIcon className="w-5 h-5 mr-3" />
                                        {t.copyForWordpress}
                                    </button>
                                </li>
                                <li>
                                    <button onClick={handleDownloadHtml} className={`w-full text-left flex items-center px-4 py-2 text-sm text-slate-300 ${appMode === 'pro' ? 'hover:bg-gray-700' : 'hover:bg-slate-700'}`}>
                                        <DownloadIcon className="w-5 h-5 mr-3" />
                                        {t.downloadHtml}
                                    </button>
                                </li>
                           </ul>
                        </div>
                    )}
                 </div>
                 <button
                    onClick={handleShare}
                    className={`inline-flex items-center ${buttonBgColor} text-${accentColor}-400 font-semibold py-2 px-4 border ${buttonBorderColor} rounded-lg shadow transition-colors`}
                >
                    <ShareIcon className="w-5 h-5 mr-2" />
                    {t.share}
                </button>
            </div>
            {feedbackMessage && <p className={`text-${accentColor}-400 text-sm mt-4 animate-fade-in-fast`}>{feedbackMessage}</p>}
        </footer>
      </article>

      {isSourcesModalOpen && post.sources && (
        <SourcesModal 
          sources={post.sources} 
          onClose={() => setIsSourcesModalOpen(false)}
          language={language}
          appMode={appMode}
        />
      )}
    </>
  );
};

// Add fade-in animation to tailwind config if possible, or use a style tag for simplicity.
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
  @keyframes fadeInFast {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in-fast {
    animation: fadeInFast 0.3s ease-out forwards;
  }
  @keyframes rotate-cube {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-rotate-cube {
    animation: rotate-cube 10s linear infinite;
    transform-origin: center;
  }
`;
document.head.appendChild(style);