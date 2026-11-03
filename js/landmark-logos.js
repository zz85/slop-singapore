// js/landmark-logos.js
// Tenants' marks for the landmark kit's signs (`logo` in kit.sign and kit.hang): each { id, aspect (its width over its
// height), draw(ctx, x, y, w, h) } paints itself on a sign's canvas, filling that box. HSBC's hexagon and Standard
// Chartered's mark follow the public-domain drawings on Wikimedia Commons ("HSBC logo (2018).svg", "Standard Chartered
// Logo (2021, Logo only).svg"); DBS's is simplified from photographs of its signs, as none is published there.

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
  }
};
