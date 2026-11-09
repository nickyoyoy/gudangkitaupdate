import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
// Fallback configuration for AI Studio (so it works out-of-the-box)
const defaultFirebaseConfig = {
  projectId: "noted-tribute-z22vb",
  appId: "1:742964557034:web:bfe654ed99a94977bd5393",
  apiKey: "AIzaSyDCnOL4hNQgV4SgBqBlSfdkXYNwozkfo9c",
  authDomain: "noted-tribute-z22vb.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-gudangkita-d5ae6977-de57-4f0e-9eb9-30b130c3a06a",
  storageBucket: "noted-tribute-z22vb.firebasestorage.app",
  messagingSenderId: "742964557034",
  measurementId: ""
};

// Use environment variables if set (highly recommended for Vercel deployment), otherwise fallback to default config
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || defaultFirebaseConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
};

import { WarehouseItem, StockMutation, PreOrder, SystemNotification } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication is the security boundary for GudangKita.
// User accounts are managed in Firebase Console; passwords are never stored in source code.
export const auth = getAuth(app);

// Initialize Firestore with custom database ID from configuration
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || '(default)');

// Collections references
export const itemsCol = collection(db, 'items');
export const mutationsCol = collection(db, 'mutations');
export const preordersCol = collection(db, 'preorders');
export const notificationsCol = collection(db, 'notifications');

/**
 * Initialize Firestore database with current local data if the database is empty.
 * This ensures the user does not lose their current data.
 */
export async function initializeFirestoreIfEmpty(
  localItems: WarehouseItem[],
  localMutations: StockMutation[],
  localPreOrders: PreOrder[],
  localNotifications: SystemNotification[]
) {
  try {
    const itemsSnapshot = await getDocs(itemsCol);
    if (!itemsSnapshot.empty) {
      console.log('Firestore already has data. Checking for missing default items...');
      const existingIds = new Set<string>();
      itemsSnapshot.forEach((docSnap) => {
        existingIds.add(docSnap.id);
      });

      const missingItems = localItems.filter((item) => !existingIds.has(item.id));
      if (missingItems.length > 0) {
        const batch = writeBatch(db);
        missingItems.forEach((item) => {
          batch.set(doc(db, 'items', item.id), item);
        });
        await batch.commit();
        console.log(`Added ${missingItems.length} missing initial items to Firestore.`);
      }
      return false; // Database was not empty
    }

    console.log('Firestore is empty. Initializing with local data...');
    const batch = writeBatch(db);

    // Add items
    localItems.forEach((item) => {
      const docRef = doc(db, 'items', item.id);
      batch.set(docRef, item);
    });

    // Add mutations
    localMutations.forEach((mut) => {
      const docRef = doc(db, 'mutations', mut.id);
      batch.set(docRef, mut);
    });

    // Add pre-orders
    localPreOrders.forEach((po) => {
      const docRef = doc(db, 'preorders', po.id);
      batch.set(docRef, po);
    });

    // Add notifications
    localNotifications.forEach((notif) => {
      const docRef = doc(db, 'notifications', notif.id);
      batch.set(docRef, notif);
    });

    await batch.commit();
    console.log('Firestore initialization complete!');
    return true;
  } catch (error) {
    console.error('Failed to initialize Firestore:', error);
    return false;
  }
}

// 1. Items helper functions
export async function saveItemToCloud(item: WarehouseItem) {
  try {
    await setDoc(doc(db, 'items', item.id), item);
  } catch (error) {
    console.error(`Error saving item ${item.id} to cloud:`, error);
  }
}

export async function deleteItemFromCloud(itemId: string) {
  try {
    await deleteDoc(doc(db, 'items', itemId));
  } catch (error) {
    console.error(`Error deleting item ${itemId} from cloud:`, error);
  }
}

// 2. Mutations helper functions
export async function saveMutationToCloud(mutation: StockMutation) {
  try {
    await setDoc(doc(db, 'mutations', mutation.id), mutation);
  } catch (error) {
    console.error(`Error saving mutation ${mutation.id} to cloud:`, error);
  }
}

export async function deleteMutationFromCloud(mutationId: string) {
  try {
    await deleteDoc(doc(db, 'mutations', mutationId));
  } catch (error) {
    console.error(`Error deleting mutation ${mutationId} from cloud:`, error);
  }
}

export async function batchDeleteMutationsFromCloud(mutationIds: string[]) {
  try {
    const batch = writeBatch(db);
    mutationIds.forEach((id) => {
      batch.delete(doc(db, 'mutations', id));
    });
    await batch.commit();
  } catch (error) {
    console.error('Error batch deleting mutations from cloud:', error);
  }
}

// 3. PreOrders helper functions
export async function savePreOrderToCloud(preOrder: PreOrder) {
  try {
    await setDoc(doc(db, 'preorders', preOrder.id), preOrder);
  } catch (error) {
    console.error(`Error saving preorder ${preOrder.id} to cloud:`, error);
  }
}

export async function deletePreOrderFromCloud(preOrderId: string) {
  try {
    await deleteDoc(doc(db, 'preorders', preOrderId));
  } catch (error) {
    console.error(`Error deleting preorder ${preOrderId} from cloud:`, error);
  }
}

// 4. Notifications helper functions
export async function saveNotificationToCloud(notification: SystemNotification) {
  try {
    await setDoc(doc(db, 'notifications', notification.id), notification);
  } catch (error) {
    console.error(`Error saving notification ${notification.id} to cloud:`, error);
  }
}

export async function deleteNotificationFromCloud(notificationId: string) {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    console.error(`Error deleting notification ${notificationId} from cloud:`, error);
  }
}

// Helper to batch set/delete for reset database action
export async function resetCloudDatabase(
  initialItems: WarehouseItem[],
  initialMutations: StockMutation[],
  initialPreorders: PreOrder[],
  initialNotifications: SystemNotification[]
) {
  try {
    // We can clear everything and set initial
    const batch = writeBatch(db);

    // Get all current documents to delete
    const itemsSnap = await getDocs(itemsCol);
    itemsSnap.forEach((d) => batch.delete(d.ref));

    const mutationsSnap = await getDocs(mutationsCol);
    mutationsSnap.forEach((d) => batch.delete(d.ref));

    const preordersSnap = await getDocs(preordersCol);
    preordersSnap.forEach((d) => batch.delete(d.ref));

    const notificationsSnap = await getDocs(notificationsCol);
    notificationsSnap.forEach((d) => batch.delete(d.ref));

    // Commit deletions
    await batch.commit();

    // Now write initial ones
    const writeBatch2 = writeBatch(db);
    initialItems.forEach((item) => {
      writeBatch2.set(doc(db, 'items', item.id), item);
    });
    initialMutations.forEach((mut) => {
      writeBatch2.set(doc(db, 'mutations', mut.id), mut);
    });
    initialPreorders.forEach((po) => {
      writeBatch2.set(doc(db, 'preorders', po.id), po);
    });
    initialNotifications.forEach((notif) => {
      writeBatch2.set(doc(db, 'notifications', notif.id), notif);
    });

    await writeBatch2.commit();
    return true;
  } catch (error) {
    console.error('Error resetting cloud database:', error);
    return false;
  }
}

// 5. Hardened diagnostics & error handling as mandated by the Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
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
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

