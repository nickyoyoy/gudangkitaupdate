import type { Request, Response } from 'express';
import { authorizeRead, fail } from './_lib/http.js';
import { readCollection } from './_lib/firestoreReader.js';

export default async function handler(req: Request, res: Response) {
  if (!authorizeRead(req, res)) return;
  try {
    const items = await readCollection('items');
    res.status(200).json({ count: items.length, items });
  } catch (error) {
    fail(res, error);
  }
}
