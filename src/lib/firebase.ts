import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Ticket, ClassSession } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test as required by skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Subscribe to all tickets in real-time
export function subscribeToTickets(onUpdate: (tickets: Ticket[]) => void, onError?: (err: Error) => void) {
  const ticketsCol = collection(db, 'tickets');
  const q = query(ticketsCol);

  return onSnapshot(
    q,
    (snapshot) => {
      const tickets: Ticket[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let createdAt = new Date().toISOString();
        if (data.createdAt instanceof Timestamp) {
          createdAt = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'string') {
          createdAt = data.createdAt;
        }

        let updatedAt = undefined;
        if (data.updatedAt instanceof Timestamp) {
          updatedAt = data.updatedAt.toDate().toISOString();
        } else if (typeof data.updatedAt === 'string') {
          updatedAt = data.updatedAt;
        }

        let resolvedAt = undefined;
        if (data.resolvedAt instanceof Timestamp) {
          resolvedAt = data.resolvedAt.toDate().toISOString();
        } else if (typeof data.resolvedAt === 'string') {
          resolvedAt = data.resolvedAt;
        }

        tickets.push({
          id: docSnap.id,
          studentName: data.studentName || 'Anonyme',
          tableNumber: data.tableNumber || '',
          category: data.category || 'Autre',
          description: data.description || '',
          screenshotUrl: data.screenshotUrl || undefined,
          status: data.status || 'waiting',
          urgency: data.urgency || 'normal',
          createdAt,
          updatedAt,
          resolvedAt,
          resolvedBy: data.resolvedBy,
          studentUid: data.studentUid,
        });
      });

      // Sort by createdAt ascending (FIFO: first in, first out)
      tickets.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onUpdate(tickets);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tickets');
      if (onError) onError(error);
    }
  );
}

// Create new ticket
export async function createTicket(ticketData: Omit<Ticket, 'id' | 'createdAt' | 'status'> & { id?: string }): Promise<string> {
  const ticketId = ticketData.id || `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, 'tickets', ticketId);
  const nowIso = new Date().toISOString();

  const payload: Record<string, any> = {
    studentName: ticketData.studentName.trim(),
    category: ticketData.category,
    description: ticketData.description.trim(),
    status: 'waiting',
    urgency: ticketData.urgency || 'normal',
    createdAt: nowIso,
  };

  if (ticketData.tableNumber?.trim()) {
    payload.tableNumber = ticketData.tableNumber.trim();
  }
  if (ticketData.screenshotUrl) {
    payload.screenshotUrl = ticketData.screenshotUrl;
  }
  if (ticketData.studentUid) {
    payload.studentUid = ticketData.studentUid;
  }

  try {
    await setDoc(docRef, payload);
    return ticketId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `tickets/${ticketId}`);
    throw error;
  }
}

// Update ticket status
export async function updateTicketStatus(
  ticketId: string, 
  status: Ticket['status'], 
  resolvedBy?: string
): Promise<void> {
  const docRef = doc(db, 'tickets', ticketId);
  const updateData: Record<string, any> = {
    status,
    updatedAt: new Date().toISOString(),
  };

  if (status === 'resolved') {
    updateData.resolvedAt = new Date().toISOString();
    if (resolvedBy) {
      updateData.resolvedBy = resolvedBy;
    }
  }

  try {
    await updateDoc(docRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tickets/${ticketId}`);
    throw error;
  }
}

// Delete ticket
export async function deleteTicket(ticketId: string): Promise<void> {
  const docRef = doc(db, 'tickets', ticketId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tickets/${ticketId}`);
    throw error;
  }
}

// Authentication helpers
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
