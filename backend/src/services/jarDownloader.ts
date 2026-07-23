import axios from 'axios';
import fs from 'fs';
import path from 'path';

const PAPER_API = 'https://api.papermc.io/v2/projects/paper/versions';
const PURPUR_API = 'https://api.purpurmc.org/v2/purpur';
const VANILLA_MANIFEST = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';

async function downloadFile(url: string, dest: string) {
  const response = await axios.get(url, { responseType: 'stream' });
  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(dest);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function downloadPaper(version: string, dir: string) {
  const buildsRes = await axios.get(`${PAPER_API}/${version}/builds`);
  const builds = buildsRes.data.builds as Array<{ build: number; downloads: { application: { name: string } } }>;
  const latest = builds[builds.length - 1];
  const filename = latest.downloads.application.name;
  const url = `${PAPER_API}/${version}/builds/${latest.build}/downloads/${filename}`;
  await downloadFile(url, path.join(dir, 'server.jar'));
}

async function downloadPurpur(version: string, dir: string) {
  const url = `${PURPUR_API}/${version}/latest/download`;
  await downloadFile(url, path.join(dir, 'server.jar'));
}

async function downloadVanilla(version: string, dir: string) {
  const manifest = await axios.get(VANILLA_MANIFEST);
  const versions = manifest.data.versions as Array<{ id: string; url: string }>;
  const entry = versions.find((v) => v.id === version);
  if (!entry) throw new Error(`Vanilla version ${version} not found`);
  const meta = await axios.get(entry.url);
  const jarUrl = meta.data.downloads.server.url;
  await downloadFile(jarUrl, path.join(dir, 'server.jar'));
}

export async function downloadJar(type: string, version: string, dir: string) {
  // Write eula.txt automatically
  fs.writeFileSync(path.join(dir, 'eula.txt'), 'eula=true\n');
  switch (type) {
    case 'paper':
      await downloadPaper(version, dir);
      break;
    case 'purpur':
      await downloadPurpur(version, dir);
      break;
    case 'vanilla':
    case 'spigot':
    default:
      await downloadVanilla(version, dir);
  }
}
