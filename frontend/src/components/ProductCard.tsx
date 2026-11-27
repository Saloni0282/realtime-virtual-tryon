import React from 'react';
import { Plus, Check, Sparkles } from 'lucide-react';
import { Garment } from '../types';

interface ProductCardProps {
  garment: Garment;
  isActive: boolean;
  onSelect: (garment: Garment) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  garment,
  isActive,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(garment)}
      className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer select-none ${
        isActive
          ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-lg'
          : 'border-zinc-200/80 hover:border-blue-300'
      }`}
    >
      {/* Product Image Frame */}
      <div className="relative aspect-[4/5] bg-zinc-100 overflow-hidden">
        <img
          src={garment.imageUrl}
          alt={garment.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Featured Tag */}
        {garment.featured && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md text-white text-[10px] font-bold tracking-wide uppercase shadow-sm">
            Featured Pick
          </div>
        )}

        {/* "+ Try-On" Action Button (styled matching the video) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(garment);
          }}
          className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 z-10 ${
            isActive
              ? 'bg-blue-600 text-white shadow-blue-500/40'
              : 'bg-white/95 text-zinc-900 hover:bg-white hover:text-blue-600'
          }`}
          title="Try on this garment on your live camera"
        >
          {isActive ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Trying On</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
              <span>Try-On</span>
            </>
          )}
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              {garment.brand}
            </p>
            <h3 className="text-sm font-bold text-zinc-900 mt-0.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {garment.name}
            </h3>
          </div>
          <span className="text-sm font-extrabold text-zinc-950">
            {garment.currency}{garment.price}
          </span>
        </div>

        <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
          {garment.description}
        </p>

        {/* Bottom Click-to-Try Action */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-blue-600 group-hover:underline">
            {isActive ? '✓ Currently Live on Camera' : 'Click card to Try-On →'}
          </span>
          <span
            className="w-3 h-3 rounded-full border border-zinc-300"
            style={{ backgroundColor: garment.color }}
            title={garment.name}
          />
        </div>
      </div>
    </div>
  );
};
