import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Award, 
  Sparkles, 
  Download, 
  HelpCircle, 
  Flame, 
  Layers, 
  Users,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Ticket, TICKET_CATEGORIES } from '../types';

interface AnalyticsViewProps {
  tickets: Ticket[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tickets }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'today'>('all');

  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];

  const filteredTickets = tickets.filter(t => {
    if (selectedTimeframe === 'today') {
      return t.createdAt.startsWith(todayDateStr);
    }
    return true;
  });

  const totalTickets = filteredTickets.length;
  const resolvedTickets = filteredTickets.filter(t => t.status === 'resolved');
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets.length / totalTickets) * 100) : 0;

  // Average wait time in minutes (based on resolved tickets with resolvedAt)
  const waitTimesMinutes: number[] = [];
  resolvedTickets.forEach(t => {
    if (t.resolvedAt) {
      const created = new Date(t.createdAt).getTime();
      const resolved = new Date(t.resolvedAt).getTime();
      const diffMins = Math.max(1, Math.round((resolved - created) / 60000));
      waitTimesMinutes.push(diffMins);
    }
  });

  const avgWaitTime = waitTimesMinutes.length > 0 
    ? Math.round(waitTimesMinutes.reduce((a, b) => a + b, 0) / waitTimesMinutes.length) 
    : 4;

  // Breakdown by Category / Topic
  const categoryCounts: Record<string, number> = {};
  filteredTickets.forEach(t => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoryCounts)
    .map(([catName, count]) => {
      const meta = TICKET_CATEGORIES.find(c => c.label === catName);
      return {
        name: catName,
        count,
        percentage: totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0,
        color: meta?.color || '#9ca3af',
      };
    })
    .sort((a, b) => b.count - a.count);

  // Top students asking for help ("Qui demande le plus d'aide ?")
  const studentStats: Record<string, { total: number; resolved: number; categories: Record<string, number> }> = {};
  filteredTickets.forEach(t => {
    const name = t.studentName.trim() || 'Élève';
    if (!studentStats[name]) {
      studentStats[name] = { total: 0, resolved: 0, categories: {} };
    }
    studentStats[name].total += 1;
    if (t.status === 'resolved') {
      studentStats[name].resolved += 1;
    }
    studentStats[name].categories[t.category] = (studentStats[name].categories[t.category] || 0) + 1;
  });

  const sortedStudents = Object.entries(studentStats)
    .map(([name, stats]) => {
      // Find favorite/most requested topic for this student
      let topCategory = 'Général';
      let maxCatCount = 0;
      Object.entries(stats.categories).forEach(([cat, c]) => {
        if (c > maxCatCount) {
          maxCatCount = c;
          topCategory = cat;
        }
      });

      return {
        name,
        total: stats.total,
        resolved: stats.resolved,
        topCategory,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Hourly distribution
  const hourlyCounts: Record<string, number> = {};
  filteredTickets.forEach(t => {
    try {
      const hour = new Date(t.createdAt).getHours();
      const hourLabel = `${hour}h00`;
      hourlyCounts[hourLabel] = (hourlyCounts[hourLabel] || 0) + 1;
    } catch {}
  });

  // Export CSV function
  const handleExportCSV = () => {
    if (filteredTickets.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const headers = ['ID', 'Eleve', 'Table', 'Sujet', 'Urgence', 'Statut', 'DateCreation', 'DateResolution'];
    const rows = filteredTickets.map(t => [
      t.id,
      `"${t.studentName.replace(/"/g, '""')}"`,
      `"${(t.tableNumber || '').replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      t.urgency || 'normal',
      t.status,
      t.createdAt,
      t.resolvedAt || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `les_bozo_de_jb_export_${todayDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and timeframe toggle */}
      <div className="dacquet-card rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <BarChart3 size={16} className="text-[#e2f952]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#e2f952] font-bold">
              ANALYSE DU COURS & STATISTIQUES
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Tableau de bord d'autonomie
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Visualisez les difficultés récurrentes de la promo et identifiez les sujets nécessitant un point collectif.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-[#0a0c0f] border border-white/10 rounded-xl flex items-center font-mono text-xs">
            <button
              onClick={() => setSelectedTimeframe('today')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedTimeframe === 'today' ? 'bg-[#e2f952] text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setSelectedTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedTimeframe === 'all' ? 'bg-[#e2f952] text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tout l'historique
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition flex items-center gap-1.5 text-xs font-mono"
            title="Exporter les données au format CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="dacquet-card rounded-2xl p-5 border border-white/10">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Total Demandes</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-white mt-2 font-mono">
            {totalTickets}
          </div>
          <p className="text-[11px] text-zinc-500 font-mono mt-1">
            Questions posées sur la période
          </p>
        </div>

        <div className="dacquet-card rounded-2xl p-5 border border-white/10">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Taux de résolution</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-2 font-mono">
            {resolutionRate}%
          </div>
          <p className="text-[11px] text-zinc-500 font-mono mt-1">
            {resolvedTickets.length} tickets résolus avec succès
          </p>
        </div>

        <div className="dacquet-card rounded-2xl p-5 border border-white/10">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Temps d'attente moyen</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-purple-400 mt-2 font-mono">
            ~{avgWaitTime} <span className="text-sm font-normal text-zinc-400">min</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono mt-1">
            Avant l'intervention de Jean-Baptiste
          </p>
        </div>

        <div className="dacquet-card rounded-2xl p-5 border border-white/10">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Sujet #1 en difficulté</span>
          <div className="text-base sm:text-lg font-bold text-[#e2f952] mt-2 truncate font-mono">
            {sortedCategories[0]?.name || 'Aucun'}
          </div>
          <p className="text-[11px] text-zinc-500 font-mono mt-1 truncate">
            {sortedCategories[0] ? `${sortedCategories[0].count} questions (${sortedCategories[0].percentage}%)` : "En attente"}
          </p>
        </div>
      </div>

      {/* Main Grid: Topics breakdown & Who asked the most */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Topics Breakdown (6 cols) */}
        <div className="lg:col-span-6 dacquet-card rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[#e2f952]" />
              <h3 className="text-lg font-bold text-white tracking-wide">
                Répartition des blocages par sujet
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {sortedCategories.length} catégories
            </span>
          </div>

          {sortedCategories.length === 0 ? (
            <p className="text-xs text-zinc-500 font-mono text-center py-8">
              Aucune donnée enregistrée pour le moment.
            </p>
          ) : (
            <div className="space-y-4">
              {sortedCategories.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-200 font-bold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                    <span className="text-zinc-400">
                      {cat.count} ticket{cat.count > 1 ? 's' : ''} ({cat.percentage}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Pedagogical insight tip */}
              {sortedCategories[0] && (
                <div className="p-4 rounded-2xl bg-[#e2f952]/10 border border-[#e2f952]/20 flex items-start gap-3 mt-4">
                  <Sparkles size={16} className="text-[#e2f952] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-white block font-mono">Conseil pédagogique pour Jean-Baptiste :</strong>
                    <span className="text-zinc-300">
                      Le sujet <strong className="text-[#e2f952]">{sortedCategories[0].name}</strong> génère le plus de blocages ({sortedCategories[0].percentage}% des demandes). Un débriefing collectif de 5 minutes au tableau permettrait de débloquer plusieurs élèves d'un coup !
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Students who asked for help (6 cols) */}
        <div className="lg:col-span-6 dacquet-card rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-[#e2f952]" />
              <h3 className="text-lg font-bold text-white tracking-wide">
                Activité des élèves (Autonomie)
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {sortedStudents.length} élèves actifs
            </span>
          </div>

          {sortedStudents.length === 0 ? (
            <p className="text-xs text-zinc-500 font-mono text-center py-8">
              Aucune demande enregistrée pour le moment.
            </p>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {sortedStudents.map((student, idx) => (
                <div
                  key={student.name}
                  className="p-3.5 rounded-2xl bg-[#0e1116] border border-white/5 hover:border-white/15 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      idx === 0 
                        ? 'bg-[#e2f952] text-black shadow' 
                        : idx === 1 
                        ? 'bg-zinc-300 text-black' 
                        : idx === 2 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-white/5 text-zinc-400 border border-white/10'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {student.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        Sujet fréquent: <span className="text-zinc-200">{student.topCategory}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs font-extrabold text-[#e2f952] block">
                      {student.total} demande{student.total > 1 ? 's' : ''}
                    </span>
                    <span className="text-[10px] text-emerald-400">
                      {student.resolved} résolu{student.resolved > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 text-[11px] text-zinc-500 font-mono text-center">
            💡 En autonomie, poser des questions ciblées est une preuve d'implication et de recherche active !
          </div>
        </div>
      </div>
    </div>
  );
};
