import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import db from '../db';

const router = Router();
router.use(authMiddleware);

const DATA_DIR = path.join(process.cwd(), '..', '.data', 'servers');
const SPIGET_BASE = 'https://api.spiget.org/v2';

// GET /api/plugins/search?q=
router.get('/search', async (req: AuthRequest, res: Response) => {
  const q = req.query.q as string;
  if (!q) { res.status(400).json({ error: 'Query required' }); return; }
  const response = await axios.get(`${SPIGET_BASE}/search/resources/${encodeURIComponent(q)}`, {
    params: { field: 'name', size: 20, sort: '-downloads' },
  });
  const results = response.data.map((r: any) => ({
    id: r.id,
    name: r.name,
    tag: r.tag,
    downloads: r.downloads,
    rating: r.rating?.average ?? 0,
    iconUrl: r.icon?.url ? `https://www.spigotmc.org/${r.icon.url}` : null,
    version: r.version?.id ?? '',
    testedVersions: r.testedVersions ?? [],
  }));
  res.json(results);
});

// POST /api/servers/:id/plugins/install
router.post('/:serverId/install', async (req: AuthRequest, res: Response) => {
  const { serverId } = req.params;
  const { resourceId } = req.body as { resourceId: number };
  const server = db.prepare('SELECT id FROM servers WHERE id = ?').get(serverId);
  if (!server) { res.status(404).json({ error: 'Server not found' }); return; }

  const pluginsDir = path.join(DATA_DIR, serverId, 'plugins');
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });

  // Get resource info for filename
  const infoRes = await axios.get(`${SPIGET_BASE}/resources/${resourceId}`);
  const name = infoRes.data.name.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const filename = `${name}.jar`;
  const dest = path.join(pluginsDir, filename);

  const downloadRes = await axios.get(`${SPIGET_BASE}/resources/${resourceId}/download`, {
    responseType: 'stream',
  });

  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(dest);
    downloadRes.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  res.json({ success: true, filename });
});

// GET /api/servers/:id/plugins
router.get('/:serverId', (req: AuthRequest, res: Response) => {
  const { serverId } = req.params;
  const pluginsDir = path.join(DATA_DIR, serverId, 'plugins');
  if (!fs.existsSync(pluginsDir)) { res.json([]); return; }
  const files = fs.readdirSync(pluginsDir)
    .filter((f) => f.endsWith('.jar'))
    .map((f) => {
      const stat = fs.statSync(path.join(pluginsDir, f));
      return { name: f, size: stat.size, modified: stat.mtimeMs };
    });
  res.json(files);
});

// DELETE /api/servers/:id/plugins/:name
router.delete('/:serverId/:name', (req: AuthRequest, res: Response) => {
  const { serverId, name } = req.params;
  const filePath = path.join(DATA_DIR, serverId, 'plugins', name);
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Not found' }); return; }
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

export default router;
