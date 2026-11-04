const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const html = readFileSync(join(__dirname, '../index.html'), 'utf8');
const importMap = html.match(/<script type="importmap">([^]*?)<\/script>/);
const preloads = [...html.matchAll(/<link rel="modulepreload" href="([^"]+)"\s*\/>/g)];
const entries = [...html.matchAll(/<script type="module" src="([^"]+)"><\/script>/g)];

test('city module preloads start after the import map and before stylesheets', () => {
  assert.ok(importMap);
  assert.ok(preloads.length > 0);
  const stylesheetIndex = html.indexOf('rel="stylesheet"');
  for (const preload of preloads) {
    assert.ok(importMap.index < preload.index);
    assert.ok(preload.index < stylesheetIndex);
  }
  assert.equal(entries.length, 1);
  assert.ok(importMap.index < entries[0].index);
  assert.ok(entries[0].index < stylesheetIndex, 'the module graph starts loading early too');
  assert.match(html, /<link rel="preconnect" href="https:\/\/cdn\.jsdelivr\.net" crossorigin\s*\/>/);
  const { imports } = JSON.parse(importMap[1]);
  assert.equal(imports.three, imports['three/webgpu'], 'Three.js aliases share one module instance');
});

test('three.js preloads from the import map\'s own URLs, before the city modules', () => {
  const { imports } = JSON.parse(importMap[1]);
  const three = [...html.matchAll(/<link rel="modulepreload" href="(https:[^"]+)" crossorigin\s*\/>/g)];
  const core = new URL('three.core.js', imports['three/webgpu']).href;
  assert.deepEqual(three.map((m) => m[1]).sort(), [imports['three/webgpu'], imports['three/tsl'], core].sort());
  for (const m of three) assert.ok(importMap.index < m.index && m.index < preloads[0].index);
});

test('native module entry and imports share canonical preloaded URLs on GitHub Pages', () => {
  const links = preloads.map((match) => match[1]);
  assert.equal(links.length, 71);
  assert.equal(new Set(links).size, links.length, 'each module is preloaded once');
  assert.equal(entries.length, 1);
  assert.equal(entries[0][1], './js/main.js');
  assert.ok(links.includes(entries[0][1]));
  assert.equal([...html.matchAll(/<script\b/g)].length, 2, 'only the import map and native entry are needed');
  const base = 'https://example.test/slop-newyork/';
  const urls = new Set(links.map((src) => new URL(src, base).href));
  for (const src of links) {
    assert.match(src, /^\.\/js\/[\w-]+\.js$/, 'preloads use the same unversioned paths as native imports');
    const source = readFileSync(join(__dirname, '..', src), 'utf8');
    for (const [, specifier] of source.matchAll(/(?:\bfrom\s*|\bimport\s*)['"](\.[^'"]+)['"]/g)) {
      const url = new URL(specifier, new URL(src, base));
      assert.ok(urls.has(url.href), `${src} imports an unpreloaded or mismatched URL: ${specifier}`);
    }
  }
});
