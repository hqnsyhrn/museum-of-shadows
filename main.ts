// Museum of Shadows — entrypoint for make.fun (program/v1).
// Copies game/ and screenshots/ into the output directory and writes
// dossier.json with buildDossier from vendor/makefun-game.ts.
// Standard library only; deterministic: two runs write the same bytes.

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyClean(source: string, target: string): void {
  rmSync(target, { recursive: true, force: true });
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true });
}

function main(): void {
  mkdirSync(outDir, { recursive: true });
  copyClean(join(repoRoot, 'game'), join(outDir, 'game'));
  copyClean(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 48 * 1024 * 1024,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
}

main();
