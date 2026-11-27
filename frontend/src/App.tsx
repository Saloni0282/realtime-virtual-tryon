import React, { useState, useEffect } from 'react';
import { Garment } from './types';
import { INITIAL_GARMENTS } from './data/garments';
import { Header } from './components/Header';
import { ProductGrid } from './components/ProductGrid';
import { TryOnWindow } from './components/TryOnWindow';
import { CustomUploadModal } from './components/CustomUploadModal';
import { EmbedModal } from './components/EmbedModal';

export const App: React.FC = () => {
  const [garments, setGarments] = useState<Garment[]>(INITIAL_GARMENTS);
  const [activeGarment, setActiveGarment] = useState<Garment | null>(INITIAL_GARMENTS[0]); // Start with blue wave sweater
  const [isTryOnOpen, setIsTryOnOpen] = useState<boolean>(true);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isEmbedOpen, setIsEmbedOpen] = useState<boolean>(false);

  // Backend connection status
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [decartConfigured, setDecartConfigured] = useState<boolean>(false);

  // Poll backend health check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setIsBackendConnected(true);
          setDecartConfigured(Boolean(data.decartConfigured));
        } else {
          setIsBackendConnected(false);
        }
      } catch (err) {
        setIsBackendConnected(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectGarment = (garment: Garment) => {
    setActiveGarment(garment);
    setIsTryOnOpen(true);
  };

  const handleAddCustomGarment = (newGarment: Garment) => {
    setGarments((prev) => [newGarment, ...prev]);
    setActiveGarment(newGarment);
    setIsTryOnOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col text-zinc-900">
      {/* Top Navigation */}
      <Header
        onOpenEmbedModal={() => setIsEmbedOpen(true)}
        onOpenUploadModal={() => setIsUploadOpen(true)}
        isBackendConnected={isBackendConnected}
        decartConfigured={decartConfigured}
      />

      {/* Main E-Commerce Storefront */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <ProductGrid
          garments={garments}
          activeGarment={activeGarment}
          onSelectGarment={handleSelectGarment}
          onOpenUploadModal={() => setIsUploadOpen(true)}
        />
      </main>

      {/* Live Video Virtual Try-On Floating/Docked Window */}
      {isTryOnOpen && (
        <TryOnWindow
          activeGarment={activeGarment}
          onClose={() => setIsTryOnOpen(false)}
          decartConfigured={decartConfigured}
        />
      )}

      {/* Custom Clothes Upload Modal */}
      <CustomUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddGarment={handleAddCustomGarment}
      />

      {/* Store Embed Modal */}
      <EmbedModal
        isOpen={isEmbedOpen}
        onClose={() => setIsEmbedOpen(false)}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-200/80 bg-white py-8 text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Anywear Virtual Try-On. Built with Vite, React, Express, WebRTC & Lucy VTON.</p>
          <div className="flex items-center gap-4 text-zinc-500">
            <span>Real-time Live Video Engine</span>
            <span>•</span>
            <span>Sub-second Latency</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
