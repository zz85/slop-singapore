// js/place-search.js
// The top bar's search, as tinywarsaw.app's "Where to?": the city's places, its modelled landmarks and its streets by
// name; picking one flies the map view there (main.js)

const KIND_ORDER = { place: 0, landmark: 1, street: 2 };

/**
 * What can be searched for: one entry per place (GEO.places), modelled landmark (GEO.landmarks) and street name
 * (ROADS), the first of a name kept. Each is { kind, name, sub, x, z, distance }: where the map view looks and from how
 * far (a landmark taken in whole, a street's whole length)
 */
function placeEntries({ places, landmarks, roads } = {}) {
  const entries = [];
  const seen = new Set();
  const add = (entry) => {
    const lower = String(entry.name || '').toLowerCase();
    if (!lower || seen.has(lower) || !Number.isFinite(entry.x) || !Number.isFinite(entry.z)) return;
    seen.add(lower);
    entries.push({ ...entry, lower });
  };
  // (only lists: New York's geodata keeps its landmarks by name, and has no places)
  const list = (v) => (Array.isArray(v) ? v : []);
  for (const p of list(places)) add({ kind: 'place', name: p.name, sub: p.sub || p.district || 'Place', x: p.x, z: p.z, distance: 900 });
  for (const l of list(landmarks)) {
    const tall = Math.max(0, ...(l.parts || []).map((p) => p.height || 0));
    add({ kind: 'landmark', name: l.name, sub: 'Landmark', x: l.x, z: l.z, distance: Math.max(350, tall * 2.4) });
  }
  // a street: the middle of all its stretches, far enough to take them in
  const streets = new Map();
  for (const r of list(roads)) {
    if (!r.name || !r.pts?.length) continue;
    let b = streets.get(r.name);
    if (!b) streets.set(r.name, (b = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }));
    for (const p of r.pts) {
      b.minX = Math.min(b.minX, p.x); b.maxX = Math.max(b.maxX, p.x);
      b.minZ = Math.min(b.minZ, p.z); b.maxZ = Math.max(b.maxZ, p.z);
    }
  }
  for (const [name, b] of streets) {
    const extent = Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
    add({ kind: 'street', name, sub: 'Street', x: (b.minX + b.maxX) / 2, z: (b.minZ + b.maxZ) / 2, distance: Math.min(2400, Math.max(350, extent * 1.1)) });
  }
  return entries;
}

/**
 * The entries whose name holds `query` (case and extra spaces do not matter), best first: a name that starts with it,
 * then one with a word that does, then any; places before landmarks before streets, then the shorter name; at most
 * `limit`
 */
function rankPlaces(query, entries, limit = 8) {
  const q = String(query || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!q) return [];
  const scored = [];
  for (const e of entries) {
    const name = e.lower || e.name.toLowerCase();
    const at = name.indexOf(q);
    if (at < 0) continue;
    const rank = at === 0 ? 0 : /[\s\-'(/]/.test(name[at - 1]) ? 1 : 2;
    scored.push({ e, key: rank * 10 + (KIND_ORDER[e.kind] ?? 3), len: name.length });
  }
  scored.sort((a, b) => a.key - b.key || a.len - b.len || a.e.name.localeCompare(b.e.name));
  return scored.slice(0, limit).map((s) => s.e);
}

/**
 * The search field and its list as a combobox: typing lists the matches, the arrows move through them, Enter or a
 * click picks one (onPick(entry)), Escape empties the field and leaves it; "/" anywhere else puts the cursor in it
 */
function bindPlaceSearch({ input, list, entries, onPick, limit = 8, doc = document }) {
  if (!input || !list) return { close() {} };
  let shown = [];
  let current = -1;
  const optionId = (k) => `${list.id}-${k}`;

  function close() {
    shown = [];
    current = -1;
    list.replaceChildren();
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function highlight(k) {
    current = k;
    list.querySelectorAll('[role="option"]').forEach((opt, i) => opt.setAttribute('aria-selected', String(i === k)));
    if (k >= 0) input.setAttribute('aria-activedescendant', optionId(k));
    else input.removeAttribute('aria-activedescendant');
  }

  function render() {
    shown = rankPlaces(input.value, entries, limit);
    current = -1;
    if (!input.value.trim()) return close();
    const items = shown.map((entry, k) => {
      const li = doc.createElement('li');
      li.id = optionId(k);
      li.className = 'search-option';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.dataset.kind = entry.kind;
      const name = doc.createElement('span');
      name.className = 'search-name';
      name.textContent = entry.name;
      const sub = doc.createElement('span');
      sub.className = 'search-sub';
      sub.textContent = entry.sub;
      li.append(name, sub);
      // (on press, so the field keeps its focus until the pick)
      li.addEventListener('pointerdown', (e) => e.preventDefault());
      li.addEventListener('click', () => pick(k));
      return li;
    });
    if (!items.length) {
      const li = doc.createElement('li');
      li.className = 'search-empty';
      li.textContent = 'Nothing here by that name';
      items.push(li);
    }
    list.replaceChildren(...items);
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    input.removeAttribute('aria-activedescendant');
  }

  function pick(k) {
    const entry = shown[k];
    if (!entry) return;
    input.value = entry.name;
    close();
    input.blur();
    onPick(entry);
  }

  input.addEventListener('input', render);
  input.addEventListener('focus', () => { if (input.value.trim()) render(); });
  input.addEventListener('blur', close);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!shown.length) return;
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      highlight((current + step + shown.length) % shown.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(current >= 0 ? current : 0);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      input.value = '';
      close();
      input.blur();
    }
    // (the HUD's shortcut keys stay out of the field)
    e.stopPropagation();
  });
  doc.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''))) return;
    e.preventDefault();
    input.focus();
    input.select?.();
  });
  close();
  return { close, render };
}

export { placeEntries, rankPlaces, bindPlaceSearch };
