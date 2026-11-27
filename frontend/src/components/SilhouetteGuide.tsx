import React from 'react';
import { X } from 'lucide-react';

interface SilhouetteGuideProps {
  guidanceText?: string;
  isVisible: boolean;
  onDismiss?: () => void;
}

export const SilhouetteGuide: React.FC<SilhouetteGuideProps> = ({
  guidanceText = 'Step back',
  isVisible,
  onDismiss,
}) => {
  if (!isVisible) return null;

  return (
    <div
      onClick={onDismiss}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-300"
      title="Click anywhere to dismiss guide"
    >
      {/* Soft vignette */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[0.5px]" />

      {/* Person upper-body silhouette matching the video */}
      <div className="relative z-10 flex flex-col items-center pointer-events-none">
        <svg
          className="w-44 h-60 text-white/45 drop-shadow-lg animate-pulse-subtle"
          viewBox="0 0 200 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Head & Neck */}
          <ellipse cx="100" cy="55" rx="34" ry="42" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" fill="rgba(255, 255, 255, 0.06)" />
          {/* Shoulders & Torso */}
          <path
            d="M 66 94 Q 100 110 134 94 C 160 102 188 126 194 175 L 182 270 L 18 270 L 6 175 C 12 126 40 102 66 94 Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            fill="rgba(255, 255, 255, 0.06)"
          />
        </svg>

        {/* Guidance Prompt pill (like "Step back" in the video) */}
        <div className="mt-3 px-3.5 py-1 rounded-full bg-white text-zinc-950 font-bold text-[11px] uppercase tracking-wider shadow-xl flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          {guidanceText}
        </div>

        <p className="text-[10px] text-white/80 mt-2 font-medium drop-shadow">
          Tap anywhere to dismiss
        </p>
      </div>
    </div>
  );
};
