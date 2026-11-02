import type { Request, Response } from 'express';
import { authorizeRead, fail } from './_lib/http.js';

const PROJECT_ID = 'noted-tribute-z22vb';
const DATABASE_ID = 'ai-studio-gudangkita-d5ae6977-de57-4f0e-9eb9-30b130c3a06a';

function decodeValue(value: any): any {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  return null;
}
function decodeFields(fields: Record<string, any>) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

export default async function handler(req: Request, res: Response) {
  if (!authorizeRead(req, res)) return;
  try {
    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    const email = process.env.GUDANGKITA_READER_EMAIL;
    const password = process.env.GUDANGKITA_READER_PASSWORD;
    if (!apiKey || !email || !password) throw new Error('Reader credentials are not configured');

    const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    if (!authResponse.ok) throw new Error('Firebase reader authentication failed');
    const auth = await authResponse.json() as { idToken: string };

    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/items`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${auth.idToken}` } });
    if (!response.ok) throw new Error('Firestore read failed');
    const payload = await response.json() as { documents?: Array<{ fields?: Record<string, any> }> };
    const items = (payload.documents || []).map(doc => decodeFields(doc.fields || {}));
    res.status(200).json({ count: items.length, items });
  } catch (error) {
    fail(res, error);
  }
}
