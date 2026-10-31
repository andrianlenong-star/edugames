import React from 'react';
import { PlayerProfile } from '../types';
import {
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  Timer,
  TimerOff,
  LayoutDashboard,
  Globe,
  Sun,
  Moon,
  Languages,
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { EduZoneLogo } from './EduZoneLogo';
import { Language, getTranslations } from '../utils/i18n';
import { Theme } from '../utils/theme';

interface Props {
  activeTab: 'bank-soal' | 'creator' | 'admin';
  setActiveTab: (tab: 'bank-soal' | 'creator' | 'admin') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  timerEnabled?: boolean;
  onToggleTimer?: () => void;
  playerProfile: PlayerProfile;
  onOpenProfile: () => void;
  onHomeClick: () => void;
  onOpenGooglePub?: () => void;
  language: Language;
  onToggleLanguage: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  soundEnabled,
  onToggleSound,
  timerEnabled = true,
  onToggleTimer,
  playerProfile,
  onOpenProfile,
  onHomeClick,
  onOpenGooglePub,
  language,
  onToggleLanguage,
  theme,
  onToggleTheme,
}) => {
  const t = getTranslations(language);
  const isLight = theme === 'light';

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md px-3 sm:px-6 py-3 transition-colors ${
        isLight
          ? 'bg-white/95 border-b border-slate-200 text-slate-900 shadow-sm'
          : 'bg-slate-900/90 border-b border-slate-800 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Brand Logo EduZone */}
        <div
          onClick={onHomeClick}
          className="cursor-pointer group select-none transition-transform hover:scale-[1.02]"
        >
          <EduZoneLogo size="md" showText={true} />
        </div>

        {/* Navigation Tabs */}
        <nav
          className={`flex items-center gap-1 p-1 rounded-2xl border transition-colors ${
            isLight
              ? 'bg-slate-100 border-slate-200'
              : 'bg-slate-800/80 border-slate-700/80'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('bank-soal');
            }}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'bank-soal'
                ? 'bg-indigo-600 text-white shadow-md'
                : isLight
                ? 'text-slate-600 hover:text-indigo-600 hover:bg-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t.bankSoal}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('creator');
            }}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'creator'
                ? 'bg-indigo-600 text-white shadow-md'
                : isLight
                ? 'text-slate-600 hover:text-indigo-600 hover:bg-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.createAi}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('admin');
            }}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-md'
                : isLight
                ? 'text-slate-600 hover:text-indigo-600 hover:bg-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">{t.adminDashboard}</span>
            <span className="sm:hidden">Admin</span>
          </button>
        </nav>

        {/* Right Controls: Language, Theme Toggle, Google Pub, Timer, Sound & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Multi-Language Selector Toggle */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onToggleLanguage();
            }}
            className={`px-2.5 py-2 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title={t.switchLangTitle}
          >
            <Languages className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="uppercase font-mono text-[11px] font-black tracking-wider">
              {language === 'id' ? 'ID' : 'EN'}
            </span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onToggleTheme();
            }}
            className={`p-2 sm:px-2.5 sm:py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isLight
                ? 'bg-amber-100/70 hover:bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400'
            }`}
            title={isLight ? t.darkModeTitle : t.lightModeTitle}
          >
            {isLight ? (
              <>
                <Sun className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px] font-extrabold hidden lg:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-[11px] font-extrabold hidden lg:inline">Dark</span>
              </>
            )}
          </button>

          {/* Google Search Publication Button */}
          {onOpenGooglePub && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onOpenGooglePub();
              }}
              className="px-2 py-2 sm:px-3 sm:py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
              title="Panduan Publikasi Google Search & Status Indeks"
            >
              <Globe className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline">{t.googlePub}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          )}

          {/* Timer Toggle */}
          {onToggleTimer && (
            <button
              type="button"
              onClick={onToggleTimer}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                timerEnabled
                  ? isLight
                    ? 'bg-slate-100 border-slate-300 text-amber-700 hover:bg-slate-200'
                    : 'bg-slate-800 border-slate-700 text-amber-400 hover:text-amber-300 hover:border-amber-500/40'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40'
              }`}
              title={
                timerEnabled
                  ? 'Timer Permainan: AKTIF (Klik untuk Matikan Timer / Mode Santai)'
                  : 'Timer Permainan: NONAKTIF / SANTAI (Klik untuk Nyalakan Timer)'
              }
            >
              {timerEnabled ? (
                <>
                  <Timer className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] font-extrabold hidden md:inline">
                    {t.timerOn}
                  </span>
                </>
              ) : (
                <>
                  <TimerOff className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="text-[11px] font-extrabold text-emerald-400 hidden md:inline">
                    {t.timerRelaxed}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? isLight
                  ? 'bg-slate-100 border-slate-300 text-indigo-600 hover:bg-slate-200'
                  : 'bg-slate-800 border-slate-700 text-indigo-400 hover:text-indigo-300'
                : isLight
                ? 'bg-slate-100 border-slate-300 text-slate-400 hover:text-slate-600'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-400'
            }`}
            title={soundEnabled ? t.soundOnTitle : t.soundOffTitle}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Profile Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenProfile();
            }}
            className={`flex items-center gap-2 p-1.5 pr-2.5 sm:pr-3 rounded-2xl border transition-all cursor-pointer select-none ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-white'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-sm shadow text-white">
              {playerProfile.avatar}
            </div>
            <div className="text-left hidden lg:block">
              <span className="text-xs font-bold block leading-none">
                {playerProfile.name}
              </span>
              <span className="text-[10px] text-amber-500 dark:text-amber-400 font-extrabold">
                Lvl {playerProfile.level} • {playerProfile.coins} 🪙
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
