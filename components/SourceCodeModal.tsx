import React, { useState } from 'react';
import { CloseIcon, CodeIcon, ZipFileIcon, InfoIcon, DownloadIcon } from './Icons';
import { Loader } from './Loader';

// This makes JSZip available in the component, assuming it's loaded from a CDN.
declare const JSZip: any;

interface SourceCodeModalProps {
  onClose: () => void;
  language: 'en' | 'es';
  appMode: 'lite' | 'pro';
  installPrompt: any;
  onInstallClick: () => void;
}

const translations = {
    en: {
        downloadsTitle: "Downloads",
        openSourceSubtitle: "Open Source",
        close: "Close",
        downloadZip: "Download .zip",
        downloadingZip: "Packaging...",
        downloadZipDesc: "Download a self-hostable version of this application.",
        showInstructions: "How to upload this to my hosting?",
        instructionsTitle: "How to Upload the App to Your Hosting (Hostinger)",
        instruction1: "Click the \"Download .zip\" button to get all the application files in one package.",
        instruction2: "Log in to your Hostinger control panel.",
        instruction3: "Find and open the \"File Manager\".",
        instruction4: "Navigate to the `public_html` folder. This is the root folder for your website.",
        instruction5: "In the File Manager's top toolbar, find the \"Upload\" icon. Select the `.zip` file you downloaded.",
        instruction6: "Once uploaded, right-click on the `.zip` file and select \"Extract\". Confirm the extraction to the current folder.",
        instruction7: "Done! The application should now be live on your domain.",
        instruction8: "<strong>(Important) Set Your API Key:</strong> To make the app work, you need to provide your Google Gemini API key. Edit the downloaded <strong>config.js</strong> file located in the root directory.",
        instruction8_context: "Follow the instructions inside `config.js`. You will need to uncomment a line and paste your API key. When you're done, it should look like this:",
        instruction8_example: 'window.GEMINI_API_KEY = "YOUR_API_KEY_HERE";',
        instruction8_warning: "<strong>Security Best Practice:</strong> The .zip file includes a <strong>.gitignore</strong> file which prevents <strong>config.js</strong> from being accidentally published. This is crucial for keeping your API key secure.",
        install: "Install App",
        installAppDesc: "Install this PWA on your device for offline access and an icon on your home screen.",
        installNotAvailable: "Installation not available on this device or browser",
    },
    es: {
        downloadsTitle: "Descargas",
        openSourceSubtitle: "Código Abierto",
        close: "Cerrar",
        downloadZip: "Descargar .zip",
        downloadingZip: "Empaquetando...",
        downloadZipDesc: "Descarga una versión auto-hospedable de esta aplicación.",
        showInstructions: "¿Cómo subir esto a mi hosting?",
        instructionsTitle: "Cómo Subir la Aplicación a tu Hosting (Hostinger)",
        instruction1: "Haz clic en el botón \"Descargar .zip\" para obtener todos los archivos de la aplicación en un solo paquete.",
        instruction2: "Inicia sesión en tu panel de control de Hostinger.",
        instruction3: "Busca y abre el \"Administrador de Archivos\".",
        instruction4: "Navega a la carpeta `public_html`. Esta es la carpeta raíz donde se deben alojar los archivos de tu sitio web.",
        instruction5: "En la barra de herramientas superior del Administrador de Archivos, busca el icono de \"Subir\". Selecciona el archivo `.zip` que descargaste.",
        instruction6: "Una vez subido, haz clic derecho sobre el archivo `.zip` y selecciona la opción \"Extraer\". Confirma la extracción en la carpeta actual.",
        instruction7: "¡Listo! La aplicación ahora debería estar en vivo en tu dominio.",
        instruction8: "<strong>(Importante) Configura tu Clave API:</strong> Para que la aplicación funcione, necesitas tu clave API de Google Gemini. Edita el archivo <strong>config.js</strong> que se encuentra en la raíz del proyecto descargado.",
        instruction8_context: "Sigue las instrucciones dentro de `config.js`. Deberás descomentar una línea y pegar tu clave API. Cuando termines, debería verse así:",
        instruction8_example: 'window.GEMINI_API_KEY = "TU_CLAVE_API_AQUI";',
        instruction8_warning: "<strong>Mejor Práctica de Seguridad:</strong> El archivo .zip incluye un <strong>.gitignore</strong> que impide que <strong>config.js</strong> sea publicado accidentalmente. Esto es crucial para mantener segura tu clave API.",
        install: "Instalar App",
        installAppDesc: "Instala esta PWA en tu dispositivo para acceso sin conexión y un ícono en tu pantalla de inicio.",
        installNotAvailable: "Instalación no disponible en este dispositivo o navegador",
    }
};

const getFileContents = async () => {
  // In a real build environment, these files would be imported as raw text.
  // Here, we fetch them to ensure the downloaded zip is up-to-date.
  const filePaths = {
    'index.html': '/index.html',
    'index.tsx': '/index.tsx',
    'metadata.json': '/metadata.json',
    'App.tsx': '/App.tsx',
    'types.ts': '/types.ts',
    'services/geminiService.ts': '/services/geminiService.ts',
    'components/ImageUploader.tsx': '/components/ImageUploader.tsx',
    'components/PostDisplay.tsx': '/components/PostDisplay.tsx',
    'components/Loader.tsx': '/components/Loader.tsx',
    'components/Icons.tsx': '/components/Icons.tsx',
    'components/TimerModal.tsx': '/components/TimerModal.tsx',
    'components/Logo.tsx': '/components/Logo.tsx',
    'components/SourcesModal.tsx': '/components/SourcesModal.tsx',
    'components/EditPostModal.tsx': '/components/EditPostModal.tsx',
    'components/ModeSwitcher.tsx': '/components/ModeSwitcher.tsx',
    'components/SourceCodeModal.tsx': '/components/SourceCodeModal.tsx',
    'manifest.json': '/manifest.json',
    'sw.js': '/sw.js',
    'icon.svg': '/icon.svg'
  };

  const fetchedContents: { [key: string]: string } = {};
  for (const key in filePaths) {
    try {
      const response = await fetch(filePaths[key as keyof typeof filePaths]);
      if (!response.ok) throw new Error(`Failed to fetch ${key}`);
      fetchedContents[key] = await response.text();
    } catch (error) {
      console.warn(`Could not fetch ${key}, it will not be included in the zip.`, error);
    }
  }
  return fetchedContents;
};


export const SourceCodeModal: React.FC<SourceCodeModalProps> = ({ onClose, language, appMode, installPrompt, onInstallClick }) => {
  const t = translations[language];
  const [isDownloading, setIsDownloading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const accentColor = appMode === 'pro' ? 'purple' : 'sky';
  const bgColor = appMode === 'pro' ? 'bg-gray-800' : 'bg-slate-800';
  const borderColor = appMode === 'pro' ? 'border-gray-700' : 'border-slate-700';
  const buttonColor = `bg-${accentColor}-500 hover:bg-${accentColor}-600`;
  const buttonBgColor = appMode === 'pro' ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-slate-700/50 hover:bg-slate-700';
  const buttonBorderColor = appMode === 'pro' ? 'border-gray-600' : 'border-slate-600';

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
        const zip = new JSZip();
        const fileContents = await getFileContents();

        const componentsFolder = zip.folder("components");
        if (!componentsFolder) {
          throw new Error("Could not create components folder in zip.");
        }

        for (const path in fileContents) {
          if (path.startsWith('components/')) {
            const fileName = path.split('/').pop();
            if(fileName) {
               componentsFolder.file(fileName, fileContents[path]);
            }
          } else {
            zip.file(path, fileContents[path]);
          }
        }
        
        // Add security-related files and instructions
        zip.file("config.js", '/*\n  1. Get your API key from Google AI Studio: https://aistudio.google.com/app/apikey\n  2. Uncomment the line below.\n  3. Replace "YOUR_API_KEY_HERE" with your actual key.\n*/\n\n// window.GEMINI_API_KEY = "YOUR_API_KEY_HERE";\n');
        zip.file(".gitignore", "# API Keys and sensitive information\nconfig.js\n.env*\n\n# Node dependencies\nnode_modules\n\n# Build output\ndist\nbuild\n");

        const content = await zip.generateAsync({ type: "blob" });
        
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "blogai-source.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (err) {
        console.error("Error creating zip file:", err);
        alert("Error creating zip file.");
    } finally {
        setIsDownloading(false);
    }
  };
  
  const InstructionStep: React.FC<{ step: number; text: string; }> = ({ step, text }) => (
    <li className="flex items-start space-x-3">
        <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-${accentColor}-500 text-white flex items-center justify-center font-bold text-sm`}>{step}</div>
        <p className="text-slate-400" dangerouslySetInnerHTML={{ __html: text }} />
    </li>
  );
  
  return (
    <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
        aria-modal="true"
        role="dialog"
        onClick={onClose}
    >
      <div 
        className={`${bgColor} border ${borderColor} rounded-xl shadow-2xl p-6 md:p-8 text-left max-w-2xl w-full mx-4 relative flex flex-col`}
        style={{ height: 'calc(100vh - 4rem)'}}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex justify-between items-start mb-6">
            <div className="flex items-center">
                <CodeIcon className={`w-8 h-8 mr-4 text-${accentColor}-400`} />
                <div>
                    <h2 className="text-3xl font-bold text-white">{t.downloadsTitle}</h2>
                    <p className="text-slate-400">{t.openSourceSubtitle}</p>
                </div>
            </div>
            <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-white transition-colors"
                aria-label={t.close}
            >
                <CloseIcon className="w-6 h-6" />
            </button>
        </header>

        <main className="flex-grow overflow-y-auto pr-2 space-y-6">
            {/* Install PWA Section */}
            <div className={`p-4 rounded-lg border ${buttonBorderColor} ${buttonBgColor}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-white flex items-center"><DownloadIcon className="w-5 h-5 mr-2" /> {t.install}</h3>
                        <p className="text-sm text-slate-400 mt-1">{t.installAppDesc}</p>
                    </div>
                    <button
                        onClick={onInstallClick}
                        disabled={!installPrompt}
                        className={`ml-4 flex-shrink-0 ${buttonColor} text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {t.install}
                    </button>
                </div>
                 {!installPrompt && <p className="text-xs text-slate-500 mt-2">{t.installNotAvailable}</p>}
            </div>

            {/* Download ZIP Section */}
            <div className={`p-4 rounded-lg border ${buttonBorderColor} ${buttonBgColor}`}>
                 <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-white flex items-center"><ZipFileIcon className="w-5 h-5 mr-2" /> {t.downloadZip}</h3>
                        <p className="text-sm text-slate-400 mt-1">{t.downloadZipDesc}</p>
                    </div>
                     <button
                        onClick={handleDownloadZip}
                        disabled={isDownloading}
                        className={`ml-4 flex-shrink-0 w-36 ${buttonColor} text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center`}
                    >
                        {isDownloading ? <><Loader /> {t.downloadingZip}</> : t.downloadZip}
                    </button>
                </div>
                 <div className="mt-4">
                    <button onClick={() => setShowInstructions(!showInstructions)} className="text-sm text-slate-400 hover:text-white flex items-center">
                        <InfoIcon className="w-4 h-4 mr-2" />
                        {t.showInstructions}
                    </button>
                 </div>
            </div>
            
            {showInstructions && (
                 <div className="p-4 bg-black/20 rounded-lg animate-fade-in-fast">
                    <h4 className="font-semibold text-white mb-4">{t.instructionsTitle}</h4>
                    <ul className="space-y-3">
                        <InstructionStep step={1} text={t.instruction1} />
                        <InstructionStep step={2} text={t.instruction2} />
                        <InstructionStep step={3} text={t.instruction3} />
                        <InstructionStep step={4} text={t.instruction4} />
                        <InstructionStep step={5} text={t.instruction5} />
                        <InstructionStep step={6} text={t.instruction6} />
                        <InstructionStep step={7} text={t.instruction7} />
                        <InstructionStep step={8} text={t.instruction8} />
                        <li className="ml-9">
                            <p className="text-slate-400 text-sm mb-2">{t.instruction8_context}</p>
                             <pre className="bg-slate-900 p-2 rounded text-xs text-slate-300 overflow-x-auto">
                                <code>{t.instruction8_example}</code>
                             </pre>
                            <p className="text-xs text-amber-400 mt-2" dangerouslySetInnerHTML={{ __html: t.instruction8_warning }} />
                        </li>
                    </ul>
                 </div>
            )}

        </main>
      </div>
    </div>
  );
};