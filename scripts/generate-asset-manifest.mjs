import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const boardsDir = path.join(root, 'public', 'assets', 'boards');
const pieceRootDir = path.join(root, 'public', 'assets', 'piece');
const outputPath = path.join(root, 'public', 'assets', 'asset-manifest.json');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);

const toLabel = (name) => name
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b\w/g, (char) => char.toUpperCase());

async function readDirSafe(dirPath) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function buildManifest() {
  const boardEntries = await readDirSafe(boardsDir);
  const boards = boardEntries
    .filter((entry) => entry.isFile())
    .filter((entry) => IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => {
      const id = entry.name.replace(path.extname(entry.name), '');
      return {
        id,
        file: entry.name,
        label: toLabel(id),
        path: `/assets/boards/${entry.name}`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const pieceSetEntries = await readDirSafe(pieceRootDir);
  const pieceSets = [];
  const pieceFilesBySet = {};

  for (const entry of pieceSetEntries) {
    if (!entry.isDirectory()) continue;
    const setName = entry.name;
    const setDir = path.join(pieceRootDir, setName);
    const files = (await readDirSafe(setDir))
      .filter((fileEntry) => fileEntry.isFile())
      .map((fileEntry) => fileEntry.name)
      .filter((fileName) => IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    if (files.length === 0) continue;

    pieceSets.push(setName);
    pieceFilesBySet[setName] = files;
  }

  pieceSets.sort((a, b) => a.localeCompare(b));

  const manifest = {
    generatedAt: new Date().toISOString(),
    boards,
    pieceSets,
    pieceFilesBySet,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Asset manifest generated: ${outputPath}`);
  console.log(`Boards: ${boards.length}, Piece sets: ${pieceSets.length}`);
}

buildManifest().catch((error) => {
  console.error('Failed to generate asset manifest', error);
  process.exitCode = 1;
});
