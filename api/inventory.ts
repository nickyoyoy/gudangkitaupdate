import type { Request, Response } from 'express';
import { adminDb } from './_lib/firebaseAdmin.js';
import { authorizeRead, fail } from './_lib/http.js';

export default async function handler(req: Request, res: Response) {
  if (!authorizeRead(req, res)) return;
  try {
    const snapshot = await adminDb.collection('items').get();
    const items = snapshot.docs.map(doc => doc.data());
    res.status(200).json({ count: items.length, items });
  } catch (error) {
    fail(res, error);
  }
}
