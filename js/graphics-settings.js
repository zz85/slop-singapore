// js/graphics-settings.js
// The Graphics menu's settings. Tree detail: how far out the island's trees are drawn and how finely (js/city-tiles.js
// TREE_DETAIL), off / low / medium / high, kept in localStorage and overridable with ?trees=<level> in the URL.

const TREE_LEVELS = ['off', 'low', 'medium', 'high'];
const TREE_KEY = 'tree-detail';

/** The level to start at: the URL's, else the one saved, else `fallback` */
function initialTreeDetail({ search = '', storage = null, fallback = 'medium' } = {}) {
  const fromUrl = new URLSearchParams(search).get('trees');
  if (TREE_LEVELS.includes(fromUrl)) return fromUrl;
  let saved = null;
  try { saved = storage?.getItem(TREE_KEY); } catch { /* storage unavailable */ }
  return TREE_LEVELS.includes(saved) ? saved : fallback;
}

/**
 * Wires the tree-detail choices: `buttons` (each with data-trees="<level>", role="radio") call `apply(level)` when
 * picked, are marked (aria-checked, .active) and the level saved. -> { set(level), get() }
 */
function bindTreeDetail({ buttons, apply, storage = null, level = 'medium' }) {
  let current = null;
  const set = (next, save = true) => {
    if (!TREE_LEVELS.includes(next)) return false;
    current = next;
    apply(next);
    for (const b of buttons) {
      const on = b.dataset.trees === next;
      b.setAttribute('aria-checked', String(on));
      b.classList.toggle('active', on);
    }
    if (save) {
      try { storage?.setItem(TREE_KEY, next); } catch { /* storage unavailable */ }
    }
    return true;
  };
  for (const b of buttons) b.addEventListener('click', () => set(b.dataset.trees));
  set(level, false);
  return { set, get: () => current };
}

export { TREE_LEVELS, TREE_KEY, initialTreeDetail, bindTreeDetail };
