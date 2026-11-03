const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');
const { loadModule } = require('./helpers/module.cjs');

const replacementIds = [155990076,685610171,694102548,694102549,
  ...Array.from({ length: 13 }, (_, i) => 1165450368 + i),
  ...Array.from({ length: 28 }, (_, i) => 1165452713 + i)].sort((a,b) => a-b);
const chain = () => new Proxy(function node() {}, {
  get: (t,k) => Object.hasOwn(t,k) ? t[k] : k === 'then' ? undefined : chain(),
  set: (t,k,v) => { t[k]=v; return true; }, apply: () => chain(), construct: () => chain()
});
class Chain { constructor(o) { const c=chain(); if(o && typeof o==='object')Object.assign(c,o); return c; } }
class Group { constructor(){this.children=[];this.position={set(){}};} add(...o){this.children.push(...o);} }
class BufferGeometry { constructor(){this.attributes={};} setAttribute(k,v){this.attributes[k]=v;} computeBoundingSphere(){} }
class Float32BufferAttribute { constructor(a,n){this.array=Float32Array.from(a);this.itemSize=n;} }
class Mesh { constructor(geometry,material){this.geometry=geometry;this.material=material;} }
const THREE={Group,Mesh,BufferGeometry,Float32BufferAttribute,MeshStandardNodeMaterial:Chain,MeshLambertNodeMaterial:Chain,MeshBasicNodeMaterial:Chain,CanvasTexture:Chain,Color:Chain,FrontSide:0,DoubleSide:2};
const tinyLook={pairMaterial:(a,b)=>b,createTinyFlatMaterial:hex=>new Chain({color:hex}),blendHex:a=>a,hexToRgb:()=>[1,1,1]};
const {createKit}=loadModule(readFileSync(join(__dirname,'../js/landmark-kit.js'),'utf8'), {imports:{'three/webgpu':THREE,'three/tsl':new Proxy({},{get:()=>chain()}),'./tiny-look.js':tinyLook},filename:'landmark-kit.js'});
const geodata=import(pathToFileURL(join(__dirname,'../js/singapore-geodata.js')).href);
const inside=(ring,x,z)=>{let ok=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const[a,b]=ring[i],[c,d]=ring[j];if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)ok=!ok;}return ok;};
const collisionAt=(cs,x,y,z)=>cs.some(c=>{const o=c.obb,dx=x-o.cx,dz=z-o.cz;return y>=c.minY&&y<=c.maxY&&Math.abs(dx*o.cs-dz*o.sn)<=o.hx&&Math.abs(dx*o.sn+dz*o.cs)<=o.hz;});

async function model(){
  const {GEO}=await geodata,L=GEO.landmarks.find(l=>l.id==='sultan-mosque');
  assert.ok(L,'SG-242 has a real generated landmark anchor');
  const {build,info}=await import(pathToFileURL(join(__dirname,'../js/landmark-models/sultan-mosque.js')).href);
  const kit=createKit({anchor:L,name:L.id});kit.bearingDeg=GEO.frame.bearingDeg;
  build(kit,{...L,parts:L.parts.map(p=>({...p,ring:Array.from({length:p.ring.length/2},(_,i)=>[p.ring[2*i]-L.x,p.ring[2*i+1]-L.z])}))});
  const {makeFrame}=await import('../tools/city/frame.mjs');
  const frame=makeFrame({lat0:GEO.frame.lat0,lon0:GEO.frame.lon0,theta:GEO.frame.bearingDeg*Math.PI/180});
  const point=(lon,lat)=>frame.toWorld(lon,lat).map((v,i)=>v-(i?L.z:L.x));
  return {kit,L,point,info};
}

test('SG-242 replaces all45 mapped mosque ways and preserves the separate annexe',async()=>{
  const {GEO}=await geodata,L=GEO.landmarks.find(l=>l.id==='sultan-mosque');
  assert.ok(L,'SG-242 has a generated anchor');
  const {default:config}=await import('../tools/city/cities/singapore.mjs');
  const entry=config.landmarks.find(l=>l.id===L.id);
  assert.deepEqual([...entry.hide].sort((a,b)=>a-b),replacementIds);
  assert.deepEqual(L.parts.map(p=>p.id).sort((a,b)=>a-b),replacementIds);
  assert.ok(!entry.hide.includes(190945743),'annexe remains separately mapped');
  assert.equal((entry.hideRelations||[]).length,0,'there is no relation to hide');
});

test('SG-242 builds finite geometry within the mapped site and material/triangle budgets',async(t)=>{
  const {kit,L,info}=await model(),b=kit.bounds();
  assert.equal(info.height,32);
  assert.ok(b.maxY>=31&&b.maxY<=33,`gold dome finial height ${b.maxY}`);
  assert.ok(b.minY>=-0.1&&b.minY<=0.1,'grounded mosque');
  assert.ok(kit.triangles>5000&&kit.triangles<65000,`${kit.triangles} triangles`);
  const outline=L.parts.find(p=>p.id===155990076).ring;
  for(const [axis,k]of [['X',0],['Z',1]]){
    const values=outline.filter((_,i)=>i%2===k).map(v=>v-L[axis.toLowerCase()]);
    assert.ok(b[`min${axis}`]>=Math.min(...values)-4.5&&b[`max${axis}`]<=Math.max(...values)+4.5,`mapped mosque bounds, including projecting entrance canopy, ${axis}`);
  }
  const {group}=kit.finish();
  assert.ok(group.children.length<=16,`${group.children.length} material batches`);
  for(const mesh of group.children)for(const attribute of Object.values(mesh.geometry.attributes))for(const v of attribute.array)assert.ok(Number.isFinite(v),'finite vertex attribute');
  const flicker=kit.flicker();
  t.diagnostic(`${kit.triangles} triangles; ${group.children.length} material batches; ${kit.parts.length} parts; ${b.maxY.toFixed(2)}m; ${flicker.length} flicker pairs`);
  assert.equal(flicker.length,0,JSON.stringify(flicker.slice(0,20)));
});

test('SG-242 hall and the two bulbous domes occupy independent mapped locations',async()=>{
  const {kit,point}=await model();
  const hall=point(103.858983,1.302228);
  assert.ok(kit.parts.some(p=>p.y0<6&&p.y1>6&&inside(p.ring,...hall)),'prayer hall is centred on its actual site');
  for(const [label,lon,lat]of [['North Bridge Road',103.8587773,1.3023201],['Bussorah Street',103.8591839,1.3021426]]){
    const p=point(lon,lat),shell=kit.parts.filter(q=>q.name.includes('onion-shell')&&inside(q.ring,...p));
    assert.ok(shell.some(q=>q.y0<23&&q.y1>23),label+' has a golden dome above its support');
    const radius=q=>Math.max(...q.ring.map(r=>Math.hypot(r[0]-p[0],r[1]-p[1])));
    const lower=shell.find(q=>q.y0>=18&&q.y0<19),bulb=shell.find(q=>q.y0>=21&&q.y0<22),upper=shell.find(q=>q.y0>=26&&q.y0<27);
    assert.ok(lower&&bulb&&upper,label+' has a complete multi-level profile');
    assert.ok(radius(bulb)>radius(lower)*1.1&&radius(upper)<radius(bulb)*0.7,label+' is an ogee onion rather than a hemisphere');
  }
});

test('SG-242 roofs and domes stop descent while neighbouring ground and annexe stay clear',async()=>{
  const {kit,L,point}=await model(),{colliders}=kit.finish();
  for(const [label,lon,lat,y]of [['hall ridge',103.858983,1.302228,15],['NW dome',103.8587773,1.3023201,23],['SE dome',103.8591839,1.3021426,23]]){
    const [x,z]=point(lon,lat);
    assert.ok(collisionAt(colliders,x+L.x,y,z+L.z),label+' is solid at roof altitude');
  }
  for(const [label,lon,lat]of [['Annexe House',103.859359,1.302515],['Bussorah approach',103.85938,1.30206],['North Bridge Road',103.85862,1.30235],['Arab Street exterior',103.85899,1.30189]]){
    const [x,z]=point(lon,lat);
    assert.ok(!collisionAt(colliders,x+L.x,1.8,z+L.z),label+' has no invented ground collision');
    assert.ok(!kit.parts.some(p=>p.y0<6&&p.y1>6&&inside(p.ring,x,z)),label+' has no replacement mass');
  }
});

test('SG-242 front portico has genuine clearance below its collidable raised canopy',async()=>{
  const {kit,L,point}=await model(),{colliders}=kit.finish();
  // Outside the SE support, on the centre of the four-column Bussorah portico.
  const [x,z]=point(103.859254,1.302112);
  assert.ok(!collisionAt(colliders,x+L.x,1.8,z+L.z),'entrance portico remains passable between columns');
  assert.ok(collisionAt(colliders,x+L.x,4.7,z+L.z),'raised canopy stops descent');
});

test('SG-242 sloping roof collision stays below its visible surface near the eaves',async()=>{
  const {kit,L,point}=await model(),{group,colliders}=kit.finish();
  // Independent review probe: 0.4 m inward of the mapped north-east roof eave, halfway along its length.
  const [px,pz]=point(103.8590069923466,1.3022956521732103),outward=kit.compass(23.7);
  // Check the central gable and the outer lower aisle at the same independently located cross-section.
  for(const offset of [0,7]) {
    const x=px+outward[0]*offset,z=pz+outward[1]*offset;
    let surface=-Infinity;
    for(const mesh of group.children) {
      const a=mesh.geometry.attributes.position.array;
      for(let i=0;i<a.length;i+=9) {
        const ax=a[i],az=a[i+2],bx=a[i+3],bz=a[i+5],cx=a[i+6],cz=a[i+8];
        const det=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);
        if(Math.abs(det)<1e-8)continue;
        const u=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/det;
        const v=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/det,w=1-u-v;
        if(u>=-1e-5&&v>=-1e-5&&w>=-1e-5)surface=Math.max(surface,u*a[i+1]+v*a[i+4]+w*a[i+7]);
      }
    }
    assert.ok(surface>12.2&&surface<12.5,`emitted roof surface is independently measured at ${surface} m`);
    assert.ok(!collisionAt(colliders,x+L.x,surface+0.03,z+L.z),'air above the sloping roof has no invisible obstacle');
    assert.ok(collisionAt(colliders,x+L.x,surface-0.25,z+L.z),'descending players still meet solid roof below its skin');
  }
});

test('SG-242 Bussorah elevation has a framed central bay, large arched doors and cream porch columns',async()=>{
  const {kit,point}=await model();
  const [x,z]=point(103.859228,1.3021233);
  const doors=kit.parts.filter(p=>p.name.startsWith('bussorah-main-door')&&p.y0<2&&p.y1>2);
  assert.ok(doors.length>=3,'the principal facade has lower ochre door panels');
  assert.ok(doors.every(p=>p.ring.some(q=>Math.hypot(q[0]-x,q[1]-z)<2.5)),'doors are on the independent Bussorah facade location');
  const border=kit.parts.filter(p=>p.name.startsWith('bussorah-main-bay-border'));
  assert.ok(border.some(p=>p.y1-p.y0>10),'tall moulded surround frames the whole entrance bay');
  const columns=kit.parts.filter(p=>p.name.startsWith('bussorah-portico-column-'));
  assert.equal(columns.length,4);
  const cream=kit.parts.find(p=>p.name==='prayer-hall').material;
  assert.ok(columns.every(p=>p.material===cream),'the four visible porch shafts are cream');
});
