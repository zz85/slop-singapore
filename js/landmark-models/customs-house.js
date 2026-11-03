// SG-036: conserved harbour office, north pier pavilions and the separately mapped control tower.
// Source boundaries, era and photographic estimates: docs/customs-house.md.
export const info = { name: 'Customs House', height: 23 };

export function build(kit, site) {
  const body=site.parts.find(p=>p.id===395113920),tower=site.parts.find(p=>p.id===406900756),pier=site.parts.find(p=>p.id===986973995);
  if(!body?.ring?.length || !tower?.ring?.length || !pier?.ring?.length)throw new Error('Customs House needs mapped body, tower and north pier');
  const U=kit.compass(92.8),V=kit.compass(182.8),E=kit.compass(90),yaw=Math.atan2(U[1],U[0]);
  const edges=body.ring.map((a,i)=>({a,b:body.ring[(i+1)%body.ring.length]}));
  // The generator simplifies collinear vertices: the north edge can become longer than the south edge.
  // Select the southern long edge explicitly, so simplification cannot move the office into the basin.
  const edge=edges.filter(e=>Math.hypot(e.b[0]-e.a[0],e.b[1]-e.a[1])>50)
    .reduce((a,b)=>(a.a[0]+a.b[0])*V[0]+(a.a[1]+a.b[1])*V[1]>(b.a[0]+b.b[0])*V[0]+(b.a[1]+b.b[1])*V[1]?a:b);
  const west=edge.a[0]*E[0]+edge.a[1]*E[1]<edge.b[0]*E[0]+edge.b[1]*E[1]?edge.a:edge.b;
  const P=(u,v)=>[west[0]+(u+19.75)*U[0]+(v-10.43)*V[0],west[1]+(u+19.75)*U[1]+(v-10.43)*V[1]];
  const M={wall:kit.material(0xdedfd2),trim:kit.material(0xf2f1e5),glass:kit.glassMaterial(0x526c70),
    frame:kit.material(0x697671),screen:kit.material(0x969f97),roof:kit.material(0xb8bbae),
    dark:kit.material(0x505d5a),deck:kit.material(0x8e9288),green:kit.material(0x5c7845)};
  const B=(u,v,y,w,h,d,m,name,collision=false)=>{
    const [x,z]=P(u,v),p=kit.box({x,z,y,w,h,d,yaw,material:m,top:m,name});
    if(collision)kit.collisionPrism(p);
    return p;
  };
  const beam=(u0,v0,y0,u1,v1,y1,w,h,m,name)=>{
    const a=P(u0,v0),b=P(u1,v1);
    return kit.beam({from:[a[0],y0,a[1]],to:[b[0],y1,b[1]],w,h,material:m,name});
  };
  const square=(u,v,w,d=w)=>[[u-w/2,v-d/2],[u+w/2,v-d/2],[u+w/2,v+d/2],[u-w/2,v+d/2]].map(p=>P(...p));
  // The main office occupies the crosspiece of the L-shaped pier. No full-site slab spans the basin.
  kit.prism({ring:body.ring,y0:0,y1:0.24,material:M.deck,top:M.deck,name:'mapped-office-plinth'});
  B(4.8,0.6,0.25,54.5,7.2,15.1,M.glass,'recessed-two-storey-shopfronts',true);
  B(-22.2,0.6,0.25,0.65,7.5,17.8,M.wall,'west-end-wall',true);
  for(const y of [0.3,3.8,7.55])B(5.4,0.6,y,56.6,0.25,18.7,M.trim,`office-floor-${y}`,true);
  for(const side of [-1,1]) {
    const v=0.6+side*9.1;
    for(let i=0;i<=14;i++) {
      const u=-22+i*3.94;
      B(u,v,0.25,0.32,7.2,0.42,M.trim,`facade-pier-${side}-${i}`,true);
      // Frames sit in front of the recessed glazing; transoms have a separate depth plane.
      for(const y of [0.55,4.1])B(u+1.95,0.6+side*7.64,y,0.055,2.65,0.08,M.frame,`window-mullion-${side}-${i}-${y}`);
      if(i===14)continue;
      for(const y of [3.2,6.95])for(let j=0;j<8;j++) {
        const a=j/8,b=(j+1)/8;
        beam(u+3.9*a,v,y+0.32*Math.sin(a*Math.PI),u+3.9*b,v,y+0.32*Math.sin(b*Math.PI),
          0.65,0.48,M.wall,`butterfly-fascia-${side}-${i}-${y}-${j}`);
      }
    }
    for(const y of [1.9,5.4])B(5.4,0.6+side*7.72,y,54.6,0.065,0.08,M.frame,`window-transom-${side}-${y}`);
    // Thin vertical slats screen the plant floor; the roof remains visibly lower than the lookout.
    B(5.4,0.6+side*8.75,7.92,56.4,1.95,0.13,M.dark,`service-screen-shadow-${side}`,true);
    for(let i=0;i<125;i++)B(-22.3+i*0.447,0.6+side*8.9,7.88,0.09,2.12,0.22,M.screen,`service-louvre-${side}-${i}`);
  }
  for(const u of [-22.8,33.65]) {
    B(u,0.6,7.93,0.12,1.96,17.5,M.dark,`screen-end-shadow-${u}`,true);
    for(let i=0;i<38;i++)B(u, -7.8+i*0.45,7.9,0.25,2.1,0.09,M.screen,`screen-end-louvre-${u}-${i}`);
  }
  B(5.4,0.6,7.84,55.9,0.12,17.4,M.roof,'service-roof-surface',true);
  // Three strips of modest rooflights and a cooling-plant row follow the aerial reference.
  for(const v of [-5.1,-1.4,2.3])for(let i=0;i<15;i++) {
    B(-20.5+i*3.5,v,7.99,2.4,0.1,1.15,M.glass,`rooflight-${v}-${i}`);
    B(-20.5+i*3.5,v,8.1,0.055,0.04,1.2,M.frame,`rooflight-bar-${v}-${i}`);
  }
  for(let i=0;i<12;i++) {
    B(-7+i*3.05,6.5,7.98,2.6,0.65,2.1,M.screen,`cooling-plant-${i}`);
    const [x,z]=P(-7+i*3.05,6.5);
    kit.cylinder({x,z,y0:8.65,y1:8.74,r:0.78,segments:12,material:M.dark,top:M.dark,name:`cooling-fan-${i}`});
  }
  const [sx,sz]=P(-7,9.68);
  kit.sign({x:sx,z:sz,y:8.3,text:'CUSTOMS HOUSE',height:0.78,maxWidth:18,yaw:kit.yawToward(182.8),bar:false,color:0xe7e7d5,name:'customs-house-name'});
  // Waterfront terrace and fine rails sit beside, rather than inside, the recessed shopfronts.
  B(6.4,12.1,0,62.4,0.22,3.1,M.deck,'south-waterfront-deck');
  for(let i=0;i<=22;i++)B(-24.5+i*2.8,13.55,0.24,0.065,1.0,0.065,M.frame,`deck-rail-post-${i}`);
  for(const y of [0.48,0.78,1.1])B(6.3,13.62,y,61.8,0.045,0.045,M.frame,`deck-rail-${y}`);
  for(let i=0;i<9;i++) {
    const u=-19+i*6.15;
    B(u,10.75,0.24,1.3,0.45,0.8,M.roof,`terrace-planter-${i}`);
    B(u,10.75,0.72,1.14,0.46,0.65,M.green,`terrace-planting-${i}`);
  }

  // The watchtower's mapped circular envelope encloses an eight-sided lookout over a much narrower shaft.
  const T=tower.ring.reduce((a,p)=>[a[0]+p[0]/tower.ring.length,a[1]+p[1]/tower.ring.length],[0,0]);
  const oct=r=>Array.from({length:8},(_,i)=>[T[0]+Math.cos(i*Math.PI/4)*r,T[1]+Math.sin(i*Math.PI/4)*r]);
  kit.cylinder({x:T[0],z:T[1],y0:0.25,y1:18.9,r:1.55,segments:16,material:M.wall,top:M.wall,name:'control-tower-shaft'});
  kit.collisionPrism({ring:oct(1.54),y0:0.25,y1:19});
  for(const y of [6.8,11.2])B(36.9,7.46,y,0.42,1.4,0.04,M.dark,`tower-stair-window-${y}`);
  kit.loft({ring:oct(1.65),topRing:oct(3.42),y0:18.5,y1:19.7,material:M.trim,top:M.trim,name:'lookout-flared-support'});
  kit.collisionPrism({ring:oct(1.65),y0:18.5,y1:19.7});
  const skirt=kit.prism({ring:oct(3.45),y0:19.71,y1:20.15,material:M.wall,top:M.wall,name:'lookout-skirt'});
  kit.collisionPrism(skirt);
  kit.loft({ring:oct(3.45),topRing:oct(3.9),y0:20.17,y1:22.53,material:M.glass,top:M.glass,name:'lookout-inclined-windows'});
  kit.collisionPrism({ring:oct(3.44),y0:20.15,y1:22.65});
  for(let i=0;i<16;i++) {
    const a=i*Math.PI/8,r0=i%2?3.45*Math.cos(Math.PI/8):3.45,r1=i%2?3.9*Math.cos(Math.PI/8):3.9;
    kit.beam({from:[T[0]+r0*Math.cos(a),20.13,T[1]+r0*Math.sin(a)],to:[T[0]+r1*Math.cos(a),22.6,T[1]+r1*Math.sin(a)],w:0.12,h:0.12,material:M.trim,name:`lookout-mullion-${i}`});
  }
  kit.loft({ring:oct(4.05),topRing:oct(3.65),y0:22.6,y1:23,material:M.frame,top:M.frame,name:'lookout-roof'});
  kit.collisionPrism({ring:oct(3.65),y0:22.55,y1:23});

  // Three square umbrella modules occupy only the mapped narrow north pier, leaving its edge passage open.
  for(let i=0;i<3;i++) {
    const v=-14.1-i*9.8,u=33.65;
    B(u,v,0,9.3,0.22,9.7,M.deck,`north-pier-deck-${i}`);
    B(u,v,0.23,0.42,4.7,0.42,M.trim,`umbrella-column-${i}`,true);
    kit.loft({ring:square(u,v,0.8),topRing:square(u,v,9.15,9.55),y0:4.4,y1:5.5,material:M.trim,top:M.roof,name:`umbrella-roof-${i}`});
    kit.collisionPrism({ring:square(u,v,9.15,9.55),y0:5.02,y1:5.5});
    B(u,v,5.53,8.4,0.12,8.8,M.green,`pavilion-planted-roof-${i}`);
    for(const side of [-1,1]) {
      B(u+side*4.61,v,0.24,0.055,0.95,0.055,M.frame,`pier-rail-post-${i}-${side}`);
      B(u+side*4.67,v,1.2,0.045,0.045,9.6,M.frame,`pier-top-rail-${i}-${side}`);
    }
  }
}
