import React from 'react';
import { Sparkles, Store, Radio } from 'lucide-react';

interface HeaderProps {
  onOpenEmbedModal: () => void;
  onOpenUploadModal: () => void;
  isBackendConnected: boolean;
  decartConfigured: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenEmbedModal,
  onOpenUploadModal,
  isBackendConnected,
  decartConfigured,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Demo Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-zinc-950 font-sans">
              Anywear
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
              Live Demo
            </span>
          </div>
        </div>

        {/* Backend & Model Status Indicator */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-zinc-600">
          <div className="flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200">
            <Radio className={`w-3.5 h-3.5 ${isBackendConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span>Backend: {isBackendConnected ? 'Connected (Port 3001)' : 'Connecting...'}</span>
            <span className="text-zinc-300">|</span>
            <span>
              Engine:{' '}
              <strong className={decartConfigured ? 'text-blue-600' : 'text-zinc-700'}>
                {decartConfigured ? 'Decart Lucy VTON' : 'Local Vision Simulator'}
              </strong>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenUploadModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Upload Custom Clothes
          </button>

          <button
            onClick={onOpenEmbedModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 active:scale-95 rounded-lg shadow-sm transition-all"
          >
            <Store className="w-3.5 h-3.5" />
            Install on my store
          </button>
        </div>
      </div>
    </header>
  );
};
