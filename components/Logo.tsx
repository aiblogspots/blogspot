

import React from 'react';

interface LogoProps {
  className?: string;
  textClassName?: string;
  svgClassName?: string;
  mode?: 'lite' | 'pro';
}

export const Logo: React.FC<LogoProps> = ({ className, textClassName, svgClassName }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-10 h-10 animate-rotate-cube ${svgClassName}`}>
            <defs>
                <linearGradient id="logo-gradient-sweep" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="48" y2="0">
                    <stop offset="0" stopColor="#9333ea" />
                    <stop offset="0.166" stopColor="#d946ef" />
                    <stop offset="0.333" stopColor="#6366f1" />
                    <stop offset="0.5" stopColor="#38bdf8" />
                    <stop offset="0.666" stopColor="#6366f1" />
                    <stop offset="0.833" stopColor="#d946ef" />
                    <stop offset="1" stopColor="#9333ea" />
                    <animateTransform
                        attributeName="gradientTransform"
                        type="translate"
                        from="-24 0"
                        to="0 0"
                        dur="12s"
                        repeatCount="indefinite"
                    />
                </linearGradient>
            </defs>
            <g stroke="url(#logo-gradient-sweep)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
                <path d="M2 7L12 12L22 7" />
                <path d="M12 12V22" />
                <path d="M17 4.5L7 9.5" />
            </g>
        </svg>
        <span className={`font-bold animate-gradient-text ${textClassName || 'text-2xl'}`}>
            BlogAI
        </span>
    </div>
  );
};