// Museum of Shadows — hand-in program (Node 22, standard library only).
// Copies game/ and screenshots/ into the output directory and writes
// dossier.json with buildDossier from the kit's vendor copy, exactly
// the dossier the gate rebuilds and compares byte for byte.
// Run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (Outside the grader MAKEFUN_OUTPUT_DIR stands in for /output.)
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await cp(path.join(repoRoot, "game"), path.join(outputDir, "game"), {
  recursive: true,
});
await cp(path.join(repoRoot, "screenshots"), path.join(outputDir, "screenshots"), {
  recursive: true,
});

const dossier = await buildDossier(repoRoot, { text_max_bytes: 163840 });
await writeFile(path.join(outputDir, "dossier.json"), dossier);

console.log(`wrote ${outputDir}/dossier.json (${dossier.length} bytes)`);
