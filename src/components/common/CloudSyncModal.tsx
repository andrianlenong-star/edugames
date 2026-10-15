import React, { useState } from 'react';
import { Cloud, RefreshCw, Copy, Check, Smartphone, Laptop, CheckCircle2, AlertCircle, X, Download, Upload, ShieldCheck } from 'lucide-react';
import { QuizSet } from '../../types';
import { syncQuizzesToCloud, fetchQuizzesFromCloud, encodeQuizzesForSyncUrl } from '../../utils/cloudSync';
import { sounds } from '../../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quizSets: QuizSet[];
  onQuizzesUpdated: (updated: QuizSet[]) => void;
}

export const CloudSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  quizSets,
  onQuizzesUpdated,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const customQuizzes = quizSets.filter((q) => q.isCustom);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    sounds.playClick();
    try {
      const result = await syncQuizzesToCloud(quizSets);
      setStatusMessage({ type: 'success', text: result.message });
      sounds.playSuccess();
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: 'Gagal menyinkronkan: ' + (e?.message || 'Koneksi terganggu') });
      sounds.playError();
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    sounds.playClick();
    try {
      const cloudQuizzes = await fetchQuizzesFromCloud();
      if (cloudQuizzes && cloudQuizzes.length > 0) {
        onQuizzesUpdated(cloudQuizzes);
        setStatusMessage({
          type: 'success',
          text: `Berhasil mengunduh ${cloudQuizzes.length} paket soal terbaru dari Cloud!`,
        });
        sounds.playSuccess();
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Semua soal di perangkat ini sudah merupakan versi terbaru.',
        });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: 'Gagal mengunduh: ' + (e?.message || 'Periksa jaringan internet') });
      sounds.playError();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySyncLink = () => {
    sounds.playClick();
    const token = encodeQuizzesForSyncUrl(customQuizzes);
    const origin = window.location.origin;
    const url = `${origin}/?sync=${token}`;

    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
      sounds.playSuccess();
    });
  };

  const handleExportJson = () => {
    sounds.playClick();
    const blob = new Blob([JSON.stringify(customQuizzes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduzone-cadangan-soal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-xl w-full bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 shadow-2xl space-y-5 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Sinkronisasi Cloud Antar Gawai</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </h3>
              <p className="text-xs text-slate-400">
                Akses soal buatan Anda dari laptop, ponsel, tablet, atau browser mana saja.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Status Cloud Storage</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40 uppercase">
              ● Aktif & Siap Pakai
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center pt-1">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-2xl font-black text-indigo-400 block">{customQuizzes.length}</span>
              <span className="text-[11px] text-slate-400 font-bold">Paket Soal Anda</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-2xl font-black text-emerald-400 block">{quizSets.length}</span>
              <span className="text-[11px] text-slate-400 font-bold">Total di Bank Soal</span>
            </div>
          </div>
        </div>

        {/* Cloud Sync Actions */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncNow}
              className="btn-3d p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Unggah / Sinkronkan ke Cloud</span>
            </button>

            <button
              type="button"
              disabled={isSyncing}
              onClick={handlePullFromCloud}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Tarik Soal Terbaru dari Cloud</span>
            </button>
          </div>

          {/* Quick Cross-Device Sync Link */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-200 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>Link Buka di HP / Laptop Lain</span>
              </span>
              <span className="text-[10px] text-indigo-400 font-bold">1-Klik Sinkron</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Kirim tautan ini ke WhatsApp atau buka di peramban gawai lain. Semua soal buatan Anda akan otomatis tersimpan di gawai tersebut!
            </p>
            <button
              type="button"
              onClick={handleCopySyncLink}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/50 text-indigo-200 hover:text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Tersalin! Siap Ditempel di Gawai Lain' : 'Salin Link Sinkronisasi Gawai'}</span>
            </button>
          </div>
        </div>

        {/* Offline Backup Option */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold">Cadangan Berkas Lokal:</span>
          <button
            type="button"
            onClick={handleExportJson}
            className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer hover:underline"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Unduh Berkas JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
