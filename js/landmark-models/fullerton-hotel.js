// The Fullerton Hotel (former General Post Office), OSM way 46595395.
// The five principal frontages and clipped corners follow the mapped site, in true east/south metres. The
// classical wings surround a lower glazed atrium; the colonnades, red dormer roofs and white hotel addition are
// separate geometry. Architectural proportions are estimated from the reference photographs, not a measured
// elevation survey. See docs/fullerton-hotel.md for sources and the conflicting mapped height tags.
export const info = { name: 'The Fullerton Hotel', height: 37 };

const C = {
  stone: 0xc7c4bb, base: 0xb3b0a7, trim: 0xe4e1d7, white: 0xf0eee6,
  roof: 0xa65340, roofEdge: 0x874536, glass: 0x435d5b, metal: 0xa1aaa5,
  atrium: 0x78928d, gold: 0xa58643, green: 0x647650, dark: 0x555b55, pool: 0x71aebc
};

// A compact letter stencil, merged into the same gold material as the door details. Contiguous pixels on each
// row become one strip, so the roof sign is geometry and needs neither a font download nor a canvas texture.
const LETTERS = {
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  H: ['10001','10001','10001','11111','10001','10001','10001'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  F: ['11111','10000','10000','11110','10000','10000','10000'],
  U: ['10001','10001','10001','10001','10001','10001','01110'],
  L: ['10000','10000','10000','10000','10000','10000','11111'],
  R: ['11110','10001','10001','11110','10100','10010','10001'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  N: ['10001','11001','11001','10101','10011','10011','10001']
};

export function build(kit, site) {
  const mapped = site.parts.find((p) => p.id === 46595395);
  if (!mapped?.ring?.length) throw new Error('Fullerton Hotel needs mapped way 46595395');
  const east = kit.compass(90), south = kit.compass(180);
  const project = ([x, z], axis) => x * axis[0] + z * axis[1];
  // Recover the reference drawing's origin from the surveyed footprint extrema; independent of the model anchor
  // and of the city's grid bearing. The drawing uses lon 103.85306, lat 1.28623 as its approximate origin.
  const ox = Math.min(...mapped.ring.map((p) => project(p, east))) + 38.75;
  const oz = Math.min(...mapped.ring.map((p) => project(p, south))) + 62.01;
  const P = (u, v) => [east[0] * (u + ox) + south[0] * (v + oz), east[1] * (u + ox) + south[1] * (v + oz)];
  const ring = (points) => points.map(([u, v]) => P(u, v));
  const M = Object.fromEntries(Object.entries(C).map(([k, color]) => [k, k === 'glass' || k === 'atrium' ? kit.glassMaterial(color) : kit.material(color)]));
  const core = ring([[-38.7,-13.7],[-7.9,-62.0],[19.0,-56.5],[19.0,51.9],[-6.6,66.1],[-38.5,0.8]]);
  const inner = kit.inset(core, 13.5);
  const recessed = kit.inset(core, 2.35);
  const attic = kit.inset(core, 6.1);
  const atticInner = kit.inset(core, 12.4);
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const strip = (a, b, i) => [a[i], a[(i + 1) % a.length], b[(i + 1) % b.length], b[i]];
  const collidable = (part) => { kit.collisionPrism(part); return part; };

  // One box in an edge's local frame: t along the face, n out of it. Positive depth puts decoration outside the
  // wall, with its rear against the wall. Every surface is separated by at least 2 cm to avoid z-fighting.
  function face(a, b) {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const tx = (b[0] - a[0]) / length, tz = (b[1] - a[1]) / length;
    const nx = tz, nz = -tx;
    const point = (s, n = 0) => [a[0] + tx * s + nx * n, a[1] + tz * s + nz * n];
    return { length, point, box(s, n, y, w, h, d, material, name) {
      const [x, z] = point(s, n);
      return kit.box({ x, z, y, w, h, d, yaw: Math.atan2(tz, tx), material, top: material, name });
    } };
  }

  function window(F, s, n, y, w, h, name, material = M.glass) {
    F.box(s, n, y, w + 0.28, h + 0.28, 0.16, M.trim, `${name}-surround`);
    F.box(s, n + 0.105, y + 0.14, w, h, 0.03, material, `${name}-glass`);
    F.box(s, n + 0.145, y + 0.14, 0.065, h, 0.035, M.white, `${name}-mullion`);
    F.box(s, n + 0.19, y + h * 0.55, w, 0.085, 0.045, M.white, `${name}-transom`);
    F.box(s, n + 0.22, y - 0.04, w + 0.52, 0.16, 0.42, M.trim, `${name}-sill`);
  }

  function cornice(y, height, out, inset, material, name) {
    for (let i = 0; i < core.length; i++) {
      const F = face(core[i], core[(i + 1) % core.length]);
      F.box(F.length / 2, (out - inset) / 2, y, F.length - 1.5, height, out + inset, material, `${name}-${i}`);
    }
  }

  // A low site plinth retains the entire mapped entrance outline, while the tall mass is a set of wings. Neither
  // their geometry nor their colliders fill the atrium with an invented full-height slab.
  kit.prism({ ring: mapped.ring, y0: -0.2, y1: 0.65, material: M.base, top: M.stone, name: 'mapped-plinth' });
  for (let i = 0; i < core.length; i++) {
    collidable(kit.prism({ ring: strip(core, inner, i), y0: 0.65, y1: 4.1, material: M.base, top: M.base, name: `rusticated-base-${i}` }));
    collidable(kit.prism({ ring: strip(recessed, inner, i), y0: 4.1, y1: 21.65, material: M.stone, top: M.stone, name: `recessed-wing-${i}` }));
    collidable(kit.prism({ ring: strip(core, inner, i), y0: 21.65, y1: 23.35, material: M.trim, top: M.trim, name: `entablature-${i}` }));
    collidable(kit.prism({ ring: strip(attic, atticInner, i), y0: 26.5, y1: 33.3, material: M.white, top: M.metal, name: `setback-hotel-${i}` }));

    const F = face(core[i], core[(i + 1) % core.length]);
    if (F.length < 12) continue;
    const bays = Math.max(2, Math.floor((F.length - 4) / 5.15));
    const spacing = (F.length - 4) / bays;
    for (let j = 0; j <= bays; j++) {
      const s = 2 + j * spacing;
      const [x, z] = F.point(s, 0.55);
      kit.cylinder({ x, z, y0: 4.1, y1: 4.55, r: 0.96, segments: 12, material: M.base, top: M.base, name: `column-${i}-${j}-plinth` });
      collidable(kit.cylinder({ x, z, y0: 4.55, y1: 20.65, r: 0.68, segments: 16, material: M.stone, top: M.stone, name: `column-${i}-${j}-shaft` }));
      kit.cylinder({ x, z, y0: 20.65, y1: 21.05, r: 0.87, segments: 12, material: M.trim, top: M.trim, name: `column-${i}-${j}-capital` });
      F.box(s, 0.55, 21.05, 1.95, 0.6, 1.95, M.trim, `column-${i}-${j}-abacus`);
    }
    for (let j = 0; j < bays; j++) {
      const s = 2 + (j + 0.5) * spacing;
      if (i !== 2 || s < 28 || s > 78) window(F, s, 0.08, 1.0, 1.8, 2.5, `base-window-${i}-${j}`);
      for (const [floor, y] of [[0,5.0],[1,10.0],[2,15.0]]) window(F, s, -2.24, y, 2.05, 4.0, `heritage-window-${i}-${j}-${floor}`);
      // Projecting stone balcony rail at the top of the colonnade, with small repeating balusters.
      F.box(s, 0.35, 23.35, spacing - 0.12, 0.22, 0.8, M.trim, `balcony-floor-${i}-${j}`);
      F.box(s, 0.68, 24.35, spacing - 0.16, 0.2, 0.32, M.trim, `balcony-rail-${i}-${j}`);
      for (let k = 0; k < 4; k++) F.box(s + (k - 1.5) * (spacing - 0.6) / 4, 0.68, 23.57, 0.18, 0.78, 0.22, M.white, `baluster-${i}-${j}-${k}`);
    }

    // The red roof slopes up toward the two-storey white hotel addition. Dormer panes are raised clear of the
    // slope; their stone cheeks and small red caps give the roof its recognisable sawtooth rhythm.
    const R = strip(core, attic, i);
    const origin = F.point(0), insetPoint = attic[i];
    const depth = Math.abs((insetPoint[0] - origin[0]) * (F.point(0,1)[0] - origin[0]) + (insetPoint[1] - origin[1]) * (F.point(0,1)[1] - origin[1]));
    const outward = [F.point(0,1)[0] - origin[0], F.point(0,1)[1] - origin[1]];
    const roofTop = (x, z) => 24.0 - 4.1 * ((x - origin[0]) * outward[0] + (z - origin[1]) * outward[1]) / depth;
    collidable(kit.prism({ ring: R, y0: 23.6, y1: roofTop, material: M.roof, top: M.roof, name: `terracotta-roof-${i}` }));
    for (let j = 0; j < bays; j++) {
      const s = 2 + (j + 0.5) * spacing;
      window(F, s, -1.3, 25.15, 1.8, 2.15, `dormer-${i}-${j}`);
      F.box(s, -1.3, 27.48, 2.45, 0.17, 1.0, M.roofEdge, `dormer-cap-${i}-${j}`);
    }

    const A = face(attic[i], attic[(i + 1) % attic.length]);
    const atticBays = Math.max(1, Math.floor(A.length / 3.8));
    for (let j = 0; j < atticBays; j++) {
      const s = (j + 0.5) * A.length / atticBays;
      window(A, s, 0.1, 28.5, 1.6, 3.35, `attic-window-${i}-${j}`);
      A.box(s, 0.22, 32.35, 2.0, 0.12, 0.18, M.trim, `attic-lintel-${i}-${j}`);
    }
    A.box(A.length / 2, 0.0, 33.3, A.length - 1.5, 0.55, 0.7, M.white, `attic-cornice-${i}`);
    // Inner walls and a low glass atrium, visible from above, without an exposed void through the ground.
    const I = face(inner[(i + 1) % inner.length], inner[i]);
    const innerBays = Math.max(1, Math.floor(I.length / 4.2));
    for (let j = 0; j < innerBays; j++) for (const [f, y] of [[0,23.9],[1,28.2]]) {
      window(I, (j + 0.5) * I.length / innerBays, 0.06, y, 1.65, 3.2, `atrium-window-${i}-${j}-${f}`);
    }
  }
  cornice(3.85, 0.29, 0.4, 0.15, M.trim, 'base-stringcourse');
  cornice(21.85, 0.22, 0.65, 0.1, M.stone, 'architrave');
  cornice(22.8, 0.3, 0.9, 0.1, M.trim, 'dentil-cornice');
  collidable(kit.prism({ ring: kit.inset(inner, 0.15), y0: 22.15, y1: 22.45, material: M.atrium, top: M.atrium, name: 'atrium-skylight' }));
  const centre = inner.reduce(([x,z], p) => [x+p[0]/inner.length,z+p[1]/inner.length],[0,0]);
  for (let i = 0; i < inner.length; i++) {
    const end = mix(inner[i], inner[(i+1)%inner.length], 0.5);
    const F = face(centre, end);
    F.box(F.length/2 + 0.6, 0, 22.47, F.length - 1.6, 0.12, 0.12, M.metal, `skylight-rib-${i}`);
  }

  // The bowed low entrance/pool-side extension follows the eastward bulge of the mapped footprint rather than
  // extending the tall hotel block over it. Its glazing and white cornice stay below the historic colonnade.
  const bow = ring([[19,-25],[27,-25],[27,-21],[35,-21],[39,-15],[40,-6],[39,5],[35,15],[27,15],[27,20],[19,20]]);
  collidable(kit.prism({ ring: bow, y0: 0.65, y1: 8.1, material: M.glass, top: M.atrium, name: 'bowed-glazed-extension' }));
  kit.prism({ ring: kit.inset(bow,-0.25), y0: 8.15, y1: 8.7, material: M.trim, top: M.trim, name: 'bowed-extension-cornice' });
  for (let i=0; i+1<bow.length; i++) {
    const F=face(bow[i],bow[i+1]), n=Math.max(1,Math.ceil(F.length/3));
    for(let j=0;j<n;j++) F.box((j+0.5)*F.length/n,0.12,0.8,0.16,7.25,0.25,M.white,`extension-frame-${i}-${j}`);
    F.box(F.length/2,0.32,4.25,Math.max(0.2,F.length-1),0.2,0.3,M.trim,`extension-transom-${i}`);
  }

  // A shallow porte-cochere on the pointed city-facing frontage, with open clearance underneath.
  const west = face(core[5],core[0]);
  collidable(west.box(west.length/2,3.0,4.8,11.5,0.38,5.6,M.atrium,'entrance-glass-canopy'));
  west.box(west.length/2,5.9,4.6,12,0.45,0.3,M.trim,'entrance-canopy-edge');
  for(const side of [-1,1]) west.box(west.length/2+side*5.4,5.8,0.7,0.3,3.9,0.3,M.metal,`entrance-post-${side}`);

  // The river-side multipolygon 4039936 is the low pool terrace, not a randomly tall office building. Its outer
  // and inner rings guide the deck and 25 m pool, with an estimated level-2 terrace height from the hotel photo.
  const terrace = ring([[-34.53,-20.26],[-47.74,-27.98],[-20.65,-60.32],[-13.55,-55.68],[-19.09,-46.30]]);
  const pool = ring([[-39.22,-35.10],[-32.92,-31.04],[-19.79,-52.88],[-22.99,-54.46]]);
  collidable(kit.prism({ring:terrace,y0:0,y1:4.45,material:M.base,top:M.trim,name:'river-pool-terrace'}));
  collidable(kit.prism({ring:pool,y0:4.48,y1:4.59,material:M.pool,top:M.pool,name:'infinity-pool-water'}));
  const riverEdge = face(terrace[1],terrace[2]);
  riverEdge.box(riverEdge.length/2,0.0,4.46,riverEdge.length-0.3,0.65,0.48,M.trim,'pool-river-parapet');
  const poolSide = face(pool[0],pool[3]);
  for(let i=0;i<4;i++) {
    const s=(i+0.5)*poolSide.length/4, [x,z]=poolSide.point(s,1.8);
    collidable(kit.cylinder({x,z,y0:4.46,y1:6.8,r:0.055,segments:6,material:M.metal,top:M.metal,name:`pool-parasol-pole-${i}`}));
    kit.loft({ring:Array.from({length:8},(_,k)=>[x+Math.cos(k*Math.PI/4)*1.6,z+Math.sin(k*Math.PI/4)*1.6]),y0:6.8,y1:7.5,scale:0.03,material:M.white,top:M.white,name:`pool-parasol-${i}`});
    poolSide.box(s,1.1,4.6,1.7,0.32,0.7,M.white,`pool-lounger-${i}`);
  }

  // Gold roof lettering on the long bay-facing facade.
  const front=face(attic[2],attic[3]);
  const text='THE FULLERTON HOTEL', pixel=0.27, advance=6*pixel;
  let cursor=(front.length-text.length*advance)/2;
  for(const [letterIndex,letter] of [...text].entries()) {
    const rows=LETTERS[letter];
    if(rows) for(let row=0;row<7;row++) {
      for(const match of rows[row].matchAll(/1+/g)) {
        const width=match[0].length*pixel;
        front.box(front.length-cursor-match.index*pixel-width/2,0.45,34.0+(6-row)*pixel,width,0.23,0.12,M.gold,`roof-letter-${letterIndex}-${row}-${match.index}`);
      }
    }
    cursor+=advance;
  }

  // Rooftop Lighthouse pavilion and a modest flagpole: simplified architectural details, not an extra tower.
  // The mapped 30–36 m rooftop part places this by the centre of the signed facade, not at the west corner.
  // Its short link meets the east wing while leaving the north and south atrium bays open.
  collidable(kit.prism({ring:ring([[-9.5,-5.6],[12.8,-5.6],[12.8,5.6],[-9.5,5.6]]),y0:30,y1:33.2,material:M.glass,top:M.glass,name:'lighthouse-rooftop-link'}));
  collidable(kit.prism({ring:ring([[-9.7,-5.8],[12.95,-5.8],[12.95,5.8],[-9.7,5.8]]),y0:33.25,y1:33.8,material:M.white,top:M.white,name:'lighthouse-link-roof'}));
  const [lx,lz]=P(-4,0);
  collidable(kit.cylinder({x:lx,z:lz,y0:33.8,y1:34.3,r:5.2,segments:8,material:M.trim,top:M.trim,name:'lighthouse-deck'}));
  collidable(kit.cylinder({x:lx,z:lz,y0:34.3,y1:37.0,r:4.55,segments:8,material:M.glass,top:M.white,name:'lighthouse-pavilion'}));
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    kit.box({x:lx+Math.cos(a)*4.68,z:lz+Math.sin(a)*4.68,y:34.3,w:0.18,h:2.74,d:0.18,material:M.white,top:M.white,name:`pavilion-mullion-${i}`});
  }
  kit.loft({ring:Array.from({length:8},(_,i)=>[lx+Math.cos(i*Math.PI/4)*5.4,lz+Math.sin(i*Math.PI/4)*5.4]),y0:37.05,y1:38.5,scale:0.08,material:M.white,top:M.white,name:'pavilion-canopy'});
  const [fx,fz]=P(-31,-5);
  kit.cylinder({x:fx,z:fz,y0:33.9,y1:43,r:0.09,segments:6,material:M.metal,top:M.metal,name:'flagpole'});
  // Red and white halves, in the same low-poly convention as the rest of the city.
  const flag=face([fx,fz],[fx+east[0]*2.1,fz+east[1]*2.1]);
  flag.box(1.05,0,41.5,2.1,0.6,0.035,M.roof,'flag-red');
  flag.box(1.05,0,40.9,2.1,0.6,0.035,M.white,'flag-white');
}
