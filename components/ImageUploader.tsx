
import React, { useRef } from 'react';
import { PhotoIcon, UploadIcon } from './Icons';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  imagePreviewUrl: string | null;
  language: 'en' | 'es';
}

const translations = {
    en: {
        changeImage: "Change Image",
        clickToUpload: "Click to upload",
        fileTypes: "PNG, JPG, or WEBP",
    },
    es: {
        changeImage: "Cambiar Imagen",
        clickToUpload: "Haz clic para subir",
        fileTypes: "PNG, JPG, o WEBP",
    }
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, imagePreviewUrl, language }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageSelect(event.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      <div
        onClick={handleClick}
        className="cursor-pointer border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-sky-500 hover:bg-slate-800 transition-all duration-300"
      >
        {imagePreviewUrl ? (
          <div className="relative group">
            <img src={imagePreviewUrl} alt="Preview" className="mx-auto max-h-80 rounded-lg shadow-md" />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                <span className="text-white text-lg font-semibold flex items-center">
                    <UploadIcon className="w-6 h-6 mr-2" /> {t.changeImage}
                </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-400">
            <PhotoIcon className="w-16 h-16 mb-4 text-slate-500" />
            <span className="font-semibold text-sky-400">{t.clickToUpload}</span>
            <span className="mt-1 text-sm">{t.fileTypes}</span>
          </div>
        )}
      </div>
    </div>
  );
};
