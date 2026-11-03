// Conserved Victorian iron market; source plan, photographs and estimates: docs/lau-pa-sat.md.
export const info = { name: 'Lau Pa Sat', height: 22 };

export function build(kit, site) {
  const mapped = site.parts.find(p => p.id === 45098520);
  if (!mapped?.ring?.length) throw new Error('Lau Pa Sat needs mapped market way45098520');
  const M = {
    tile: kit.material(0xb8663f), tileEdge: kit.material(0x994d36),
    cream: kit.material(0xe6d5b9), light: kit.material(0xf3e6cb),
    iron: kit.material(0x315849), dark: kit.material(0x26352e),
    glass: kit.glassMaterial(0x93aca6), paving: kit.material(0xa59a84),
    stall: kit.material(0xc8c1ac), timber: kit.material(0x806747),
    red: kit.material(0x9d4735)
  };
  // The generated vertex-average anchor is not the tower centre. Eight roof wedges share the mapped centre
  // node. Recover that point, with a mapped compass offset from the westmost corner as a parent-only fallback.
  const wedges = site.parts.filter(p => p.id >= 463863828 && p.id <= 463863835);
  let centre;
  if (wedges.length === 8) {
    centre = wedges[0].ring.find(a => wedges.every(p => p.ring.some(b => Math.hypot(a[0]-b[0],a[1]-b[1]) < 0.12)));
  }
  const east=kit.compass(90), south=kit.compass(180);
  if (!centre) {
    const west=mapped.ring.reduce((a,b) => a[0]*east[0]+a[1]*east[1] < b[0]*east[0]+b[1]*east[1] ? a:b);
    centre=[west[0]+east[0]*39.473+south[0]*5.838,west[1]+east[1]*39.473+south[1]*5.838];
  }
  // Remove only collinear mapped subdivisions; keep the irregular eight-corner OSM perimeter.
  const outer=mapped.ring.map(p=>[...p]);
  for(let changed=true;changed&&outer.length>8;) {
    changed=false;
    for(let i=0;i<outer.length;i++) {
      const a=outer[(i+outer.length-1)%outer.length],b=outer[i],c=outer[(i+1)%outer.length];
      const d=Math.abs((c[0]-a[0])*(b[1]-a[1])-(c[1]-a[1])*(b[0]-a[0]))/Math.hypot(c[0]-a[0],c[1]-a[1]);
      if(d<0.16) { outer.splice(i,1);changed=true;break; }
    }
  }
  const add=(a,b)=>[a[0]+b[0],a[1]+b[1]], sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const scale=(p,s)=>mix(centre,p,s);
  const face=outer.map((p,i)=>mix(p,outer[(i+1)%outer.length],0.5));
  const beam=(a,ya,b,yb,w,material,name,h=w)=>kit.beam({from:[a[0],ya,a[1]],to:[b[0],yb,b[1]],w,h,material,name});
  const prism=(ring,y0,y1,material,name,top=material)=>kit.prism({ring,y0,y1,material,top,name});
  const collision=(ring,y0,y1)=>kit.collisionPrism({ring,y0,y1});
  const column=(p,i)=>{
    const C=(y0,y1,r,material,suffix)=>kit.cylinder({x:p[0],z:p[1],y0,y1,r,segments:10,material,top:material,name:`iron-column-${i}-${suffix}`});
    C(0.12,0.51,0.29,M.dark,'plinth'); const shaft=C(0.52,4.19,0.17,M.iron,'shaft');
    C(4.2,4.39,0.29,M.iron,'capital'); C(4.40,4.53,0.34,M.cream,'abacus');
    collision(shaft.ring,0.15,4.4);
  };

  prism(mapped.ring,0.02,0.12,M.paving,'market-paved-floor');
  // Roof faces meet exactly at shared edges. The triangle airwells are glass, not painted panels on a full hip.
  // Their underside is raised, so no roof or tower collision closes the market below its eaves.
  const inner=outer.map(p=>scale(p,0.20));
  prism(inner,9.23,9.45,M.cream,'central-octagonal-roof',M.tile);
  collision(inner,4.55,9.45);
  function roofPatch(vertices,name,top=M.tile) {
    const ring=vertices.map(v=>v[0]);
    const height=(x,z)=>vertices.reduce((best,v)=>Math.hypot(v[0][0]-x,v[0][1]-z)<Math.hypot(best[0][0]-x,best[0][1]-z)?v:best)[1];
    const part=kit.prism({ring,y0:4.55,y1:height,material:M.cream,edgeMaterial:()=>top,top,name});
    // The flat base band is a conservative solid-roof approximation. It leaves every aisle open below4.55m.
    collision(ring,4.55,Math.min(...vertices.map(v=>v[1]))+0.12);
    return part;
  }
  const roofHeight=(edgeIndex,p)=>{
    const a=outer[edgeIndex],b=outer[(edgeIndex+1)%outer.length],t=sub(b,a),n=[-t[1],t[0]];
    const distance=(a[0]-centre[0])*n[0]+(a[1]-centre[1])*n[1];
    const fraction=((p[0]-centre[0])*n[0]+(p[1]-centre[1])*n[1])/distance;
    return 7.2+(0.83-fraction)*2.25/0.63;
  };
  for(let i=0;i<outer.length;i++) {
    const previous=(i+outer.length-1)%outer.length;
    const v=outer[i],a=face[previous],c=face[i],d=inner[i],ai=scale(a,0.20);
    const toward=(p,q,length)=>mix(p,q,Math.min(1,length/Math.hypot(...sub(q,p))));
    const ag=toward(a,v,5.5),cg=toward(c,v,5.5);
    const ag2=scale(ag,0.83),cg2=scale(cg,0.83),bandCorner=scale(v,0.83);
    const across=sub(c,a),acrossLength=Math.hypot(...across),half=across.map(q=>q/acrossLength*3.8);
    const tt=scale(v,0.39),base=scale(v,0.70),tl=sub(base,half),tr=add(base,half);
    const yl=roofHeight(previous,tl),yr=roofHeight(i,tr),yt=roofHeight(i,tt),ym=(yl+yr)/2;
    // Each broad upper facet is one physical plane. Height comes from the mapped edge, including at the
    // glass boundary, so ear clipping cannot invent folds in a non-planar many-sided polygon.
    const next=(i+1)%outer.length,vn=outer[next],crossNext=sub(face[next],c),crossLength=Math.hypot(...crossNext);
    const tlNext=sub(scale(vn,0.70),crossNext.map(q=>q/crossLength*3.8));
    // One facet spans each whole octagonal side, including under its nave. There is no duplicate vertical
    // join along the nave's centreline, where the roof solids would otherwise share an internal wall.
    roofPatch([d,tt,tr,bandCorner,scale(vn,0.83),tlNext,scale(vn,0.39),inner[next]].map(p=>[p,roofHeight(i,p)]),`roof-sector-${i}-plane`);
    roofPatch([[bandCorner,7.2],[base,ym],[tl,yl]],`roof-sector-${i}-outer-left`);
    roofPatch([[bandCorner,7.2],[tr,yr],[base,ym]],`roof-sector-${i}-outer-right`);
    roofPatch([[ag,4.6],[v,4.6],[bandCorner,7.2],[ag2,7.2]],`outer-hip-band-${i}-left`);
    roofPatch([[v,4.6],[cg,4.6],[cg2,7.2],[bandCorner,7.2]],`outer-hip-band-${i}-right`);
    roofPatch([[tt,yt],[tl,yl],[tr,yr]],`airwell-glass-${i}`,M.glass);
    for(const [j,[p,q,yp,yq]]of [[tt,tl,yt,yl],[tl,tr,yl,yr],[tr,tt,yr,yt]].entries())beam(p,yp+0.04,q,yq+0.04,0.09,M.cream,`airwell-frame-${i}-${j}`);
    beam(tt,yt+0.07,base,ym+0.07,0.055,M.cream,`airwell-mullion-${i}`);
    for(const [j,[p,q]]of [[ag2,bandCorner],[bandCorner,cg2]].entries())beam(p,7.24,q,7.24,0.10,M.tileEdge,`outer-hip-joint-${i}-${j}`);
    // Raised radial naves are independently bounded strips, rather than the whole sector rising to a ridge.
    // Their roof changes pitch at the inner taper and the outer hip; explicit triangles make those intended
    // breaks deterministic. The long middle section keeps a constant9m width in the source roof plan.
    const axis=sub(a,centre),axisLength=Math.hypot(...axis),tangent=[-axis[1]/axisLength,axis[0]/axisLength];
    const levels=[[0.20,1.9,9.48,9.40],[0.40,4.5,9.40,8.72],[0.83,4.5,9.30,7.28],[1,5.5,9.2,4.6]];
    for(let level=0;level<levels.length-1;level++)for(const sign of [-1,1]) {
      const [r0,w0,h0,e0]=levels[level],[r1,w1,h1,e1]=levels[level+1],p0=scale(a,r0),p1=scale(a,r1);
      const q0=add(p0,tangent.map(v=>v*w0*sign)),q1=add(p1,tangent.map(v=>v*w1*sign));
      roofPatch([[p0,h0],[p1,h1],[q1,e1]],`nave-roof-${i}-${level}-${sign}-outer`);
      roofPatch([[p0,h0],[q1,e1],[q0,e0]],`nave-roof-${i}-${level}-${sign}-inner`);
    }
    beam(ai,9.51,a,9.27,0.13,M.light,`radial-roof-ridge-${i}`);
    // A narrow volume under each ridge complements the low perimeter band. Its top stays inside the nave
    // slope, rather than raising a whole-sector collider above the low eaves or glass-airwell valleys.
    const direction=sub(a,centre),distance=Math.hypot(...direction),side=[-direction[1]/distance*1.4,direction[0]/distance*1.4];
    collision([add(ai,side),add(a,side),sub(a,side),sub(ai,side)],4.55,8.05);
    // Entrance gable and the adjacent eaves carry a pale scallop-like valance.
    for(const [j,[p,q,yp,yq]]of [[a,ag,9.2,4.6],[ag,v,4.6,4.6],[v,cg,4.6,4.6],[cg,c,4.6,9.2]].entries()) {
      beam(p,yp-0.05,q,yq-0.05,0.19,M.cream,`eaves-trim-${i}-${j}`,0.20);
      const count=Math.ceil(Math.hypot(...sub(q,p))/0.72);
      for(let k=0;k<count;k++) {
        const t=(k+0.5)/count,pt=mix(p,q,t),y=yp+(yq-yp)*t;
        beam(pt,y-0.13,pt,y-0.38,0.10,M.cream,`eaves-tooth-${i}-${j}-${k}`,0.14);
      }
    }
  }

  // Green open iron perimeter and eight unobstructed central doorway bays.
  for(let i=0;i<outer.length;i++) {
    const a=outer[i],b=outer[(i+1)%outer.length],f=face[i],edge=sub(b,a),length=Math.hypot(...edge),T=edge.map(v=>v/length);
    const N=sub(centre,f),nlen=Math.hypot(...N),N0=N.map(v=>v/nlen);
    const P=(u,inset=0)=>[f[0]+T[0]*u+N0[0]*inset,f[1]+T[1]*u+N0[1]*inset];
    const positions=[-length/2+0.75,-8.0,-5.6,5.6,8.0,length/2-0.75].filter((u,j,all)=>j===0||u-all[j-1]>0.9);
    for(const [j,u]of positions.entries())column(P(u,0.36),`${i}-${j}`);
    beam(P(-length/2+0.6,0.36),4.42,P(length/2-0.6,0.36),4.42,0.19,M.iron,`perimeter-tie-${i}`,0.18);
    // The broad fanlight has actual gaps: curved ribs and spokes sit above the clear entrance.
    const r=4.0,base=4.68,rise=3.0;
    for(let j=0;j<16;j++) {
      const a0=Math.PI*j/16,a1=Math.PI*(j+1)/16;
      beam(P(Math.cos(a0)*r,0.04),base+Math.sin(a0)*rise,P(Math.cos(a1)*r,0.04),base+Math.sin(a1)*rise,0.105,M.iron,`entrance-fan-${i}-arc-${j}`);
    }
    beam(P(-r,0.04),base,P(r,0.04),base,0.14,M.iron,`entrance-fan-${i}-sill`);
    for(let j=1;j<10;j++) {
      const angle=Math.PI*j/10;
      beam(P(Math.cos(angle)*0.9,0.02),base+Math.sin(angle)*0.65,P(Math.cos(angle)*r,0.02),base+Math.sin(angle)*rise,0.085,M.iron,`entrance-fan-${i}-spoke-${j}`);
    }
    // Selective lattice brackets below the low eaves. A small circle and diagonal suggest the iron fretwork.
    for(const side of [-1,1]) {
      const u=side*5.6;
      beam(P(u,0.39),3.55,P(u+side*1.3,0.39),4.24,0.10,M.iron,`iron-bracket-${i}-${side}`);
      for(let j=0;j<10;j++) {
        const t0=j*Math.PI*2/10,t1=(j+1)*Math.PI*2/10,uc=u+side*0.47;
        beam(P(uc+0.25*Math.cos(t0),0.39),4.07+0.25*Math.sin(t0),P(uc+0.25*Math.cos(t1),0.39),4.07+0.25*Math.sin(t1),0.065,M.iron,`iron-rosette-${i}-${side}-${j}`);
      }
    }
    // A few separated counters read as a market. Their gaps preserve the independent radial aisle probes.
    for(const side of [-1,1])for(const radial of [10.5]) {
      const p=P(side*4.3,radial),yaw=Math.atan2(T[1],T[0]);
      kit.box({x:p[0],z:p[1],y:0.13,w:3.8,h:2.35,d:3.3,yaw,material:M.stall,top:M.timber,name:`market-stall-${i}-${side}-${radial}`});
      const front=add(p,N0.map(v=>-1.73*v));
      kit.box({x:front[0],z:front[1],y:2.10,w:3.65,h:0.40,d:0.12,yaw,material:i%3===0?M.red:M.iron,top:M.timber,name:`stall-fascia-${i}-${side}-${radial}`});
    }
  }

  // The cream lantern is a separate, deeply framed mass above the roof; the square clock is much narrower.
  const axis=sub(face[0],centre),axisLength=Math.hypot(...axis),U=axis.map(v=>v/axisLength),V=[-U[1],U[0]],yaw=Math.atan2(U[1],U[0]);
  const P=(u,v)=>[centre[0]+U[0]*u+V[0]*v,centre[1]+U[1]*u+V[1]*v];
  const box=(u,v,y,w,h,d,material,name,turn=0)=>{const p=P(u,v);return kit.box({x:p[0],z:p[1],y,w,h,d,yaw:yaw+turn,material,top:material,name});};
  const square=half=>[P(-half,-half),P(half,-half),P(half,half),P(-half,half)];
  prism(square(3.4),9.48,9.82,M.cream,'lantern-base-cornice');
  prism(square(2.95),9.83,14.25,M.cream,'lantern-body');collision(square(2.95),9.83,14.25);
  for(let side=0;side<4;side++) {
    const angle=side*Math.PI/2,cs=Math.cos(angle),sn=Math.sin(angle),F=(u,v)=>[u*cs-v*sn,u*sn+v*cs];
    const B=(u,v,y,w,h,d,material,name)=>{const q=F(u,v);return box(q[0],q[1],y,w,h,d,material,`${name}-${side}`,angle);};
    for(const u of [-1.02,1.02]) {
      B(u,-2.968,10.19,1.43,3.34,0.065,M.dark,`lantern-window-${u}`);
      for(const x of [-0.55,0.55])B(u+x,-3.022,10.13,0.11,3.50,0.11,M.light,`lantern-window-jamb-${u}-${x}`);
      for(let j=0;j<7;j++) {
        const t=j*Math.PI/6;
        const left=F(u+Math.cos(t)*0.65,-3.05),next=F(u+Math.cos(t+Math.PI/6)*0.65,-3.05);
        if(j<6)beam(P(...left),13.10+Math.sin(t)*0.65,P(...next),13.10+Math.sin(t+Math.PI/6)*0.65,0.11,M.light,`lantern-window-arch-${side}-${u}-${j}`);
      }
      B(u,-3.095,10.14,0.08,3.19,0.07,M.cream,`lantern-mullion-${u}`);
      B(u,-3.14,11.56,1.35,0.09,0.07,M.cream,`lantern-transom-${u}`);
    }
    for(const u of [-2.74,0,2.74])B(u,-3.0,9.93,0.28,4.26,0.19,M.light,`lantern-pilaster-${u}`);
  }
  prism(square(3.3),14.27,14.52,M.light,'lantern-cornice');
  kit.loft({ring:square(3.35),topRing:square(2.03),y0:14.55,y1:15.43,material:M.cream,top:M.cream,name:'lantern-hip'});
  collision(square(3.1),14.25,15.43);
  prism(square(2.12),15.45,15.67,M.light,'clock-sill');
  prism(square(1.94),15.70,18.50,M.cream,'clock-body');collision(square(1.94),15.45,19.1);
  for(let side=0;side<4;side++) {
    const a=side*Math.PI/2,cs=Math.cos(a),sn=Math.sin(a),F=(u,v)=>P(u*cs-v*sn,u*sn+v*cs);
    // Segmented disks are raised 3cm from the wall and all decorations sit further forward.
    for(let j=0;j<24;j++) {
      const dy=-1.18+(j+0.5)*2.36/24,w=2*Math.sqrt(1.18**2-dy**2),p=F(0,-1.985);
      kit.box({x:p[0],z:p[1],y:17.08+dy-2.36/48,w,h:2.36/24,d:0.045,yaw:yaw+a,material:M.dark,top:M.dark,name:`clock-dial-${side}-${j}`});
    }
    for(let j=0;j<12;j++) {
      const t=Math.PI*2*j/12,u=Math.sin(t)*0.94,y=17.08+Math.cos(t)*0.94,p=F(u,-2.035);
      kit.box({x:p[0],z:p[1],y:y-0.07,w:0.12,h:0.14,d:0.035,yaw:yaw+a,material:M.light,top:M.light,name:`clock-hour-${side}-${j}`});
    }
    beam(F(0,-2.075),17.08,F(0,-2.075),17.81,0.07,M.light,`clock-minute-${side}`,0.035);
    beam(F(0,-2.11),17.08,F(-0.48,-2.11),17.35,0.09,M.light,`clock-hour-hand-${side}`,0.035);
  }
  kit.loft({ring:square(2.12),topRing:square(0.70),y0:18.55,y1:19.65,material:M.cream,top:M.light,name:'clock-pyramidal-roof'});
  collision(square(1.3),18.50,19.65);
  // Openwork spire keeps the fine Victorian silhouette without a heavy conical cap.
  for(const u of [-0.83,0.83])for(const v of [-0.83,0.83]) {
    beam(P(u,v),19.25,P(0,0),21.50,0.075,M.light,`spire-rib-${u}-${v}`);
    beam(P(u,v),19.25,P(-u,-v),20.10,0.045,M.light,`spire-lattice-${u}-${v}`);
  }
  kit.cylinder({x:centre[0],z:centre[1],y0:21.40,y1:22,r:0.055,segments:8,material:M.light,top:M.light,name:'clock-finial'});
}
