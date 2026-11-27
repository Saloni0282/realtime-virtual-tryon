import React, { useState } from 'react';
import { X, Check, Copy, Store, Code2 } from 'lucide-react';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const embedCode = `<!-- Anywear Real-Time Virtual Try-On Widget -->
<script 
  src="https://cdn.anywear.dev/widget.js" 
  data-store-id="YOUR_STORE_ID" 
  data-position="bottom-left"
  async>
</script>
<div id="anywear-tryon-root"></div>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-zinc-950">
              Install Virtual Try-On on Your Store
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-zinc-600 leading-relaxed">
            Integrate live video virtual try-on onto your Shopify, WooCommerce, or custom storefront in minutes. The widget connects seamlessly with your product catalog buttons.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Embed Code Snippet
            </label>
            <div className="relative rounded-2xl bg-zinc-950 p-4 font-mono text-xs text-zinc-300 overflow-x-auto border border-zinc-800">
              <pre>{embedCode}</pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-3 right-3 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                title="Copy code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1">
            <p className="font-bold">✨ Supported Platforms:</p>
            <p className="text-blue-800">Shopify App Store, WooCommerce, BigCommerce, Magento, Custom Next.js / React stores.</p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
