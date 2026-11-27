import React, { useState } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Garment } from '../types';

interface CustomUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGarment: (garment: Garment) => void;
}

export const CustomUploadModal: React.FC<CustomUploadModalProps> = ({
  isOpen,
  onClose,
  onAddGarment,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('My Custom Brand');
  const [price, setPrice] = useState(120);
  const [color, setColor] = useState('#2563eb');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
        if (!name) setName(file.name.replace(/\.[^/.]+$/, ''));
        if (!prompt) {
          setPrompt(`Substitute current top with a ${file.name.replace(/\.[^/.]+$/, '')} made of premium fabric matching the uploaded reference image.`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !previewImage) {
      alert('Please provide a garment name and image.');
      return;
    }

    const newGarment: Garment = {
      id: `custom-${Date.now()}`,
      name,
      brand,
      price: Number(price) || 99,
      currency: '$',
      category: 'tops',
      color,
      imageUrl: previewImage,
      prompt: prompt || `Substitute current top with a ${name}`,
      description: description || 'Custom user-uploaded garment for live virtual try-on.',
      tags: ['Custom Upload', 'Live Try-On'],
    };

    onAddGarment(newGarment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-zinc-950">
              Upload Custom Clothing Item
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Image Picker */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
              Garment Image
            </label>
            <div className="relative border-2 border-dashed border-zinc-200 hover:border-blue-500 rounded-2xl p-4 flex flex-col items-center justify-center bg-zinc-50 transition-colors cursor-pointer text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {previewImage ? (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-md">
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Upload className="w-8 h-8 text-zinc-400" />
                  <p className="text-xs font-semibold text-zinc-700">
                    Click to browse or drop an image of your garment
                  </p>
                  <p className="text-[11px] text-zinc-400">PNG, JPG, WebP up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Garment Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Garment Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vintage Silk Shirt"
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Brand Name</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. My Brand"
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Price ($)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-200"
                />
                <span className="text-xs font-mono text-zinc-600">{color}</span>
              </div>
            </div>
          </div>

          {/* AI VTON Prompt */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              AI Virtual Try-On Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Substitute current top with a relaxed silk floral button-down shirt with short sleeves..."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              The AI model uses this conditioning description to map fabric movement and contours onto the video feed.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Add & Start Trying On Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
