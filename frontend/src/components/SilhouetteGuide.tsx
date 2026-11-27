import React from 'react';

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
      className="absolute inset-0 z-20 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden"
      title="Click to dismiss guide"
    >
      {/* SVG Inverse Cutout Mask matching Image 1 exactly */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="cutout-silhouette-mask">
            {/* White background reveals the dark overlay */}
            <rect x="0" y="0" width="400" height="300" fill="white" />

            {/* Black shapes cut out the hole to reveal live webcam behind */}
            {/* Head oval */}
            <ellipse cx="200" cy="100" rx="36" ry="46" fill="black" />
            {/* Neck & Shoulders & Torso */}
            <path
              d="M 168 140 
                 Q 200 156 232 140 
                 C 255 148 285 170 292 215 
                 L 280 300 
                 L 120 300 
                 L 108 215 
                 C 115 170 145 148 168 140 Z"
              fill="black"
            />
          </mask>
        </defs>

        {/* The dark surrounding overlay using the cutout mask */}
        <rect
          x="0"
          y="0"
          width="400"
          height="300"
          fill="#121316"
          opacity="0.94"
          mask="url(#cutout-silhouette-mask)"
        />

        {/* Subtle white outline around the cutout boundary */}
        <ellipse
          cx="200"
          cy="100"
          rx="36"
          ry="46"
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <path
          d="M 168 140 
             Q 200 156 232 140 
             C 255 148 285 170 292 215 
             L 280 300 
             L 120 300 
             L 108 215 
             C 115 170 145 148 168 140 Z"
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      </svg>

      {/* "Step back" label matching Image 1 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none select-none">
        <span className="text-white text-xs font-bold tracking-wider uppercase drop-shadow-md">
          {guidanceText}
        </span>
        <span className="text-[10px] text-zinc-400">
          (Tap anywhere to skip)
        </span>
      </div>
    </div>
  );
};
