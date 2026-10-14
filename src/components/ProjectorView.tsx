import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Users, 
  Clock, 
  MapPin, 
  Copy, 
  Check, 
  Sparkles, 
  QrCode, 
  Flame, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Ticket, TICKET_CATEGORIES } from '../types';

interface ProjectorViewProps {
  tickets: Ticket[];
  onOpenStudentPage: () => void;
  studentUrl: string;
}

export const ProjectorView: React.FC<ProjectorViewProps> = ({ 
  tickets, 
  onOpenStudentPage, 
  studentUrl 
}) => {
  const [copied, setCopied] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  
  // Real-time clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(studentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeTickets = tickets.filter(t => t.status === 'waiting' || t.status === 'in_progress');
  const inProgressTicket = activeTickets.find(t => t.status === 'in_progress');
  const waitingTickets = activeTickets.filter(t => t.status === 'waiting');

  return (
    <div className="space-y-6">
      {/* Top Banner for classroom */}
      <div className="dacquet-card rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden bg-gradient-to-r from-[#12151a] via-[#161a22] to-[#12151a]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e2f952] animate-ping" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#e2f952] font-bold">
                AFFICHAGE VIDÉOPROJECTEUR TABLEAU
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              LES BOZO DE JB
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 mt-2 font-mono">
              Scannez le QR Code pour rejoindre la file d'attente d'assistance.
            </p>
          </div>

          {/* Classroom Clock */}
          <div className="flex flex-col items-center md:items-end font-mono">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Heure du cours</span>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-widest bg-black/40 px-4 py-2 rounded-2xl border border-white/10 shadow-inner">
              {currentTimeStr || '12:00:00'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = QR Code for students / Right = Giant Queue list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column (5 cols): QR Code card */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="dacquet-card rounded-3xl p-6 sm:p-8 border border-white/15 text-center flex flex-col items-center shadow-2xl relative overflow-hidden">
            <div className="w-full flex items-center justify-between text-xs font-mono text-zinc-400 mb-6 pb-3 border-b border-white/10">
              <span className="flex items-center gap-1.5 font-bold text-white">
                <QrCode size={14} className="text-[#e2f952]" />
                SCANNEZ AVEC VOTRE SMARTPHONE
              </span>
              <span className="text-[#e2f952]">PAGE ÉLÈVE</span>
            </div>

            {/* Giant QR Code strictly pointing to student URL */}
            <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-2xl border-4 border-[#e2f952] relative group">
              <QRCodeSVG
                value={studentUrl}
                size={230}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Steps instructions */}
            <div className="w-full mt-6 space-y-2.5 text-left font-mono text-xs">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-[#e2f952] text-black font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span className="text-zinc-300">Scannez le QR Code avec votre téléphone pour ouvrir la page élève.</span>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-[#e2f952] text-black font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span className="text-zinc-300">Renseignez votre prénom, table et blocage (screenshot facultatif).</span>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-[#e2f952] text-black font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <span className="text-zinc-300">Votre tour arrive au tableau ci-contre ! Jean-Baptiste passe dans l'ordre.</span>
              </div>
            </div>

            {/* Copy button & preview link */}
            <div className="w-full mt-6 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-xs font-mono transition flex items-center justify-center gap-2"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Lien élève copié !' : 'Copier le lien élève'}</span>
              </button>
              <button
                type="button"
                onClick={onOpenStudentPage}
                className="py-3 px-4 bg-[#e2f952] hover:bg-[#d4ed3f] text-black font-bold rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5"
              >
                <span>Tester la page élève</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right column (7 cols): Giant Live Queue */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Active spotlight: who is being helped right now */}
          {inProgressTicket ? (
            <div className="dacquet-card rounded-3xl p-6 border-2 border-[#e2f952] bg-[#161b22] shadow-2xl relative overflow-hidden animate-in fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#e2f952] text-black flex items-center gap-1.5 shadow">
                  <UserCheck size={14} />
                  ACTUELLEMENT AVEC JEAN-BAPTISTE
                </span>
                <span className="text-xs font-mono text-[#e2f952] animate-pulse">En cours</span>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <div className="w-14 h-14 rounded-2xl bg-[#e2f952] text-black flex items-center justify-center font-mono font-black text-2xl shadow-lg">
                  ⚡
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {inProgressTicket.studentName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {inProgressTicket.tableNumber && (
                      <span className="text-sm font-mono text-zinc-300 flex items-center gap-1">
                        <MapPin size={13} className="text-[#e2f952]" />
                        {inProgressTicket.tableNumber}
                      </span>
                    )}
                    <span className="text-sm text-zinc-400">•</span>
                    <span className="text-sm font-mono text-[#e2f952]">
                      {inProgressTicket.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="dacquet-card rounded-3xl p-5 border border-white/10 text-center py-6">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                Jean-Baptiste est disponible pour le prochain élève de la file
              </span>
            </div>
          )}

          {/* Queue List */}
          <div className="dacquet-card rounded-3xl p-6 border border-white/10 flex-1 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Ordre de passage au tableau
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#e2f952] text-black">
                  {waitingTickets.length}
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                Ordre chronologique strict
              </span>
            </div>

            {waitingTickets.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 mb-3">
                  <Sparkles size={28} />
                </div>
                <h4 className="text-lg font-bold text-white">Aucun élève en attente</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs font-mono">
                  Scannez le QR Code pour vous inscrire dès que vous bloquez sur un exercice !
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {waitingTickets.map((ticket, index) => {
                  const categoryMeta = TICKET_CATEGORIES.find(c => c.label === ticket.category);
                  const badgeColor = categoryMeta?.color || '#9ca3af';

                  return (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-2xl bg-[#0e1116] border border-white/10 flex items-center justify-between gap-4 hover:border-white/20 transition group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Number in line */}
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono font-black text-sm text-[#e2f952] shrink-0">
                          #{String(index + 1).padStart(2, '0')}
                        </div>

                        {/* Name & Table */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-base truncate">
                              {ticket.studentName}
                            </span>
                            {ticket.tableNumber && (
                              <span className="text-xs font-mono text-zinc-400 flex items-center gap-0.5">
                                <MapPin size={11} className="text-[#e2f952]" />
                                {ticket.tableNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 truncate max-w-md mt-0.5">
                            {ticket.description}
                          </p>
                        </div>
                      </div>

                      {/* Right Tag */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span 
                          className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border"
                          style={{
                            backgroundColor: `${badgeColor}15`,
                            color: badgeColor,
                            borderColor: `${badgeColor}30`,
                          }}
                        >
                          {ticket.category}
                        </span>
                        {ticket.urgency === 'blocking' && (
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" title="Blocage urgent" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
