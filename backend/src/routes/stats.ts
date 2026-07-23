import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getServerStats } from '../services/pm2Service';
import db from '../db';

const router = Router();
router.use(authMiddleware);

// GET /api/stats/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const server = db.prepare('SELECT id FROM servers WHERE id = ?').get(req.params.id);
  if (!server) { res.status(404).json({ error: 'Not found' }); return; }
  const stats = await getServerStats(req.params.id);
  res.json(stats);
});

export default router;
