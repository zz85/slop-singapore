// Raffles Hotel: mapped wings around real courts, not a single extrusion. Drawing coordinates are metres,
// right/back on the hotel visitor plan; see docs/raffles-hotel.md for the source geometry and estimated heights.
export const info = { name: 'Raffles Hotel', height: 26.4 };

const COLORS = { white:0xf1eee4, trim:0xfffbef, shade:0xc9c7b9, roof:0xb55f43, ridge:0x873f30,
  green:0x315c4e, glass:0x52655c, cream:0xd6bf91, paving:0xc5bda7, lawn:0x759453,
  leaf:0x49734d, trunk:0x89705a, water:0x439eac, iron:0x52645a, gold:0xa58b4f };

export function build(kit, site) {
  const mapped = site.parts.find(p=>p.id===254815862);
  if (!mapped?.ring?.length) throw new Error('Raffles Hotel needs mapped way 254815862');
  const U=kit.compass(37.1), V=kit.compass(307.1);
  const dot=(p,a)=>p[0]*a[0]+p[1]*a[1];
  const ou=Math.min(...mapped.ring.map(p=>dot(p,U)))+10.25;
  const ov=Math.min(...mapped.ring.map(p=>dot(p,V)))-0.28;
  const P=(u,v)=>[(u+ou)*U[0]+(v+ov)*V[0],(u+ou)*U[1]+(v+ov)*V[1]];
  const R=points=>points.map(p=>P(...p));
  const M=Object.fromEntries(Object.entries(COLORS).map(([k,c])=>[k,k==='water'||k==='glass'?kit.glassMaterial(c):kit.material(c)]));
  const yaw=Math.atan2(U[1],U[0]);
  const rect=(a,b,c,d)=>R([[a,c],[b,c],[b,d],[a,d]]);
  function box(u,v,y,w,h,d,m,name,turn=0) {
    // U/right and V/back form a reflected drawing basis in the city's x/z plane.
    const [x,z]=P(u,v);return kit.box({x,z,y,w,h,d,yaw:yaw-turn,material:m,top:m,name});
  }
  function volume(ring,y0,y1,m,name) {
    const p=kit.prism({ring,y0,y1,material:m,top:m,name});kit.collisionPrism({ring,y0,y1});return p;
  }
  function cylinder(u,v,y0,y1,r,m,name,n=10) {
    const [x,z]=P(u,v);return kit.cylinder({x,z,y0,y1,r,segments:n,material:m,top:m,name});
  }
  // An actual hip: four trapezoid slopes to a narrow ridge, not a scaled-up pyramid or a flat red lid.
  function hip(a,b,c,d,eave,rise,name) {
    const w=b-a,h=d-c,cut=Math.min(w,h)*.43;
    const outer=[[a,c],[b,c],[b,d],[a,d]];
    const inner=w>h?[[a+cut,(c+d)/2-.1],[b-cut,(c+d)/2-.1],[b-cut,(c+d)/2+.1],[a+cut,(c+d)/2+.1]]:
      [[(a+b)/2-.1,c+cut],[(a+b)/2+.1,c+cut],[(a+b)/2+.1,d-cut],[(a+b)/2-.1,d-cut]];
    kit.loft({ring:R(outer),topRing:R(inner),y0:eave,y1:eave+rise,material:M.roof,top:M.ridge,name});
    // Conservative roof collision stays inside the lower footprint, preserving the surrounding gardens.
    kit.collisionPrism({ring:rect(a+.3,b-.3,c+.3,d-.3),y0:eave,y1:eave+rise-.15});
    box((a+b)/2,(c+d)/2,eave+rise+.02,w>h?w-2*cut:.24,.17,w>h?.24:h-2*cut,M.ridge,name+'-ridge');
  }
  // Face coordinates: s along an edge, n outward. Endpoints are in plan metres.
  function face(a,b) {
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]),tx=(b[0]-a[0])/length,tv=(b[1]-a[1])/length;
    const at=(s,n)=>[a[0]+tx*s+tv*n,a[1]+tv*s-tx*n];
    const ringAt=(s0,s1,n0,n1)=>R([at(s0,n0),at(s1,n0),at(s1,n1),at(s0,n1)]);
    return {length,at,ringAt,box(s,n,y,w,h,d,m,name){const [u,v]=at(s,n);return box(u,v,y,w,h,d,m,name,Math.atan2(tv,tx));}};
  }
  function column(F,s,y,h,name,round=false) {
    const [u,v]=F.at(s,.08);
    F.box(s,.08,y,.65,.22,.65,M.trim,name+'-base');
    if(round)cylinder(u,v,y+.22,y+h-.24,.21,M.white,name+'-shaft',10);
    else F.box(s,.08,y+.22,.38,h-.46,.38,M.white,name+'-shaft');
    F.box(s,.08,y+h-.24,.65,.24,.65,M.trim,name+'-capital');
  }
  // An arched pane with a curved, raised surround. Horizontal loft slices describe a round arch with real
  // silhouette/depth, and share only opposite-facing boundaries. No decal, external texture or font is needed.
  function arch(F,s,n,y,w,h,name,segments=4) {
    const r=w/2,spring=y+h-r;
    F.box(s,n,y,w,h-r,.06,M.glass,name+'-pane');
    F.box(s-w/2-.09,n+.04,y,.18,h-r,.16,M.cream,name+'-left');
    F.box(s+w/2+.09,n+.04,y,.18,h-r,.16,M.cream,name+'-right');
    for(let i=0;i<segments;i++) {
      const y0=r*i/segments,y1=r*(i+1)/segments;
      const x0=Math.sqrt(Math.max(0,r*r-y0*y0)),x1=Math.sqrt(Math.max(.001,r*r-y1*y1));
      kit.loft({ring:F.ringAt(s-x0,s+x0,n-.03,n+.03),topRing:F.ringAt(s-x1,s+x1,n-.03,n+.03),y0:spring+y0,y1:spring+y1,material:M.glass,top:M.glass,name:name+'-curve-'+i});
      const outer0=Math.sqrt(Math.max(0,(r+.18)**2-y0*y0)),outer1=Math.sqrt(Math.max(0,(r+.18)**2-y1*y1));
      for(const side of [-1,1])kit.loft({ring:F.ringAt(s+side*x0,s+side*outer0,n,n+.16),topRing:F.ringAt(s+side*x1,s+side*outer1,n,n+.16),y0:spring+y0,y1:spring+y1,material:M.cream,top:M.cream,name:name+'-architrave-'+side+'-'+i});
    }
    F.box(s,n+.10,y,w,.12,.19,M.trim,name+'-sill');
    F.box(s,n+.24,y+.13,.07,h-.18,.055,M.cream,name+'-mullion');
    F.box(s,n+.31,spring-.17,w,.10,.05,M.cream,name+'-transom');
  }
  function openArch(F,s,y,w,name) {
    const r=w/2,spring=y+4.7-r;
    for(let i=0;i<3;i++) {
      const h0=r*i/3,h1=r*(i+1)/3;
      const x0=Math.sqrt(Math.max(.001,r*r-h0*h0)),x1=Math.sqrt(Math.max(.001,r*r-h1*h1));
      for(const side of [-1,1])kit.loft({ring:F.ringAt(s+side*x0,s+side*(r+.18),-.14,.18),topRing:F.ringAt(s+side*x1,s+side*(r+.18),-.14,.18),y0:spring+h0,y1:spring+h1,material:M.white,top:M.white,name:name+'-'+i+'-'+side});
    }
  }
  function rail(F,y,name,bays) {
    F.box(F.length/2,.09,y,F.length-.6,.16,.27,M.green,name+'-bottom');
    F.box(F.length/2,.09,y+1.0,F.length-.6,.15,.30,M.trim,name+'-top');
    const n=Math.floor(F.length/2.6);
    for(let i=0;i<n;i++) {
      const s=(i+.5)*F.length/n;
      if(Array.from({length:bays+1},(_,j)=>.7+j*(F.length-1.4)/bays).some(c=>Math.abs(c-s)<.4))continue;
      F.box(s,.09,y+.17,.14,.81,.16,M.green,name+'-baluster-'+i);
    }
  }
  function wing(a,b,c,d,floors,name,{verandas=true,eave=floors*5.1+.5}={}) {
    // The room block is recessed behind the colonnade. The veranda edge and its columns are separate solids.
    const inset=verandas?1.7:0;
    volume(rect(a+inset,b-inset,c+inset,d-inset),.0,eave,M.white,name+'-rooms');
    const faces=[face([a,c],[b,c]),face([b,c],[b,d]),face([b,d],[a,d]),face([a,d],[a,c])];
    for(let k=0;k<faces.length;k++) {
      const F=faces[k],bays=Math.max(1,Math.round((F.length-1.4)/5.2));
      const longSide=F.length>=Math.max(b-a,d-c)-.1;
      if(!longSide) {
        for(let f=0;f<floors;f++)for(let i=0;i<bays;i++) {
          F.box((i+.5)*F.length/bays,-inset+.08,f*5.1+1.1,1.6,3.0,.12,M.cream,name+'-end-surround-'+k+'-'+f+'-'+i);
          F.box((i+.5)*F.length/bays,-inset+.16,f*5.1+1.25,1.3,2.7,.05,M.glass,name+'-end-pane-'+k+'-'+f+'-'+i);
        }
        continue;
      }
      for(let floor=0;floor<floors;floor++) {
        const y=floor*5.1;
        F.box(F.length/2,-.65,y+.15,F.length-.25,.23,2.1,M.shade,name+'-veranda-floor-'+k+'-'+floor);
        const columnHeight=(floor===floors-1?eave-.80-y:4.87);
        for(let j=0;j<=bays;j++)F.box(.7+j*(F.length-1.4)/bays,.08,y+.38,.42,columnHeight,.42,M.white,'veranda-column-'+name+'-'+k+'-'+floor+'-'+j);
        for(let j=0;j<bays;j++) {
          const s=.7+(j+.5)*(F.length-1.4)/bays;
          F.box(s,-inset+.05,y+1.0,1.48,3.1,.07,M.cream,name+'-door-frame-'+k+'-'+floor+'-'+j);
          F.box(s,-inset+.10,y+1.17,1.18,2.75,.035,M.glass,name+'-door-'+k+'-'+floor+'-'+j);
          if(floor===0&&((name==='garden-wing'&&k===0)||(name==='palm-wing'&&k===3)))openArch(F,s,y,(F.length-1.4)/bays-.44,name+'-open-arch-'+j);
        }
        if(floor>0)rail(F,y+.42,name+'-rail-'+k+'-'+floor,bays);
      }
      F.box(F.length/2,-.06,eave-.42,F.length-.15,.42,.52,M.trim,name+'-cornice-'+k);
    }
    hip(a-.45,b+.45,c-.45,d+.45,eave,Math.min(3.1,Math.min(b-a,d-c)*.24),name+'-roof');
  }

  // Main building: projecting clipped corners, tall front and lower rear pool terrace. The open courts are
  // never covered by a property-wide plinth or a collision rectangle.
  volume(R([[25,22],[31,17],[30,15],[54,16],[59,23],[57,59],[23,57]]),0,17.75,M.white,'main-body');
  const front=face([30,15],[54,16]);
  for(const [floor,y]of [[0,.7],[1,6.2],[2,11.55]]) {
    for(let i=0;i<9;i++)arch(front,(i+.5)*front.length/9,.08,y,1.66,4.0,'main-arch-'+floor+'-'+i);
    for(let i=0;i<=9;i++)column(front,i*front.length/9,y-.1,4.6,'main-pilaster-'+floor+'-'+i,true);
    front.box(front.length/2,.18,y+4.67,front.length,.32,.62,M.trim,'main-stringcourse-'+floor);
  }
  for(const y of [5.85,11.2])front.box(front.length/2,.55,y,8.5,.23,1.5,M.trim,'main-central-balcony-'+y);
  // Green roof balusters and white parapet piers flank the central pediment in the Beach Road photograph.
  for(const [a,b]of [[.4,7.1],[16.9,23.6]]) {
    front.box((a+b)/2,.18,17.48,b-a,.16,.30,M.trim,'main-parapet-sill-'+a);
    front.box((a+b)/2,.18,18.35,b-a,.18,.38,M.trim,'main-parapet-cap-'+a);
    for(let s=a+.35;s<b;s+=.55)front.box(s,.18,17.68,.15,.63,.19,M.green,'main-parapet-baluster-'+s);
    for(const s of [a,b])front.box(s,.18,17.64,.35,.71,.38,M.trim,'main-parapet-pier-'+s);
  }
  for(const [i,pts]of [[0,[[20,16],[26,11],[31,17],[25,22]]],[1,[[54,16],[59,12],[64,19],[59,23]]]]) {
    const ring=R(pts);volume(ring,0,18.35,M.white,'main-corner-'+i);
    for(let j=0;j<3;j++) {
      const F=face(pts[j],pts[j+1]);
      for(let f=0;f<3;f++)for(let k=0;k<2;k++)arch(F,(k+.5)*F.length/2,.12,f*5.3+.85,1.45,3.7,'main-corner-window-'+i+'-'+j+'-'+f+'-'+k);
      for(const y of [5.55,10.85,17.65])F.box(F.length/2,.20,y,F.length-.2,.24,.50,M.trim,'main-corner-cornice-'+i+'-'+j+'-'+y);
    }
    kit.loft({ring:kit.inset(ring,-.25),topRing:kit.inset(ring,1.8),y0:18.35,y1:20.1,material:M.roof,top:M.roof,name:'main-corner-roof-'+i});
    kit.collisionPrism({ring:kit.inset(ring,.1),y0:18.15,y1:20.0});
  }
  // The lower hip is truncated under the clerestory. A full pointed hip would leave the upper roof floating
  // above it at every corner. Both roof tiers meet the same rectangular ventilation band.
  kit.loft({ring:rect(24,58,20,61),topRing:rect(29,53,26,54),y0:17.75,y1:20.05,material:M.roof,top:M.roof,name:'main-lower-roof'});
  kit.collisionPrism({ring:rect(24.3,57.7,20.3,60.7),y0:17.4,y1:20.05});
  volume(rect(29,53,26,54),20.05,20.68,M.shade,'main-clerestory');
  hip(28.6,53.4,25.6,54.4,20.68,1.25,'main-upper-roof');
  for(let v=36.5;v<44;v+=1.2)box(41,v,21.95,.16,.48,.18,M.trim,'main-ridge-crest-'+v);
  // Pediment in the facade's vertical plane, assembled from a tapered loft with a triangular side profile.
  const ped=front.ringAt(front.length/2-4.6,front.length/2+4.6,.35,1.0);
  kit.loft({ring:ped,topRing:front.ringAt(front.length/2-.04,front.length/2+.04,.35,1.0),y0:17.25,y1:19.55,material:M.trim,top:M.trim,name:'main-pediment'});
  front.box(front.length/2,.7,16.65,9.6,.55,.85,M.trim,'main-pediment-base');
  // Carriage porch is open below its roof. Its roof and columns all have explicit upper collision.
  const porch=face([32,7.8],[51,8.7]);
  for(let i=0;i<6;i++)column(porch,.6+i*(porch.length-1.2)/5,.22,4.45,'main-porch-column-'+i,true);
  volume(rect(31.5,52,8,15.1),4.67,4.92,M.trim,'main-porch-entablature');
  hip(31.1,52.4,7.6,15.5,4.98,1.75,'main-porch-roof');
  cylinder(41.7,16.8,19.55,26.4,.075,M.iron,'main-flagpole',8);
  box(43.0,16.8,24.65,2.45,1.25,.07,M.green,'main-flag');
  const lettering=P(...front.at(front.length/2,1.25));
  const origin=P(...front.at(0,0)),out=P(...front.at(0,1));
  kit.sign({text:'RAFFLES HOTEL',x:lettering[0],z:lettering[1],y:16.73,height:.4,width:8.3,yaw:Math.atan2(out[0]-origin[0],out[1]-origin[1]),color:COLORS.iron,bar:false,name:'main-hotel-lettering'});
  for(const F of [face([23,57],[25,23]),face([59,23],[57,59])]) {
    for(let f=0;f<3;f++)for(let i=0;i<8;i++)arch(F,(i+.5)*F.length/8,.08,f*5.3+.9,1.55,3.65,'main-side-arch-'+F.at(0,0)[0]+'-'+f+'-'+i,3);
    for(const y of [5.5,10.8,16.8])F.box(F.length/2,.16,y,F.length-.6,.22,.44,M.trim,'main-side-cornice-'+F.at(0,0)[0]+'-'+y);
  }
  volume(rect(23,54,60,127.6),0,11.1,M.white,'main-rear-rooms');
  volume(rect(31.5,40.1,127.6,136.3),0,10.3,M.white,'rear-stair-link');
  hip(31.2,40.4,127.6,136.6,10.3,1.6,'rear-stair-link-roof');
  const stairFront=face([40.1,136.3],[31.5,136.3]);
  for(const y of [1.2,6.2])for(const s of [2.2,6.4])stairFront.box(s,.10,y,1.1,2.4,.12,M.glass,'rear-stair-window-'+y+'-'+s);
  volume(rect(24,53,79,126),11.15,11.55,M.paving,'pool-terrace');
  volume(rect(33,41.4,91.3,111.4),11.57,11.78,M.water,'pool-water');
  volume(rect(25.5,51.5,117,127.5),11.6,15.25,M.white,'pool-pavilion');
  hip(25,52,113.5,128,15.25,2.4,'pool-pavilion-roof');
  for(const u of [27,32,45,50])box(u,114,11.55,.35,3.4,.35,M.white,'pool-portico-column-'+u);
  box(38.5,114,14.95,24,.30,.5,M.trim,'pool-portico-beam');
  for(const F of [face([23,126],[23,61]),face([54,61],[54,126])])for(let f=0;f<2;f++)for(let i=0;i<13;i++) {
    const s=(i+.5)*F.length/13;
    F.box(s,.08,f*5.1+1.1,1.8,3.2,.14,M.cream,'rear-window-frame-'+F.at(0,0)[0]+'-'+f+'-'+i);
    F.box(s,.20,f*5.1+1.28,1.45,2.85,.07,M.glass,'rear-window-'+F.at(0,0)[0]+'-'+f+'-'+i);
  }
  for(const u of [27,48])for(let v=85;v<111;v+=5) {
    box(u,v,11.57,1.2,.32,2.4,M.cream,'pool-lounger-'+u+'-'+v);
    cylinder(u,v,11.6,14,.04,M.iron,'pool-umbrella-pole-'+u+'-'+v,6);
    kit.loft({ring:rect(u-1.7,u+1.7,v-1.7,v+1.7),scale:.06,y0:13.75,y1:14.35,material:M.trim,top:M.trim,name:'pool-umbrella-'+u+'-'+v});
  }
  // Low Bar & Billiard Room, Garden Wing, Fern Court / Courtyard Wing, and two sides of Palm Court.
  wing(-10.2,11.5,.3,34.1,1,'billiard-room',{eave:6.6});
  // Small mapped covered links: retain their actual irregular outlines and clear headroom below the roof.
  for(const id of [1228813829,1228813830,254833691,254833693]) {
    const part=site.parts.find(p=>p.id===id);
    if(!part?.ring?.length)throw new Error('Raffles Hotel needs canopy way '+id);
    volume(part.ring,4.65,5.05,M.roof,'mapped-canopy-'+id);
    for(const [i,[x,z]]of part.ring.entries())if(i%2===0)kit.cylinder({x,z,y0:.15,y1:4.63,r:.16,segments:6,material:M.green,top:M.green,name:'mapped-canopy-post-'+id+'-'+i});
  }
  wing(-10.5,22.5,57,75.5,2,'garden-wing');
  wing(-10,10.4,83,137,3,'courtyard-wing');
  wing(56.5,98.4,60,79,2,'palm-return');
  wing(100,120,4.5,82.4,2,'palm-wing');
  // Arcade: open North Bridge Road forecourt, ballroom/spa centre, eastern wing around Raffles Square.
  wing(-10.8,9.2,140.3,160.5,3,'arcade-west');
  wing(9.5,59.5,149.5,169.7,3,'arcade-north-west');
  wing(61.3,100.5,110,161.2,3,'arcade-centre');
  wing(101,156.7,153,172.1,3,'arcade-north-east');
  wing(123.5,139,120,152.7,3,'arcade-east');
  wing(101.5,123.1,120,139.8,3,'arcade-square-south');
  wing(110,155.2,94.5,112,3,'arcade-casuarina');
  // Name a roof group for visual/geometry checks without relying on material colour alone.
  for(const p of kit.parts)if(p.name.startsWith('arcade-')&&p.name.includes('-roof'))p.name='arcade-roof-'+p.name;

  function garden(a,b,c,d,name) {
    box((a+b)/2,(c+d)/2,.01,b-a,.10,d-c,M.lawn,name+'-lawn');
    for(const [u,v,w,h]of [[a-.8,(c+d)/2,.8,d-c+2],[b+.8,(c+d)/2,.8,d-c+2],[(a+b)/2,c-.8,b-a,.8],[(a+b)/2,d+.8,b-a,.8]])box(u,v,.14,w,.42,h,M.leaf,name+'-hedge-'+u+'-'+v);
  }
  garden(-4,12,39,51,'palm-garden');garden(62,94,24,51,'palm-court');garden(12,19,88,127,'fern-court');garden(61,98,85,105,'the-lawn');
  box(111.5,145.7,.02,19.5,.16,9.0,M.paving,'raffles-square');
  // A small two-tier pavilion on the Lawn, echoing the green timber structure in the architect's photograph.
  box(98,96.3,.18,8.5,.35,11.5,M.green,'lawn-pavilion-base');
  for(const u of [94.2,101.8])for(const v of [91,96.3,101.5])box(u,v,.53,.22,3.55,.22,M.green,'lawn-pavilion-post-'+u+'-'+v);
  kit.loft({ring:rect(93.3,102.7,89.9,102.7),topRing:rect(95.3,100.7,92,100.6),y0:4.08,y1:5.3,material:M.roof,top:M.roof,name:'lawn-pavilion-lower-roof'});
  kit.collisionPrism({ring:rect(93.6,102.4,90.2,102.4),y0:4.08,y1:5.3});
  volume(rect(95.3,100.7,92,100.6),5.3,5.68,M.green,'lawn-pavilion-roof-band');
  hip(95.3,100.7,92,100.6,5.68,.85,'lawn-pavilion-upper-roof');
  function palm(u,v,h,name) {
    cylinder(u,v,.2,h,.22,M.trunk,name+'-trunk',7);
    for(let i=0;i<7;i++) {
      const a=i*Math.PI*2/7,du=Math.cos(a),dv=Math.sin(a),s=.55;
      const ring=R([[u,v],[u+du*2.7-dv*s,v+dv*2.7+du*s],[u+du*4.5,v+dv*4.5],[u+du*2.7+dv*s,v+dv*2.7-du*s]]);
      kit.prism({ring,y0:h-.3,y1:(x,z)=>h+.7-Math.hypot(x-P(u,v)[0],z-P(u,v)[1])*.20,material:M.leaf,top:M.leaf,name:name+'-frond-'+i});
    }
  }
  for(const [i,u,v,h]of [[0,0,43,8.5],[1,11,49,7],[2,65,29,8.4],[3,92,29,9],[4,65,48,8],[5,91,48,7.5],[6,58,89,9],[7,96,101,8],[8,30,142,8],[9,48,141,8]])palm(u,v,h,'garden-palm-'+i);
  // Round driveway island in front of the entrance; no property-wide plane extending across the streets.
  cylinder(42,-4.5,.01,.14,8,M.paving,'entrance-roundabout',32);
  cylinder(42,-4.5,.16,.48,5.5,M.leaf,'entrance-island',28);
  cylinder(42,-4.5,.49,.65,1.0,M.trim,'entrance-island-centre',12);
}
