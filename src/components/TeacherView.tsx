import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Trash2, 
  ExternalLink, 
  AlertCircle, 
  MapPin, 
  Search, 
  Filter, 
  Play, 
  UserCheck, 
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  Flame,
  Check,
  Zap
} from 'lucide-react';
import { Ticket, TICKET_CATEGORIES } from '../types';
import { updateTicketStatus, deleteTicket } from '../lib/firebase';
import { soundFx } from '../lib/sound';

interface TeacherViewProps {
  tickets: Ticket[];
  onOpenScreenshot: (url: string, title?: string) => void;
  onOpenPasscodeModal: () => void;
  isUnlocked: boolean;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  tickets,
  onOpenScreenshot,
  onOpenPasscodeModal,
  isUnlocked,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Update relative time counter every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Format relative minutes
  const getElapsedMinutes = (dateString: string) => {
    const created = new Date(dateString).getTime();
    const diffMs = currentTime - created;
    const minutes = Math.floor(diffMs / 60000);
    return Math.max(0, minutes);
  };

  // Format hour HH:MM
  const formatTime = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const handleSetInProgress = async (ticket: Ticket) => {
    try {
      setProcessingId(ticket.id);
      await updateTicketStatus(ticket.id, 'in_progress', 'JB');
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolve = async (ticket: Ticket) => {
    try {
      setProcessingId(ticket.id);
      soundFx.playResolvedChime();
      await updateTicketStatus(ticket.id, 'resolved', 'JB');
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (window.confirm("Supprimer définitivement cette demande de la file ?")) {
      try {
        setProcessingId(ticketId);
        await deleteTicket(ticketId);
      } catch (e) {
        console.error(e);
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleClearAllResolved = async () => {
    const resolved = tickets.filter(t => t.status === 'resolved');
    if (resolved.length === 0) return;
    if (window.confirm(`Supprimer l'historique des ${resolved.length} tickets résolus ?`)) {
      for (const t of resolved) {
        await deleteTicket(t.id).catch(() => {});
      }
    }
  };

  // Filter tickets
  const activeTickets = tickets.filter(t => t.status === 'waiting' || t.status === 'in_progress');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');

  const displayedList = (activeTab === 'active' ? activeTickets : resolvedTickets)
    .filter(t => {
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          t.studentName.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          (t.tableNumber && t.tableNumber.toLowerCase().includes(query))
        );
      }
      return true;
    });

  // Calculate stats
  const waitingCount = activeTickets.filter(t => t.status === 'waiting').length;
  const inProgressTicket = activeTickets.find(t => t.status === 'in_progress');
  const resolvedTodayCount = resolvedTickets.length;

  return (
    <div className="space-y-6">
      {/* Top dashboard summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="dacquet-card rounded-2xl p-4 sm:p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">En file d'attente</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
              {waitingCount}
            </span>
            <span className="text-xs text-zinc-500 font-mono">élève{waitingCount > 1 ? 's' : ''}</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            {waitingCount === 0 ? "Tout le monde est débloqué 🎉" : "Ordre chronologique strict"}
          </p>
        </div>

        <div className="dacquet-card rounded-2xl p-4 sm:p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Actuellement avec</span>
            <UserCheck size={16} className="text-[#e2f952]" />
          </div>
          <div className="text-base sm:text-lg font-bold text-white truncate font-mono">
            {inProgressTicket ? inProgressTicket.studentName : 'Personne'}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 truncate">
            {inProgressTicket ? `Poste: ${inProgressTicket.tableNumber || 'Salle'}` : 'En attente du prochain élève'}
          </p>
        </div>

        <div className="dacquet-card rounded-2xl p-4 sm:p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Aides terminées</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight font-mono">
              {resolvedTodayCount}
            </span>
            <span className="text-xs text-zinc-500 font-mono">blocages résolus</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            Session d'autonomie du jour
          </p>
        </div>

        <div className="dacquet-card rounded-2xl p-4 sm:p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Attente max</span>
            <Clock size={16} className="text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
              {waitingCount > 0 ? getElapsedMinutes(activeTickets[0].createdAt) : 0}
            </span>
            <span className="text-xs text-zinc-500 font-mono">min</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            Depuis la demande la plus ancienne
          </p>
        </div>
      </div>

      {/* Control bar: Tabs + Search + Category Filter */}
      <div className="dacquet-card rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Active vs Resolved switch */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0b0d10] border border-white/10 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 ${
              activeTab === 'active'
                ? 'bg-[#e2f952] text-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>File active</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === 'active' ? 'bg-black text-[#e2f952]' : 'bg-white/10 text-white'
            }`}>
              {activeTickets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 ${
              activeTab === 'resolved'
                ? 'bg-[#e2f952] text-black shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Historique résolus</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === 'resolved' ? 'bg-black text-[#e2f952]' : 'bg-white/10 text-white'
            }`}>
              {resolvedTickets.length}
            </span>
          </button>
        </div>

        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher élève, table..."
              className="w-full bg-[#0b0d10] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#e2f952] transition font-mono"
            />
          </div>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full sm:w-auto bg-[#0b0d10] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-[#e2f952] transition font-mono cursor-pointer"
          >
            <option value="all">Tous les sujets</option>
            {TICKET_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.label}>{cat.label}</option>
            ))}
          </select>

          {activeTab === 'resolved' && resolvedTickets.length > 0 && (
            <button
              onClick={handleClearAllResolved}
              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-mono transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <Trash2 size={13} />
              <span>Vider l'historique</span>
            </button>
          )}
        </div>
      </div>

      {/* Ticket Queue List */}
      <div className="space-y-3">
        {displayedList.length === 0 ? (
          <div className="dacquet-card rounded-2xl p-12 text-center border border-white/10">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mb-3">
              <CheckCircle2 size={24} className="text-[#e2f952]" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">
              {activeTab === 'active' ? "Aucun élève en attente !" : "Aucun ticket résolu dans l'historique"}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              {activeTab === 'active'
                ? "Tous les élèves progressent de manière autonome ou personne n'a encore posé de question."
                : "Les demandes marquées comme résolues apparaîtront ici."}
            </p>
          </div>
        ) : (
          displayedList.map((ticket, index) => {
            const elapsedMins = getElapsedMinutes(ticket.createdAt);
            const isInProgress = ticket.status === 'in_progress';
            const isResolved = ticket.status === 'resolved';

            // Category color
            const categoryMeta = TICKET_CATEGORIES.find(c => c.label === ticket.category);
            const badgeColor = categoryMeta?.color || '#9ca3af';

            return (
              <div
                key={ticket.id}
                className={`dacquet-card rounded-2xl p-5 border transition-all duration-200 relative overflow-hidden group ${
                  isInProgress
                    ? 'border-[#e2f952] bg-[#12151a]/95 ring-1 ring-[#e2f952]/40 shadow-xl shadow-[#e2f952]/5'
                    : isResolved
                    ? 'border-white/5 bg-[#0e1014]/60 opacity-75'
                    : 'border-white/10 hover:border-white/20 bg-[#12151a]/80'
                }`}
              >
                {/* Visual side indicator */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isInProgress 
                      ? 'bg-[#e2f952]' 
                      : isResolved 
                      ? 'bg-emerald-500' 
                      : ticket.urgency === 'blocking'
                      ? 'bg-red-500'
                      : 'bg-zinc-700'
                  }`}
                />

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left Column: Number, Name, Table, Tags */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Index badge */}
                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-mono font-bold text-sm border shrink-0 ${
                      isInProgress
                        ? 'bg-[#e2f952] text-black border-[#e2f952]'
                        : isResolved
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-white/5 text-zinc-300 border-white/10'
                    }`}>
                      <span className="text-[10px] leading-none opacity-60">#</span>
                      <span className="text-base leading-none">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-white tracking-tight">
                          {ticket.studentName}
                        </h4>

                        {ticket.tableNumber && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-white/5 border border-white/10 text-zinc-300">
                            <MapPin size={11} className="text-[#e2f952]" />
                            {ticket.tableNumber}
                          </span>
                        )}

                        {/* Category tag */}
                        <span 
                          className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium border"
                          style={{
                            backgroundColor: `${badgeColor}15`,
                            color: badgeColor,
                            borderColor: `${badgeColor}30`,
                          }}
                        >
                          {ticket.category}
                        </span>

                        {/* Urgency */}
                        {ticket.urgency === 'blocking' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
                            <Flame size={11} />
                            Bloquant
                          </span>
                        )}
                        {ticket.urgency === 'quick_question' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                            <Zap size={11} />
                            Question rapide
                          </span>
                        )}

                        {isInProgress && (
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#e2f952]/10 text-[#e2f952] border border-[#e2f952]/30 animate-pulse">
                            En cours d'intervention
                          </span>
                        )}
                      </div>

                      {/* Problem description */}
                      <p className="text-sm text-zinc-300 leading-relaxed font-sans pr-2 break-words">
                        {ticket.description}
                      </p>

                      {/* Time info */}
                      <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Demande à {formatTime(ticket.createdAt)}
                        </span>
                        {!isResolved && (
                          <span className={`font-semibold ${
                            elapsedMins > 15 ? 'text-red-400' : elapsedMins > 5 ? 'text-amber-400' : 'text-zinc-400'
                          }`}>
                            (Attente: {elapsedMins} min)
                          </span>
                        )}
                        {isResolved && ticket.resolvedAt && (
                          <span className="text-emerald-400 font-medium">
                            Résolu à {formatTime(ticket.resolvedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Screenshot thumbnail & Action Buttons */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
                    {/* Screenshot thumbnail if available */}
                    {ticket.screenshotUrl && (
                      <button
                        type="button"
                        onClick={() => onOpenScreenshot(ticket.screenshotUrl!, `Capture de ${ticket.studentName} (${ticket.category})`)}
                        className="relative group/thumb border border-white/15 rounded-xl overflow-hidden hover:border-[#e2f952] transition shrink-0 bg-black/40 h-11 w-16 flex items-center justify-center"
                        title="Cliquer pour agrandir la capture d'écran"
                      >
                        <img
                          src={ticket.screenshotUrl}
                          alt="Miniature"
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition">
                          <ExternalLink size={14} className="text-white" />
                        </div>
                      </button>
                    )}

                    {/* Button: Aller voir (In progress) */}
                    {!isResolved && (
                      <button
                        type="button"
                        disabled={processingId === ticket.id}
                        onClick={() => handleSetInProgress(ticket)}
                        className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                          isInProgress
                            ? 'bg-[#e2f952] text-black shadow'
                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                        }`}
                        title="Indiquer aux élèves que vous êtes en train d'aider cette personne"
                      >
                        <Play size={13} className={isInProgress ? 'fill-black' : ''} />
                        <span>{isInProgress ? 'En cours' : 'Aller voir'}</span>
                      </button>
                    )}

                    {/* Button: Marquer comme résolu (Primary) */}
                    {!isResolved ? (
                      <button
                        type="button"
                        disabled={processingId === ticket.id}
                        onClick={() => handleResolve(ticket)}
                        className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#e2f952] hover:bg-[#d4ed3f] text-black transition shadow-lg shadow-[#e2f952]/10 flex items-center gap-1.5 active:scale-95"
                        title="Marquer comme résolu (retire de la file)"
                      >
                        <Check size={14} />
                        <span>Résolu</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={processingId === ticket.id}
                        onClick={() => handleSetInProgress(ticket)}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition flex items-center gap-1.5"
                        title="Remettre en attente"
                      >
                        <RotateCcw size={12} />
                        <span>Rouvrir</span>
                      </button>
                    )}

                    {/* Button: Delete / Clean */}
                    <button
                      type="button"
                      disabled={processingId === ticket.id}
                      onClick={() => handleDelete(ticket.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 border border-white/10 transition"
                      title="Supprimer la demande"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
