// SG-034. Restored Art Deco house, roof terraces and distinct lower glass annexe.
// OSM controls the envelope; internal divisions/heights are photographic estimates. See docs/fullerton-waterboat-house.md.
export const info = { name: 'The Fullerton Waterboat House', height: 14.4 };

export function build(kit, site) {
  const mapped = site.parts.find(p => p.id === 172931401);
  if (!mapped?.ring?.length) throw new Error('Waterboat House needs mapped way 172931401');
  const E = kit.compass(90), N = kit.compass(0);
  // Recover the drawing origin from the southernmost mapped vertex (103.8535434, 1.2869244).
  // Drawing coordinates are true east/north metres about 103.853535, 1.287066; the basis is reflected in world x/z.
  const tip = mapped.ring.reduce((a, b) => a[0] * N[0] + a[1] * N[1] < b[0] * N[0] + b[1] * N[1] ? a : b);
  const P = (e, n) => [tip[0] + (e - 0.935) * E[0] + (n + 15.657) * N[0],
    tip[1] + (e - 0.935) * E[1] + (n + 15.657) * N[1]];
  const ring = pts => pts.map(([e, n]) => P(e, n));
  const rect = (e, n, w, d) => ring([[e-w/2,n-d/2],[e+w/2,n-d/2],[e+w/2,n+d/2],[e-w/2,n+d/2]]);
  const M = {
    plaster: kit.material(0xbfc1b9), trim: kit.material(0xe4e6dc), shadow: kit.material(0x858e89),
    glass: kit.glassMaterial(0x53767f), frame: kit.material(0xd3dad7), roof: kit.material(0x727c72),
    deck: kit.material(0xa7a79a), steel: kit.material(0x526363), green: kit.material(0x526b46),
    dark: kit.material(0x344440), red: kit.material(0xb84640)
  };
  const solid = (pts, y0, y1, material, name, collide = false) => {
    const part = kit.prism({ ring: ring(pts), y0, y1, material, top: material, name });
    if (collide) kit.collisionPrism(part);
    return part;
  };
  const B = (e,n,y,w,h,d,material,name,collide=false) => {
    const [x,z] = P(e,n);
    const part = kit.box({x,z,y,w,h,d,yaw:Math.atan2(E[1],E[0]),material,top:material,name});
    if (collide) kit.collisionPrism(part);
    return part;
  };
  const face = (pts, i) => {
    const a = pts[i], b = pts[(i+1)%pts.length], dx = b[0]-a[0], dn = b[1]-a[1], length = Math.hypot(dx,dn);
    const area = pts.reduce((sum,p,j) => { const q=pts[(j+1)%pts.length]; return sum+p[0]*q[1]-q[0]*p[1]; },0);
    const te=dx/length, tn=dn/length, ne=Math.sign(area)*tn, nn=-Math.sign(area)*te;
    const point = (s,out=0) => [a[0]+te*s+ne*out,a[1]+tn*s+nn*out];
    return {length,point,box(s,out,y,w,h,d,material,name) {
      const [e,n]=point(s,out),[x,z]=P(e,n),t=[te*E[0]+tn*N[0],te*E[1]+tn*N[1]];
      return kit.box({x,z,y,w,h,d,yaw:Math.atan2(t[1],t[0]),material,top:material,name});
    }};
  };
  // Offset loops give adjacent rim segments shared, mitred vertices rather than overlapping rectangular caps.
  const rim = (pts, indices, inside, outside, y, h, material, name, collide=false) => {
    const outer=outside ? kit.inset(ring(pts),outside) : ring(pts),inner=kit.inset(ring(pts),inside);
    for(const i of indices) {
      const j=(i+1)%pts.length;
      const part=kit.prism({ring:[outer[i],outer[j],inner[j],inner[i]],y0:y,y1:y+h,material,top:material,name:`${name}-${i}`});
      if(collide)kit.collisionPrism(part);
    }
  };
  const rail = (pts, indices, y, name) => {
    for (const i of indices) {
      const F=face(pts,i),count=Math.max(1,Math.ceil(F.length/1.7));
      for(let j=0;j<count;j++) F.box(j*F.length/count,0,y,0.065,0.94,0.065,M.frame,`${name}-post-${i}-${j}`);
      // Posts and horizontal rails occupy separate depth planes, preventing coplanar crossings.
      for(const h of [0.2,0.48,0.76,1.0])F.box(F.length/2,0.065,y+h,F.length-0.15,0.045,0.045,M.frame,`${name}-rail-${i}-${h}`);
    }
  };

  // Western wing and rounded southern end. The re-entrant edge is the street edge in the source ring.
  const house = [[0.67,-11.07],[-5.35,-11],[-6.17,-6.35],[-8.37,-0.36],[-11.25,3.49],[-14.67,6.82],
    [-7.7,15.34],[0.27,15.73],[0.1,2.5],[0.2,-3.5],[2.0,-6.3],[6.8,-6.7],[8.5,-8.5],[8.3,-11.88],
    [5.75,-14.53],[3.95,-15.26],[0.93,-15.66]];
  const rounded = pts => pts.flatMap((p,i) => {
    const a=pts[(i+pts.length-1)%pts.length],b=pts[(i+1)%pts.length];
    const da=Math.hypot(a[0]-p[0],a[1]-p[1]),db=Math.hypot(b[0]-p[0],b[1]-p[1]);
    const d=Math.min(1.35,da*0.4,db*0.4),q=p.map((v,k)=>v+(a[k]-v)*d/da),r=p.map((v,k)=>v+(b[k]-v)*d/db);
    return Array.from({length:5},(_,j)=>{const t=j/4;return p.map((v,k)=>(1-t)**2*q[k]+2*t*(1-t)*v+t*t*r[k]);});
  });
  const tower = rounded([[0.85,-10.9],[1.0,-15.35],[3.85,-14.98],[5.55,-14.22],[8.0,-11.7],
    [8.12,-8.6],[6.6,-6.95],[2.2,-6.65],[0.6,-8.1]]);
  const core = kit.inset(ring(house),0.78);
  kit.prism({ring:ring(house),y0:0,y1:0.24,material:M.shadow,top:M.shadow,name:'historic-plinth'});
  const body=kit.prism({ring:core,y0:0.25,y1:7.32,material:M.plaster,top:M.plaster,name:'historic-house'});
  kit.collisionPrism(body);
  solid(house,7.34,7.68,M.deck,'historic-roof-terrace',true);
  const towerCore=kit.inset(ring(tower),0.6);
  const lower=kit.prism({ring:towerCore,y0:0.26,y1:7.29,material:M.plaster,top:M.plaster,name:'rounded-lower-storeys'});
  kit.collisionPrism(lower);
  const upper=kit.prism({ring:towerCore,y0:7.7,y1:10.63,material:M.plaster,top:M.plaster,name:'rounded-upper-storey'});
  kit.collisionPrism(upper);
  solid(tower,10.68,11.08,M.trim,'rounded-roof-coping',true);
  solid(tower.map(([e,n])=>[4.2+(e-4.2)*0.9,-10.8+(n+10.8)*0.9]),11.1,11.17,M.roof,'rounded-roof-surface');

  // The front balconies stand outside the recessed wall face but inside the mapped envelope.
  const wall = core.map(p => {
    const delta=[p[0]-P(0,0)[0],p[1]-P(0,0)[1]];
    return [delta[0]*E[0]+delta[1]*E[1],delta[0]*N[0]+delta[1]*N[1]];
  });
  rim(house,[1,2,3,4],1.3,0.02,3.65,0.22,M.trim,'front-balcony',true);
  rim(house,[1,2,3,4],1.3,0,6.35,0.18,M.trim,'front-eyebrow',true);
  for(const y of [4.08,4.36,4.64,4.9])rim(house,[1,2,3,4],0.11,0.055,y,0.045,M.frame,`front-balcony-rail-${y}`);
  for(const i of [1,2,3,4]) {
    const F=face(wall,i),bays=Math.max(1,Math.round(F.length/2.8)),step=F.length/bays;
    F.box(F.length/2,0.05,0.35,F.length-0.1,0.22,0.15,M.shadow,`front-plinth-${i}`);
    for(const y of [1.05,4.25]) for(let j=0;j<bays;j++) {
      if(i===2&&y===1.05)continue; // the entrance and its flanking panes have their own spacing below
      const s=(j+0.5)*step,w=step-0.8;
      F.box(s,0.07,y,w,1.5,0.07,M.glass,`front-window-${i}-${y}-${j}`);
      for(const off of [-w/2,0,w/2])F.box(s+off,0.18,y-0.04,0.065,1.62,0.11,M.trim,`front-mullion-${i}-${y}-${j}-${off}`);
      for(const h of [-0.06,1.53])F.box(s,0.22,y+h,w+0.13,0.07,0.16,M.trim,`front-window-trim-${i}-${y}-${j}-${h}`);
      F.box(s,0.35,y+1.72,w+0.18,0.11,0.72,M.trim,`front-window-shade-${i}-${y}-${j}`);
    }
    const count=Math.ceil(F.length/1.55);
    for(let j=0;j<count;j++)F.box(j*F.length/count,0.68,3.9,0.06,0.92,0.06,M.frame,`front-balcony-post-${i}-${j}`);
    // Faint plaster courses are geometry kept on the face, below the balcony's shadow line.
    for(const y of [0.65,3.13,5.99,6.94])F.box(F.length/2,0.017,y,F.length-0.2,0.025,0.025,M.shadow,`front-course-${i}-${y}`);
  }
  const entrance=face(wall,2),[de,dn]=entrance.point(entrance.length*0.53,0.12),[dx,dz]=P(de,dn);
  entrance.box(entrance.length*0.53,0.13,0.28,1.58,2.65,0.09,M.dark,'entrance-door');
  for(const offset of [-0.88,0.88])entrance.box(entrance.length*0.53+offset,0.26,0.28,0.16,2.7,0.24,M.trim,`entrance-jamb-${offset}`);
  for(const s of [0.85,entrance.length-0.85]) {
    entrance.box(s,0.07,1.05,1.0,1.5,0.07,M.glass,`entrance-side-window-${s}`);
    for(const offset of [-0.55,0.55])entrance.box(s+offset,0.18,0.99,0.065,1.62,0.11,M.trim,`entrance-window-jamb-${s}-${offset}`);
  }
  const normal=entrance.point(entrance.length*0.53,1.0),[sx,sz]=P(...normal);
  kit.sign({text:'THE FULLERTON\nWATERBOAT HOUSE',x:sx,z:sz,y:2.92,height:0.46,maxWidth:3.3,
    yaw:Math.atan2(sx-dx,sz-dz),color:0xe6e7de,font:'110px Helvetica, Arial, sans-serif',name:'waterboat-house-name'});

  // Rounded tower windows and projecting eyebrows: three strata, with real shade depth at each level.
  const towerEdges=tower.map((_,i)=>i);
  for(const y of [1.1,4.3,8.25]) {
    rim(tower,towerEdges,0.52,0.43,y,1.32,M.glass,`tower-window-${y}`);
    for(const h of [-0.08,1.34])rim(tower,towerEdges,0.5,0.27,y+h,0.09,M.trim,`tower-window-band-${y}-${h}`);
    for(let i=0;i<tower.length;i+=2) {
      const F=face(tower,i);
      F.box(F.length*0.5,-0.3,y-0.035,0.065,1.42,0.11,M.trim,`tower-frame-${i}-${y}`);
    }
  }
  // These are continuous floor/shade plates; filling their hidden interior avoids offset folds at the tight curve.
  for(const y of [2.72,5.92,9.87])solid(tower,y,y+0.14,M.trim,`tower-eyebrow-${y}`,true);
  // Flat-roof parapet and upper terrace railing. No roof fills the void beside the annexe.
  rim(house,[1,2,3,4,5,6,7,8],0.27,0.04,7.7,0.35,M.plaster,'roof-parapet');
  rim(house,[1,2,3,4,5,6,7,8],0.34,0,8.08,0.085,M.trim,'roof-parapet-coping');
  rail(house,[1,2,3,4,5,6],8.2,'roof-terrace');
  // Quiet northern service elevation, distinct from the window-rich principal front.
  for(const i of [5,6]) {
    const F=face(wall,i);
    for(const y of [1.1,4.25])for(let j=0;j<3;j++) {
      const s=(j+0.5)*F.length/3;
      F.box(s,0.07,y,Math.min(1.5,F.length/3-0.4),1.6,0.07,M.glass,`north-window-${i}-${j}-${y}`);
      F.box(s,0.24,y+1.7,Math.min(1.9,F.length/3),0.12,0.7,M.trim,`north-shade-${i}-${j}-${y}`);
    }
  }

  // Independent eastern annexe. The western cut-out remains a narrow outdoor space rather than a solid site slab.
  const annexe = [[3.1,11.78],[3.05,0.7],[5.5,-4.6],[8.8,-7.4],[10.18,-9.34],[12.99,-9.34],
    [14.53,-5.15],[14.33,0.9],[13.66,4.95],[11.12,8.88],[7.57,12.47],[2.95,14.81]];
  solid(annexe,0,0.32,M.shadow,'annexe-plinth');
  solid(annexe,0.34,5.94,M.glass,'glass-annexe',true);
  solid(annexe,6.0,6.28,M.steel,'annexe-roof',true);
  solid(annexe.map(([e,n])=>[8.5+(e-8.5)*0.96,3.0+(n-3.0)*0.96]),6.3,6.37,M.roof,'annexe-roof-surface');
  for(let i=0;i<annexe.length;i++) {
    const F=face(annexe,i),count=Math.max(1,Math.ceil(F.length/2.0));
    for(let j=0;j<count;j++)F.box((j+0.5)*F.length/count,0.09,0.36,0.095,5.55,0.13,M.frame,`annexe-mullion-${i}-${j}`);
    for(const y of [0.65,3.15,5.75])F.box(F.length/2,0.18,y,Math.max(0.03,F.length-0.35),0.07,0.12,M.frame,`annexe-transom-${i}-${y}`);
  }
  // Glazed link: explicit floor/roof collision, with no ground-level wall across its underpass.
  B(1.55,10,3.5,3.4,0.28,2.5,M.deck,'glazed-link-deck',true);
  B(1.55,10,5.8,3.65,0.23,2.7,M.frame,'glazed-link-roof',true);
  for(const n of [8.78,11.22]) {
    B(1.55,n,3.82,3.25,1.92,0.065,M.glass,`link-glass-${n}`,true);
    for(const e of [0.1,1.55,3.0])B(e,n-0.08,3.8,0.07,1.95,0.09,M.frame,`link-frame-${n}-${e}`);
  }

  // River-side rear bays and a few portholes, placed on quiet faces clear of the bridge.
  for(const i of [7,8,9]) {
    const F=face(wall,i);
    if(F.length<1)continue;
    for(const y of [1.0,4.15])for(let j=0;j<Math.ceil(F.length/3);j++) {
      const s=(j+0.5)*F.length/Math.ceil(F.length/3);
      const [e,n]=F.point(s);
      if(i===7&&n>7&&n<13)continue; // glazed bridge opening
      const w=Math.min(1.8,F.length/Math.ceil(F.length/3)-0.65);
      F.box(s,0.07,y,w,1.7,0.07,M.glass,`rear-window-${i}-${j}-${y}`);
      F.box(s,0.2,y+1.75,w+0.15,0.12,0.65,M.trim,`rear-window-shade-${i}-${j}-${y}`);
    }
  }
  // The round nautical windows on the river side are recessed dark discs with raised plaster surrounds.
  const portholeFace=face(wall,8);
  for(const [index,s,y] of [[0,portholeFace.length*0.7,3.35],[1,portholeFace.length*0.4,6.35]]) {
    const radius=0.43,inner=0.31,rows=20,h=2*radius/rows;
    for(let j=0;j<rows;j++) {
      const dy=-radius+(j+0.5)*h,outer=Math.sqrt(Math.max(0,radius*radius-dy*dy)),hole=Math.sqrt(Math.max(0,inner*inner-dy*dy));
      if(hole>0)portholeFace.box(s,0.07,y+dy-h/2,2*hole,h,0.06,M.dark,`porthole-glass-${index}-${j}`);
      for(const sign of [-1,1])portholeFace.box(s+sign*(outer+hole)/2,0.19,y+dy-h/2,outer-hole,h,0.12,M.trim,`porthole-surround-${index}-${j}-${sign}`);
    }
  }
  for(const [i,e,n,w,d] of [[0,-6,11,4.5,0.8],[1,-3,11,0.8,3.2]]) {
    B(e,n,7.73,w,0.45,d,M.shadow,`terrace-planter-${i}`);
    B(e,n,8.22,w-0.15,0.45,d-0.15,M.green,`terrace-planting-${i}`);
  }
  // The small roof's flagpoles form the high point; there is no invented pitched roof or tower crown.
  for(const [i,e,n] of [[0,2.2,-10.0],[1,4.8,-10.0],[2,7.0,-9.5]]) {
    const [x,z]=P(e,n);
    kit.cylinder({x,z,y0:11.2,y1:14.4,r:0.045,segments:8,material:M.frame,top:M.frame,name:`roof-flagpole-${i}`});
    if(i===1) {
      B(e+0.47,n,13.65,0.86,0.32,0.025,M.red,'singapore-flag-red');
      B(e+0.47,n,13.33,0.86,0.29,0.025,M.trim,'singapore-flag-white');
    }
  }
}
