import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, X, Link, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  imageUrl?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
  compact?: boolean;
}

// Compress and resize image file to prevent huge local storage / network payloads
function processAndCompressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // If SVG, read as text or data URL directly
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Fill background white for transparent png to jpeg conversion if desired, or keep png format
        if (file.type === 'image/png') {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        }
      };
      img.onerror = () => reject(new Error('Gagal memproses berkas gambar'));
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const QuestionImageUploader: React.FC<Props> = ({
  imageUrl,
  onChange,
  label = 'Gambar Penjelas Soal (Opsional)',
  compact = false,
}) => {
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Format berkas harus berupa gambar (JPG, PNG, WebP, GIF, SVG).');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const dataUrl = await processAndCompressImage(file);
      onChange(dataUrl);
      sounds.playSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal mengunggah gambar.');
      sounds.playError();
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      setErrorMessage('URL gambar harus diawali dengan https:// atau http://');
      return;
    }
    setErrorMessage(null);
    onChange(trimmed);
    setUrlInput('');
    setIsUrlMode(false);
    sounds.playSuccess();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    sounds.playClick();
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>{label}</span>
        </label>

        {!imageUrl && (
          <button
            type="button"
            onClick={() => {
              setIsUrlMode(!isUrlMode);
              setErrorMessage(null);
            }}
            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Link className="w-3 h-3" />
            <span>{isUrlMode ? 'Unggah dari File' : 'Gunakan Link URL'}</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* When Image is Present */}
      {imageUrl ? (
        <div className="relative rounded-2xl border-2 border-indigo-500/40 bg-slate-900/90 p-2.5 flex items-center justify-between gap-3 shadow-md group">
          <div className="flex items-center gap-3 min-w-0">
            <div
              onClick={() => setIsPreviewModalOpen(true)}
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-700/80 shrink-0 cursor-pointer group/thumb"
              title="Klik untuk melihat ukuran penuh"
            >
              <img
                src={imageUrl}
                alt="Gambar Penjelas Soal"
                className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                <Eye className="w-5 h-5 text-white drop-shadow" />
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider inline-block">
                ✓ Gambar Terpasang
              </span>
              <p className="text-[11px] text-slate-400 truncate">
                Ditampilkan otomatis pada kuis, permainan, & lembar kerja.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Lihat Pratinjau Ukuran Penuh"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Ganti Gambar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ganti</span>
            </button>

            <button
              type="button"
              onClick={handleRemove}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors cursor-pointer border border-rose-500/30"
              title="Hapus Gambar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : isUrlMode ? (
        /* URL Input Mode */
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            placeholder="Tempel tautan gambar https://... (contoh: https://domain.com/gambar.jpg)"
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition-colors shrink-0"
          >
            Terapkan
          </button>
        </div>
      ) : (
        /* File Drop / Upload Mode */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file && fileInputRef.current) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              fileInputRef.current.files = dataTransfer.files;
              handleFileChange({ target: fileInputRef.current } as any);
            }
          }}
          className={`border-2 border-dashed border-slate-700 hover:border-indigo-500/70 bg-slate-800/40 hover:bg-slate-800/70 rounded-2xl ${
            compact ? 'p-2.5' : 'p-3.5'
          } flex items-center justify-center gap-2.5 cursor-pointer transition-all text-center group`}
        >
          <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-slate-300 group-hover:text-white block">
              {isProcessing ? 'Memproses berkas gambar...' : 'Klik atau seret gambar ke sini'}
            </span>
            <span className="text-[10px] text-slate-500">
              Mendukung PNG, JPG, WebP, GIF, SVG (Otomatis dikompresi)
            </span>
          </div>
        </div>
      )}

      {/* Lightbox / Preview Modal */}
      {isPreviewModalOpen && imageUrl && (
        <div
          onClick={() => setIsPreviewModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-4 shadow-2xl overflow-hidden space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Pratinjau Gambar Penjelas</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center rounded-2xl bg-slate-950 p-2">
              <img
                src={imageUrl}
                alt="Gambar Penjelas Ukuran Penuh"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
