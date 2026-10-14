import React from 'react';
import { 
  Users, 
  Presentation, 
  BarChart3, 
  PlusCircle, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Lock, 
  LogOut,
  Maximize2,
  Minimize2,
  Sparkles
} from 'lucide-react';
import { User } from 'firebase/auth';
import { logoutUser } from '../lib/firebase';

interface HeaderProps {
  currentTab: 'teacher' | 'projector' | 'student' | 'analytics';
  onSelectTab: (tab: 'teacher' | 'projector' | 'student' | 'analytics') => void;
  waitingCount: number;
  inProgressCount: number;
  isProfUnlocked: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentUser: User | null;
  onOpenPasscodeModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  waitingCount,
  inProgressCount,
  isProfUnlocked,
  soundEnabled,
  onToggleSound,
  currentUser,
  onOpenPasscodeModal,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b0d10]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div 
            onClick={() => onSelectTab('teacher')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#e2f952] text-black flex items-center justify-center font-black text-base shadow-lg shadow-[#e2f952]/20 group-hover:scale-105 transition">
              JB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#e2f952] transition">
                  LES BOZO DE JB
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-white/5 border border-white/10 text-[#e2f952]">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono hidden sm:block">
                File d'attente d'autonomie • dacquet.design
              </p>
            </div>
          </div>

          {/* Quick status pill on mobile */}
          <div className="flex md:hidden items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
              waitingCount > 0 
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' 
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${waitingCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              {waitingCount} en attente
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-[#12151a] border border-white/10 rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => {
              if (!isProfUnlocked && !currentUser) {
                onOpenPasscodeModal();
              } else {
                onSelectTab('teacher');
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              currentTab === 'teacher'
                ? 'bg-[#e2f952] text-black font-bold shadow'
                : 'text-zinc-300 hover:text-white hover:bg-white/5'
            }`}
          >
            {isProfUnlocked || currentUser ? (
              <ShieldCheck size={14} className={currentTab === 'teacher' ? 'text-black' : 'text-emerald-400'} />
            ) : (
              <Lock size={14} className="text-zinc-400" />
            )}
            <span>Écran Prof</span>
            {waitingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                currentTab === 'teacher' ? 'bg-black text-[#e2f952]' : 'bg-[#e2f952] text-black font-bold'
              }`}>
                {waitingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('projector')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              currentTab === 'projector'
                ? 'bg-[#e2f952] text-black font-bold shadow'
                : 'text-zinc-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Presentation size={14} />
            <span>Tableau / Projeter</span>
          </button>

          <button
            onClick={() => onSelectTab('student')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              currentTab === 'student'
                ? 'bg-[#e2f952] text-black font-bold shadow'
                : 'text-zinc-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <PlusCircle size={14} />
            <span>Demander de l'aide</span>
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              currentTab === 'analytics'
                ? 'bg-[#e2f952] text-black font-bold shadow'
                : 'text-zinc-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 size={14} />
            <span>Analytiques</span>
          </button>
        </nav>

        {/* Controls & Auth */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Sound alert toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Alertes sonores activées' : 'Alertes sonores coupées'}
            className={`p-2 rounded-xl border text-xs transition flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-[#e2f952]/10 border-[#e2f952]/30 text-[#e2f952]'
                : 'bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            title="Plein écran (idéal pour le tableau)"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* User profile or lock button */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || 'Professeur'} 
                  className="w-7 h-7 rounded-full border border-white/20 object-cover" 
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#e2f952] text-black text-xs font-bold flex items-center justify-center">
                  {(currentUser.displayName || currentUser.email || 'P')[0].toUpperCase()}
                </div>
              )}
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold text-white truncate max-w-[100px]">
                  {currentUser.displayName || 'Jean-Baptiste'}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono">Enseignant</p>
              </div>
              <button
                onClick={() => logoutUser()}
                title="Déconnexion"
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : isProfUnlocked ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck size={13} />
                Mode Prof
              </span>
              <button
                onClick={() => {
                  sessionStorage.removeItem('jb_prof_authenticated');
                  window.location.reload();
                }}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono transition"
                title="Verrouiller l'écran prof"
              >
                Verrouiller
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenPasscodeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-zinc-300 hover:text-white transition"
            >
              <Lock size={13} />
              <span>Accès Enseignant</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
