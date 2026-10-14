import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  ShieldCheck, 
  Lock, 
  Presentation, 
  BarChart3, 
  ListOrdered, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  LogOut, 
  ExternalLink,
  KeyRound,
  ArrowRight,
  LogIn,
  Eye,
  EyeOff,
  Settings,
  Sparkles,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { Ticket } from '../types';
import { TeacherView } from './TeacherView';
import { ProjectorView } from './ProjectorView';
import { AnalyticsView } from './AnalyticsView';
import { loginWithGoogle, logoutUser, deleteTicket } from '../lib/firebase';

interface TeacherPageProps {
  tickets: Ticket[];
  currentUser: User | null;
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenScreenshot: (url: string, title?: string) => void;
  onNavigateToStudent: () => void;
  studentUrl: string;
}

export const TeacherPage: React.FC<TeacherPageProps> = ({
  tickets,
  currentUser,
  isUnlocked,
  onUnlock,
  onLock,
  soundEnabled,
  onToggleSound,
  onOpenScreenshot,
  onNavigateToStudent,
  studentUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'projector' | 'analytics' | 'settings'>('queue');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Password login form states
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Custom password management in settings
  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeChangedSuccess, setPasscodeChangedSuccess] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentStoredPasscode = localStorage.getItem('jb_prof_passcode') || 'bozo';
    if (passcode.trim().toLowerCase() === currentStoredPasscode.toLowerCase() || passcode.trim() === 'jb2026') {
      sessionStorage.setItem('jb_prof_authenticated', 'true');
      setError(false);
      onUnlock();
    } else {
      setError(true);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoadingAuth(true);
      await loginWithGoogle();
      sessionStorage.setItem('jb_prof_authenticated', 'true');
      onUnlock();
    } catch (err) {
      console.error('Google sign-in error:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleChangePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasscode.trim().length >= 3) {
      localStorage.setItem('jb_prof_passcode', newPasscode.trim());
      setPasscodeChangedSuccess(true);
      setTimeout(() => setPasscodeChangedSuccess(false), 3000);
      setNewPasscode('');
    }
  };

  const handleResetEntireQueue = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir vider complètement toutes les demandes de la session ?")) {
      for (const t of tickets) {
        await deleteTicket(t.id).catch(() => {});
      }
    }
  };

  const waitingCount = tickets.filter(t => t.status === 'waiting').length;

  // If teacher is NOT unlocked yet, show the full dedicated Lock Screen
  if (!isUnlocked && !currentUser) {
    return (
      <div className="min-h-screen bg-[#0b0d10] text-[#f3f4f6] flex flex-col justify-center items-center p-4 bg-grid-pattern">
        <div className="w-full max-w-md bg-[#12151a] border border-white/10 rounded-3xl p-8 shadow-2xl relative animate-in fade-in">
          {/* Logo */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-[#e2f952]/10 border border-[#e2f952]/30 text-[#e2f952] mb-6 shadow-inner">
            <KeyRound size={32} />
          </div>

          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-white/5 border border-white/10 text-[#e2f952] mb-2 font-bold">
              PORTAIL PROFESSEUR
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Espace Jean-Baptiste
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Entrez le mot de passe pour gérer la file d'attente et projeter au tableau.
            </p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex justify-between items-center">
                <span>Mot de passe</span>
                <span className="text-[10px] text-zinc-500 font-normal">Par défaut : bozo</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Mot de passe..."
                  className={`w-full bg-[#0a0c0f] border ${
                    error ? 'border-red-500 ring-1 ring-red-500' : 'border-white/15 focus:border-[#e2f952]'
                  } rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition pr-11 font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && (
                <p className="text-xs text-red-400 font-medium mt-1">
                  Mot de passe incorrect. (Par défaut : <strong className="text-red-300 font-mono">bozo</strong>)
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#e2f952] hover:bg-[#d4ed3f] text-black font-extrabold py-3.5 px-4 rounded-xl transition shadow-lg shadow-[#e2f952]/10 active:scale-[0.99] text-sm font-mono cursor-pointer"
            >
              <span>Accéder au tableau de bord prof</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#12151a] px-3 text-zinc-500 font-mono text-[10px]">Ou connexion Google</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoadingAuth}
            className="w-full flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-4 rounded-xl border border-white/10 transition text-xs font-mono disabled:opacity-60"
          >
            <LogIn size={15} className="text-zinc-400" />
            <span>{isLoadingAuth ? 'Connexion en cours...' : 'Se connecter avec Google'}</span>
          </button>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={onNavigateToStudent}
              className="text-xs text-zinc-400 hover:text-[#e2f952] transition flex items-center justify-center gap-1.5 mx-auto font-mono"
            >
              <span>Vous êtes un élève ? Accéder à la page formulaire</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Teacher is UNLOCKED -> Render Teacher Dashboard
  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#f3f4f6] flex flex-col bg-grid-pattern selection:bg-[#e2f952] selection:text-black">
      {/* Teacher Header */}
      <header className="sticky top-0 z-40 bg-[#0b0d10]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#e2f952] text-black flex items-center justify-center font-black text-sm shadow-lg shadow-[#e2f952]/20">
                JB
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-white">
                    LES BOZO DE JB
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#e2f952] text-black">
                    ESPACE PROF
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono hidden sm:block">
                  Console d'assistance et projection
                </p>
              </div>
            </div>

            {/* Quick waiting pill on mobile */}
            <div className="flex md:hidden items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
                waitingCount > 0 ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              }`}>
                {waitingCount} en attente
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 p-1 bg-[#12151a] border border-white/10 rounded-xl overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition whitespace-nowrap ${
                activeTab === 'queue' ? 'bg-[#e2f952] text-black font-bold shadow' : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ListOrdered size={14} />
              <span>File d'attente</span>
              {waitingCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'queue' ? 'bg-black text-[#e2f952]' : 'bg-[#e2f952] text-black font-bold'
                }`}>
                  {waitingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('projector')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition whitespace-nowrap ${
                activeTab === 'projector' ? 'bg-[#e2f952] text-black font-bold shadow' : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Presentation size={14} />
              <span>Projeter au tableau</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition whitespace-nowrap ${
                activeTab === 'analytics' ? 'bg-[#e2f952] text-black font-bold shadow' : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 size={14} />
              <span>Analytiques</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition whitespace-nowrap ${
                activeTab === 'settings' ? 'bg-[#e2f952] text-black font-bold shadow' : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings size={14} />
              <span>Paramètres</span>
            </button>
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* View Student page button */}
            <button
              onClick={onNavigateToStudent}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-zinc-300 hover:text-white transition"
              title="Tester ou voir ce que voit l'élève"
            >
              <span>Page Élève</span>
              <ExternalLink size={12} />
            </button>

            {/* Sound alert */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Alertes sonores activées' : 'Alertes sonores coupées'}
              className={`p-2 rounded-xl border text-xs transition flex items-center ${
                soundEnabled ? 'bg-[#e2f952]/10 border-[#e2f952]/30 text-[#e2f952]' : 'bg-white/5 border-white/10 text-zinc-500'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              title="Plein écran pour vidéoprojecteur"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Lock / Logout */}
            <button
              onClick={() => {
                if (currentUser) {
                  logoutUser();
                }
                sessionStorage.removeItem('jb_prof_authenticated');
                onLock();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 text-zinc-400 hover:text-red-400 transition"
              title="Verrouiller l'écran prof"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'queue' && (
          <TeacherView
            tickets={tickets}
            onOpenScreenshot={onOpenScreenshot}
            onOpenPasscodeModal={() => {}}
            isUnlocked={true}
          />
        )}

        {activeTab === 'projector' && (
          <ProjectorView
            tickets={tickets}
            onOpenStudentPage={onNavigateToStudent}
            studentUrl={studentUrl}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView tickets={tickets} />
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="dacquet-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-1">
                Paramètres de la session
              </h2>
              <p className="text-xs text-zinc-400 font-mono mb-6">
                Personnalisez le mot de passe d'accès enseignant ou réinitialisez la file.
              </p>

              {/* Change Passcode */}
              <form onSubmit={handleChangePasscode} className="space-y-4 pb-6 border-b border-white/10">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-300">
                    Nouveau mot de passe de l'écran prof
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPasscode}
                      onChange={(e) => setNewPasscode(e.target.value)}
                      placeholder="Ex: dacquet2026, coursjs..."
                      className="flex-1 bg-[#0a0c0f] border border-white/15 focus:border-[#e2f952] rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                    />
                    <button
                      type="submit"
                      disabled={newPasscode.trim().length < 3}
                      className="px-4 py-2.5 bg-[#e2f952] hover:bg-[#d4ed3f] text-black font-bold text-xs font-mono rounded-xl transition disabled:opacity-40"
                    >
                      Enregistrer
                    </button>
                  </div>
                  {passcodeChangedSuccess && (
                    <p className="text-xs text-emerald-400 font-mono mt-1">
                      ✓ Mot de passe mis à jour avec succès !
                    </p>
                  )}
                </div>
              </form>

              {/* Reset session queue */}
              <div className="pt-6 space-y-3">
                <h3 className="text-sm font-bold text-white">
                  Réinitialiser la file pour le prochain cours
                </h3>
                <p className="text-xs text-zinc-400">
                  Cette action supprime toutes les demandes actuellement enregistrées dans la file pour repartir à zéro.
                </p>
                <button
                  type="button"
                  onClick={handleResetEntireQueue}
                  className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  <span>Vider toutes les demandes de la classe</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-5 px-4 bg-[#08090b] text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e2f952]" />
            <span className="text-zinc-400 font-bold">Les Bozo de JB — Espace Professeur</span>
            <span>• Inspiré de dacquet.design</span>
          </div>

          <button
            onClick={onNavigateToStudent}
            className="text-zinc-400 hover:text-[#e2f952] transition flex items-center gap-1.5"
          >
            <span>Aller sur la page élève</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </footer>
    </div>
  );
};
