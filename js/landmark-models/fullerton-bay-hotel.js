// Fullerton Bay Hotel: mapped 25 m / six-storey block, its north link and photo-guided architecture.
// The glass corners incline outward; room balconies and copper dividers sit between them. Roof arrangement
// follows the aerial reference (pool north, bar canopy east, service core west). See docs/fullerton-bay-hotel.md.
export const info = { name: 'The Fullerton Bay Hotel', height: 25 };

const LETTERS = {
  A:['01110','10001','10001','11111','10001','10001','10001'],
  B:['11110','10001','10001','11110','10001','10001','11110'],
  Y:['10001','10001','01010','00100','00100','00100','00100'],
  T:['11111','00100','00100','00100','00100','00100','00100'],
  H:['10001','10001','10001','11111','10001','10001','10001'],
  E:['11111','10000','10000','11110','10000','10000','11111'],
  F:['11111','10000','10000','11110','10000','10000','10000'],
  U:['10001','10001','10001','10001','10001','10001','01110'],
  L:['10000','10000','10000','10000','10000','10000','11111'],
  R:['11110','10001','10001','11110','10100','10010','10001'],
  O:['01110','10001','10001','10001','10001','10001','01110'],
  N:['10001','11001','11001','10101','10011','10011','10001']
};

export function build(kit, site) {
  const main = site.parts.find((p) => p.id === 406900561);
  const link = site.parts.find((p) => p.id === 986973997);
  if (!main?.ring?.length || !link?.ring?.length) throw new Error('Fullerton Bay needs mapped main block and north link');
  const east = kit.compass(90);
  // A long east-going mapped edge sets the building axes (about 3 degrees off true east). Projecting extrema
  // recovers its actual rectangular centre, independently of the complete hotel's off-centre vertex mean.
  let edge = [0,0], longest = 0;
  for (let i=0;i<main.ring.length;i++) {
    const a=main.ring[i],b=main.ring[(i+1)%main.ring.length],v=[b[0]-a[0],b[1]-a[1]];
    const along=v[0]*east[0]+v[1]*east[1];
    if(Math.abs(along)>longest){longest=Math.abs(along);edge=along>0?v:v.map(x=>-x);}
  }
  const len=Math.hypot(...edge), E=edge.map(v=>v/len), S=[-E[1],E[0]];
  const projection=(p,a)=>p[0]*a[0]+p[1]*a[1];
  const us=main.ring.map(p=>projection(p,E)),vs=main.ring.map(p=>projection(p,S));
  const u0=(Math.min(...us)+Math.max(...us))/2,v0=(Math.min(...vs)+Math.max(...vs))/2;
  const W=Math.max(...us)-Math.min(...us),D=Math.max(...vs)-Math.min(...vs),hx=W/2,hz=D/2;
  const P=(u,v)=>[E[0]*(u+u0)+S[0]*(v+v0),E[1]*(u+u0)+S[1]*(v+v0)];
  const ring=pts=>pts.map(([u,v])=>P(u,v));
  const rect=(u,v,w,d)=>ring([[u-w/2,v-d/2],[u+w/2,v-d/2],[u+w/2,v+d/2],[u-w/2,v+d/2]]);
  const M={
    stone:kit.material(0xc7c2b5), trim:kit.material(0xdddcd0), frame:kit.material(0xafb9b8),
    glass:kit.glassMaterial(0x34718d), dark:kit.glassMaterial(0x294550), copper:kit.material(0xbd724b),
    copperLight:kit.material(0xd79361), wood:kit.material(0x85715e), roof:kit.material(0x555a53),
    pool:kit.glassMaterial(0x65adc1), green:kit.material(0x567748), fabric:kit.material(0xebe8db),
    gold:kit.material(0x9f8150)
  };
  const collidable=p=>{kit.collisionPrism(p);return p;};
  const box=(u,v,y,w,h,d,material,name)=>{
    const [x,z]=P(u,v);
    return kit.box({x,z,y,w,h,d,yaw:Math.atan2(E[1],E[0]),material,top:material,name});
  };
  const prism=(points,y0,y1,material,name)=>kit.prism({ring:points,y0,y1,material,top:material,name});
  function face(a,b){
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]),tx=(b[0]-a[0])/length,tz=(b[1]-a[1])/length;
    const point=(s,n=0)=>[a[0]+tx*s+tz*n,a[1]+tz*s-tx*n];
    return {length,point,box(s,n,y,w,h,d,material,name){const [x,z]=point(s,n);return kit.box({x,z,y,w,h,d,yaw:Math.atan2(tz,tx),material,top:material,name});}};
  }
  function rod(u,v,y,tu,tv,ty,width,material,name){
    return kit.loft({ring:rect(u,v,width,width),topRing:rect(tu,tv,width,width),y0:y,y1:ty,material,top:material,name});
  }

  // The low pier slab and hotel interior. The separate corner shells and outer balconies supply the architectural
  // depth; the ground core and explicit roof volumes keep its interior solid to cars and descending aircraft.
  collidable(prism(rect(0,0,W+1.5,D+1.5),-0.25,0.6,M.trim,'waterfront-podium'));
  collidable(prism(rect(0,0,W-4.8,D-4.8),0.65,24.45,M.dark,'guestroom-core'));
  const core=rect(0,0,W-4.8,D-4.8), outer=rect(0,0,W,D);
  const shiftAt=y=>2.2*(1-(y-0.65)/(25.08-0.65));
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const corner=[[hx,hz],[hx-7.2,hz],[hx-7.2,hz-0.18],[hx-0.18,hz-0.18],[hx-0.18,hz-7.2],[hx,hz-7.2]].map(([u,v])=>[u*sx,v*sz]);
    const lower=ring(corner.map(([u,v])=>[u-sx*2.2,v-sz*2.2])),upper=ring(corner);
    kit.loft({ring:lower,topRing:upper,y0:0.65,y1:25.08,material:M.glass,top:M.glass,name:`inclined-glass-${sx}-${sz}`});
    kit.collisionPrism({ring:upper,y0:0.65,y1:25.08});
    for(let k=0;k<=3;k++){
      const s=k*2.4;
      rod(sx*(hx-s-2.2),sz*(hz-2.12),0.65,sx*(hx-s),sz*(hz+0.08),25.24,0.11,M.frame,`glass-mullion-u-${sx}-${sz}-${k}`);
      if(k)rod(sx*(hx-2.12),sz*(hz-s-2.2),0.65,sx*(hx+0.08),sz*(hz-s),25.24,0.11,M.frame,`glass-mullion-v-${sx}-${sz}-${k}`);
    }
    for(let i=0;i<=10;i++){
      const y=1.05+i*2.32,s=shiftAt(y);
      box(sx*(hx-s-3.6),sz*(hz-s+0.09),y,6.85,0.075,0.12,M.frame,`glass-grid-u-${sx}-${sz}-${i}`);
      box(sx*(hx-s+0.09),sz*(hz-s-3.6),y,0.12,0.075,6.85,M.frame,`glass-grid-v-${sx}-${sz}-${i}`);
    }
  }

  // North and south: three guestroom rows over a tall glazed lobby. Bay-facing east: five stacked room rows.
  // Copper cheeks sit forward of recessed panes, with thin floor bands, real balcony slabs and glass balustrades.
  for(const side of [0,1,2]){
    const F=face(core[side],core[(side+1)%4]),end=5.7;
    const bays=Math.max(3,Math.round((F.length-2*end)/4.35)),spacing=(F.length-2*end)/bays;
    const floors=side===1?[2.1,6.3,10.5,14.7,18.9]:[11.2,15.25,19.3];
    for(const [floor,y]of floors.entries()){
      F.box(F.length/2,0.72,y-0.25,F.length-2*end+0.35,0.21,1.7,M.trim,`balcony-band-${side}-${floor}`);
      for(let bay=0;bay<bays;bay++){
        const s=end+(bay+0.5)*spacing,w=spacing-0.52;
        F.box(s,0.11,y,w,3.23,0.08,M.glass,`room-pane-${side}-${floor}-${bay}`);
        F.box(s-spacing/2+0.24,0.5,y-0.02,0.72,3.48,1.22,M.copper,`copper-cheek-${side}-${floor}-${bay}`);
        F.box(s-spacing/2+0.67,0.95,y+0.1,0.09,3.11,0.26,M.copperLight,`copper-reveal-${side}-${floor}-${bay}`);
        for(const offset of [-w/2,w/2,0])F.box(s+offset,0.21,y+0.05,0.065,3.1,0.07,M.trim,`room-frame-${side}-${floor}-${bay}-${offset}`);
        F.box(s,1.4,y+0.05,w-0.15,1.01,0.065,M.glass,`balcony-glass-${side}-${floor}-${bay}`);
        F.box(s,1.45,y+1.13,w-0.08,0.06,0.095,M.frame,`balcony-rail-${side}-${floor}-${bay}`);
      }
    }
    if(side!==1){
      F.box(F.length/2,0.2,1.0,F.length-2*end,9.7,0.08,M.glass,`lobby-glass-${side}`);
      for(let j=0;j<=Math.ceil((F.length-2*end)/2.6);j++){
        const s=end+j*(F.length-2*end)/Math.ceil((F.length-2*end)/2.6);
        F.box(s,0.3,1.1,0.07,9.2,0.08,M.frame,`lobby-mullion-${side}-${j}`);
      }
      for(const y of [3.3,5.9,8.5])F.box(F.length/2,0.44,y,F.length-2*end-0.3,0.07,0.1,M.frame,`lobby-transom-${side}-${y}`);
      if(side===0)for(let j=0;j<5;j++){
        const [x,z]=F.point(end+(j+0.5)*(F.length-2*end)/5,1.4);
        collidable(kit.cylinder({x,z,y0:0.6,y1:10.8,r:0.48,segments:12,material:M.stone,top:M.stone,name:`north-lobby-column-${j}`}));
      }
    }
    F.box(F.length/2,2.4,23.55,F.length-2*end+0.2,1.5,0.22,M.glass,`roof-fascia-${side}`);
    const text='THE FULLERTON BAY HOTEL',pixel=Math.min(0.19,(F.length-2*end)/(text.length*6)),advance=pixel*6;
    let cursor=(F.length-text.length*advance)/2;
    for(const [index,letter]of [...text].entries()){
      for(const [row,bits]of (LETTERS[letter]||[]).entries())for(const match of bits.matchAll(/1+/g)){
        const w=match[0].length*pixel;
        F.box(F.length-cursor-match.index*pixel-w/2,2.59,23.67+(6-row)*pixel,w,pixel*0.83,0.07,M.gold,`hotel-sign-${side}-${index}-${row}-${match.index}`);
      }
      cursor+=advance;
    }
  }

  // Street-side stone spine: horizontal joints and short bronze accents, rising above the glass guestroom block.
  collidable(box(-hx+1.0,0,0.6,5.8,30.0,15.0,M.stone,'street-stone-spine'));
  for(let i=0;i<36;i++){
    const y=0.95+i*0.8;
    box(-hx-1.96,0,y,0.075,0.055,14.8,M.roof,`stone-joint-${i}`);
    for(const sign of [-1,1])box(-hx-2.01,sign*6.35,y+0.1,0.08,0.055,1.85,M.gold,`spine-accent-${i}-${sign}`);
  }
  collidable(box(-hx-1.1,0,4.75,7.8,0.22,26.0,M.glass,'street-entrance-canopy'));
  for(const v of [-11,11]){
    collidable(rod(-hx-4.1,v,0.6,-hx-2.9,v-0.6,4.7,0.18,M.trim,`entrance-v-post-${v}`));
    rod(-hx-4.1,v,0.6,-hx-2.9,v+0.6,4.7,0.18,M.trim,`entrance-v-brace-${v}`);
  }

  // Hotel's low northward link to Clifford Pier. The separate historic pier is neither hidden nor remodelled.
  collidable(prism(link.ring,-0.1,5.55,M.dark,'north-pier-link'));
  collidable(prism(kit.inset(link.ring,-0.12),5.6,5.92,M.stone,'north-link-coping'));
  for(let i=0;i<link.ring.length;i++){
    const F=face(link.ring[i],link.ring[(i+1)%link.ring.length]),bays=Math.max(1,Math.round(F.length/2.6));
    for(let j=0;j<bays;j++)F.box((j+0.5)*F.length/bays,0.09,0.5,0.09,4.85,0.14,M.frame,`link-mullion-${i}-${j}`);
  }

  // Bay-side deck, piles and handrail; the thin pile geometry is batched with the rest of the model.
  collidable(box(hx+1.5,0,0.15,3.9,0.5,D+0.8,M.wood,'bayfront-boardwalk'));
  for(let i=0;i<=8;i++){
    const v=-hz+0.5+i*(D-1)/8;
    kit.cylinder({x:P(hx+2.7,v)[0],z:P(hx+2.7,v)[1],y0:-0.3,y1:0.12,r:0.24,segments:8,material:M.stone,top:M.stone,name:`waterfront-pile-${i}`});
    box(hx+3.25,v,0.7,0.1,1.0,0.1,M.frame,`boardwalk-post-${i}`);
  }
  box(hx+3.25,0,1.72,0.08,0.075,D-0.9,M.frame,'boardwalk-rail');

  // Roof plan: service core on the west, rectangular pool on the north, Lantern's long canopy on the east.
  collidable(prism(rect(0,0,W-0.65,D-0.65),24.5,25.2,M.wood,'roof-deck'));
  collidable(box(-hx+11.0,-hz+10.0,25.25,17.5,4.9,17.0,M.stone,'roof-service-core'));
  box(-hx+11.0,-hz+10.0,30.2,18.0,0.22,17.5,M.trim,'service-core-coping');
  for(let i=0;i<6;i++)box(-hx+11,-hz+10,26+i*0.65,17.6,0.045,17.1,M.trim,`service-core-joint-${i}`);
  const poolU=5.0,poolV=-7.0,poolW=25.0,poolD=10.0;
  box(poolU,poolV,25.23,poolW+0.7,0.18,poolD+0.7,M.trim,'pool-coping');
  collidable(prism(rect(poolU,poolV,poolW,poolD),25.44,25.5,M.pool,'rooftop-pool-water'));
  // Narrow lane marks and two small circular Jacuzzis south of the pool.
  for(const u of [-2.5,5,12.5])box(u,poolV,25.52,0.08,0.025,poolD-0.5,M.glass,`pool-lane-${u}`);
  for(const [i,u]of [-1,6].entries()){
    const [x,z]=P(u,2.8);
    kit.cylinder({x,z,y0:25.24,y1:25.78,r:1.65,segments:20,material:M.trim,top:M.trim,name:`jacuzzi-rim-${i}`});
    collidable(kit.cylinder({x,z,y0:25.8,y1:25.84,r:1.25,segments:20,material:M.pool,top:M.pool,name:`jacuzzi-water-${i}`}));
  }
  const canopyU=hx-5.2,canopyD=D-6;
  for(const v of [-canopyD/2,0,canopyD/2])for(const u of [canopyU-3.1,canopyU+3.1]){
    box(u,v,25.25,0.14,2.8,0.14,M.trim,`lantern-post-${u}-${v}`);
  }
  for(const sign of [-1,1]){
    const points=rect(canopyU+sign*1.8,0,3.6,canopyD+0.8),ridge=P(canopyU,0);
    const roofY=(x,z)=>29.15-Math.abs((x-ridge[0])*E[0]+(z-ridge[1])*E[1])*0.29;
    collidable(kit.prism({ring:points,y0:28.05,y1:roofY,material:M.fabric,top:M.fabric,name:`lantern-tent-roof-${sign}`}));
  }
  collidable(box(-5,10.0,25.25,15.0,2.55,5.5,M.glass,'rooftop-bar-pavilion'));
  box(-5,10.0,27.85,15.5,0.2,6.0,M.frame,'bar-pavilion-roof');
  for(let i=0;i<8;i++)box(-11.5+i*1.85,7.21,25.4,0.08,2.15,0.1,M.trim,`bar-pavilion-frame-${i}`);

  // Roof-edge planting, restrained low-poly frangipani and furniture. Gaps keep the pool readable from above.
  for(const [i,u,v,w,d]of [[0,0,hz-1.5,W-5,1.2],[1,0,-hz+1.5,W-5,1.1],[2,hx-1.4,0,1.1,D-5]]){
    box(u,v,25.25,w,0.6,d,M.roof,`roof-planter-${i}`);
    box(u,v,25.9,w-0.1,0.7,d-0.1,M.green,`roof-hedge-${i}`);
  }
  for(const [i,u,v]of [[0,-10,1.3],[1,12,4.0],[2,-13,15],[3,10,15]]){
    const [x,z]=P(u,v);
    kit.cylinder({x,z,y0:25.25,y1:26.0,r:0.75,segments:10,material:M.stone,top:M.stone,name:`tree-planter-${i}`});
    kit.cylinder({x,z,y0:26.02,y1:27.4,r:0.1,segments:6,material:M.wood,top:M.wood,name:`roof-tree-trunk-${i}`});
    kit.loft({ring:rect(u,v,2.4,2.4),y0:27.0,y1:28.7,scale:0.2,material:M.green,top:M.green,name:`roof-tree-crown-${i}`});
  }
  for(let i=0;i<8;i++){
    const u=-6+i*3.0;
    box(u,-15.6,25.24,1.25,0.28,2.0,M.fabric,`pool-lounger-${i}`);
    box(u,6.5,25.24,1.15,0.3,1.9,M.fabric,`lantern-seat-${i}`);
  }
  // Slim glass safety rails around the roof; subdivided panels avoid an opaque wall obscuring the pool.
  for(let i=0;i<4;i++){
    const F=face(outer[i],outer[(i+1)%4]),count=Math.ceil(F.length/2.7);
    for(let j=0;j<count;j++)F.box((j+0.5)*F.length/count,-0.17,25.25,F.length/count-0.08,1.0,0.06,M.glass,`roof-guard-${i}-${j}`);
  }
}
