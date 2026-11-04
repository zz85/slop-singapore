// js/landmark-logos.js
// Tenants' marks for the landmark kit's signs (`logo` in kit.sign and kit.hang): each { id, aspect (its width over its
// height), draw(ctx, x, y, w, h) } paints itself on a sign's canvas, filling that box. HSBC's hexagon and Standard
// Chartered's mark follow the public-domain drawings on Wikimedia Commons ("HSBC logo (2018).svg", "Standard Chartered
// Logo (2021, Logo only).svg"); DBS's and Apple's are simplified from photographs of their signs.

// a drawing in its own units, `units` of them as tall as the box
const into = (ctx, x, y, h, units) => { ctx.translate(x, y); ctx.scale(h / units, h / units); };
const fill = (ctx, colour, points) => {
  ctx.fillStyle = colour;
  ctx.beginPath();
  points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
  ctx.fill();
};

export const LOGOS = {
  // Simplified from the Singapore Land crown sign photographed by Lighting Planners Associates.
  'singapore-land': {
    id: 'singapore-land', aspect: 1.02,
    draw(ctx, x, y, w, h) {
      into(ctx, x, y, h, 100);
      fill(ctx, '#002d74', [[28, 17], [61, 0], [61, 68], [28, 51]]);
      fill(ctx, '#002d74', [[0, 49], [30, 34], [30, 88], [0, 100]]);
      fill(ctx, '#e6b467', [[67, 53], [102, 36], [102, 88], [67, 100]]);
    }
  },
  // The tiger roundel simplified from Maybank's yellow crown sign in Bob T's 2018 aerial photo.
  maybank: {
    id: 'maybank', aspect: 1,
    draw(ctx, x, y, w, h) {
      into(ctx, x, y, h, 100);
      ctx.fillStyle = '#201d18';
      ctx.fill(new Path2D('M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0Z M50 7A43 43 0 1 0 50 93A43 43 0 1 0 50 7Z'));
      fill(ctx, '#201d18', [[20, 36], [29, 22], [43, 25], [54, 17], [66, 24], [70, 36], [84, 47], [75, 55], [63, 54], [59, 61], [77, 64], [67, 74], [51, 74], [41, 85], [29, 74], [33, 62], [22, 55]]);
      fill(ctx, '#f6c745', [[44, 29], [61, 31], [67, 39], [54, 35], [50, 44], [39, 45]]);
      fill(ctx, '#f6c745', [[34, 50], [51, 48], [46, 55], [33, 60]]);
    }
  },
  // the hexagon: a white square between red triangles above and below its middle, and red points either side
  hsbc: {
    id: 'hsbc', aspect: 2,
    draw(ctx, x, y, w, h) {
      into(ctx, x, y, h, 85);
      fill(ctx, '#ffffff', [[42.5, 0], [127.5, 0], [127.5, 85], [42.5, 85]]);
      fill(ctx, '#db0011', [[42.5, 0], [127.5, 0], [85, 42.5]]);
      fill(ctx, '#db0011', [[42.5, 85], [127.5, 85], [85, 42.5]]);
      fill(ctx, '#db0011', [[42.5, 0], [0, 42.5], [42.5, 85]]);
      fill(ctx, '#db0011', [[127.5, 0], [170, 42.5], [127.5, 85]]);
    }
  },
  // a red square holding a white star of four points on its diagonals
  dbs: {
    id: 'dbs', aspect: 1,
    draw(ctx, x, y, w, h) {
      into(ctx, x, y, h, 100);
      fill(ctx, '#e1251b', [[0, 0], [100, 0], [100, 100], [0, 100]]);
      fill(ctx, '#ffffff', Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4 + Math.PI / 4, r = i % 2 ? 9 : 37;
        return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
      }));
    }
  },
  // two bands folded into an S, blue over green, each ending in a round tab behind the other
  'standard-chartered': {
    id: 'standard-chartered', aspect: 68.92 / 109.4,
    draw(ctx, x, y, w, h) {
      into(ctx, x, y, h, 109.4);
      ctx.fillStyle = '#38d200';
      ctx.fill(new Path2D('M53.51 107.79 7.63 77.92c0 0-5.75-3.31-7.07-9.47-1.85-8.65 4.25-16.07 4.25-16.07l59.54 38.78c4.59 2.99 5.85 9.12 2.89 13.74-3.03 4.75-9.27 5.79-13.74 2.89z'));
      ctx.fill(new Path2D('M57.26 22.17c-2.36 0-4.03.75-5.67 1.81l-12.24 7.97 12.24 7.97c1.65 1.06 3.38 1.81 5.67 1.81a9.78 9.78 0 1 0 0-19.56'));
      ctx.fillStyle = '#0473ea';
      ctx.fill(new Path2D('M10.05 45.98c0 0-7.03-4.24-7.03-14.06 0-9.78 7.02-13.97 7.02-13.97l25.08-16.41a9.93 9.93 0 0 1 10.82 16.65l-21.14 13.76 36.02 23.46c0 0 6.48 3.71 7.76 9.98 1.78 8.75-4.24 15.95-4.24 15.95zM9.92 109.37c2.35 0 4.03-.75 5.67-1.81l12.24-7.98-12.24-7.97c-1.65-1.06-3.38-1.81-5.67-1.81a9.78 9.78 0 1 0 0 19.56z'));
    }
  },
  // Keppel's name in white on a grey plate, a red stroke over the K: the public-domain drawing on Wikimedia Commons
  // ("Keppel Ltd logo.svg"), its paths rounded to a tenth; the plate darker than the drawing's grey, as it looks on Ocean
  // Financial Centre's crown
  keppel: {
    id: 'keppel', aspect: 501 / 167,
    draw(ctx, x, y, w, h) {
      into(ctx, x, y, h, 167);
      fill(ctx, '#55595c', [[0, 31], [501, 31], [501, 167], [0, 167]]);
      ctx.fillStyle = '#ffffff';
      ctx.fill(new Path2D('M443.8 46C452.4 46 461.1 46 469.7 46C469.8 75.7 469.7 105.3 469.8 135C461.1 135.1 452.4 135 443.8 135C443.8 105.3 443.8 75.7 443.8 46ZM32 47C40.3 47 48.5 47 56.8 47C56.8 60.2 56.7 73.3 56.8 86.5C67.1 73.4 77.1 60.1 87.3 46.8C96.6 46.7 106 46.7 115.4 46.9L115.8 46.9C105.8 60.2 95.8 73.7 85.7 87C95.3 103 105.1 118.8 114.7 134.7C105.5 134.7 96.3 134.8 87.1 134.7C85.7 134.9 85.2 133.3 84.5 132.5C75.5 117.4 66.3 102.3 57.1 87.2C56.3 103 57 118.9 56.7 134.7C48.5 134.8 40.3 134.8 32 134.8C32 105.5 32 76.3 32 47ZM131 75C144.8 65.7 164.7 65.9 178.2 75.9C188 83.5 192.5 96.5 191.8 108.6C175.5 108.4 159.1 108.5 142.8 108.6C143.1 114.1 146.9 119.4 152.5 120.6C157.4 122.1 162.9 119.7 165.3 115.3C173.5 115.2 181.7 115.3 189.9 115.3C187.9 123.9 180.9 130.7 172.8 133.7C162.8 137.4 151.7 137.9 141.5 135.4C133 133.2 125.2 127.8 121 120.1C113.2 105.3 116.8 84.7 131 75M142.8 95.2C150.6 95.3 158.4 95.3 166.2 95.2C165.7 88.5 158.9 82.9 152.2 84.4C146.7 84.9 142.9 89.9 142.8 95.2ZM238.9 68.7C247.9 67.1 257.9 70 264 77C270 83.8 272.4 93.1 272.3 102C272.5 110.5 270.6 119.4 265.3 126.2C259 134.4 248 138.1 237.9 136.6C233 135.8 228.8 132.7 225.5 129.1C225.5 138.4 225.6 147.7 225.5 157C216.9 157 208.3 157 199.8 157C199.8 128.1 199.7 99.2 199.8 70.3C207.5 70.3 215.3 70.2 223 70.3C222.9 73.3 222.9 76.3 223.3 79.3C226.3 73.4 232.5 69.8 238.9 68.7M232.2 88.2C227.6 90 225.6 95.3 225.2 100C224.8 105.1 225.6 110.8 229.4 114.7C233.4 118.6 240.7 117.4 243.7 112.7C247.2 107.2 247.2 100 245 94.1C243.2 89.1 237.2 86.2 232.2 88.2ZM304.2 79.2C311.4 66.7 329.8 65.3 340.8 73.2C349.5 79.5 353.3 90.6 353.3 101C353.6 109.1 352.2 117.6 347.5 124.5C341.3 134.1 328.9 138.6 318 136.4C313.3 135.5 309.6 132.4 306.5 129.1C306.6 138.4 306.5 147.7 306.5 156.9C297.9 157.1 289.4 157 280.8 157C280.8 128.1 280.7 99.2 280.8 70.3C288.5 70.2 296.2 70.3 304 70.2C304 73.2 303.9 76.2 304.2 79.2M313.3 88.1C308.3 90.1 306.3 96 306.2 101C306 106.2 307 112.3 311.5 115.5C315.9 118.6 322.6 116.7 325.1 112.1C328.2 106.6 328.1 99.8 326 94.1C324.2 89.1 318.3 86.2 313.3 88.1ZM369.7 78.7C378.3 70.1 391.1 67.1 402.9 68.7C411.3 69.6 419.6 73.4 425.3 79.7C432.4 87.4 435.4 98.2 434.9 108.6C418.6 108.5 402.2 108.4 385.8 108.6C386.3 114 389.7 119.3 395.2 120.5C400.3 122.2 405.8 119.8 408.4 115.3C416.6 115.3 424.8 115.2 433.1 115.3C431.2 122.1 426.7 128.1 420.4 131.5C410.3 137 398.1 138 386.9 135.9C376.3 133.9 366.4 126.9 362.5 116.7C357.9 104 359.9 88.4 369.7 78.7M394.5 84.6C389.3 85.3 386.1 90.2 385.8 95.2C393.6 95.3 401.4 95.3 409.2 95.2C408.9 88.1 401.4 82.6 394.5 84.6Z'));
      ctx.fillStyle = '#55595c';
      ctx.fill(new Path2D('M142.8 95.2C142.9 89.9 146.7 84.9 152.2 84.4C158.9 82.9 165.7 88.5 166.2 95.2C158.4 95.3 150.6 95.3 142.8 95.2ZM394.5 84.6C401.4 82.6 408.9 88.1 409.2 95.2C401.4 95.3 393.6 95.3 385.8 95.2C386.1 90.2 389.3 85.3 394.5 84.6ZM232.2 88.2C237.2 86.2 243.2 89.1 245 94.1C247.2 100 247.2 107.2 243.7 112.7C240.7 117.4 233.4 118.6 229.4 114.7C225.6 110.8 224.8 105.1 225.2 100C225.6 95.3 227.6 90 232.2 88.2ZM313.3 88.1C318.3 86.2 324.2 89.1 326 94.1C328.1 99.8 328.2 106.6 325.1 112.1C322.6 116.7 315.9 118.6 311.5 115.5C307 112.3 306 106.2 306.2 101C306.3 96 308.3 90.1 313.3 88.1Z'));
      ctx.fillStyle = '#c8102e';
      ctx.fill(new Path2D('M127.6 31C135.4 20.9 143.2 10.7 151.1 0.5C160.4 0.5 169.6 0.5 178.9 0.5C171.3 10.7 163.6 20.8 156 31C151.9 36.3 148.2 41.9 143.7 46.9C134.5 47.2 125.1 47 115.8 46.9L115.4 46.9C119.5 41.6 123.5 36.3 127.6 31Z'));
    }
  },
  // OCBC's mark: a red disc with a round hole set up and to the right of its middle, its left part cut into the slats
  // of a junk's sail fanning round the hole. Simplified from photographs of the signs on OCBC Centre (its crown, 2023;
  // the banking hall's wall, 2006); the slats are separate pieces, so the wall shows between them as it does on the
  // building
  ocbc: {
    id: 'ocbc', aspect: 1,
    draw(ctx, x, y, w, h) {
      into(ctx, x, y, h, 100);
      // a piece of the ring between two angles (degrees, counter-clockwise from the right): out along the rim, back
      // along the hole's edge
      const piece = (a0, a1) => {
        const n = Math.max(2, Math.ceil((a1 - a0) / 6)), pts = [];
        for (let k = 0; k <= n; k++) { const a = ((a0 + ((a1 - a0) * k) / n) * Math.PI) / 180; pts.push([50 + 49.5 * Math.cos(a), 50 - 49.5 * Math.sin(a)]); }
        for (let k = n; k >= 0; k--) { const a = ((a0 + ((a1 - a0) * k) / n) * Math.PI) / 180; pts.push([56 + 23 * Math.cos(a), 47 - 23 * Math.sin(a)]); }
        return pts;
      };
      fill(ctx, '#e01f26', piece(-100, 102));
      for (const [a0, a1] of [[106, 133], [137, 164], [168, 195], [199, 226], [230, 256]]) fill(ctx, '#e01f26', piece(a0, a1));
    }
  },
  // Apple's bitten apple with its leaf, in white as the shore signpost of Apple Marina Bay Sands carries it:
  // simplified from photographs of that signpost and of the mark on the dome's glass (2020 press views)
  apple: {
    id: 'apple', aspect: 0.82,
    draw(ctx, x, y, w, h) {
      into(ctx, x, y, h, 100);
      fill(ctx, '#ffffff', [[41, 33], [33, 26], [22, 26], [14, 33], [8, 45], [6, 60], [9, 75], [14, 87], [20, 94], [27, 98], [34, 96], [41, 95], [48, 96], [55, 98], [62, 94], [68, 86], [71, 79], [66, 72], [60, 64], [59, 55], [62, 47], [66, 42], [58, 35], [50, 31], [45, 31]]);
      fill(ctx, '#ffffff', Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2, ex = 13 * Math.cos(a), ey = 6 * Math.sin(a), r = -0.42;
        return [54 + ex * Math.cos(r) - ey * Math.sin(r), 16 + ex * Math.sin(r) + ey * Math.cos(r)];
      }));
    }
  },
  // Deutsche Bank's slash in a square, in its blue: the public-domain drawing on Wikimedia Commons ("Deutsche Bank logo
  // without wordmark.svg", a 148-unit square framed 21 units thick round a slash from lower left to upper right), the
  // frame drawn as four bars; as it hangs right of the bank's name on One Raffles Quay's podium
  'deutsche-bank': {
    id: 'deutsche-bank', aspect: 1,
    draw(ctx, x, y, w, h) {
      into(ctx, x, y, h, 148);
      for (const bar of [[[0, 0], [148, 0], [148, 21], [0, 21]], [[0, 127], [148, 127], [148, 148], [0, 148]], [[0, 21], [21, 21], [21, 127], [0, 127]], [[127, 21], [148, 21], [148, 127], [127, 127]]]) fill(ctx, '#0018a8', bar);
      fill(ctx, '#0018a8', [[89, 36], [116, 36], [60, 113], [33, 113]]);
    }
  },
  // Singlife's mark: a ring of sixteen white blades swirling out round a wide open middle, as it is painted on the red
  // banner on 18 Robinson's podium. Simplified from photographs of that banner (Mx. Granger, Wikimedia Commons, 11 March
  // 2024), as no drawing is published there; white only, so it stands on the banner's own red
  singlife: {
    id: 'singlife', aspect: 1,
    draw(ctx, x, y, w, h) {
      into(ctx, x, y, h, 100);
      // each blade a band 7 units wide along a curve from radius 23 to 48, turning 30° as it goes out
      for (let k = 0; k < 16; k++) {
        const a0 = (k * 2 * Math.PI) / 16, edge = (side) => Array.from({ length: 7 }, (_, i) => {
          const s = side > 0 ? i / 6 : 1 - i / 6, r = 23 + 25 * s, a = a0 + 0.52 * s + (side * 3.5) / r;
          return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
        });
        fill(ctx, '#ffffff', [...edge(-1), ...edge(1)]);
      }
    }
  },
  // IOI's mark as it hangs on IOI Central Boulevard Towers' West Tower crown: a blue globe crossed by a white band, then
  // "IOI" in white serif capitals standing off the louvres, their shadows dark beside them. Simplified from the owner's
  // photograph of the crown (IOI Properties Singapore, ioiproperties.com.sg masthead), as no drawing is published on
  // Wikimedia Commons; the band's small lettering is left out
  ioi: {
    id: 'ioi', aspect: 2.95,
    draw(ctx, x, y, w, h) {
      into(ctx, x, y, h, 100);
      const ellipse = (cx, cy, rx, ry, n = 36, dir = 1) => Array.from({ length: n }, (_, i) => { const a = (dir * i * 2 * Math.PI) / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
      fill(ctx, '#2f3f9a', ellipse(50, 50, 48, 48));
      fill(ctx, '#ffffff', [...Array.from({ length: 13 }, (_, i) => [14 + 6 * i, 50 - 13 * Math.sqrt(Math.sin((Math.PI * i) / 12))]), ...Array.from({ length: 11 }, (_, i) => [80 - 6 * i, 50 + 13 * Math.sqrt(Math.sin((Math.PI * (i + 1)) / 12))])]);
      // a serif I from x0; an O as a ring (its outer and inner edges run opposite ways, joined at a seam)
      const letterI = (x0, d) => [[0, 16], [36, 16], [36, 23], [26, 23], [26, 77], [36, 77], [36, 84], [0, 84], [0, 77], [10, 77], [10, 23], [0, 23]].map(([px, py]) => [x0 + px + d, py + d]);
      const letterO = (d) => { const outer = ellipse(196 + d, 50 + d, 34, 34, 40), inner = ellipse(196 + d, 50 + d, 18, 26, 40, -1); return [...outer, outer[0], ...inner, inner[0]]; };
      for (const [colour, d] of [['#2b3036', 2.5], ['#f2f4f6', 0]]) {
        fill(ctx, colour, letterI(106, d));
        fill(ctx, colour, letterO(d));
        fill(ctx, colour, letterI(250, d));
      }
    }
  },
  // GuocoLand's red mark as it hangs near the top of Guoco Tower's south face: three red bands stacked a little apart,
  // their left ends rounding along one circle and their right ends square, so that together they make a disc's left half
  // joined to a square's right. Simplified from photographs of the crown (Bjoertvedt, 10 November 2018; Chainwit., 2
  // March 2025; Wikimedia Commons), as no drawing of the mark is published there
  guocoland: {
    id: 'guocoland', aspect: 1,
    draw(ctx, x, y, w, h) {
      into(ctx, x, y, h, 100);
      for (const [top, bottom] of [[4, 29], [37.5, 62.5], [71, 96]]) {
        const arc = Array.from({ length: 9 }, (_, i) => { const py = bottom - ((bottom - top) * i) / 8; return [50 - Math.sqrt(Math.max(0, 48 * 48 - (py - 50) ** 2)), py]; });
        fill(ctx, '#d2232a', [...arc, [96, top], [96, bottom]]);
      }
    }
  },
  // The Monetary Authority of Singapore's crest as it hangs over the MAS Building's entrance on Shenton Way: a gold
  // medallion on a tall navy panel, the panel's frame and a ring in the medallion. Simplified from Timothy Tye's
  // photograph of 27 July 2017 (penang-traveltips.com), as no drawing of the crest is published on Wikimedia Commons;
  // the crest's own figure is too small there to draw and is left out
  mas: {
    id: 'mas', aspect: 0.6,
    draw(ctx, x, y, w, h) {
      into(ctx, x, y, h, 100);
      const circle = (cx, cy, r, n = 36) => Array.from({ length: n }, (_, i) => { const a = (i * 2 * Math.PI) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
      fill(ctx, '#1b2238', [[0, 0], [60, 0], [60, 100], [0, 100]]);
      fill(ctx, '#c9a24b', circle(30, 46, 22));
      fill(ctx, '#1b2238', circle(30, 46, 16));
      fill(ctx, '#c9a24b', circle(30, 46, 13));
    }
  }
};
