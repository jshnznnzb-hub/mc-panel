import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { downloadJar } from '../services/jarDownloader';
import { startServer, stopServer, restartServer, getServerStatus } from '../services/pm2Service';

const router = Router();
router.use(authMiddleware);

const DATA_DIR = path.join(process.cwd(), '..', '.data', 'servers');

function getNextPort(): number {
  const row = db.prepare('SELECT MAX(port) as maxPort FROM servers').get() as { maxPort: number | null };
  return (row.maxPort ?? 25564) + 1;
}

function serverDataDir(id: string) {
  return path.join(DATA_DIR, id);
}

// GET /api/servers
router.get('/', (_req: AuthRequest, res: Response) => {
  const servers = db.prepare('SELECT * FROM servers ORDER BY created DESC').all();
  const withStatus = servers.map((s: any) => ({
    ...s,
    status: getServerStatus(s.id),
  }));
  res.json(withStatus);
});

// POST /api/servers
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, version, type, ram } = req.body as {
    name: string;
    version: string;
    type: string;
    ram: number;
  };
  if (!name || !version || !type || !ram) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }
  const id = uuidv4();
  const port = getNextPort();
  const dir = serverDataDir(id);
  fs.mkdirSync(path.join(dir, 'plugins'), { recursive: true });

  try {
    await downloadJar(type, version, dir);
    db.prepare('INSERT INTO servers (id, name, version, type, ram, port) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, name, version, type, ram, port
    );
    res.json({ id, name, version, type, ram, port });
  } catch (err: any) {
    fs.rmSync(dir, { recursive: true, force: true });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/servers/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id) as any;
  if (!server) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ...server, status: getServerStatus(server.id) });
});

// DELETE /api/servers/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id) as any;
  if (!server) { res.status(404).json({ error: 'Not found' }); return; }
  try {
    await stopServer(server.id);
  } catch {}
  fs.rmSync(serverDataDir(server.id), { recursive: true, force: true });
  db.prepare('DELETE FROM servers WHERE id = ?').run(server.id);
  res.json({ success: true });
});

// POST /api/servers/:id/start
router.post('/:id/start', async (req: AuthRequest, res: Response) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id) as any;
  if (!server) { res.status(404).json({ error: 'Not found' }); return; }
  await startServer(server);
  res.json({ success: true });
});

// POST /api/servers/:id/stop
router.post('/:id/stop', async (req: AuthRequest, res: Response) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id) as any;
  if (!server) { res.status(404).json({ error: 'Not found' }); return; }
  await stopServer(server.id);
  res.json({ success: true });
});

// POST /api/servers/:id/restart
router.post('/:id/restart', async (req: AuthRequest, res: Response) => {
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id) as any;
  if (!server) { res.status(404).json({ error: 'Not found' }); return; }
  await restartServer(server.id);
  res.json({ success: true });
});

export default router;
