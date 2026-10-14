import React from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ExternalLink } from 'lucide-react';

interface ScreenshotModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({ imageUrl, title, onClose }) => {
  const [scale, setScale] = React.useState(1);

  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl w-full max-h-[92vh] flex flex-col bg-[#12151a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0f12]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e2f952]" />
            <h3 className="font-bold text-sm tracking-wide text-white truncate max-w-md">
              {title || "Capture d'écran de l'élève"}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition"
              title="Zoom arrière"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={() => setScale(1)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition"
              title="Réinitialiser le zoom"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => setScale((s) => Math.min(2.5, s + 0.25))}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition"
              title="Zoom avant"
            >
              <ZoomIn size={18} />
            </button>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink size={18} />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-lg transition ml-2"
              title="Fermer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Image viewport */}
        <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center min-h-[400px] bg-[#08090b]">
          <img
            src={imageUrl}
            alt="Capture d'écran du problème"
            style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
            className="max-h-[75vh] w-auto object-contain rounded-lg transition-transform duration-100 shadow-md select-none"
          />
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-white/5 bg-[#0d0f12] text-xs text-zinc-500 flex justify-between items-center">
          <span>Utilisez les boutons de zoom ou ouvrez en plein écran pour lire le code d'erreur.</span>
          <span>Zoom: {Math.round(scale * 100)}%</span>
        </div>
      </div>
    </div>
  );
};
