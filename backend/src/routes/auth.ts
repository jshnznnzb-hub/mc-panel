import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { signToken, signRefreshToken, verifyRefreshToken } from '../middleware/auth';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }
  const user = db.prepare('SELECT id, password FROM users WHERE username = ?').get(username) as
    | { id: number; password: string }
    | undefined;
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = signToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  res.json({ token, refreshToken, username });
});

router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }
  try {
    const userId = verifyRefreshToken(refreshToken);
    const token = signToken(userId);
    res.json({ token });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
