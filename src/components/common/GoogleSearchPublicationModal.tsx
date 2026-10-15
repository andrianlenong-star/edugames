import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  X,
  FileCode,
  ShieldCheck,
  Sparkles,
  Zap,
  Info,
  HelpCircle,
  Save,
} from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSearchPublicationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSitemap, setCopiedSitemap] = useState(false);
  const [copiedMetaTag, setCopiedMetaTag] = useState(false);
  const [copiedFileHtml, setCopiedFileHtml] = useState(false);
  const [customVerificationCode, setCustomVerificationCode] = useState('');
  const [isSavedCode, setIsSavedCode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wayground_custom_google_verification') || '';
      setCustomVerificationCode(saved);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-pmzx57gruf77apyjc56nz6-496673436177.asia-southeast1.run.app';

  const sitemapUrl = `${currentOrigin}/sitemap.xml`;
  const defaultVerifyFile = 'google14164c3f3705f7ed.html';
  const metaTagSnippet = `<meta name="google-site-verification" content="${customVerificationCode.trim() || 'google14164c3f3705f7ed'}" />`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedUrl(true);
    sounds.playSuccess();
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleCopySitemap = () => {
    navigator.clipboard.writeText(sitemapUrl);
    setCopiedSitemap(true);
    sounds.playSuccess();
    setTimeout(() => setCopiedSitemap(false), 2500);
  };

  const handleCopyMetaTag = () => {
    navigator.clipboard.writeText(metaTagSnippet);
    setCopiedMetaTag(true);
    sounds.playSuccess();
    setTimeout(() => setCopiedMetaTag(false), 2500);
  };

  const handleCopyFileHtml = () => {
    navigator.clipboard.writeText(defaultVerifyFile);
    setCopiedFileHtml(true);
    sounds.playSuccess();
    setTimeout(() => setCopiedFileHtml(false), 2500);
  };

  const handleSaveCustomCode = () => {
    const code = customVerificationCode.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('wayground_custom_google_verification', code);
      if (code) {
        // Insert or update meta tag in head
        let existingMeta = document.querySelector('meta[name="google-site-verification"][data-custom="true"]');
        if (!existingMeta) {
          existingMeta = document.createElement('meta');
          existingMeta.setAttribute('name', 'google-site-verification');
          existingMeta.setAttribute('data-custom', 'true');
          document.head.appendChild(existingMeta);
        }
        existingMeta.setAttribute('content', code);
      }
    }
    setIsSavedCode(true);
    sounds.playSuccess();
    setTimeout(() => setIsSavedCode(false), 3000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-3xl w-full bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 overflow-hidden max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Publikasikan Aplikasi ke Google Search
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/40 uppercase flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Siap 100% Diindeks Google</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Panduan resmi &amp; berkas teknis lengkap agar aplikasi Anda muncul di pencarian Google.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Checklist Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Status Kesiapan SEO &amp; Perayapan Googlebot</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
              Semua Fitur SEO Aktif
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Judul &amp; Meta Deskripsi SEO</strong>
                <span className="text-[11px] text-slate-400">
                  Judul unik, kata kunci kuis, &amp; deskripsi siap tampil di cuplikan Google
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Verifikasi Google Search Console</strong>
                <span className="text-[11px] text-slate-400">
                  Berkas HTML verifikasi &amp; meta tag Google aktif di server
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Berkas Robots.txt Resmi</strong>
                <span className="text-[11px] text-slate-400">
                  Mengizinkan Googlebot &amp; Googlebot-Image merayapi seluruh halaman kuis
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Peta Situs Publik (/sitemap.xml)</strong>
                <span className="text-[11px] text-slate-400">
                  Daftar tautan bank soal, kuis kilat, dan pembuat soal untuk Google
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 sm:col-span-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">
                  Data Terstruktur Schema.org (JSON-LD: WebApplication &amp; FAQPage)
                </strong>
                <span className="text-[11px] text-slate-400">
                  Mendukung hasil kaya (Rich Snippets) berupa FAQ interaktif dan kartu edukasi di Google
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Steps to Publish on Google Search */}
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-4">
          <div className="flex items-center gap-2 text-indigo-200">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-black uppercase tracking-wider text-white">
              4 Langkah Mudah Mendaftarkan Aplikasi ke Google Search:
            </h4>
          </div>

          <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div className="space-y-1 flex-1">
                <strong className="text-white block font-bold text-xs sm:text-sm">
                  Buka Google Search Console Resmi
                </strong>
                <p className="text-slate-300 text-[11px]">
                  Masuk dengan akun Google Anda ke <strong>Google Search Console</strong> lalu pilih properti tipe <em>"Awalan URL" (URL prefix)</em>.
                </p>
                <div className="pt-1">
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] transition-all shadow-sm"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Klik Buka Google Search Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div className="space-y-1.5 flex-1">
                <strong className="text-white block font-bold text-xs sm:text-sm">
                  Masukkan URL Aplikasi &amp; Verifikasi Kepemilikan
                </strong>
                <p className="text-slate-300 text-[11px]">
                  Masukkan URL aplikasi di bawah ini. Pilih metode verifikasi <strong>"File HTML"</strong> (nama file <code>google14164c3f3705f7ed.html</code> sudah otomatis tersedia dan aktif di aplikasi ini) atau metode <strong>"Tag HTML"</strong>.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'URL Tersalin!' : 'Salin URL Aplikasi'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyFileHtml}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedFileHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFileHtml ? 'Nama File Tersalin!' : 'Salin Nama File HTML'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div className="space-y-1.5 flex-1">
                <strong className="text-white block font-bold text-xs sm:text-sm">
                  Kirim Peta Situs (Sitemap.xml)
                </strong>
                <p className="text-slate-300 text-[11px]">
                  Di menu sebelah kiri Google Search Console, klik <strong>"Peta Situs" (Sitemaps)</strong>. Ketik <code>sitemap.xml</code> lalu klik <strong>"Kirim"</strong>. Google akan otomatis memproses dan mengindeks seluruh halaman materi soal Anda.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleCopySitemap}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {copiedSitemap ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSitemap ? 'URL Sitemap Tersalin!' : 'Salin URL Sitemap (/sitemap.xml)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                4
              </span>
              <div className="space-y-1 flex-1">
                <strong className="text-white block font-bold text-xs sm:text-sm">
                  Minta Pengindeksan Instan (Request Indexing)
                </strong>
                <p className="text-slate-300 text-[11px]">
                  Gunakan kolom pencarian paling atas di Google Search Console (Inspeksi URL), tekan Enter, lalu klik tombol <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold">Minta Pengindeksan</span> (Request Indexing) untuk memprioritaskan aplikasi Anda di antrean perayapan Googlebot.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Google Verification Code Form */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Punya Kode Verifikasi Google Search Console Sendiri? (Opsional)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Bisa langsung disimpan di sini</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Jika Google memberikan kode meta verifikasi kustom (misal: <code>google-site-verification=...</code>), tempelkan di bawah ini:
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customVerificationCode}
              onChange={(e) => setCustomVerificationCode(e.target.value)}
              placeholder="Contoh: google14164c3f3705f7ed atau kode token Google Anda..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              onClick={handleSaveCustomCode}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shrink-0"
            >
              {isSavedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{isSavedCode ? 'Berhasil Disimpan!' : 'Simpan Kode'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            <button
              type="button"
              onClick={handleCopyMetaTag}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              {copiedMetaTag ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Salin Tag Meta HTML Lengkap</span>
            </button>
          </div>
        </div>

        {/* Quick Testing Tools Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <a
            href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(currentOrigin)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Uji Hasil Kaya Google (Rich Results)</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>

          <a
            href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(currentOrigin)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Uji Kecepatan &amp; Mobile-Friendly Google</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>

        {/* Footer info & FAQ Note */}
        <div className="p-3 rounded-xl bg-slate-950 text-slate-400 text-[11px] leading-relaxed flex items-start gap-2 border border-slate-800">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-300">Berapa lama waktu yang dibutuhkan sampai muncul di Google?</strong>
            <p className="mt-0.5">
              Setelah mengirim sitemap dan meminta pengindeksan di Google Search Console, Googlebot biasanya merayapi dan memasukkan halaman aplikasi ke indeks pencarian Google dalam waktu <strong>24 jam hingga 3 hari kerja</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
