const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');
const { loadModule } = require('./helpers/module.cjs');

const chain = () => new Proxy(function () {}, { get: (t,k) => Object.hasOwn(t,k) ? t[k] : k === 'then' ? undefined : chain(), set: (t,k,v) => (t[k]=v,true), apply: () => chain(), construct: () => chain() });
class Chain { constructor(o) { const c=chain(); if(o)Object.assign(c,o); return c; } }
class Group { constructor() { this.children=[]; this.position={set(){}}; } add(...o) { this.children.push(...o); return this; } }
const THREE={Group,Mesh:Chain,BufferGeometry:Chain,Float32BufferAttribute:Chain,MeshStandardNodeMaterial:Chain,MeshLambertNodeMaterial:Chain,MeshBasicNodeMaterial:Chain,CanvasTexture:Chain,Color:Chain,SRGBColorSpace:'srgb',FrontSide:0,DoubleSide:2};
const {createKit}=loadModule(readFileSync(join(__dirname,'../js/landmark-kit.js'),'utf8'),{imports:{'three/webgpu':THREE,'three/tsl':new Proxy({},{get:()=>chain()}),'./tiny-look.js':{pairMaterial:(a,b)=>b,createTinyFlatMaterial:hex=>new Chain({color:hex}),blendHex:a=>a,hexToRgb:()=>[1,1,1]}}});
const expected=[45098520,463863828,463863829,463863830,463863831,463863832,463863833,463863834,463863835];
const collides=(cs,x,y,z)=>cs.some(c=>{const o=c.obb,dx=x-o.cx,dz=z-o.cz;return y>c.minY&&y<c.maxY&&Math.abs(dx*o.cs-dz*o.sn)<o.hx&&Math.abs(dx*o.sn+dz*o.cs)<o.hz;});

async function model() {
  const file=join(__dirname,'../js/landmark-models/lau-pa-sat.js');
  assert.ok(existsSync(file),'Lau Pa Sat has a dedicated procedural model');
  const {build,info}=await import(pathToFileURL(file).href);
  const {GEO}=await import(pathToFileURL(join(__dirname,'../js/singapore-geodata.js')).href);
  const L=GEO.landmarks.find(l=>l.id==='lau-pa-sat');
  assert.ok(L,'Lau Pa Sat has a generated mapped anchor');
  const site={...L,parts:L.parts.map(p=>({...p,ring:Array.from({length:p.ring.length/2},(_,i)=>[p.ring[i*2]-L.x,p.ring[i*2+1]-L.z])}))};
  const kit=createKit({anchor:L,name:L.id}); kit.bearingDeg=GEO.frame.bearingDeg;
  const roofPlanes=[],prism=kit.prism;
  kit.prism=spec=>{if(typeof spec.y1==='function')roofPlanes.push({name:spec.name,points:spec.ring.map(([x,z])=>[x,spec.y1(x,z),z])});return prism(spec);};
  build(kit,site);
  const {makeFrame}=await import(pathToFileURL(join(__dirname,'../tools/city/frame.mjs')).href);
  const frame=makeFrame({lat0:GEO.frame.lat0,lon0:GEO.frame.lon0,theta:GEO.frame.bearingDeg*Math.PI/180});
  return {kit,L,site,info,frame,roofPlanes,centre:frame.toWorld(103.8505047,1.280616)};
}

test('Lau Pa Sat replaces exactly its octagonal market and eight roof wedges',async()=>{
  const {kit,L,site,info}=await model();
  assert.deepEqual(L.parts.map(p=>p.id).sort((a,b)=>a-b),expected);
  assert.equal(info.height,22);
  const b=kit.bounds(),r=site.parts.find(p=>p.id===45098520).ring;
  for(const [axis,i]of [['X',0],['Z',1]]) {
    assert.ok(b['min'+axis]>=Math.min(...r.map(p=>p[i]))-0.8);
    assert.ok(b['max'+axis]<=Math.max(...r.map(p=>p[i]))+0.8);
  }
  assert.ok(b.maxY>=21.5&&b.maxY<=22.5); assert.ok(b.minY>=0&&b.minY<=0.15);
});

test('the real roof centre and all eight radial entrances remain traversable below elevated roofs',async()=>{
  const {kit,L,site,centre}=await model(),{colliders}=kit.finish();
  // Geographic centre from OSM node8167597426, independent of model-local origin and generated anchor.
  assert.ok(!collides(colliders,centre[0],1.8,centre[1]),'central crossing is open at eye level');
  const raw=JSON.parse(readFileSync(join(__dirname,'../tools/data/singapore/osm_buildings.json'),'utf8'));
  const main=site.parts.find(p=>p.id===45098520).ring;
  const corners=[0,1,2,3,4,6,8,10].map(i=>raw.elements.find(e=>e.id===45098520).geometry[i]);
  const {frame}=await model();
  for(let i=0;i<8;i++) {
    const a=frame.toWorld(corners[i].lon,corners[i].lat),b=frame.toWorld(corners[(i+1)%8].lon,corners[(i+1)%8].lat);
    const end=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    for(const t of [0.35,0.65,0.94]) {
      const p=centre.map((v,k)=>v+(end[k]-v)*t);
      assert.ok(!collides(colliders,p[0],1.8,p[1]),`radial aisle ${i} at ${t} is open`);
      assert.ok(collides(colliders,p[0],6.2,p[1]),`roof over aisle ${i} at ${t} stops descent`);
    }
  }
  assert.ok(collides(colliders,centre[0],17,centre[1]),'clock tower is solid aloft');
  assert.ok(main.length>=8&&Number.isFinite(L.x));
});

test('neighbouring streets and detached restaurant stay outside Lau Pa Sat collisions',async()=>{
  const {kit,frame}=await model(),{colliders}=kit.finish();
  for(const [lon,lat]of [[103.85092,1.28062],[103.85000,1.28060],[103.85055,1.28102],[103.85057,1.28022]]) {
    const [x,z]=frame.toWorld(lon,lat);
    for(const y of [1.8,6.2,17])assert.ok(!collides(colliders,x,y,z),`clear exterior ${lon},${lat},${y}`);
  }
});

test('roof airwells are broad triangles and the outer octagonal hip is a continuous roof band',async()=>{
  const {kit}=await model();
  for(const p of kit.parts.filter(p=>p.name.startsWith('airwell-glass-'))) {
    const r=p.ring,area=Math.abs(r.reduce((sum,a,i)=>{const b=r[(i+1)%r.length];return sum+a[0]*b[1]-a[1]*b[0];},0))/2;
    const longest=Math.max(...r.map((a,i)=>Math.hypot(a[0]-r[(i+1)%r.length][0],a[1]-r[(i+1)%r.length][1])));
    assert.ok(area>=24&&area<=75,`${p.name}: ${area.toFixed(1)}m2 clear glazing`);
    assert.ok(2*area/longest>=5,`${p.name}: broad triangular airwell, not a narrow slit`);
  }
  const bands=kit.parts.filter(p=>p.name.startsWith('outer-hip-band-'));
  assert.equal(bands.length,16);
  for(const p of bands)assert.ok(Math.abs(p.y1-7.2)<0.01,'outer hip joins the upper roof at7.2m');
});

test('roof polygons are planar so triangulation cannot introduce arbitrary folds',async()=>{
  const {roofPlanes}=await model();
  for(const {name,points:p}of roofPlanes.filter(p=>p.points.length>3)) {
    const a=p[0],b=p[1],c=p[2],u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);
    const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n);
    if(len<1e-6)continue;
    for(const q of p.slice(3))assert.ok(Math.abs(n.reduce((s,v,i)=>s+v*(q[i]-a[i]),0))/len<0.02,`${name}: all vertices must lie on its roof plane`);
  }
});

test('Lau Pa Sat has finite detailed geometry, eight roof airwells and bounded batches without flicker',async t=>{
  const {kit}=await model();
  assert.ok(kit.triangles>1500&&kit.triangles<65000,`${kit.triangles} triangles`);
  assert.equal(kit.parts.filter(p=>p.name.startsWith('airwell-glass-')).length,8,'eight triangular glazed airwells');
  assert.ok(kit.parts.filter(p=>p.name.startsWith('entrance-fan-')).length>=8,'fanlight structure changes the silhouette');
  for(const p of kit.parts)for(const n of Object.values(p.bounds))assert.ok(Number.isFinite(n),p.name);
  const flicker=kit.flicker();assert.equal(flicker.length,0,JSON.stringify(flicker));
  const {group,colliders}=kit.finish();assert.ok(group.children.length<=16,`${group.children.length} batches`);
  assert.ok(colliders.length>8,'columns and altitude-aware roof collisions');
  t.diagnostic(`${kit.triangles} triangles; ${group.children.length} material batches; ${kit.parts.length} parts; ${colliders.length} colliders; zero flicker`);
});
