import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { PostDisplay } from './components/PostDisplay';
import { Loader } from './components/Loader';
import { generatePostFromImage, generateImagesForPost, generatePostFromTopic, generateTopicIdea } from './services/geminiService';
import type { Post, PostImage } from './types';
import { ArrowUpRightIcon, PhotoIcon, PencilIcon, LanguageIcon, LightbulbIcon, SparklesIcon, CodeIcon, DownloadIcon, ShareIcon } from './components/Icons';
import { TimerModal } from './components/TimerModal';
import { Logo } from './components/Logo';
import { EditPostModal } from './components/EditPostModal';
import { ModeSwitcher } from './components/ModeSwitcher';
import { SourceCodeModal } from './components/SourceCodeModal';

const BLOG_AI_URL = 'https://ai-image-to-blog-post-generator-1096815793501.us-west1.run.app';

const translations = {
  en: {
    headerTitle: "AI Image to Blog Post Generator",
    headerSubtitle: "Upload an image and let Model gemini-2.5-pro craft a detailed 1000-word blog post with a captivating title, subtitle, and 3 AI-generated images.",
    step1Title: "Step 1: Upload Your Image",
    step1Desc: "Choose an image that will be the inspiration for your post.",
    step2Title: "Step 2: Provide a Title (Optional)",
    step2Desc: "Give your post a title to provide context for the AI and improve accuracy.",
    titlePlaceholder: "e.g., 'The Future of Urban Gardening'",
    generateButton: "Generate Post",
    generatingButton: "Generating...",
    errorPrefix: "Error:",
    toggleLanguage: "Español",
    footerText: "Powered by Gemini",
    copyrightText: "BlogAI Generator",
    downloads: "Downloads",
    install: "Install",
    installNotAvailable: "Installation not available on this device or browser",
    shareSite: "Blog AI",
    // Pro translations
    proHeaderTitle: "BlogAI Pro Generator",
    proHeaderSubtitle: "Generate powerful, SEO-optimized blog posts from an image, a topic, or just a spark of an idea. Unleash your creativity.",
    fromImage: "From Image",
    fromTopic: "From Topic",
    fromIdea: "From Idea",
    topicStepTitle: "Provide a Topic",
    topicStepDesc: "Enter a topic or title, and the AI will research and write a full post.",
    ideaStepTitle: "Start with an Idea",
    ideaStepDesc: "Don't have a topic? Enter a general theme and let the AI inspire you.",
    ideaPlaceholder: "e.g., 'The impact of AI on art'",
    inspireMe: "Inspire Me",
    inspiring: "Inspiring...",
  },
  es: {
    headerTitle: "Generador de Artículos de Blog con IA",
    headerSubtitle: "Sube una imagen y deja que Model gemini-2.5-pro elabore un artículo de 1000 palabras con un título, subtítulo y 3 imágenes generadas por IA.",
    step1Title: "Paso 1: Sube tu Imagen",
    step1Desc: "Elige una imagen que sirva de inspiración para tu artículo.",
    step2Title: "Paso 2: Proporciona un Título (Opcional)",
    step2Desc: "Dale un título a tu artículo para dar contexto a la IA y mejorar la precisión.",
    titlePlaceholder: "ej., 'El Futuro de la Jardinería Urbana'",
    generateButton: "Generar Post",
    generatingButton: "Generando...",
    errorPrefix: "Error:",
    toggleLanguage: "English",
    footerText: "Potenciado por Gemini",
    copyrightText: "Generador BlogAI",
    downloads: "Descargas",
    install: "Instalar",
    installNotAvailable: "Instalación no disponible en este dispositivo o navegador",
    shareSite: "Blog AI",
    // Pro translations
    proHeaderTitle: "Generador BlogAI Pro",
    proHeaderSubtitle: "Genera artículos de blog potentes y optimizados para SEO a partir de una imagen, un tema o solo una chispa de idea. Desata tu creatividad.",
    fromImage: "Desde Imagen",
    fromTopic: "Desde Tema",
    fromIdea: "Desde Idea",
    topicStepTitle: "Proporciona un Tema",
    topicStepDesc: "Introduce un tema o título, y la IA investigará y escribirá un artículo completo.",
    ideaStepTitle: "Empieza con una Idea",
    ideaStepDesc: "¿No tienes un tema? Introduce una idea general y deja que la IA te inspire.",
    ideaPlaceholder: "ej., 'El impacto de la IA en el arte'",
    inspireMe: "Inspírame",
    inspiring: "Inspirando...",
  },
};


const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'lite' | 'pro'>('lite');
  const [generationType, setGenerationType] = useState<'image' | 'topic' | 'idea'>('image');
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [userTitle, setUserTitle] = useState<string>('');
  const [ideaTheme, setIdeaTheme] = useState('');
  const [isInspiring, setIsInspiring] = useState(false);

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(90);
  const [language, setLanguage] = useState<'en' | 'es'>('es');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSourceCodeModalOpen, setIsSourceCodeModalOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const t = translations[language];

  const theme = {
    lite: {
      bg: 'bg-slate-900',
      headerGradient: 'from-sky-400 to-indigo-500',
      accentColor: 'sky',
      cardBg: 'bg-slate-800/50',
      borderColor: 'border-slate-700',
      buttonColor: 'bg-sky-500 hover:bg-sky-600',
      buttonBgColor: 'bg-slate-700/50 hover:bg-slate-700',
      buttonBorderColor: 'border-slate-600',
    },
    pro: {
      bg: 'bg-gray-900',
      headerGradient: 'from-fuchsia-500 to-purple-600',
      accentColor: 'purple',
      cardBg: 'bg-gray-800/50',
      borderColor: 'border-gray-700',
      buttonColor: 'bg-purple-500 hover:bg-purple-600',
      buttonBgColor: 'bg-gray-700/50 hover:bg-gray-700',
      buttonBorderColor: 'border-gray-600',
    }
  };

  const currentTheme = theme[appMode];

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isLoading) {
      setCountdown(90); 
      timer = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    setPost(null);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleGenerateIdea = async () => {
    if (!ideaTheme) return;
    setIsInspiring(true);
    setError(null);
    try {
        const inspiredTitle = await generateTopicIdea(ideaTheme, language);
        setUserTitle(inspiredTitle);
        setGenerationType('topic'); // Switch to topic tab to show the new title
    } catch(err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setIsInspiring(false);
    }
  };

  const handleGeneratePost = useCallback(async () => {
    const activeGenerationType = appMode === 'lite' ? 'image' : generationType;

    if (activeGenerationType === 'image' && !imageFile) {
        setError("Please select an image first.");
        return;
    }
    if (activeGenerationType === 'topic' && !userTitle) {
        setError("Please enter a topic or title.");
        return;
    }
    
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsLoading(true);
    setPost(null);
    setError(null);

    try {
      // Step 1: Generate text content, SEO data, and alt texts
      let textData;
      
      if (activeGenerationType === 'image') {
          const base64Data = await new Promise<string>((resolve, reject) => {
            if (!imageFile) { reject(new Error("Image file is missing.")); return; }
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onload = () => {
                const result = (reader.result as string)?.split(',')[1];
                if (result) resolve(result);
                else reject(new Error("Failed to read image data."));
            };
            reader.onerror = () => reject(new Error("Error reading file."));
          });
          if (signal.aborted) return;
          textData = await generatePostFromImage(base64Data, imageFile.type, userTitle, language, appMode);
      } else { // 'topic'
          textData = await generatePostFromTopic(userTitle, language, appMode);
      }
      
      if (signal.aborted) return;
      
      // Step 2: Generate images based on the post title and alt texts
      const imageSrcs = await generateImagesForPost(
        textData.title, 
        textData.imageAltTexts
      );
      if (signal.aborted) return;

      // Step 3: Combine text data and image sources into a final Post object
      const images: PostImage[] = imageSrcs.map((src, index) => ({
          src,
          alt: textData.imageAltTexts?.[index] || `${textData.title} - Image ${index + 1}`
      }));
      
      setPost({ ...textData, images });

    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.log("Generation cancelled by user.");
        setError(null);
      } else {
        console.error(err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, userTitle, language, appMode, generationType]);

  const toggleLanguage = () => {
    setLanguage(prevLang => prevLang === 'en' ? 'es' : 'en');
  };

  const handleCancelGeneration = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };
  
  const handleSavePost = (updatedPost: Post) => {
    setPost(updatedPost);
    setIsEditModalOpen(false);
  };
  
  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
    });
  };

  const handleShareSite = () => {
    window.open(BLOG_AI_URL, '_blank', 'noopener,noreferrer');
  };


  const renderProGenerator = () => (
    <>
      <div className={`mb-6 p-1 bg-gray-700/50 rounded-lg flex items-center justify-center gap-2 border ${currentTheme.borderColor}`}>
        <button onClick={() => setGenerationType('image')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full ${generationType === 'image' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t.fromImage}</button>
        <button onClick={() => setGenerationType('topic')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full ${generationType === 'topic' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t.fromTopic}</button>
        <button onClick={() => setGenerationType('idea')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors w-full ${generationType === 'idea' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t.fromIdea}</button>
      </div>

      {generationType === 'image' && (
        <>
            <div className={`${currentTheme.cardBg} rounded-xl shadow-lg p-6 md:p-8 border ${currentTheme.borderColor} backdrop-blur-sm`}>
                <h2 className={`text-2xl font-bold text-${currentTheme.accentColor}-400 mb-2 flex items-center`}><PhotoIcon className="w-6 h-6 mr-2" />{t.step1Title}</h2>
                <p className="text-slate-400 mb-6">{t.step1Desc}</p>
                <ImageUploader onImageSelect={handleImageSelect} imagePreviewUrl={imagePreviewUrl} language={language} />
            </div>
            <div className={`mt-8 ${currentTheme.cardBg} rounded-xl shadow-lg p-6 md:p-8 border ${currentTheme.borderColor} backdrop-blur-sm`}>
                <h2 className={`text-2xl font-bold text-${currentTheme.accentColor}-400 mb-2 flex items-center`}><PencilIcon className="w-6 h-6 mr-2" />{t.step2Title}</h2>
                <p className="text-slate-400 mb-6">{t.step2Desc}</p>
                <input type="text" value={userTitle} onChange={(e) => setUserTitle(e.target.value)} placeholder={t.titlePlaceholder} className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${currentTheme.accentColor}-500 transition-colors`} aria-label="Blog post title" />
            </div>
        </>
      )}
      {generationType === 'topic' && (
          <div className={`${currentTheme.cardBg} rounded-xl shadow-lg p-6 md:p-8 border ${currentTheme.borderColor} backdrop-blur-sm`}>
              <h2 className={`text-2xl font-bold text-${currentTheme.accentColor}-400 mb-2 flex items-center`}><PencilIcon className="w-6 h-6 mr-2" />{t.topicStepTitle}</h2>
              <p className="text-slate-400 mb-6">{t.topicStepDesc}</p>
              <input type="text" value={userTitle} onChange={(e) => setUserTitle(e.target.value)} placeholder={t.titlePlaceholder} className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${currentTheme.accentColor}-500 transition-colors`} aria-label="Blog post topic" />
          </div>
      )}
      {generationType === 'idea' && (
           <div className={`${currentTheme.cardBg} rounded-xl shadow-lg p-6 md:p-8 border ${currentTheme.borderColor} backdrop-blur-sm`}>
              <h2 className={`text-2xl font-bold text-${currentTheme.accentColor}-400 mb-2 flex items-center`}><LightbulbIcon className="w-6 h-6 mr-2" />{t.ideaStepTitle}</h2>
              <p className="text-slate-400 mb-6">{t.ideaStepDesc}</p>
              <textarea value={ideaTheme} onChange={(e) => setIdeaTheme(e.target.value)} placeholder={t.ideaPlaceholder} rows={3} className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${currentTheme.accentColor}-500 transition-colors resize-none`} aria-label="Blog post idea" />
               <button onClick={handleGenerateIdea} disabled={!ideaTheme || isInspiring} className={`mt-4 w-full md:w-auto flex items-center justify-center text-md font-semibold ${currentTheme.buttonColor} text-white px-6 py-3 rounded-lg shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed transition-all`}>
                  {isInspiring ? <><Loader /><span>{t.inspiring}</span></> : <><SparklesIcon className="w-5 h-5 mr-2" /><span>{t.inspireMe}</span></>}
               </button>
           </div>
      )}
    </>
  );

  const renderLiteGenerator = () => (
    <>
        <div className={`${currentTheme.cardBg} rounded-xl shadow-lg p-6 md:p-8 border ${currentTheme.borderColor} backdrop-blur-sm`}>
            <h2 className={`text-2xl font-bold text-${currentTheme.accentColor}-400 mb-2 flex items-center`}><PhotoIcon className="w-6 h-6 mr-2" />{t.step1Title}</h2>
            <p className="text-slate-400 mb-6">{t.step1Desc}</p>
            <ImageUploader onImageSelect={handleImageSelect} imagePreviewUrl={imagePreviewUrl} language={language} />
        </div>
        <div className={`mt-8 ${currentTheme.cardBg} rounded-xl shadow-lg p-6 md:p-8 border ${currentTheme.borderColor} backdrop-blur-sm`}>
            <h2 className={`text-2xl font-bold text-${currentTheme.accentColor}-400 mb-2 flex items-center`}><PencilIcon className="w-6 h-6 mr-2" />{t.step2Title}</h2>
            <p className="text-slate-400 mb-6">{t.step2Desc}</p>
            <input type="text" value={userTitle} onChange={(e) => setUserTitle(e.target.value)} placeholder={t.titlePlaceholder} className={`w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${currentTheme.accentColor}-500 transition-colors`} aria-label="Blog post title" />
        </div>
    </>
  );

  return (
    <div className={`min-h-screen ${currentTheme.bg} text-gray-200 font-sans flex flex-col transition-colors duration-500`}>
      {isLoading && <TimerModal remainingTime={countdown} language={language} onCancel={handleCancelGeneration} appMode={appMode} />}
      {isEditModalOpen && post && (
        <EditPostModal post={post} onClose={() => setIsEditModalOpen(false)} onSave={handleSavePost} language={language} appMode={appMode} />
      )}
      {isSourceCodeModalOpen && (
        <SourceCodeModal
          onClose={() => setIsSourceCodeModalOpen(false)}
          language={language}
          appMode={appMode}
          installPrompt={installPrompt}
          onInstallClick={handleInstallClick}
        />
      )}

      <div className="container mx-auto px-4 py-8 md:py-12 relative flex-grow">
        <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
            <ModeSwitcher mode={appMode} onChange={setAppMode} />
            <button
              onClick={handleInstallClick}
              disabled={!installPrompt}
              className={`flex items-center ${currentTheme.buttonBgColor} text-${currentTheme.accentColor}-400 font-semibold py-2 px-4 border ${currentTheme.buttonBorderColor} rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={t.install}
              title={!installPrompt ? t.installNotAvailable : t.install}
            >
              <DownloadIcon className="w-5 h-5 mr-2" />
              {t.install}
            </button>
            <button onClick={toggleLanguage} className={`flex items-center ${currentTheme.buttonBgColor} text-${currentTheme.accentColor}-400 font-semibold py-2 px-4 border ${currentTheme.buttonBorderColor} rounded-lg shadow transition-colors`} aria-label="Change language">
                <LanguageIcon className="w-5 h-5 mr-2" />
                {t.toggleLanguage}
            </button>
        </div>
        
        <header className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
          <div className="flex justify-center mb-4">
              <Logo mode={appMode} />
          </div>
          <h1 className={`text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${currentTheme.headerGradient}`}>
            {appMode === 'lite' ? t.headerTitle : t.proHeaderTitle}
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            {appMode === 'lite' ? t.headerSubtitle : t.proHeaderSubtitle}
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          {appMode === 'lite' ? renderLiteGenerator() : renderProGenerator()}
          
          <div className={`fixed bottom-0 left-0 right-0 p-4 ${currentTheme.bg}/80 backdrop-blur-sm border-t ${currentTheme.borderColor} md:relative md:bg-transparent md:border-none md:p-0 md:mt-8 z-10`}>
              <div className="max-w-4xl mx-auto flex justify-center">
                <button
                  onClick={handleGeneratePost}
                  disabled={isLoading || (appMode === 'pro' && generationType === 'idea')}
                  className={`w-full md:w-auto flex items-center justify-center text-lg font-semibold ${currentTheme.buttonColor} text-white px-8 py-4 rounded-lg shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100`}
                >
                  {isLoading ? (
                    <>
                      <Loader />
                      <span>{t.generatingButton}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.generateButton}</span>
                      <ArrowUpRightIcon className="w-6 h-6 ml-2" />
                    </>
                  )}
                </button>
              </div>
          </div>


          {error && (
            <div className="mt-8 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
              <strong>{t.errorPrefix}</strong> {error}
            </div>
          )}

          <div className="mt-8 pb-24 md:pb-8">
             {post && <PostDisplay post={post} language={language} onEditClick={() => setIsEditModalOpen(true)} appMode={appMode} />}
          </div>

        </main>
      </div>
      <footer className={`w-full border-t ${appMode === 'lite' ? 'border-slate-800' : 'border-gray-800'} py-6`}>
        <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
            <div className="flex items-center gap-2 flex-wrap justify-center relative">
                <Logo textClassName="text-xl" svgClassName="w-8 h-8" mode={appMode} />
                <button
                onClick={() => setIsSourceCodeModalOpen(true)}
                className={`inline-flex items-center ${currentTheme.buttonBgColor} text-${currentTheme.accentColor}-400 font-semibold py-2 px-4 border ${currentTheme.buttonBorderColor} rounded-lg shadow transition-colors`}
                >
                <CodeIcon className="w-5 h-5 mr-2" />
                {t.downloads}
                </button>
                <button
                onClick={handleShareSite}
                className={`inline-flex items-center ${currentTheme.buttonBgColor} text-${currentTheme.accentColor}-400 font-semibold py-2 px-4 border ${currentTheme.buttonBorderColor} rounded-lg shadow transition-colors`}
                >
                <ShareIcon className="w-5 h-5 mr-2" />
                {t.shareSite}
                </button>
            </div>
            <div className="text-center sm:text-right">
                <p>{t.footerText}</p>
                <p>&copy; {new Date().getFullYear()} {t.copyrightText}</p>
            </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;