import type { Request, Response } from 'express';
import { authorizeRead, fail } from './_lib/http.js';
import { readCollection } from './_lib/firestoreReader.js';

export default async function handler(req: Request, res: Response) {
  if (!authorizeRead(req, res)) return;
  try {
    const data = await readCollection('preorders');
    res.status(200).json({ count: data.length, preorders: data });
  } catch (error) {
    fail(res, error);
  }
}
