import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  testConnection, 
  subscribeToTickets, 
  createTicket 
} from './lib/firebase';
import { Ticket } from './types';
import { StudentPage } from './components/StudentPage';
import { TeacherPage } from './components/TeacherPage';
import { ScreenshotModal } from './components/ScreenshotModal';
import { soundFx } from './lib/sound';

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Detect current page from URL: either 'student' or 'teacher'
  const getInitialPage = (): 'student' | 'teacher' => {
    if (typeof window === 'undefined') return 'teacher';
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    if (params.get('page') === 'eleve' || params.get('page') === 'student' || path.endsWith('/eleve') || hash === '#eleve') {
      return 'student';
    }
    return 'teacher';
  };

  const [activePage, setActivePage] = useState<'student' | 'teacher'>(getInitialPage);

  const [isProfUnlocked, setIsProfUnlocked] = useState<boolean>(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('jb_prof_authenticated') === 'true';
  });
  
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('jb_sound_enabled') !== 'false' : true;
  });
  
  const [screenshotModal, setScreenshotModal] = useState<{ url: string; title?: string } | null>(null);
  const [hasTestedConnection, setHasTestedConnection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize browser history and popstate
  const navigateTo = (page: 'student' | 'teacher') => {
    setActivePage(page);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('page', page === 'student' ? 'eleve' : 'prof');
      window.history.pushState({ page }, '', url.toString());
    } catch (e) {
      console.warn('History pushState error', e);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActivePage(getInitialPage());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Compute the exact URL pointing directly to the Student Page for the QR Code
  const getStudentUrl = () => {
    if (typeof window === 'undefined') return 'https://lesbozodejb.fr?page=eleve';
    const url = new URL(window.location.href);
    url.searchParams.set('page', 'eleve');
    return url.toString();
  };

  // Initial Firebase connection test per skill
  useEffect(() => {
    if (!hasTestedConnection) {
      testConnection();
      setHasTestedConnection(true);
    }
  }, [hasTestedConnection]);

  // Track Firebase Auth user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setIsProfUnlocked(true);
        sessionStorage.setItem('jb_prof_authenticated', 'true');
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription
  useEffect(() => {
    let previousCount = -1;
    const unsubscribe = subscribeToTickets(
      (newTickets) => {
        const activeCount = newTickets.filter(t => t.status === 'waiting').length;
        if (previousCount >= 0 && activeCount > previousCount && soundEnabled) {
          soundFx.playNewTicketChime();
        }
        previousCount = activeCount;
        setTickets(newTickets);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching tickets:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [soundEnabled]);

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('jb_sound_enabled', String(nextVal));
    if (nextVal) {
      soundFx.playResolvedChime();
    }
  };

  const handleOpenScreenshot = (url: string, title?: string) => {
    setScreenshotModal({ url, title });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0d10] text-[#f3f4f6] flex flex-col items-center justify-center space-y-4 p-4 bg-grid-pattern">
        <div className="w-12 h-12 border-2 border-white/10 border-t-[#e2f952] rounded-full animate-spin" />
        <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
          Connexion à la classe en direct...
        </p>
      </div>
    );
  }

  return (
    <>
      {activePage === 'student' ? (
        /* DEDICATED STUDENT PAGE */
        <StudentPage
          tickets={tickets}
          onOpenScreenshot={handleOpenScreenshot}
          onNavigateToProf={() => navigateTo('teacher')}
        />
      ) : (
        /* DEDICATED TEACHER PAGE */
        <TeacherPage
          tickets={tickets}
          currentUser={currentUser}
          isUnlocked={isProfUnlocked}
          onUnlock={() => setIsProfUnlocked(true)}
          onLock={() => setIsProfUnlocked(false)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onOpenScreenshot={handleOpenScreenshot}
          onNavigateToStudent={() => navigateTo('student')}
          studentUrl={getStudentUrl()}
        />
      )}

      {/* High-res Screenshot Lightbox */}
      <ScreenshotModal
        imageUrl={screenshotModal?.url || null}
        title={screenshotModal?.title}
        onClose={() => setScreenshotModal(null)}
      />
    </>
  );
}
