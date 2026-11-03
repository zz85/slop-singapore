// js/building-info.js
// Click a building, and a card beside it says what it is, as tinywarsaw.app's does: its name, its address (else the
// streets it is near) and its coordinates. The names & addresses are OpenStreetMap's (js/<city>-building-info.js,
// tools/city/build.mjs), loaded once the city is up; a landmark gives the config's name and its address. Which
// building was clicked is js/building-picker.js's to say (main.js puts the two together).

/** INFO (tools/city/build.mjs) as a lookup: { count, byIndex: building index → { name, street, number, postcode }, sites } */
function decodeBuildingInfo(INFO) {
  const byIndex = new Map();
  const s = (k) => (k ? INFO.strings[k - 1] : '');
  let index = 0;
  for (let i = 0; i + 4 < INFO.data.length; i += 5) {
    index += INFO.data[i];
    byIndex.set(index, { name: s(INFO.data[i + 1]), street: s(INFO.data[i + 2]), number: s(INFO.data[i + 3]), postcode: s(INFO.data[i + 4]) });
  }
  return { count: INFO.buildings, byIndex, sites: INFO.sites || {} };
}

/** An address as Singapore writes it: the house number before the street, the postcode after the city ("80 Raffles
 * Place, Singapore 048624"); '' without a street */
function formatAddress({ street = '', number = '', postcode = '' } = {}, city = '') {
  if (!street) return '';
  const line = number ? `${number} ${street}` : street;
  return postcode ? `${line}, ${city ? `${city} ` : ''}${postcode}` : line;
}

/** The card's rows, [label, value, kind]: the name, the address (else the streets it is near), the coordinates */
function describeBuilding({ info = null, near = '', lon, lat, city = '' }) {
  const rows = [];
  if (info?.name) rows.push(['Name', info.name, 'name']);
  const address = formatAddress(info || {}, city);
  if (address) rows.push(['Address', address, 'address']);
  else if (near) rows.push(['Near', near, 'address']);
  rows.push(['Coordinates', `${lat.toFixed(5)}, ${lon.toFixed(5)}`, 'coords']);
  return rows;
}

/**
 * The card on the page: a click or a tap on the canvas (one that does not drag the view) asks pickAt(clientX, clientY)
 * for { rows, point } (null: nothing there, and the card goes); update() each frame keeps the card beside its point
 * as the view moves (project(point): { x, y, visible } in CSS pixels). Returns { update, hide, get visible }.
 */
function bindBuildingInfo({ canvas, card, pickAt, project, doc = document, win = window }) {
  let point = null;
  let down = null;
  const pointers = new Set();
  const OFFSET = 14;

  function hide() {
    point = null;
    card.hidden = true;
  }

  function show(rows, at) {
    point = at;
    card.replaceChildren(...rows.map(([label, value, kind]) => {
      const row = doc.createElement('div');
      row.className = `bi-row bi-${kind}`;
      const l = doc.createElement('span');
      l.className = 'bi-label';
      l.textContent = label;
      const v = doc.createElement('span');
      v.className = 'bi-value';
      v.textContent = value;
      row.append(l, v);
      return row;
    }));
    card.hidden = false;
    update();
  }

  function update() {
    if (!point) return;
    const p = project(point);
    card.style.visibility = p.visible ? '' : 'hidden';
    if (!p.visible) return;
    // beside the point, below and to the right; turned the other way near the right or bottom edge
    const w = card.offsetWidth, h = card.offsetHeight;
    const x = p.x + OFFSET + w > win.innerWidth - 8 ? p.x - OFFSET - w : p.x + OFFSET;
    const y = p.y + OFFSET + h > win.innerHeight - 8 ? p.y - OFFSET - h : p.y + OFFSET;
    card.style.transform = `translate(${Math.round(Math.max(8, x))}px, ${Math.round(Math.max(8, y))}px)`;
  }

  canvas.addEventListener('pointerdown', (e) => {
    pointers.add(e.pointerId);
    down = pointers.size === 1 && e.button === 0 ? { id: e.pointerId, x: e.clientX, y: e.clientY, at: e.timeStamp } : null;
  });
  const lift = (e) => {
    pointers.delete(e.pointerId);
    const d = down;
    down = null;
    // (a click: not a drag of the view, a pinch, a long press, nor in the jet's cockpit with the mouse captured)
    if (!d || d.id !== e.pointerId || e.type !== 'pointerup' || doc.pointerLockElement) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || e.timeStamp - d.at > 700) return;
    const found = pickAt(e.clientX, e.clientY);
    if (found) show(found.rows, found.point);
    else hide();
  };
  canvas.addEventListener('pointerup', lift);
  canvas.addEventListener('pointercancel', lift);
  hide();
  return { update, hide, get visible() { return !!point; } };
}

export { decodeBuildingInfo, formatAddress, describeBuilding, bindBuildingInfo };
