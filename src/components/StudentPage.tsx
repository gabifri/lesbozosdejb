import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MapPin, 
  HelpCircle, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Zap, 
  Flame, 
  Sparkles, 
  Clipboard, 
  Lock, 
  ExternalLink,
  Users,
  ChevronRight,
  Eye,
  Check
} from 'lucide-react';
import { Ticket, TICKET_CATEGORIES, TicketUrgency } from '../types';
import { createTicket, updateTicketStatus } from '../lib/firebase';
import { compressImageToDataUrl } from '../lib/imageUtils';
import { soundFx } from '../lib/sound';

interface StudentPageProps {
  tickets: Ticket[];
  onOpenScreenshot: (url: string, title?: string) => void;
  onNavigateToProf: () => void;
}

export const StudentPage: React.FC<StudentPageProps> = ({
  tickets,
  onOpenScreenshot,
  onNavigateToProf,
}) => {
  // Pre-fill from localStorage if available
  const [studentName, setStudentName] = useState(() => localStorage.getItem('jb_bozo_student_name') || '');
  const [tableNumber, setTableNumber] = useState(() => localStorage.getItem('jb_bozo_table_number') || '');
  const [category, setCategory] = useState<string>('JavaScript / TypeScript');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<TicketUrgency>('normal');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [justSubmittedId, setJustSubmittedId] = useState<string | null>(() => localStorage.getItem('jb_last_ticket_id') || null);
  const [selfResolvedSuccess, setSelfResolvedSuccess] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current user has an active ticket in the queue
  const myActiveTicket = tickets.find(
    t => (t.id === justSubmittedId || (studentName.trim() && t.studentName.toLowerCase() === studentName.trim().toLowerCase())) &&
         (t.status === 'waiting' || t.status === 'in_progress')
  );

  // Queue position calculation
  const waitingTickets = tickets.filter(t => t.status === 'waiting');
  const inProgressTicket = tickets.find(t => t.status === 'in_progress');
  const myQueueIndex = myActiveTicket && myActiveTicket.status === 'waiting' 
    ? waitingTickets.findIndex(t => t.id === myActiveTicket.id)
    : -1;

  // Handle Ctrl+V / Cmd+V paste of screenshots
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            try {
              const compressed = await compressImageToDataUrl(file);
              setScreenshotDataUrl(compressed);
            } catch (err) {
              console.error('Image compression failed', err);
            }
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner un fichier image valide (PNG, JPG, WebP).");
      return;
    }
    try {
      const compressed = await compressImageToDataUrl(file);
      setScreenshotDataUrl(compressed);
    } catch (err) {
      console.error('Compression failed', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('Merci de renseigner ton prénom ou nom.');
      return;
    }
    if (!description.trim()) {
      alert('Merci de décrire brièvement ton blocage.');
      return;
    }

    try {
      setIsSubmitting(true);
      localStorage.setItem('jb_bozo_student_name', studentName.trim());
      if (tableNumber.trim()) {
        localStorage.setItem('jb_bozo_table_number', tableNumber.trim());
      }

      const newId = await createTicket({
        studentName: studentName.trim(),
        tableNumber: tableNumber.trim() || undefined,
        category,
        description: description.trim(),
        urgency,
        screenshotUrl: screenshotDataUrl || undefined,
      });

      soundFx.playNewTicketChime();
      setJustSubmittedId(newId);
      localStorage.setItem('jb_last_ticket_id', newId);
      setDescription('');
      setScreenshotDataUrl(null);
    } catch (err) {
      console.error('Submit ticket error', err);
      alert("Une erreur s'est produite lors de l'enregistrement de la demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelfResolve = async () => {
    if (!myActiveTicket) return;
    try {
      await updateTicketStatus(myActiveTicket.id, 'resolved', 'Élève (Autonomie)');
      soundFx.playResolvedChime();
      setSelfResolvedSuccess(true);
      setTimeout(() => {
        setSelfResolvedSuccess(false);
        setJustSubmittedId(null);
        localStorage.removeItem('jb_last_ticket_id');
      }, 4000);
    } catch (err) {
      console.error('Self resolve error', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#f3f4f6] flex flex-col bg-grid-pattern selection:bg-[#e2f952] selection:text-black">
      {/* Dedicated Student Header */}
      <header className="sticky top-0 z-40 bg-[#0b0d10]/95 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e2f952] text-black flex items-center justify-center font-black text-sm shadow-md">
              JB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  LES BOZO DE JB
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#e2f952]/10 border border-[#e2f952]/30 text-[#e2f952]">
                  ÉLÈVE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Demande d'aide en autonomie
              </p>
            </div>
          </div>

          {/* Live class indicator */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowQueueModal(!showQueueModal)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono transition flex items-center gap-2"
            >
              <span className={`w-2 h-2 rounded-full ${waitingTickets.length > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-zinc-300 hidden sm:inline">File au tableau :</span>
              <strong className="text-white">{waitingTickets.length} en attente</strong>
            </button>
          </div>
        </div>
      </header>

      {/* Main Student Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {myActiveTicket ? (
          /* Active Ticket Card */
          <div className="dacquet-card rounded-3xl p-6 sm:p-8 border-2 border-[#e2f952] bg-[#12151a] shadow-2xl relative overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#e2f952] text-black">
                DEMANDE ENREGISTRÉE AU TABLEAU
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {new Date(myActiveTicket.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="space-y-4">
              {myActiveTicket.status === 'in_progress' ? (
                <div className="p-5 rounded-2xl bg-[#e2f952]/15 border-2 border-[#e2f952] flex items-center gap-4">
                  <span className="w-4 h-4 rounded-full bg-[#e2f952] animate-ping shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-white text-lg">
                      Jean-Baptiste arrive à ta table !
                    </h3>
                    <p className="text-xs text-zinc-300 font-mono mt-1">
                      C'est ton tour. Prépare ton écran, ton code et ta question.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#0e1116] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#e2f952] text-black font-mono font-black text-3xl flex items-center justify-center shadow-lg shrink-0">
                      #{myQueueIndex >= 0 ? myQueueIndex + 1 : 1}
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        Tu es {myQueueIndex === 0 ? "le prochain !" : `${myQueueIndex + 1}ème dans la file`}
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-1.5">
                        <Clock size={13} className="text-[#e2f952]" />
                        Temps estimé avant passage : {myQueueIndex === 0 ? "Moins de 2 min" : `~${(myQueueIndex + 1) * 4} minutes`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:border-l border-white/10 sm:pl-5">
                    <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                      Emplacement
                    </span>
                    <span className="text-sm font-bold text-zinc-200 font-mono">
                      {myActiveTicket.tableNumber || "Table non indiquée"}
                    </span>
                  </div>
                </div>
              )}

              {/* Summary of ticket */}
              <div className="p-4 rounded-2xl bg-[#0a0c0f] border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#e2f952]">
                    {myActiveTicket.category}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs text-zinc-400 font-medium">
                    {myActiveTicket.studentName}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                  {myActiveTicket.description}
                </p>
                {myActiveTicket.screenshotUrl && (
                  <button
                    type="button"
                    onClick={() => onOpenScreenshot(myActiveTicket.screenshotUrl!, "Ta capture d'écran")}
                    className="mt-2 text-xs text-[#e2f952] hover:underline flex items-center gap-1.5 font-mono"
                  >
                    <ImageIcon size={13} />
                    <span>Voir la capture d'écran envoyée</span>
                  </button>
                )}
              </div>

              {/* Self-resolve button */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleSelfResolve}
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm font-mono bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Sparkles size={16} />
                  <span>J'ai réussi à débloquer tout seul ! 🎉</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJustSubmittedId(null);
                    localStorage.removeItem('jb_last_ticket_id');
                  }}
                  className="py-3 px-4 rounded-xl font-medium text-xs font-mono bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition"
                >
                  Poser une autre question
                </button>
              </div>
            </div>
          </div>
        ) : selfResolvedSuccess ? (
          <div className="dacquet-card rounded-3xl p-8 border border-emerald-500/30 text-center space-y-3 bg-[#0f1914] animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-2xl font-black text-white">Bravo pour l'autonomie !</h3>
            <p className="text-sm text-zinc-300 max-w-md mx-auto">
              Trouver la solution par soi-même est la compétence clé du dev. Ta demande a été automatiquement retirée du tableau de Jean-Baptiste.
            </p>
          </div>
        ) : (
          /* Submission Form */
          <div className="dacquet-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative">
            <div className="mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#e2f952]" />
                <span className="text-xs font-mono uppercase tracking-widest text-[#e2f952] font-bold">
                  AUTONOMIE & ACCOMPAGNEMENT
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Demander de l'aide à JB
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Remplis le formulaire pour rejoindre la liste au tableau. JB passe dans l'ordre strict d'arrivée.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Row 1: Student Name & Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1">
                    <span>Ton prénom / nom</span>
                    <span className="text-[#e2f952]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Ex: Lucas, Sarah M."
                    className="w-full bg-[#0a0c0f] border border-white/15 focus:border-[#e2f952] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1">
                    <MapPin size={12} className="text-[#e2f952]" />
                    <span>Emplacement / Table</span>
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex: Table 3, Rangée B, Fond gauche"
                    className="w-full bg-[#0a0c0f] border border-white/15 focus:border-[#e2f952] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition font-medium"
                  />
                </div>
              </div>

              {/* Row 2: Category selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1">
                  <span>Sujet du blocage</span>
                  <span className="text-[#e2f952]">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TICKET_CATEGORIES.map((cat) => {
                    const isSelected = category === cat.label;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.label)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between min-h-[58px] ${
                          isSelected
                            ? 'border-[#e2f952] bg-[#e2f952]/10 ring-1 ring-[#e2f952]/30'
                            : 'border-white/10 bg-[#0a0c0f] hover:border-white/20'
                        }`}
                      >
                        <span className="text-xs font-bold truncate text-white">
                          {cat.label}
                        </span>
                        <span 
                          className="w-2.5 h-1 rounded-full mt-1.5"
                          style={{ backgroundColor: cat.color }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1">
                    <span>Description du problème</span>
                    <span className="text-[#e2f952]">*</span>
                  </label>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {description.length}/1000
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={1000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Que cherches-tu à faire ? Que se passe-t-il à la place ? Si tu as une erreur console, note-la ici..."
                  className="w-full bg-[#0a0c0f] border border-white/15 focus:border-[#e2f952] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition leading-relaxed resize-none"
                />
              </div>

              {/* Row 4: Urgency selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300">
                  Niveau d'urgence
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUrgency('quick_question')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      urgency === 'quick_question'
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-white/10 bg-[#0a0c0f] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Zap size={16} className="text-purple-400 shrink-0" />
                    <div>
                      <span className="block text-xs font-bold">Question rapide</span>
                      <span className="block text-[10px] text-zinc-500 font-mono">~2 min max</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('normal')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      urgency === 'normal'
                        ? 'border-[#e2f952] bg-[#e2f952]/10 text-white'
                        : 'border-white/10 bg-[#0a0c0f] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Clock size={16} className="text-[#e2f952] shrink-0" />
                    <div>
                      <span className="block text-xs font-bold">Normal</span>
                      <span className="block text-[10px] text-zinc-500 font-mono">Besoin d'aide</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('blocking')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      urgency === 'blocking'
                        ? 'border-red-500 bg-red-500/10 text-white'
                        : 'border-white/10 bg-[#0a0c0f] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Flame size={16} className="text-red-400 shrink-0" />
                    <div>
                      <span className="block text-xs font-bold">Bloquant</span>
                      <span className="block text-[10px] text-zinc-500 font-mono">Totalement bloqué</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Row 5: Screenshot upload / Paste */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon size={13} className="text-[#e2f952]" />
                    <span>Capture d'écran ou photo de l'erreur (facultatif)</span>
                  </span>
                  <span className="text-[10px] text-[#e2f952] font-mono flex items-center gap-1">
                    <Clipboard size={11} />
                    Ctrl+V supporté
                  </span>
                </label>

                {screenshotDataUrl ? (
                  <div className="relative p-2.5 rounded-xl bg-[#0a0c0f] border border-white/15 flex items-center gap-4">
                    <img
                      src={screenshotDataUrl}
                      alt="Capture"
                      className="w-20 h-16 object-cover rounded-lg border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-white block">Capture jointe avec succès</span>
                      <span className="text-[11px] text-emerald-400 font-mono">Optimisée pour le prof</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScreenshotDataUrl(null)}
                      className="p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition"
                      title="Supprimer la capture"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center cursor-pointer transition ${
                      isDragging
                        ? 'border-[#e2f952] bg-[#e2f952]/5'
                        : 'border-white/15 hover:border-white/30 bg-[#0a0c0f]'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageFile(e.target.files[0]);
                        }
                      }}
                    />
                    <ImageIcon size={22} className="mx-auto text-zinc-500 mb-2" />
                    <p className="text-xs text-zinc-300 font-medium">
                      Clique pour importer ou fais <span className="text-[#e2f952] font-mono">Ctrl+V</span> pour coller ta capture
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono mt-1">
                      Idéal pour montrer l'erreur console ou le rendu cassé
                    </p>
                  </div>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-[#e2f952] hover:bg-[#d4ed3f] text-black font-extrabold text-sm sm:text-base font-mono transition shadow-xl shadow-[#e2f952]/10 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <Send size={18} />
                <span>{isSubmitting ? "Envoi de ta demande..." : "Rejoindre la file d'attente"}</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Discrete footer for student page */}
      <footer className="border-t border-white/10 py-5 px-4 bg-[#08090b] text-center text-xs text-zinc-500 font-mono mt-auto">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e2f952]" />
            <span className="text-zinc-400 font-bold">Les Bozo de JB</span>
            <span className="hidden sm:inline">• Cours d'autonomie</span>
          </div>

          <button
            onClick={onNavigateToProf}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition text-[11px]"
          >
            <Lock size={12} />
            <span>Accès Enseignant</span>
          </button>
        </div>
      </footer>

      {/* Live queue peek modal */}
      {showQueueModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowQueueModal(false)}
        >
          <div 
            className="w-full max-w-md bg-[#12151a] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">
                File d'attente actuelle au tableau
              </h3>
              <button
                onClick={() => setShowQueueModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {inProgressTicket && (
              <div className="p-3 rounded-xl bg-[#e2f952]/10 border border-[#e2f952]/30 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300">En cours avec JB :</span>
                <strong className="text-[#e2f952] font-bold">{inProgressTicket.studentName}</strong>
              </div>
            )}

            {waitingTickets.length === 0 ? (
              <p className="text-xs text-zinc-500 font-mono text-center py-6">
                Personne n'est en attente pour le moment !
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {waitingTickets.map((t, idx) => (
                  <div 
                    key={t.id}
                    className="p-3 rounded-xl bg-[#0a0c0f] border border-white/5 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#e2f952] font-bold">#{idx + 1}</span>
                      <span className="text-white font-medium">{t.studentName}</span>
                    </div>
                    <span className="text-zinc-500 text-[11px]">{t.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
