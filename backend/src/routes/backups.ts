import { Router, Response } from 'express';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import db from '../db';

const router = Router();
router.use(authMiddleware);

const DATA_DIR = path.join(process.cwd(), '..', '.data');

// GET /api/backups/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const backupDir = path.join(DATA_DIR, 'backups', id);
  if (!fs.existsSync(backupDir)) { res.json([]); return; }
  const files = fs.readdirSync(backupDir)
    .filter((f) => f.endsWith('.zip'))
    .map((f) => {
      const stat = fs.statSync(path.join(backupDir, f));
      return { filename: f, size: stat.size, created: stat.birthtimeMs };
    })
    .sort((a, b) => b.created - a.created);
  res.json(files);
});

// POST /api/backups/:id
router.post('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const server = db.prepare('SELECT id FROM servers WHERE id = ?').get(id);
  if (!server) { res.status(404).json({ error: 'Server not found' }); return; }

  const serverDir = path.join(DATA_DIR, 'servers', id);
  const backupDir = path.join(DATA_DIR, 'backups', id);
  fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.zip`;
  const destPath = path.join(backupDir, filename);

  const output = fs.createWriteStream(destPath);
  const archive = archiver('zip', { zlib: { level: 6 } });

  archive.on('error', (err) => res.status(500).json({ error: err.message }));
  output.on('close', () => res.json({ success: true, filename }));

  archive.pipe(output);
  archive.directory(serverDir, false);
  archive.finalize();
});

// GET /api/backups/:id/download/:filename
router.get('/:id/download/:filename', (req: AuthRequest, res: Response) => {
  const { id, filename } = req.params;
  const filePath = path.join(DATA_DIR, 'backups', id, filename);
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Not found' }); return; }
  res.download(filePath);
});

// DELETE /api/backups/:id/:filename
router.delete('/:id/:filename', (req: AuthRequest, res: Response) => {
  const { id, filename } = req.params;
  const filePath = path.join(DATA_DIR, 'backups', id, filename);
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Not found' }); return; }
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

export default router;
