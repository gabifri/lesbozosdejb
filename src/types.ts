export type TicketStatus = 'waiting' | 'in_progress' | 'resolved' | 'cancelled';
export type TicketUrgency = 'normal' | 'blocking' | 'quick_question';

export interface Ticket {
  id: string;
  studentName: string;
  tableNumber?: string;
  category: string;
  description: string;
  screenshotUrl?: string;
  status: TicketStatus;
  urgency?: TicketUrgency;
  createdAt: string; // ISO string for client & stored timestamp
  updatedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  studentUid?: string;
}

export interface ClassSession {
  id: string;
  title: string;
  courseCode?: string;
  teacherPasscode?: string;
  totalTickets: number;
  resolvedTickets: number;
  updatedAt?: string;
}

export const TICKET_CATEGORIES = [
  { id: 'js_ts', label: 'JavaScript / TypeScript', color: '#f7df1e', icon: 'Code2' },
  { id: 'html_css', label: 'HTML & CSS / Design', color: '#38bdf8', icon: 'Palette' },
  { id: 'react', label: 'React / State / Hooks', color: '#61dafb', icon: 'Layers' },
  { id: 'git', label: 'Git / GitHub / Terminal', color: '#f97316', icon: 'GitBranch' },
  { id: 'console_error', label: 'Erreur Console / Crash', color: '#ef4444', icon: 'AlertTriangle' },
  { id: 'logic', label: 'Logique / Algorithme', color: '#a855f7', icon: 'Brain' },
  { id: 'deployment', label: 'Déploiement / Serveur', color: '#10b981', icon: 'Server' },
  { id: 'other', label: 'Autre question', color: '#9ca3af', icon: 'HelpCircle' },
] as const;
