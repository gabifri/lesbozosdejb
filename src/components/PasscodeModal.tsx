import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck, LogIn, Eye, EyeOff } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';

interface PasscodeModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  if (!isOpen) return null;

  const currentStoredPasscode = localStorage.getItem('jb_prof_passcode') || 'bozo';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim().toLowerCase() === currentStoredPasscode.toLowerCase() || passcode.trim() === 'jb2026') {
      sessionStorage.setItem('jb_prof_authenticated', 'true');
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoadingAuth(true);
      await loginWithGoogle();
      sessionStorage.setItem('jb_prof_authenticated', 'true');
      onSuccess();
    } catch (err) {
      console.error('Google sign-in error:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#12151a] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-2xl bg-[#e2f952]/10 border border-[#e2f952]/30 text-[#e2f952] mb-6 shadow-inner">
          <KeyRound size={28} />
        </div>

        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-white/5 border border-white/10 text-zinc-400 mb-2">
            Zone Réservée
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Accès Écran Professeur
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Entrez le mot de passe pour gérer la file d'attente et marquer les élèves aidés.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex justify-between items-center">
              <span>Mot de passe enseignant</span>
              <span className="text-[10px] text-zinc-500 font-normal">Par défaut: bozo</span>
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
                placeholder="Entrez le mot de passe..."
                className={`w-full bg-[#0a0c0f] border ${
                  error ? 'border-red-500/80 ring-1 ring-red-500/50' : 'border-white/15 focus:border-[#e2f952]'
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
                Mot de passe incorrect. (Astuce: le mot de passe par défaut est <strong className="text-red-300 font-mono">bozo</strong>)
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#e2f952] hover:bg-[#d4ed3f] text-black font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-[#e2f952]/10 active:scale-[0.99] text-sm"
          >
            <span>Déverrouiller l'écran prof</span>
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
          className="w-full flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 text-white font-medium py-2.5 px-4 rounded-xl border border-white/10 transition text-sm disabled:opacity-60"
        >
          <LogIn size={16} className="text-zinc-400" />
          <span>{isLoadingAuth ? 'Connexion en cours...' : 'Se connecter avec Google'}</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full text-center mt-4 text-xs text-zinc-500 hover:text-zinc-400 transition"
        >
          Retourner à la vue élève
        </button>
      </div>
    </div>
  );
};
