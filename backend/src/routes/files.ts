import { Router, Response, Request } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import db from '../db';

const router = Router();
router.use(authMiddleware);

const DATA_DIR = path.join(process.cwd(), '..', '.data', 'servers');

function safePath(serverId: string, rel: string): string | null {
  const base = path.join(DATA_DIR, serverId);
  const resolved = path.resolve(base, rel.replace(/^\/+/, ''));
  if (!resolved.startsWith(base)) return null; // path traversal guard
  return resolved;
}

// GET /api/files/:id?path=
router.get('/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const rel = (req.query.path as string) || '/';
  const abs = safePath(id, rel);
  if (!abs) { res.status(400).json({ error: 'Invalid path' }); return; }
  if (!fs.existsSync(abs)) { res.status(404).json({ error: 'Not found' }); return; }
  const stat = fs.statSync(abs);
  if (!stat.isDirectory()) { res.status(400).json({ error: 'Not a directory' }); return; }
  const entries = fs.readdirSync(abs).map((name) => {
    const s = fs.statSync(path.join(abs, name));
    return { name, type: s.isDirectory() ? 'dir' : 'file', size: s.isDirectory() ? 0 : s.size };
  });
  res.json(entries);
});

// GET /api/files/:id/read?path=
router.get('/:id/read', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const rel = req.query.path as string;
  if (!rel) { res.status(400).json({ error: 'Path required' }); return; }
  const abs = safePath(id, rel);
  if (!abs) { res.status(400).json({ error: 'Invalid path' }); return; }
  if (!fs.existsSync(abs)) { res.status(404).json({ error: 'Not found' }); return; }
  const content = fs.readFileSync(abs, 'utf-8');
  res.json({ content });
});

// PUT /api/files/:id/write
router.put('/:id/write', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { filePath, content } = req.body as { filePath: string; content: string };
  const abs = safePath(id, filePath);
  if (!abs) { res.status(400).json({ error: 'Invalid path' }); return; }
  fs.writeFileSync(abs, content, 'utf-8');
  res.json({ success: true });
});

// DELETE /api/files/:id/delete
router.delete('/:id/delete', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { filePath } = req.body as { filePath: string };
  const abs = safePath(id, filePath);
  if (!abs) { res.status(400).json({ error: 'Invalid path' }); return; }
  if (!fs.existsSync(abs)) { res.status(404).json({ error: 'Not found' }); return; }
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) fs.rmSync(abs, { recursive: true });
  else fs.unlinkSync(abs);
  res.json({ success: true });
});

// POST /api/files/:id/upload
const upload = multer({ storage: multer.memoryStorage() });
router.post('/:id/upload', upload.single('file'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const rel = (req.query.path as string) || '/';
  const abs = safePath(id, rel);
  if (!abs || !req.file) { res.status(400).json({ error: 'Invalid request' }); return; }
  fs.mkdirSync(abs, { recursive: true });
  fs.writeFileSync(path.join(abs, req.file.originalname), req.file.buffer);
  res.json({ success: true, filename: req.file.originalname });
});

// GET /api/files/:id/download?path=
router.get('/:id/download', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const rel = req.query.path as string;
  const abs = safePath(id, rel);
  if (!abs || !fs.existsSync(abs)) { res.status(404).json({ error: 'Not found' }); return; }
  res.download(abs);
});

export default router;
