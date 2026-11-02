import type { Request, Response } from 'express';

export function authorizeRead(req: Request, res: Response): boolean {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed. This API is read-only.' });
    return false;
  }
  const expected = process.env.GUDANGKITA_API_TOKEN;
  if (!expected) {
    res.status(500).json({ error: 'API authentication is not configured' });
    return false;
  }
  if ((req.headers.authorization || '') !== `Bearer ${expected}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export function fail(res: Response, error: unknown) {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
}
