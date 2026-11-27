import React, { useState } from 'react';
import { Garment } from '../types';
import { ProductCard } from './ProductCard';
import { Sparkles, PlusCircle } from 'lucide-react';

interface ProductGridProps {
  garments: Garment[];
  activeGarment: Garment | null;
  onSelectGarment: (garment: Garment) => void;
  onOpenUploadModal: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  garments,
  activeGarment,
  onSelectGarment,
  onOpenUploadModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Garments' },
    { id: 'sweaters', label: 'Sweaters' },
    { id: 'hoodies', label: 'Hoodies' },
    { id: 'jackets', label: 'Jackets' },
    { id: 'tops', label: 'Tops' },
  ];

  const filteredGarments = selectedCategory === 'all'
    ? garments
    : garments.filter((g) => g.category === selectedCategory);

  return (
    <div className="w-full">
      {/* Hero Headline from the video */}
      <div className="text-center max-w-2xl mx-auto mb-10 pt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 font-sans">
          Try it on yourself, on this page.
        </h1>
        <p className="mt-3 text-sm sm:text-base text-zinc-500 font-normal leading-relaxed">
          Click <span className="font-semibold text-zinc-900">Try-On</span> on any garment. Every virtual try-on you have been shown before was a photo edit — <span className="text-blue-600 font-semibold">this one you can move in</span>.
        </p>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                selectedCategory === cat.id
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Garments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGarments.map((garment) => (
          <ProductCard
            key={garment.id}
            garment={garment}
            isActive={activeGarment?.id === garment.id}
            onSelect={onSelectGarment}
          />
        ))}

        {/* Upload Custom Garment Card */}
        <div
          onClick={onOpenUploadModal}
          className="group cursor-pointer rounded-2xl border-2 border-dashed border-zinc-300 hover:border-blue-500 bg-zinc-50/50 hover:bg-blue-50/20 p-8 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[360px]"
        >
          <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform mb-4 border border-zinc-200">
            <PlusCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">
            Try Your Own Clothing
          </h3>
          <p className="text-xs text-zinc-500 max-w-xs mt-2">
            Upload any photo of a shirt, hoodie, or sweater to test real-time cloth simulation on yourself.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
            <Sparkles className="w-3.5 h-3.5" />
            Upload Garment
          </span>
        </div>
      </div>
    </div>
  );
};
