// tools/build-site.mjs — copies what the page loads (index.html, css/, js/, tiles/) into dist/, the folder wrangler.jsonc
// serves as Workers static assets at tinysingapore.tradelabs.cc; the rest (tools/data, docs, tests) stays out of the upload
// usage: node tools/build-site.mjs [--commit <sha>]   (--commit writes dist/deployment.json for the deploy check)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const SITE = ['index.html', 'css', 'js', 'tiles'];
// dotfiles stay out: .DS_Store, and the scratch module the tile-worker test writes into js/ while it runs
const keep = (src) => !path.basename(src).startsWith('.');

fs.rmSync(dist, { recursive: true, force: true });
for (const entry of SITE) fs.cpSync(path.join(root, entry), path.join(dist, entry), { recursive: true, filter: keep });

const commit = process.argv.includes('--commit') ? process.argv[process.argv.indexOf('--commit') + 1] : null;
if (commit) fs.writeFileSync(path.join(dist, 'deployment.json'), JSON.stringify({ commit }) + '\n');

let files = 0, bytes = 0;
const walk = (dir) => {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p);
    else { files++; bytes += fs.statSync(p).size; }
  }
};
walk(dist);
console.log(`dist/: ${files} files, ${(bytes / 1048576).toFixed(1)} MB`);
