// js/landmark-models/sgx-centre.js
// SGX Centre (SG-063), 2 & 4 Shenton Way: SGX Centre One (2000) and SGX Centre Two (2001), built as the Unity Towers and
// renamed for the Singapore Exchange (Kohn Pedersen Fox with Architects 61; 29 storeys each). OSM ways 47345025 (SGX
// Centre One, the north-north-east tower toward Lau Pa Sat), 47345024 (SGX Centre Two, toward McCallum Street) and
// 45098518 (the site: the three-storey podium, the forecourts at both ends). Robinson Point, The Ogilvy Centre (SO/
// Sofitel), Robinson Centre and One Shenton across the road stay the city's.
// Twin towers, mirror images of each other about the podium between them. Each is a slab 30 m across Shenton Way and
// 47 m along it: the glass face toward Shenton Way (and the bay) curves back toward the tower's outer end and wraps
// round it, pale silvery glass between close white fins, a faint band every two storeys, over a colonnade of round
// columns, under a thin dark roof slab that overhangs it and slopes down from 172.8 m over the inner end to about 153 m
// over the outer end, with a recessed dark top storey under it. Toward Boon Tat Link and toward the other tower the walls are stone frames round
// bays of blue glass crossed by white sunshade blades every two storeys; the outer corner toward Boon Tat Link is
// notched. Over each inner end a stone portal rises 15 m past the roof to 187.3 m, the top storeys and the sky seen
// through a tall opening in it, a lattice mast up its south-east post to about 196 m; beside it a stone pier. Between
// the towers the podium: three storeys of stone and windows over a colonnade on Shenton Way. At the north end a drop-off
// canopy on columns and a raised lawn with the black SGX letters; at the south end a paved forecourt. The name SGX
// CENTRE 1 on One's fascia; no crown signs (the AVIVA sign of 2006–2012 is not known to be there today).
// Heights: 187.3 m CTBUH's architectural height (and Emporis'), to the portals' tops; the roof 172.8 m (Emporis' roof
// height: its high end); the roof's low end, the portal's opening, the masts (~196.5 m), the podium and colonnade
// estimated from photographs (Terence Ong 2006, Nicolas Lannuzel 2012, Timothy Tye 2011 and 2017) scaled by those
// heights. See docs/sgx-centre.md.
export const info = { name: 'SGX Centre', height: 187 };

const ID = { site: 45098518, one: 47345025, two: 47345024 };
const ACROSS = 121.8, ALONG = 211.8; // toward Shenton Way; along it toward McCallum Street (SGX Centre Two's end)
// heights (m): the roof's high end (where the slab meets the portal) and its low end over the outer face; the portal's
// top, its foot over the inner face's bay (the opening's sill) and its lintel's underside; the masts' tips; the
// colonnade under the towers and the fascia over it; the recessed top storey's depth under the roof line and the slab's
// thickness; the stone band along the Boon Tat Link wall's top and its parapet; the pier beside the portal; the podium
// and its colonnade; the drop-off canopy
const H = {
  roofIn: 172.8, roofOut: 153, top: 187.3, portal: 161.5, lintel: 177.8, mast: 196.5,
  colonnade: 12.6, fascia: 14.4, loggia: 4.6, slab: 0.9, band: 9.5, parapet: 1.5, pier: 177,
  podium: 16, podiumColonnade: 5.5, dropOff: [8.3, 8.9]
};
const FIN = { first: 22, step: 9.2, out: 1.5, thick: 0.35 }; // sunshade blades every two 4.6 m storeys
const OVERHANG = 2.4, COLONNADE = 3.5, LOGGIA_IN = 1.2;
// colours from daylight photographs (Tye 2011/2017, Lannuzel 2012, Ong 2006): the pale warm grey stone; the Shenton Way
// face's pale silvery blue-green glass between close white fins, a soft grey band every two storeys; the stone faces'
// bays of bluer, darker glass in grey mullions and their white blades; the dark recessed top storey and the dark roof slab, pale on top with dark wells; the lobbies' dark
// glass; the podium's stone and windows; granite paving, the lawn, the SGX letters' black, the tower's name in grey
const C = {
  stone: 0xd6d1c7, glass: 0xa2b9c6, fin: 0xdde0de, band: 0xd0d6d9, bayGlass: 0x6d8aa2, bayFrame: 0x9aa9b3, white: 0xe4e5e2,
  loggia: 0x2b3338, loggiaPost: 0x9aa1a5, slab: 0x3b4147, roofTop: 0xd2d2cc, roofWell: 0x7a8287,
  lobby: 0x2c3a43, lobbyFrame: 0x7e878c, podiumWindow: 0x41545f, paving: 0xc6c0b6, leaf: 0x4f7d3a, letters: 0x1d1f21, name: 0x4b4c4f
};

// The part of a ring where p·d is at least t (or, `below`, at most t): one side of a straight cut
function cut(ring, [dx, dz], t, below = false) {
  const s = ([x, z]) => (below ? t - (x * dx + z * dz) : x * dx + z * dz - t);
  const out = [];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length], sa = s(a), sb = s(b);
    if (sa >= 0) out.push(a);
    if ((sa >= 0) !== (sb >= 0)) { const k = sa / (sa - sb); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); }
  });
  return out.filter((p, i) => { const q = out[(i + 1) % out.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.05; });
}

// A tower's plan read off its mapped ring, in its own frame: b across the site (toward Shenton Way), a along it from the
// inner end (the face toward the other tower) to the outer end. bW, bE the Boon Tat Link and Shenton Way walls; the
// stone pier at the inner end from bW to bP, standing aIn2 proud of the rest of the inner face; the Shenton Way wall
// straight to aArc, then curving back to bOut on the outer face at aOut; the notch at the outer Boon Tat Link corner
// from bW to bN, from aN to the outer face
function planOf(ring, s, dot, U, V) {
  const pts = ring.map((p) => [dot(p, U), dot(p, V)]);
  const vs = pts.map((p) => p[1]), vIn = s > 0 ? Math.min(...vs) : Math.max(...vs);
  const loc = pts.map(([u, v]) => [u, s * (v - vIn)]);
  const bs = loc.map((p) => p[0]), as = loc.map((p) => p[1]);
  const bW = Math.min(...bs), bE = Math.max(...bs), aOut = Math.max(...as);
  const inner = loc.filter((p) => p[1] < 8), outer = loc.filter((p) => p[1] > aOut - 1.2);
  return {
    vIn, bW, bE, aOut,
    aIn2: inner.reduce((m, p) => (p[0] > m[0] ? p : m))[1],
    bP: Math.max(...loc.filter((p) => p[1] < 1).map((p) => p[0])),
    aArc: Math.max(...loc.filter((p) => p[0] > bE - 0.6).map((p) => p[1])),
    bOut: Math.max(...outer.map((p) => p[0])), bN: Math.min(...outer.map((p) => p[0])),
    aN: Math.max(...loc.filter((p) => p[0] < bW + 1).map((p) => p[1]))
  };
}

export function build(kit, site) {
  const mapped = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`SGX Centre needs mapped way ${id}`);
    return p.ring;
  };
  const M = {
    // the Shenton Way faces: pale glass between close white fins 1.2 m apart, nothing across them (the pattern's one
    // horizontal line, every 200 m, falls below the office floors); the two-storey bands are thin beams
    glassFace: kit.facadeMaterial({ wall: C.fin, window: C.glass, floorHeight: 200, bayWidth: 1.2, windowWidth: 0.66, pattern: 'strips' }),
    // the bays in the stone faces: bluer glass in fine grey mullions and transoms, two panes to a storey
    bay: kit.facadeMaterial({ wall: C.bayFrame, window: C.bayGlass, floorHeight: 2.3, bayWidth: 1.6, windowWidth: 0.9, pattern: 'strips' }),
    // the recessed top storey: dark glass behind pale posts
    loggia: kit.facadeMaterial({ wall: C.loggiaPost, window: C.loggia, floorHeight: 4.6, bayWidth: 2.4, windowWidth: 0.8, pattern: 'strips' }),
    // the roof slab's top: pale, with a grid of dark wells (as the aerial shows it)
    roofTop: kit.facadeMaterial({ wall: C.roofTop, window: C.roofWell, floorHeight: 6.5, bayWidth: 6.5, windowWidth: 0.5, windowHeight: 0.45, pattern: 'punched' }),
    lobby: kit.facadeMaterial({ wall: C.lobbyFrame, window: C.lobby, floorHeight: 4.2, bayWidth: 2.4, pattern: 'curtain' }),
    podium: kit.facadeMaterial({ wall: C.stone, window: C.podiumWindow, floorHeight: 5.25, bayWidth: 3.6, windowWidth: 0.62, windowHeight: 0.5, pattern: 'punched' }),
    stone: kit.material(C.stone, { roughness: 0.85 }), slab: kit.material(C.slab, { roughness: 0.6, metalness: 0.2 }),
    white: kit.material(C.white, { roughness: 0.5, metalness: 0.2 }), band: kit.material(C.band, { roughness: 0.5, metalness: 0.2 }), paving: kit.material(C.paving), leaf: kit.material(C.leaf)
  };

  // --- the drawing: u across the site toward Shenton Way, v along it toward McCallum Street ---------------------------------
  const U = kit.compass(ACROSS), V = kit.compass(ALONG);
  const dot = (p, d) => p[0] * d[0] + p[1] * d[1];
  const P = (u, v) => [U[0] * u + V[0] * v, U[1] * u + V[1] * v];
  const siteRing = mapped(ID.site);
  const su = siteRing.map((p) => dot(p, U)), sv = siteRing.map((p) => dot(p, V));
  // the site's long sides (the mean of each side's two corners) and its ends
  const sorted = [...su].sort((a, b) => a - b), uW = (sorted[0] + sorted[1]) / 2, uE = (sorted[2] + sorted[3]) / 2;
  const vN = Math.min(...sv), vS = Math.max(...sv);
  const rectUV = (u0, v0, u1, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];

  // paving over the whole site, a little past its edge, above the city's lawn
  kit.prism({ ring: kit.inset(siteRing, -0.25), y0: 0, y1: 0.32, material: M.paving, top: M.paving, name: 'base-paving' });

  // --- the towers -------------------------------------------------------------------------------------------------------
  const towers = {};
  for (const [t, id, s] of [['one', ID.one, -1], ['two', ID.two, 1]]) {
    const T = planOf(mapped(id), s, dot, U, V);
    const { vIn, bW, bE, aOut, aIn2, bP, aArc, bOut, bN, aN } = T;
    towers[t] = T;
    const L = (b, a) => P(b, vIn + s * a);
    const ringL = (pts) => pts.map(([b, a]) => L(b, a));
    const rectL = (b0, a0, b1, a1) => ringL([[b0, a0], [b1, a0], [b1, a1], [b0, a1]]);
    const aOf = (x, z) => s * (x * V[0] + z * V[1] - vIn);
    // the roof's line: 172.8 m where the slab meets the back of the portal, falling straight to its low end over the
    // outer face
    const aRoof = aIn2 + 2.4, slope = (H.roofIn - H.roofOut) / (aOut - aRoof);
    const roof = (a) => H.roofIn - slope * (a - aRoof);
    const roofXZ = (d) => (x, z) => roof(aOf(x, z)) + d;
    // the Shenton Way wall curving back to the outer face: b = bE - k (a - aArc)², its outward normal
    const k = (bE - bOut) / (aOut - aArc) ** 2;
    const arcB = (a) => bE - k * (a - aArc) ** 2;
    const arcN = (a) => { const d = -2 * k * (a - aArc), n = Math.hypot(1, d); return [1 / n, -d / n]; };
    const ARC = Array.from({ length: 10 }, (_, i) => aArc + ((aOut - aArc) * (i + 1)) / 10);
    // the body's plan (the pier aside): the inner face, the Shenton Way wall and its curve, the outer face, the notch,
    // the Boon Tat Link wall
    const bodyL = [[bW, aIn2], [bE, aIn2], [bE, aArc], ...ARC.map((a) => [arcB(a), a]), [bN, aOut], [bN, aN], [bW, aN]];
    const body = ringL(bodyL);
    // the walls of the body's ring: the inner face and the Boon Tat Link wall are the stone faces' glass bays, the rest
    // the finned glass
    const stoneSide = (i) => i === 0 || i === bodyL.length - 1;

    // the colonnade: the lobby's dark glass stands back 3.5 m from the glass faces behind round columns, under the fascia
    const lobbyArc = ARC.filter((a) => a < aOut - COLONNADE - 0.5).map((a) => [arcB(a) - COLONNADE, a]);
    const lobby = ringL([[bW, aIn2], [bE - COLONNADE, aIn2], [bE - COLONNADE, aArc], ...lobbyArc, [arcB(aOut - COLONNADE) - COLONNADE, aOut - COLONNADE], [bN, aOut - COLONNADE], [bN, aN], [bW, aN]]);
    kit.prism({ ring: lobby, y0: 0, y1: H.colonnade + 0.02, material: M.lobby, top: M.stone, name: `${t}-lobby` });
    const columns = [];
    const straight = aArc - (aIn2 + 3.5), nS = Math.max(1, Math.round(straight / 6));
    for (let i = 0; i < nS; i++) columns.push([bE - 1.4, aIn2 + 3.5 + (straight * (i + 0.5)) / nS]);
    for (const f of [0.2, 0.4, 0.6, 0.8]) { const a = aArc + (aOut - aArc) * f, [nb, na] = arcN(a); columns.push([arcB(a) - 1.4 * nb, a - 1.4 * na]); }
    const outerRun = arcB(aOut) - 3 - (bN + 1.5), nO = Math.max(1, Math.round(outerRun / 5.5));
    for (let i = 0; i <= nO; i++) columns.push([arcB(aOut) - 3 - (outerRun * i) / nO, aOut - 1.4]);
    columns.forEach(([b, a], i) => { const [x, z] = L(b, a); kit.cylinder({ x, z, y0: 0, y1: H.colonnade + 0.02, r: 0.55, segments: 10, material: M.white, top: M.white, name: `${t}-column-${i}` }); });

    // the fascia over the colonnade, the office floors to the recessed top storey, the top storey, all solid
    kit.prism({ ring: body, y0: H.colonnade, y1: H.fascia, material: M.stone, top: M.stone, name: `${t}-fascia` });
    kit.prism({ ring: body, y0: H.fascia, y1: roofXZ(-H.loggia), material: M.glassFace, edgeMaterial: (i) => (stoneSide(i) ? M.bay : null), top: M.white, name: `${t}-body` });
    // the soft grey band every two storeys across the glass faces, at the blades' levels, under the sloping top
    for (let y = FIN.first, k = 0; y < H.roofIn; y += FIN.step, k++) {
      for (let i = 1; i + 1 < bodyL.length; i++) {
        const [p, q] = [bodyL[i], bodyL[i + 1]];
        if (Math.min(roof(p[1]), roof(q[1])) - H.loggia < y + 0.6) continue;
        const [px, pz] = L(...p), [qx, qz] = L(...q);
        kit.beam({ from: [px, y, pz], to: [qx, y, qz], w: 0.22, h: 0.45, material: M.band, name: `${t}-glass-band-${k}-${i}` });
      }
    }
    const loggia = kit.inset(body, LOGGIA_IN);
    kit.prism({ ring: loggia, y0: roof(aOut) - H.loggia - 1, y1: roofXZ(-H.slab + 0.05), material: M.loggia, top: M.slab, name: `${t}-loggia` });
    for (let a0 = aIn2; a0 < aOut - 0.01; a0 += 6) {
      const a1 = Math.min(aOut, a0 + 6), band = cut(cut(bodyL, [0, 1], a0), [0, 1], a1, true);
      if (band.length >= 3) kit.collisionPrism({ ring: ringL(band), y0: H.colonnade, y1: roof(a1) - H.slab });
    }

    // the roof slab: over the body, overhanging the glass faces and the notch, from the back of the portal (and of the
    // pier) to past the outer face; cut into slices along the tower so that it slopes, each slice's top the roof's
    // line and its underside under the slice's low end
    // (the offset curve's end carried on along its tangent to the outer face's offset line)
    const end = (() => {
      const [nb, na] = arcN(aOut), p = [arcB(aOut) + OVERHANG * nb, aOut + OVERHANG * na], db = -2 * k * (aOut - aArc);
      return [p[0] + db * (aOut + OVERHANG - p[1]), aOut + OVERHANG];
    })();
    const slabL = [[bW + 0.2, aIn2 + 0.5], [bP, aIn2 + 0.5], [bP, aRoof], [bE + OVERHANG, aRoof], [bE + OVERHANG, aArc],
      ...ARC.slice(0, -1).map((a) => { const [nb, na] = arcN(a); return [arcB(a) + OVERHANG * nb, a + OVERHANG * na]; }), end, [bW + 0.2, aOut + OVERHANG]];
    const SLICE = 1.5, a0s = aIn2 + 0.5, nSlices = Math.ceil((aOut + OVERHANG - a0s) / SLICE);
    for (let i = 0; i < nSlices; i++) {
      const a0 = a0s + ((aOut + OVERHANG - a0s) * i) / nSlices, a1 = a0s + ((aOut + OVERHANG - a0s) * (i + 1)) / nSlices;
      const piece = cut(cut(slabL, [0, 1], a0), [0, 1], a1, true);
      if (piece.length < 3) continue;
      const ring = ringL(piece), y0 = roof(a1) - H.slab;
      kit.prism({ ring, y0, y1: roofXZ(0), material: M.slab, top: M.roofTop, name: `${t}-canopy-${i}` });
      kit.collisionPrism({ ring, y0, y1: roof(a1) });
    }
    // its fascia: a dark band along the slab's free edges, sloping with it, over the slices' stepped undersides
    const rim = [...slabL.slice(3), [bW + 0.2, aN + 0.3]];
    for (let i = 0; i + 1 < rim.length; i++) {
      const [p, q] = [rim[i], rim[i + 1]], [px, pz] = L(...p), [qx, qz] = L(...q), FASCIA = 1.7;
      kit.beam({ from: [px, roof(p[1]) - FASCIA / 2, pz], to: [qx, roof(q[1]) - FASCIA / 2, qz], w: 0.3, h: FASCIA, material: M.slab, name: `${t}-rim-${i}` });
    }

    // --- the stone faces: the pier at the inner end of the Boon Tat Link wall, the band at its outer end, the stone band
    // along its top, the corner post and the portal on the inner face
    kit.prism({ ring: rectL(bW - 0.3, 0, bP, aIn2 + 0.5), y0: 0, y1: H.pier, material: M.stone, top: M.stone, name: `${t}-pier` });
    kit.prism({ ring: rectL(bW - 0.6, aN - 5, bW + 2, aN + 0.3), y0: 0, y1: roofXZ(H.parapet), material: M.stone, top: M.stone, name: `${t}-band-stone` });
    {
      const from = L(bW - 0.3, aIn2 + 0.2), to = L(bW - 0.3, aN - 4.8);
      const mid = (a) => roof(a) - H.band + (H.band + H.parapet) / 2;
      kit.beam({ from: [from[0], mid(aIn2 + 0.2), from[1]], to: [to[0], mid(aN - 4.8), to[1]], w: 1.2, h: H.band + H.parapet, material: M.stone, name: `${t}-band-top` });
    }
    // the portal: a stone frame over the inner face from the top of its bay to 187.3 m, its south-east post down to the
    // ground (the inner face's corner), its lintel 9.5 m deep; the opening in it 13.4 m wide and 16 m tall shows the
    // tower's top storeys and the roof slab behind it, and the sky over them (as photographed in 2006 and 2012)
    const pa0 = aIn2 - 0.6, pa1 = aRoof, base = H.portal;
    const [ob0, ob1] = [bE - 16.9, bE - 3.5];
    kit.prism({ ring: rectL(ob1, pa0, bE + 0.4, pa1), y0: 0, y1: H.top, material: M.stone, top: M.stone, name: `${t}-corner-post` });
    for (const [name, b0, b1, y0, y1] of [['portal-post', bP, ob0, base, H.top], ['portal-lintel', ob0, ob1, H.lintel, H.top]]) {
      const ring = rectL(b0, pa0, b1, pa1);
      kit.prism({ ring, y0, y1, material: M.stone, top: M.stone, name: `${t}-${name}` });
      kit.collisionPrism({ ring, y0, y1 });
    }
    // the lattice mast up the south-east post's face toward the other tower, from the portal's foot to past its top
    {
      const am = pa0 - 0.15, y0 = H.portal;
      const legs = [bE - 0.7, bE - 2.1].map((b) => L(b, am));
      legs.forEach(([x, z], i) => kit.beam({ from: [x, y0, z], to: [x, H.mast, z], w: 0.3, h: 0.3, material: M.white, name: `${t}-mast-leg-${i}` }));
      for (let y = y0 + 2, i = 0; y < H.mast - 1; y += 2.5, i++) kit.beam({ from: [legs[0][0], y, legs[0][1]], to: [legs[1][0], y, legs[1][1]], w: 0.15, h: 0.15, material: M.white, name: `${t}-mast-rung-${i}` });
    }

    // the sunshade blades, standing out past the stone frame: across the Boon Tat Link wall's bay from the pier, under the
    // stone band (shorter as the band slopes down); across the inner face's bay to the corner post, under the portal
    for (let y = FIN.first, i = 0; y < H.roofIn; y += FIN.step, i++) {
      const aMax = Math.min(aN - 4.6, aRoof + (H.roofIn - (y + FIN.thick + 0.6 + H.band)) / slope);
      if (aMax > 6) {
        const ring = rectL(bW - FIN.out, 0.3, bW + 0.1, aMax);
        kit.prism({ ring, y0: y, y1: y + FIN.thick, material: M.white, top: M.white, name: `${t}-fin-w-${i}` });
        kit.collisionPrism({ ring, y0: y, y1: y + FIN.thick });
      }
      if (y > H.podium + 2 && y + FIN.thick < base - 0.6) {
        const ring = rectL(bP - 0.1, aIn2 - FIN.out, bE + 0.2, aIn2 + 0.1);
        kit.prism({ ring, y0: y, y1: y + FIN.thick, material: M.white, top: M.white, name: `${t}-fin-i-${i}` });
        kit.collisionPrism({ ring, y0: y, y1: y + FIN.thick });
      }
    }
    T.body = body;
  }

  // --- the podium between the towers: a colonnade on Shenton Way under three storeys of stone and windows --------------
  const v1 = towers.one.vIn - towers.one.aIn2 - 0.4, v2 = towers.two.vIn + towers.two.aIn2 + 0.4;
  const pw = uW + 0.3, pe = uE - 0.3;
  kit.prism({ ring: rectUV(pw, v1, pe - 3, v2), y0: 0, y1: H.podiumColonnade + 0.02, material: M.lobby, top: M.stone, name: 'base-podium-shops' });
  const upper = rectUV(pw, v1, pe, v2);
  kit.prism({ ring: upper, y0: H.podiumColonnade, y1: H.podium, material: M.podium, name: 'base-podium' });
  kit.collisionPrism({ ring: upper, y0: H.podiumColonnade, y1: H.podium });
  for (let v = v1 + 3.75, i = 0; v < v2 - 2; v += 7.5, i++) {
    const [x, z] = P(pe - 1, v);
    kit.box({ x, z, y: 0, w: 0.8, h: H.podiumColonnade + 0.02, d: 0.8, yaw: Math.atan2(V[0], V[1]), material: M.stone, top: M.stone, name: `base-podium-column-${i}` });
  }

  // --- the north forecourt: the drop-off canopy on four columns, the raised lawn with the SGX letters and a tree --------
  const vOne = towers.one.vIn - towers.one.aOut; // SGX Centre One's outer face
  {
    const [d0, d1] = H.dropOff, canopy = rectUV(uW + 0.5, vN + 0.8, 2.5, vOne - 0.3);
    kit.prism({ ring: canopy, y0: d0, y1: d1, material: M.white, top: kit.roofMaterial(), name: 'base-canopy' });
    kit.collisionPrism({ ring: canopy, y0: d0, y1: d1 });
    kit.prism({ ring: rectUV(uW + 2.5, vN + 2, 0.5, vN + 3.6), y0: d1, y1: d1 + 0.25, material: M.white, top: M.bay, name: 'base-canopy-skylight' });
    [[uW + 2.2, vN + 2.4], [1, vN + 2.4], [uW + 2.2, vOne - 5], [1, vOne - 5]].forEach(([u, v], i) => {
      const [x, z] = P(u, v);
      kit.cylinder({ x, z, y0: 0, y1: d0 + 0.02, r: 0.45, segments: 10, material: M.white, top: M.white, name: `base-canopy-column-${i}` });
    });
    const plinth = rectUV(4, vN + 1, uE - 1, vOne - 6);
    kit.prism({ ring: plinth, y0: 0, y1: 0.9, material: M.stone, top: M.leaf, name: 'base-letters-plinth' });
    const [lx, lz] = P(8.8, vN + 6.5);
    kit.sign({ text: 'SGX', x: lx, z: lz, y: 0.9, yaw: kit.yawToward(76.8), height: 2.8, color: C.letters, font: '900 110px "Arial Black", Helvetica, Arial, sans-serif', name: 'sign:sgx-letters' });
    tree(uE - 2.8, vOne - 8.8, 0.9, 7.5, 2.6, 'base-lawn');
  }
  // the south forecourt: planters with trees along Shenton Way
  {
    const vTwo = towers.two.vIn + towers.two.aOut;
    for (const [k, u] of [[0, uE - 7], [1, uE - 2.2]]) {
      const v = (vTwo + vS) / 2 + 0.5;
      kit.prism({ ring: rectUV(u - 1.4, v - 1.4, u + 1.4, v + 1.4), y0: 0, y1: 0.8, material: M.stone, top: M.leaf, name: `base-planter-${k}` });
      tree(u, v, 0.8, 6.6 + 1.2 * k, 2.2, `base-south-${k}`);
    }
  }
  // the tower's name on the fascia over SGX Centre One's outer (north-north-east) face, toward Lau Pa Sat
  kit.hang({ ring: towers.one.body, top: H.fascia, toward: ALONG - 180, below: 0.35, out: 0.05, margin: 2, text: 'SGX CENTRE 1', height: 1.0, color: C.name, name: 'sign:sgx-centre-1' });

  // a tree: a trunk and a two-tier crown
  function tree(u, v, y, h, r, name) {
    const [x, z] = P(u, v), around = (rr) => Array.from({ length: 7 }, (_, i) => [x + Math.cos((i * 2 * Math.PI) / 7) * rr, z + Math.sin((i * 2 * Math.PI) / 7) * rr]);
    kit.cylinder({ x, z, y0: y, y1: y + h * 0.45, r: 0.18, segments: 5, material: M.stone, top: M.stone, name: `${name}-trunk` });
    kit.loft({ ring: around(r * 0.5), topRing: around(r), y0: y + h * 0.4, y1: y + h * 0.65, material: M.leaf, top: M.leaf, name: `${name}-tree-crown` });
    kit.loft({ ring: around(r), y0: y + h * 0.65, y1: y + h, scale: 0.35, material: M.leaf, top: M.leaf, name: `${name}-tree-crown-top` });
  }
}
