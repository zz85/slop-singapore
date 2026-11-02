// The paired heritage entrance pavilions in Raffles Place Park. Footprints and orientation are mapped; the
// Dutch-style gables, mouldings, ornaments and roof details are photo-guided. See docs/raffles-place-mrt.md.
export const info = { name: 'Raffles Place MRT', height: 7 };

const FONT={
  A:['010','101','111','101','101'],B:['110','101','110','101','110'],C:['011','100','100','100','011'],
  E:['111','100','110','100','111'],F:['111','100','110','100','100'],I:['111','010','010','010','111'],
  L:['100','100','100','100','111'],N:['101','111','111','111','101'],P:['110','101','110','100','100'],
  R:['110','101','110','101','101'],S:['011','100','010','001','110'],T:['111','010','010','010','010'],
  W:['101','101','111','111','101'],X:['101','101','010','101','101'],
  1:['010','110','010','010','111'],2:['110','001','010','100','111'],4:['101','101','111','001','001'],6:['011','100','110','101','010']
};

export function build(kit,site){
  const M={
    stone:kit.material(0xd1d5cf),trim:kit.material(0xeeeee6),relief:kit.material(0xaeb8af),
    glass:kit.glassMaterial(0x7f9b96),dark:kit.material(0x283331),floor:kit.material(0x777e78),
    steps:kit.material(0x505955),metal:kit.material(0x333d3a),red:kit.material(0xb94947),green:kit.material(0x3e815c),
    mint:kit.glassMaterial(0xa3bba3),yellow:kit.glassMaterial(0xc8bb8e),blue:kit.glassMaterial(0x7497a8),roofGlass:kit.glassMaterial(0xb8c6ba)
  };
  const east=kit.compass(90),entrances=[];
  for(const [id,label,direction]of [[106193391,'A',1],[106193387,'B',-1]]){
    const mapped=site.parts.find(p=>p.id===id);
    if(!mapped?.ring?.length)throw new Error(`Raffles Place MRT needs mapped pavilion ${id}`);
    let edge=[0,0],best=0;
    for(let i=0;i<mapped.ring.length;i++){
      const a=mapped.ring[i],b=mapped.ring[(i+1)%mapped.ring.length],v=[b[0]-a[0],b[1]-a[1]],d=v[0]*east[0]+v[1]*east[1];
      if(Math.abs(d)>best){best=Math.abs(d);edge=d>0?v:v.map(x=>-x);}
    }
    const length=Math.hypot(...edge),E=edge.map(x=>x/length*direction),S=[-E[1],E[0]];
    const project=(p,a)=>p[0]*a[0]+p[1]*a[1];
    const us=mapped.ring.map(p=>project(p,E)),vs=mapped.ring.map(p=>project(p,S));
    const ou=(Math.min(...us)+Math.max(...us))/2,ov=(Math.min(...vs)+Math.max(...vs))/2;
    const W=Math.max(...us)-Math.min(...us),D=Math.max(...vs)-Math.min(...vs),hx=W/2,hz=D/2,front=-hz;
    const P=(u,v)=>[E[0]*(u+ou)+S[0]*(v+ov),E[1]*(u+ou)+S[1]*(v+ov)];
    const ring=pts=>pts.map(([u,v])=>P(u,v));
    const rect=(u,v,w,d)=>ring([[u-w/2,v-d/2],[u+w/2,v-d/2],[u+w/2,v+d/2],[u-w/2,v+d/2]]);
    const tag=name=>`${label}-${name}`;
    const collidable=p=>{kit.collisionPrism(p);return p;};
    const B=(u,v,y,w,h,d,material,name)=>{
      const [x,z]=P(u,v);
      return kit.box({x,z,y,w,h,d,yaw:Math.atan2(E[1],E[0]),material,top:material,name:tag(name)});
    };
    const C=(u,v,y0,y1,r,material,name,segments=12)=>{
      const [x,z]=P(u,v);
      return kit.cylinder({x,z,y0,y1,r,segments,material,top:material,name:tag(name)});
    };
    const prism=(points,y0,y1,material,name)=>kit.prism({ring:points,y0,y1,material,top:material,name:tag(name)});
    const rod=(u,v,y,tu,tv,ty,w,material,name)=>kit.loft({ring:rect(u,v,w,w),topRing:rect(tu,tv,w,w),y0:y,y1:ty,material,top:material,name:tag(name)});

    // The entrance is genuinely open at eye level. Only the side/rear walls, individual piers and overhead
    // structures have tall collision; no filled footprint slab turns the whole pavilion into a solid block.
    B(0,front-2.0,0.18,W+3.2,0.1,6.5,M.floor,'paved-approach');
    entrances.push(P(0,front-2.8));
    B(0,front+1.87,0.2,W-0.3,0.37,3.5,M.floor,'entrance-landing');
    for(let i=0;i<3;i++)B(0,front-0.8+i*0.35,0.28+i*0.1,W-0.9,0.09,0.34,M.steps,`approach-step-${i}`);
    B(0,1,0.27,W-0.7,0.06,D-4,M.dark,'interior-floor');
    for(const side of [-1,1]){
      collidable(B(side*(hx-0.15),0,0,0.3,4.43,D,M.stone,`side-wall-${side}`));
      B(side*(hx-0.12),0,0.4,0.5,0.19,D-0.15,M.trim,`side-plinth-${side}`);
      B(side*(hx-0.14),0,4.44,0.4,0.12,D-0.15,M.trim,`side-coping-${side}`);
      // Quiet horizontal masonry joints on the long elevations.
      for(let i=0;i<6;i++)B(side*(hx+0.012),0,0.95+i*0.49,0.024,0.022,D-0.7,M.relief,`side-joint-${side}-${i}`);
    }
    collidable(B(0,hz-0.25,0,W-0.5,4.4,0.4,M.stone,'rear-wall'));
    B(0,front+5.4,0.15,W-0.9,2.7,0.08,M.dark,'shadowed-interior');
    for(let i=0;i<9;i++){
      B(0,front+2.8+i*0.22,0.53-i*0.025,W*0.52,0.024,0.2,M.steps,`descending-tread-${i}`);
    }

    // Four plain pilasters support a glazed clerestory and three open doorway bays.
    for(const [i,u]of [-hx+0.35,-W*0.18,W*0.18,hx-0.35].entries()){
      collidable(B(u,front,0.0,0.84,4.25,0.7,M.stone,`entrance-pier-${i}`));
      B(u,front-0.06,0.0,1.05,0.65,1.0,M.trim,`pier-plinth-${i}`);
      B(u,front-0.06,4.12,0.88,0.18,0.85,M.trim,`pier-capital-${i}`);
      B(u,front-0.08,4.32,1.0,0.06,0.92,M.trim,`pier-abacus-${i}`);
    }
    const bays=[[-W*0.33,W*0.245],[0,W*0.30],[W*0.33,W*0.245]];
    for(const [i,[u,w]]of bays.entries()){
      collidable(B(u,front+0.04,2.77,w,1.28,0.07,M.glass,`clerestory-glass-${i}`));
      B(u,front-0.025,2.64,w+0.1,0.075,0.12,M.trim,`clerestory-sill-${i}`);
      B(u,front-0.03,4.08,w+0.1,0.07,0.14,M.trim,`clerestory-header-${i}`);
    }
    collidable(B(0,front,4.46,W+0.15,0.22,0.7,M.trim,'entrance-entablature'));
    B(0,front-0.06,4.72,W+0.32,0.13,0.78,M.trim,'projecting-cornice');

    // A sampled curving gable is masonry, not a triangular texture: low shoulders curl up to the central finial.
    const profile=[[0,8.35],[0.07,8.2],[0.18,7.78],[0.33,7.3],[0.41,7.12],[0.45,7.24],[0.49,7.15],[0.84,5.68],[0.9,5.57],[0.95,5.66],[1,5.72]];
    const top=u=>{
      const t=Math.min(1,Math.abs(u)/hx);
      const i=profile.findIndex((p,j)=>j>0&&p[0]>=t),index=i<0?profile.length-1:i,a=profile[index-1],b=profile[index];
      const prev=profile[Math.max(0,index-2)],next=profile[Math.min(profile.length-1,index+1)],span=b[0]-a[0],f=(t-a[0])/span;
      const m0=index===1?0:(b[1]-prev[1])/(b[0]-prev[0]),m1=(next[1]-a[1])/(next[0]-a[0]);
      return (2*f**3-3*f*f+1)*a[1]+(f**3-2*f*f+f)*span*m0+(-2*f**3+3*f*f)*b[1]+(f**3-f*f)*span*m1;
    };
    const slices=88,step=W/slices;
    for(let i=0;i<slices;i++){
      const u=-hx+(i+0.5)*step,points=rect(u,front,step,0.38);
      const height=(x,z)=>top(project([x,z],E)-ou);
      collidable(prism(points,4.86,height,M.stone,`gable-masonry-${i}`));
      const copingY=(x,z)=>height(x,z)+0.08;
      prism(rect(u,front-0.24,step,0.16),Math.min(top(u-step/2),top(u+step/2))-0.04,copingY,M.trim,`gable-coping-${i}`);
    }
    B(0,front-0.23,5.31,W-0.12,0.1,0.18,M.trim,'gable-stringcourse');

    function panel(u,y,w,h,name){
      B(u,front-0.23,y,w,h,0.055,M.relief,`${name}-recess`);
      B(u,front-0.27,y+0.065,w-0.13,h-0.13,0.055,M.stone,`${name}-raised`);
    }
    function disk(u,y,r,material,name,v=front-0.32){
      const rows=16,h=2*r/rows;
      for(let i=0;i<rows;i++){
        const dy=-r+(i+0.5)*h,half=Math.sqrt(Math.max(0,r*r-dy*dy));
        B(u,v,y+dy-h/2,half*2,h,0.035,material,`${name}-${i}`);
      }
    }
    function circle(u,y,r,thickness,name){
      const rows=18,h=2*r/rows;
      for(let i=0;i<rows;i++){
        const dy=-r+(i+0.5)*h,outer=Math.sqrt(Math.max(0,r*r-dy*dy)),inner=Math.sqrt(Math.max(0,(r-thickness)**2-dy*dy));
        if(inner>0)for(const side of [-1,1])B(u+side*(outer+inner)/2,front-0.39,y+dy-h/2,outer-inner,h,0.07,M.trim,`${name}-${i}-${side}`);
        else B(u,front-0.39,y+dy-h/2,2*outer,h,0.07,M.trim,`${name}-${i}`);
      }
    }
    // Three round grille ornaments, narrow engaged pilasters, plaster panels and swag-like relief.
    for(const [i,u]of [-W*0.14,0,W*0.14].entries()){
      panel(u,5.65,W*0.12,0.64,`lower-panel-${i}`);
      disk(u,6.78,0.28,M.relief,`round-vent-${i}`);
      circle(u,6.78,0.30,0.055,`vent-surround-${i}`);
      for(const n of [-1,0,1])B(u+n*0.105,front-0.45,6.55,0.028,0.46,0.035,M.trim,`vent-grille-v-${i}-${n}`);
      for(const n of [-1,0,1])B(u,front-0.50,6.78+n*0.105,0.46,0.028,0.035,M.trim,`vent-grille-h-${i}-${n}`);
    }
    for(const [i,u]of [-W*0.215,-W*0.073,W*0.073,W*0.215].entries()){
      B(u,front-0.30,5.4,0.12,1.84,0.16,M.trim,`upper-pilaster-${i}`);
      B(u,front-0.44,7.26,0.27,0.09,0.16,M.trim,`upper-capital-${i}`);
      B(u,front-0.31,7.4,0.33,0.065,0.23,M.trim,`upper-abacus-${i}`);
    }
    for(const side of [-1,1]){
      panel(side*W*0.29,5.85,W*0.10,0.43,`shoulder-panel-${side}`);
      panel(side*W*0.35,5.35,W*0.20,0.22,`side-panel-${side}`);
    }
    for(const [i,u,w]of [[0,-W*0.35,W*0.22],[1,-W*0.14,W*0.11],[2,0,W*0.11],[3,W*0.14,W*0.11],[4,W*0.35,W*0.22]]){
      for(let j=0;j<13;j++){
        const t=(j+0.5)/13;
        const base=i===0||i===4?5.35:5.72,drop=i===0||i===4?0.20:0.25;
        B(u+(t-0.5)*w,front-0.37,base+drop*(2*t-1)**2,w/15,0.055,0.065,M.trim,`plaster-swag-${i}-${j}`);
      }
    }
    B(0,front-0.31,5.04,W*0.43,0.06,0.20,M.trim,'baluster-base');
    B(0,front-0.38,5.42,W*0.43,0.06,0.22,M.trim,'baluster-rail');
    for(let i=0;i<20;i++)B((i-9.5)*W*0.021,front-0.31,5.13,0.055,0.26,0.11,M.trim,`gable-baluster-${i}`);

    function urn(u,y,r,name){
      C(u,front,y,y+0.12,r*1.2,M.trim,`${name}-base`);
      C(u,front,y+0.13,y+0.38,r,M.stone,`${name}-neck`);
      kit.loft({ring:rect(u,front,r*2.5,r*2.5),y0:y+0.39,y1:y+0.62,scale:0.35,material:M.trim,top:M.trim,name:tag(`${name}-cap`)});
    }
    for(const [i,u]of [-hx+0.23,-W*0.225,W*0.225,hx-0.23].entries())urn(u,top(u)+0.03,0.17,`shoulder-urn-${i}`);
    urn(0,8.35,0.22,'central-urn');
    C(0,front,8.99,9.13,0.085,M.trim,'finial-collar');
    kit.loft({ring:rect(0,front,0.16,0.16),y0:9.15,y1:10.15,scale:0.01,material:M.trim,top:M.trim,name:tag('central-finial')});

    // The roof is solid above the doorway, with a shallow coloured-glass gable and narrow white framing.
    collidable(prism(rect(0,0.2,W-0.18,D-0.65),4.5,4.85,M.trim,'roof-slab'));
    const roofHalf=hx-0.3,roofD=D-1.2,rows=10;
    for(const side of [-1,1])for(let i=0;i<rows;i++)for(let band=0;band<3;band++){
      const u=side*(band+0.5)*roofHalf/3,v=-roofD/2+(i+0.5)*roofD/rows;
      const points=rect(u,v,roofHalf/3,roofD/rows),centre=P(0,0);
      const roofY=(x,z)=>6.65-Math.abs((x-centre[0])*E[0]+(z-centre[1])*E[1])*1.55/roofHalf;
      const material=[M.mint,M.yellow,M.blue][(i+band+(side>0?1:0))%3];
      collidable(prism([points[0],points[1],points[2]],4.93,roofY,M.roofGlass,`roof-glass-${side}-${i}-${band}-clear`));
      collidable(prism([points[0],points[2],points[3]],4.93,roofY,material,`roof-glass-${side}-${i}-${band}-colour`));
    }
    for(let i=0;i<=rows;i++){
      const v=-roofD/2+i*roofD/rows;
      for(const side of [-1,1])rod(side*roofHalf,v,5.15,side*0.11,v,6.74,0.075,M.trim,`skylight-rib-${side}-${i}`);
    }
    B(0,0,6.77,0.29,0.08,roofD+0.2,M.trim,'skylight-ridge');

    // Small station plaque in front of the clerestory. Letters are geometry, avoiding fonts/textures/downloads.
    function text(value,u,y,pixel,material,name){
      const advance=pixel*4,start=value.length*advance/2;
      for(const [i,letter]of [...value].entries())for(const [row,bits]of (FONT[letter]||[]).entries())for(const match of bits.matchAll(/1+/g)){
        const w=match[0].length*pixel;
        B(u+start-i*advance-match.index*pixel-w/2,front-0.29,y+(4-row)*pixel,w,pixel*0.82,0.025,material,`${name}-${i}-${row}-${match.index}`);
      }
    }
    B(0,front-0.19,3.16,3.5,0.3,0.055,M.dark,'station-plaque');
    B(1.38,front-0.235,3.20,0.58,0.22,0.025,M.red,'NS26-badge');
    B(0.72,front-0.235,3.20,0.58,0.22,0.025,M.green,'EW14-badge');
    text('NS26',1.38,3.23,0.032,M.trim,'NS26-text');
    text('EW14',0.72,3.23,0.032,M.trim,'EW14-text');
    text('RAFFLES PLACE',-0.66,3.23,0.037,M.trim,'station-name');

    // Rosettes on the lower piers and restrained park lamps, matching the cast-metal lantern silhouettes.
    for(const [i,u]of [-hx+0.35,-W*0.18,W*0.18,hx-0.35].entries()){
      disk(u,3.86,0.115,M.relief,`pier-rosette-${i}`,front-0.41);
    }
    for(const side of [-1,1]){
      const u=side*(hx+1.05),v=front-2.0;
      C(u,v,0,0.24,0.15,M.metal,`lamp-base-${side}`);
      C(u,v,0.26,3.2,0.055,M.metal,`lamp-post-${side}`,8);
      B(u,v,3.25,0.33,0.48,0.33,M.glass,`lamp-glass-${side}`);
      for(const a of [-1,1])for(const b of [-1,1])B(u+a*0.17,v+b*0.17,3.24,0.035,0.51,0.035,M.metal,`lamp-frame-${side}-${a}-${b}`);
      kit.loft({ring:rect(u,v,0.49,0.49),y0:3.78,y1:4.02,scale:0.06,material:M.metal,top:M.metal,name:tag(`lamp-roof-${side}`)});
      C(u,v,4.04,4.12,0.035,M.metal,`lamp-finial-${side}`,8);
    }
  }
  // The photographed park has a paved pedestrian connection, rather than grass running into the stair mouths.
  // This thin walkable strip links the two approach aprons without filling the surrounding lawn.
  const [a,b]=entrances,dx=b[0]-a[0],dz=b[1]-a[1];
  kit.box({x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,y:0.16,w:3.0,h:0.1,d:Math.hypot(dx,dz),yaw:Math.atan2(-dx,dz),material:M.floor,top:M.floor,name:'park-connecting-path'});
}
