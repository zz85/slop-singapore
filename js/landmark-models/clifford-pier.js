// SG-035: the restored passenger hall, not the adjacent Fullerton Bay Hotel/link.
// Mapped plan and photographic elevation estimates: docs/clifford-pier.md.
export const info = { name: 'Clifford Pier', height: 11.7 };

export function build(kit, site) {
  const hall = site.parts.find(p => p.id === 407926383);
  const deck = site.parts.find(p => p.id === 986973999);
  if (!hall?.ring?.length || !deck?.ring?.length) throw new Error('Clifford Pier needs its mapped hall and deck');
  const U = kit.compass(92.8), V = kit.compass(182.8);
  const centre = hall.ring.reduce((a,p) => [a[0]+p[0]/hall.ring.length,a[1]+p[1]/hall.ring.length],[0,0]);
  const P = (u,v) => [centre[0]+u*U[0]+v*V[0],centre[1]+u*U[1]+v*V[1]];
  const yaw = Math.atan2(U[1],U[0]);
  const M = { wall:kit.material(0xd6d2bf), trim:kit.material(0xf0ecdc), band:kit.material(0x96998c),
    roof:kit.material(0xa74e3d), tile:kit.material(0xb65b48), glass:kit.glassMaterial(0x5b7676),
    frame:kit.material(0x5f6c68), deck:kit.material(0xa4a08d), red:kit.material(0xab3d31) };
  const B = (u,v,y,w,h,d,m,name,collision=false) => {
    const [x,z]=P(u,v), part=kit.box({x,z,y,w,h,d,yaw,material:m,top:m,name});
    if(collision)kit.collisionPrism(part);
    return part;
  };
  const beam = (u0,v0,y0,u1,v1,y1,w,h,m,name,collision=false) => {
    const a=P(u0,v0),b=P(u1,v1);
    const part=kit.beam({from:[a[0],y0,a[1]],to:[b[0],y1,b[1]],w,h,material:m,name});
    if(collision) {
      // Facade arches lie in a constant-u vertical plane. Small boxes follow each concrete segment,
      // including its depth, without inserting a full-height collider across the doorway below.
      const dv=v1-v0,dy=y1-y0,pad=Math.abs(dy)/Math.hypot(dv,dy)*h/2;
      kit.collisionPrism({ring:rect(u0,(v0+v1)/2,w,Math.abs(dv)+2*pad),y0:part.bounds.minY,y1:part.bounds.maxY});
    }
    return part;
  };
  const rect = (u,v,w,d) => [[u-w/2,v-d/2],[u+w/2,v-d/2],[u+w/2,v+d/2],[u-w/2,v+d/2]].map(p=>P(...p));

  // The enclosing OSM part is a deck only. Its irregular north projection and eastern walk stay low.
  kit.prism({ring:deck.ring,y0:0,y1:0.22,material:M.deck,top:M.deck,name:'mapped-pier-deck'});
  B(0,0,0.23,66.1,0.12,18.8,M.wall,'passenger-hall-floor');
  // The conditioned dining room has recessed glass walls, with doors at the western and eastern ends.
  for(const side of [-1,1]) {
    B(0,side*9.15,0.35,65.1,7.0,0.12,M.glass,`recessed-hall-glass-${side}`,true);
    B(0,side*9.28,4.57,66.4,0.34,0.3,M.trim,`hall-entablature-${side}`);
    B(0,side*12.05,4.78,67.3,0.24,4.8,M.band,`veranda-roof-${side}`,true);
    B(0,side*14.43,4.79,67.5,0.35,0.18,M.trim,`veranda-fascia-${side}`);
    for(let i=0;i<11;i++) {
      const u=-32.5+i*6.5;
      B(u,side*9.3,0.25,0.65,7.3,0.65,M.wall,`hall-side-pier-${side}-${i}`,true);
      B(u,side*13.7,0.25,0.55,4.5,0.55,M.trim,`arcade-column-${side}-${i}`,true);
      B(u,side*13.7,0.3,0.8,0.28,0.8,M.wall,`arcade-base-${side}-${i}`);
      B(u,side*13.7,4.3,0.85,0.4,0.78,M.trim,`arcade-capital-${side}-${i}`);
      beam(u,side*9.5,4.55,u,side*14.3,4.72,0.16,0.2,M.frame,`veranda-rafter-${side}-${i}`);
      if(i<10) {
        // Shallow open arches frame the outdoor walk, without filling its bays.
        const c=u+3.25;
        for(let j=0;j<10;j++) {
          const a=Math.PI*j/10,b=Math.PI*(j+1)/10;
          beam(c+2.94*Math.cos(a),side*13.7,3.5+0.92*Math.sin(a),
            c+2.94*Math.cos(b),side*13.7,3.5+0.92*Math.sin(b),0.3,0.22,M.trim,`arcade-arch-${side}-${i}-${j}`);
        }
      }
    }
  }
  // Ten concrete ribbon trusses span the hall; the centre is genuinely column-free.
  for(let i=0;i<10;i++) {
    const u=-29.4+i*6.53;
    for(let j=0;j<20;j++) {
      const a=Math.PI*j/20,b=Math.PI*(j+1)/20;
      beam(u,9.15*Math.cos(a),4.5+5.6*Math.sin(a),u,9.15*Math.cos(b),4.5+5.6*Math.sin(b),
        0.38,0.32,M.trim,`hall-rib-${i}-${j}`);
    }
  }
  // Thin sloped slabs, rather than a solid wedge with a flat underside hiding the trusses.
  for(const side of [-1,1]) {
    beam(0,side*10.5,7.65,0,0,11.15,67.4,0.2,M.roof,`gable-slope-${side}`);
    for(let u=-33.3;u<=33.3;u+=0.68)beam(u,side*10.48,7.78,u,side*0.08,11.24,0.035,0.035,M.tile,`roof-tile-seam-${side}-${u}`);
    // Conservative 0.25 m strips stay beneath each slope and keep doorways open below 7.4 m.
    for(let j=0;j<42;j++) {
      const v=(j+0.5)*0.25,top=11.15-(j+1)*0.25/10.5*3.5;
      kit.collisionPrism({ring:rect(0,side*v,67.3,0.25),y0:7.4,y1:top});
    }
    B(0,side*10.53,7.48,67.65,0.25,0.23,M.trim,`gable-eave-${side}`);
  }
  B(0,0,11.12,67.6,0.23,0.22,M.roof,'ridge-cap');

  // The west street entrance is a stepped Art Deco screen with three real arch openings.
  for(const v of [-9.8,-3.3,3.3,9.8]) {
    B(-39.4,v,0.25,3.1,6.4,1.15,M.wall,`portal-pier-${v}`,true);
    for(const y of [0.8,2.0,3.2,4.4,5.6])B(-41,v,y,0.15,0.12,1.25,M.band,`portal-course-${v}-${y}`);
  }
  for(const v of [-6.6,0,6.6])for(let j=0;j<18;j++) {
    const a=Math.PI*j/18,b=Math.PI*(j+1)/18;
    beam(-39.6,v+2.65*Math.cos(a),3.2+2.65*Math.sin(a),-39.6,v+2.65*Math.cos(b),3.2+2.65*Math.sin(b),
      2.9,0.48,M.trim,`portal-arch-${v}-${j}`,true);
  }
  for(const [w,y,h]of [[22,6.2,1.2],[16,7.43,1.0],[10,8.46,1.1],[6.3,9.6,1.1],[4.4,10.73,0.97]])
    B(-39.3,0,y,3.4,h,w,M.wall,`portal-stepped-crown-${y}`,true);
  for(const y of [6.4,7.6,8.7,9.9])B(-41.05,0,y,0.16,0.14,Math.max(5,24-y*1.65),M.band,`portal-crown-band-${y}`);
  const [sx,sz]=P(-41.13,0);
  kit.sign({x:sx,z:sz,y:6.75,text:'CLIFFORD PIER',height:0.66,maxWidth:12,yaw:kit.yawToward(272.8),bar:false,color:0x405951,name:'pier-name'});
  // East end's open frame and lantern recall the historic landing point.
  for(const v of [-9.5,9.5])B(34.3,v,0.25,0.7,7.2,0.7,M.trim,`east-end-pier-${v}`,true);
  beam(34.3,-10,7.6,34.3,0,11.1,0.35,0.35,M.trim,'east-gable-north');
  beam(34.3,0,11.1,34.3,10,7.6,0.35,0.35,M.trim,'east-gable-south');
  // Two halves put a real vertex at the ridge; a four-corner rectangle would flatten this gable.
  for(const side of [-1,1])kit.prism({ring:rect(33.4,side*5.1,0.35,10.2),y0:7.42,
    y1:(x,z)=>7.6+3.4*(1-Math.abs((x-centre[0])*V[0]+(z-centre[1])*V[1])/10.2),
    material:M.trim,top:M.trim,name:`east-gable-attic-${side}`});
  for(const v of [-9.8,-3.3,3.3,9.8])B(33.45,v,0.25,0.75,6.12,1.0,M.trim,`east-arch-pier-${v}`,true);
  for(const v of [-6.6,0,6.6])for(let j=0;j<16;j++) {
    const a=Math.PI*j/16,b=Math.PI*(j+1)/16;
    beam(33.45,v+2.65*Math.cos(a),3.5+2.65*Math.sin(a),33.45,v+2.65*Math.cos(b),3.5+2.65*Math.sin(b),
      0.75,0.35,M.trim,`east-arch-${v}-${j}`,true);
  }
  B(33.45,0,6.37,0.76,1.01,20.7,M.trim,'east-arch-cornice',true);
  B(37.5,0,4.1,0.5,0.7,0.5,M.red,'red-landing-lantern');
}
