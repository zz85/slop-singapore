// SG-242. Mapped hall, support, dome, minaret and pinnacle rings; source-guided elevations.
// See docs/sultan-mosque.md for the 45-way replacement ledger and estimated details.
export const info = { name: 'Sultan Mosque', height: 32 };

export function build(kit, site) {
  const M = {
    cream: kit.material(0xe6e1cb), trim: kit.material(0xf4eee0), shadow: kit.material(0x242d2b),
    gold: kit.material(0xd9aa38), green: kit.material(0x4c6d59), grey: kit.material(0x71827f),
    ochre: kit.material(0xb79153), red: kit.material(0xa45f43), glass: kit.glassMaterial(0x263f39)
  };
  const mapped = id => {
    const p = site.parts.find(p => p.id === id);
    if (!p?.ring?.length) throw new Error(`Sultan Mosque needs mapped way ${id}`);
    return p.ring;
  };
  const U = kit.compass(113.7), V = kit.compass(23.7);
  const dot = (p, d) => p[0]*d[0] + p[1]*d[1];
  const box = ring => {
    const us=ring.map(p=>dot(p,U)),vs=ring.map(p=>dot(p,V));
    return {u:(Math.min(...us)+Math.max(...us))/2,v:(Math.min(...vs)+Math.max(...vs))/2,
      w:Math.max(...us)-Math.min(...us),d:Math.max(...vs)-Math.min(...vs)};
  };
  // Stable drawing origin: the NW dome support, not the vertex-weighted landmark anchor.
  const origin=box(mapped(694102548));
  const P=(u,v)=>[(u+origin.u)*U[0]+(v+origin.v)*V[0],(u+origin.u)*U[1]+(v+origin.v)*V[1]];
  const local=ring=>{const b=box(ring);return {...b,u:b.u-origin.u,v:b.v-origin.v};};
  const rect=(u,v,w,d)=>[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([x,z])=>P(u+x,v+z));
  const B=(u,v,y,w,h,d,material,name)=>{const [x,z]=P(u,v);return kit.box({x,z,y,w,h,d,yaw:Math.atan2(U[1],U[0]),material,top:material,name});};
  const C=(u,v,y0,y1,r,material,name,segments=16)=>{const [x,z]=P(u,v);return kit.cylinder({x,z,y0,y1,r,segments,material,top:material,name});};
  const prism=(ring,y0,y1,material,name)=>kit.prism({ring,y0,y1,material,top:material,name});
  const circle=(u,v,r,n=24)=>Array.from({length:n},(_,i)=>P(u+Math.cos(i/n*Math.PI*2)*r,v+Math.sin(i/n*Math.PI*2)*r));
  const loft=(u,v,r0,r1,y0,y1,material,name,n=24)=>kit.loft({ring:circle(u,v,r0,n),topRing:circle(u,v,r1,n),y0,y1,material,top:material,name});
  const collision=(ring,y0,y1)=>kit.collisionPrism({ring,y0,y1});
  const beam=(u,v,y,tu,tv,ty,w,material,name)=>{const a=P(u,v),b=P(tu,tv);return kit.beam({from:[a[0],y,a[1]],to:[b[0],ty,b[1]],w,h:w,material,name});};

  const hall=mapped(1165450369);
  prism(hall,0,12,M.cream,'prayer-hall');
  collision(kit.inset(hall,0.25),0,12);
  for(const id of [1165450370,1165450371]) {
    const ring=mapped(id);
    prism(ring,0,5,M.cream,`side-projection-${id}`);
    prism(kit.inset(ring,-0.25),5.04,5.3,M.grey,`side-projection-roof-${id}`);
    collision(ring,5,5.3);
  }

  // A central green gable rises above lower side aisles, following the tagged roof footprint.
  const roof=local(mapped(1165450368)),ru=roof.u,rv=roof.v;
  for(const s of [-1,1]) {
    const ring=rect(ru,rv+s*roof.d/4,roof.w,roof.d/2);
    prism(ring,12.04,(x,z)=>16-3.85*Math.abs(dot([x,z],V)-origin.v-rv)/(roof.d/2),M.green,`central-green-roof-${s}`);
    // Each band stops at the lower (outer) edge's roof height. A single full-width volume would
    // extend above the falling slope near the eaves and create an invisible obstacle for aircraft.
    const bands=12,step=roof.d/(2*bands);
    for(let i=0;i<bands;i++) {
      collision(rect(ru,rv+s*(i+0.5)*step,roof.w-0.3,step),12,16-3.85*(i+1)/bands-0.03);
    }
  }
  beam(ru-roof.w/2,rv,16.07,ru+roof.w/2,rv,16.07,0.18,M.green,'green-roof-ridge');
  for(const s of [-1,1]) {
    const ring=rect(ru,rv+s*12,roof.w,7.1);
    prism(ring,12.05,(x,z)=>12.9-0.7*(Math.abs(dot([x,z],V)-origin.v-rv)-8.45)/7.1,M.grey,`lower-aisle-roof-${s}`);
    for(let i=0;i<6;i++) {
      collision(rect(ru,rv+s*(8.45+(i+0.5)*7.1/6),roof.w-0.4,7.1/6),12,12.9-0.7*(i+1)/6-0.03);
    }
  }

  // Profiled ogee shells are deliberately wider at the bulb than at the dark bottle-band neck.
  function finial(u,v,base,scale,name) {
    C(u,v,base,base+0.8*scale,0.16*scale,M.gold,`${name}-finial-base`,12);
    loft(u,v,0.34*scale,0.06*scale,base+0.3*scale,base+1.25*scale,M.gold,`${name}-finial-taper`,12);
    C(u,v,base+1.1*scale,base+1.75*scale,0.065*scale,M.gold,`${name}-finial-stem`,8);
    const cy=base+2.25*scale,r=0.65*scale;
    for(let i=0;i<12;i++) {
      const a=(48+i*264/12)*Math.PI/180,b=(48+(i+1)*264/12)*Math.PI/180;
      beam(u+Math.cos(a)*r,v,cy+Math.sin(a)*r,u+Math.cos(b)*r,v,cy+Math.sin(b)*r,0.09*scale,M.gold,`${name}-crescent-${i}`);
    }
    for(let i=0;i<5;i++) {
      const a=(-90+i*144)*Math.PI/180,b=(-90+(i+1)*144)*Math.PI/180;
      beam(u+0.25*scale+Math.cos(a)*0.22*scale,v,cy+Math.sin(a)*0.22*scale,u+0.25*scale+Math.cos(b)*0.22*scale,v,cy+Math.sin(b)*0.22*scale,0.045*scale,M.gold,`${name}-star-${i}`);
    }
  }
  function onion(u,v,name) {
    C(u,v,17.02,18.22,4.35,M.shadow,`${name}-bottle-band`,32);
    const levels=[[18.2,4.28],[19.5,4.98],[21.3,5.7],[23.5,5.62],[25.2,4.7],[26.4,3.65],[27.55,2.05],[28.25,1.05],[29,0.13]];
    for(let i=0;i<levels.length-1;i++) {
      const [y0,r0]=levels[i],[y1,r1]=levels[i+1];
      loft(u,v,r0,r1,y0,y1,M.gold,`${name}-onion-shell-${i}`,40);
      // Interior collision remains within the curved skin at every altitude.
      collision(circle(u,v,Math.min(r0,r1)-0.07,16),y0,y1);
    }
    finial(u,v,29,1,name);
  }

  const fronts=[];
  for(const [id,label,domeId] of [[694102548,'north-bridge',694102549],[1165450377,'bussorah',1165450378]]) {
    const ring=mapped(id),b=local(ring),d=local(mapped(domeId));
    prism(ring,0,17,M.cream,`${label}-dome-support`);
    collision(kit.inset(ring,0.12),0,17);
    B(b.u,b.v,16.74,b.w+0.32,0.29,b.d+0.32,M.trim,`${label}-support-cornice`);
    onion(d.u,d.v,label);
    fronts.push({b,label,out:label==='bussorah'?1:-1});
  }

  function smallDome(u,v,y,r,name) {
    const levels=[[y,r*0.75],[y+0.5,r],[y+1.05,r*0.85],[y+1.7,r*0.25],[y+1.9,r*0.1]];
    for(let i=0;i<levels.length-1;i++)loft(u,v,levels[i][1],levels[i+1][1],levels[i][0],levels[i+1][0],M.gold,`${name}-gold-cap-${i}`,16);
    C(u,v,y+1.85,y+2.5,0.06,M.gold,`${name}-needle`,8);
  }
  for(const id of [1165450375,1165450376,1165450379,1165450380]) {
    const b=local(mapped(id)),name=`small-pavilion-${id}`;
    prism(mapped(id),0,13.9,M.cream,name);
    C(b.u,b.v,13.94,16.2,1.58,M.shadow,`${name}-recess`,12);
    for(let i=0;i<8;i++) {
      const a=i/8*Math.PI*2;
      C(b.u+Math.cos(a)*1.86,b.v+Math.sin(a)*1.86,13.94,16.2,0.16,M.trim,`${name}-arcade-column-${i}`,8);
    }
    C(b.u,b.v,16.22,16.48,2.3,M.trim,`${name}-eave`,16);
    smallDome(b.u,b.v,16.5,1.72,name);
    collision(circle(b.u,b.v,1.6,12),13.9,18.25);
  }

  for(const id of [685610171,1165450372,1165450373,1165450374]) {
    const b=local(mapped(id)),name=`minaret-${id}`;
    C(b.u,b.v,0,23.7,1.35,M.trim,`${name}-shaft`,12);
    C(b.u,b.v,0.03,2.5,1.52,M.cream,`${name}-plinth`,12);
    C(b.u,b.v,12.1,12.5,1.46,M.shadow,`${name}-lower-band`,12);
    loft(b.u,b.v,1.35,2.12,23.5,24.2,M.trim,`${name}-balcony-bracket`,12);
    C(b.u,b.v,24.23,24.48,2.15,M.trim,`${name}-balcony-sill`,12);
    C(b.u,b.v,24.5,26.8,0.9,M.shadow,`${name}-balcony-shadow`,12);
    for(let i=0;i<8;i++) {
      const a=i/8*Math.PI*2;
      C(b.u+Math.cos(a)*1.7,b.v+Math.sin(a)*1.7,24.5,26.8,0.13,M.trim,`${name}-balcony-post-${i}`,8);
    }
    C(b.u,b.v,26.83,27.1,2.1,M.trim,`${name}-balcony-roof`,12);
    smallDome(b.u,b.v,27.12,1.3,name);
    collision(circle(b.u,b.v,1.3,12),23.7,29.15);
  }

  // Recessed arch panes behind projecting ochre frames; beam profiles create the pointed upper outline.
  function windowFace(cx,cz,tx,tz,nx,nz,y,w,h,name,out=0.1) {
    const world=(a,b)=>[cx+tx*a+nx*b,cz+tz*a+nz*b];
    const panel=(a,yy,ww,hh,depth,material,label)=>{const [x,z]=world(a,depth);return kit.box({x,z,y:yy,w:ww,h:hh,d:0.09,yaw:Math.atan2(tz,tx),material,top:material,name:`${name}-${label}`});};
    const shoulder=y+h*0.66,arch=h*0.34,steps=8;
    panel(0,y,w,h*0.66,out,M.glass,'pane');
    const points=Array.from({length:steps+1},(_,i)=>{const a=-w/2+w*i/steps;return [a,shoulder+arch*(1-Math.pow(Math.abs(a)/(w/2),0.7))];});
    for(let i=0;i<steps;i++) {
      const [a,ya]=points[i],[b,yb]=points[i+1],q=world((a+b)/2,out);
      kit.box({x:q[0],z:q[1],y:shoulder+0.025,w:(b-a)*0.98,h:Math.max(0.025,(ya+yb)/2-shoulder),d:0.09,yaw:Math.atan2(tz,tx),material:M.glass,top:M.glass,name:`${name}-arch-pane-${i}`});
      const f=world(a,out+0.13),t=world(b,out+0.13);
      kit.beam({from:[f[0],ya,f[1]],to:[t[0],yb,t[1]],w:0.13,h:0.13,material:M.ochre,name:`${name}-arch-frame-${i}`});
    }
    for(const a of [-w/2,w/2])panel(a,y,0.13,h*0.66,out+0.13,M.ochre,`jamb-${a}`);
    panel(0,y+0.1,w,0.12,out+0.28,M.ochre,'sill');
    panel(0,y+0.2,0.08,h*0.75,out+0.22,M.ochre,'mullion');
    panel(0,shoulder-0.2,w-0.15,0.1,out+0.35,M.ochre,'transom');
  }

  // Exterior trim and repeated window bays follow the stepped source ring rather than a site bounding box.
  const area=hall.reduce((a,p,i)=>{const q=hall[(i+1)%hall.length];return a+p[0]*q[1]-q[0]*p[1];},0);
  for(let i=0;i<hall.length;i++) {
    const a=hall[i],b=hall[(i+1)%hall.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    if(len<2)continue;
    const tx=dx/len,tz=dz/len,nx=(area>0?1:-1)*tz,nz=(area>0?-1:1)*tx;
    const edgeBox=(y,h,d,material,label)=>kit.box({x:(a[0]+b[0])/2+nx*0.08,z:(a[1]+b[1])/2+nz*0.08,y,w:len-0.65,h,d,yaw:Math.atan2(tz,tx),material,top:material,name:`hall-edge-${i}-${label}`});
    edgeBox(0.45,0.45,0.25,M.shadow,'plinth');
    edgeBox(6.5,0.18,0.26,M.shadow,'string-course');
    edgeBox(11.65,0.23,0.32,M.trim,'cornice');
    edgeBox(12.92,0.32,0.33,M.trim,'parapet');
    const count=Math.max(1,Math.floor(len/3.7));
    if(len>4)for(let j=0;j<count;j++)for(const [floor,y,h]of [[0,1.6,3.9],[1,7.5,3.35]]) {
      const q=(j+0.5)/count;
      windowFace(a[0]+dx*q,a[1]+dz*q,tx,tz,nx,nz,y,Math.min(2.1,len/count-0.6),h,`hall-window-${i}-${j}-${floor}`);
    }
    const crenels=Math.floor(len/0.9);
    for(let j=0;j<crenels;j++) {
      const q=(j+0.5)/crenels,cx=a[0]+dx*q,cz=a[1]+dz*q;
      const ring=[[-0.18,-0.13],[0.18,-0.13],[0.18,0.13],[-0.18,0.13]].map(([s,t])=>[cx+tx*s+nx*t,cz+tz*s+nz*t]);
      kit.loft({ring,y0:13.28,y1:13.75,scale:0.08,material:M.red,top:M.red,name:`hall-merlon-${i}-${j}`});
    }
  }

  for(const {b,label,out}of fronts) {
    const u=b.u+out*b.w/2;
    for(const v of [-2.8,0,2.8]) {
      const [x,z]=P(u,b.v+v);
      windowFace(x,z,V[0],V[1],U[0]*out,U[1]*out,7.9,2.35,5.65,`${label}-upper-arch-${v}`,0.12);
    }
    for(const y of [0.45,6.5,15.4])B(u+out*0.12,b.v,y,0.25,0.2,b.d+0.1,M.shadow,`${label}-front-band-${y}`);
    B(u+out*0.35,b.v,7.8,0.9,0.28,3.0,M.trim,`${label}-balcony-floor`);
    B(u+out*0.7,b.v,8.1,0.12,0.72,3.3,M.shadow,`${label}-balcony-rail`);
  }

  // Four-column entrance porch: a raised canopy with open space beneath, beyond the mapped SE support.
  const front=fronts.find(f=>f.label==='bussorah').b,fu=front.u+front.w/2;
  // The Bussorah facade's main bay is a tall moulded panel, not an undecorated dome pedestal.
  // A dark ornamental line sits within wider cream mouldings, visibly in front of the masonry.
  for(const side of [-1,1]) {
    B(fu+0.18,front.v+side*4.7,3.1,0.2,12.1,0.42,M.trim,`bussorah-main-bay-moulding-${side}`);
    B(fu+0.32,front.v+side*4.54,3.2,0.08,11.8,0.09,M.shadow,`bussorah-main-bay-border-side-${side}`);
    for(let j=0;j<11;j++) {
      const y=3.55+j*1.0;
      beam(front.u+front.w/2+0.38,front.v+side*4.54-0.12,y,front.u+front.w/2+0.38,front.v+side*4.54+0.12,y+0.45,0.055,M.ochre,`bussorah-border-floral-${side}-${j}`);
    }
  }
  B(fu+0.26,front.v,15.18,0.2,0.4,9.8,M.trim,'bussorah-main-bay-moulding-top');
  B(fu+0.4,front.v,15.07,0.08,0.09,9.1,M.shadow,'bussorah-main-bay-border-top');
  B(fu+0.5,front.v,5.4,0.2,0.3,8.8,M.trim,'bussorah-main-bay-moulding-bottom');
  B(fu+0.4,front.v,5.75,0.08,0.09,9.1,M.shadow,'bussorah-main-bay-border-bottom');
  const [doorX,doorZ]=P(fu,front.v);
  windowFace(doorX,doorZ,V[0],V[1],U[0],U[1],0.45,2.65,3.75,'bussorah-main-door',0.12);
  for(const side of [-1,1]) {
    B(fu+0.22,front.v+side*0.6,0.58,0.09,2.25,1.08,M.ochre,`bussorah-main-door-leaf-${side}`);
    for(const y of [0.9,1.65]) B(fu+0.29,front.v+side*0.6,y,0.06,0.6,0.73,M.cream,`bussorah-main-door-panel-${side}-${y}`);
  }
  const canopy=rect(fu+2.05,front.v,4.1,8.3);
  prism(canopy,4.48,4.95,M.grey,'bussorah-entrance-canopy');
  collision(canopy,4.48,4.95);
  for(const v of [-3.55,-1.18,1.18,3.55]) {
    C(fu+3.6,front.v+v,0,4.46,0.22,M.cream,`bussorah-portico-column-${v}`,12);
    C(fu+3.6,front.v+v,3.9,4.42,0.34,M.cream,`bussorah-portico-capital-${v}`,12);
  }
  // Twenty-eight slender roof pinnacles occupy their mapped hexagons.
  for(let id=1165452713;id<=1165452740;id++) {
    const b=local(mapped(id));
    C(b.u,b.v,12.45,14.65,0.16,M.trim,`pinnacle-${id}-shaft`,8);
    C(b.u,b.v,14.3,14.7,0.23,M.red,`pinnacle-${id}-collar`,8);
    loft(b.u,b.v,0.23,0.01,14.7,16,M.trim,`pinnacle-${id}-tip`,8);
  }
}
