import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}

const app = getApps()[0] ?? initializeApp({
  credential: cert({
    projectId: required('FIREBASE_ADMIN_PROJECT_ID'),
    clientEmail: required('FIREBASE_ADMIN_CLIENT_EMAIL'),
    privateKey: required('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n'),
  }),
});

export const adminDb = getFirestore(app, process.env.FIREBASE_ADMIN_DATABASE_ID || '(default)');
