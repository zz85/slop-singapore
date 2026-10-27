import * as THREE from 'three/webgpu';
import { vec3, float, attribute, uniform, sin, time, positionLocal } from 'three/tsl';

// js/jet-effects.js
// What the F-15SG leaves in the air: vapour trails off its wingtips when it pulls hard (Singapore's air is humid; above
// about 4 g the low pressure in the tip vortices condenses), and the fireball and smoke when it doesn't pull hard
// enough. Both cheap: two ribbons of 64 points rewritten in place, and two spheres scaled over a few seconds.

const TRAIL = 64; // points per wingtip
const TRAIL_LIFE = 2.2; // s

class WingtipTrails {
  constructor(scene) {
    this.points = [0, 1].map(() => ({ pos: new Float32Array(TRAIL * 3), up: new Float32Array(TRAIL * 3), age: new Float32Array(TRAIL).fill(1e9), strength: new Float32Array(TRAIL), gap: new Uint8Array(TRAIL), head: 0, count: 0, on: false }));
    this.geometry = new THREE.BufferGeometry();
    this.position = new THREE.BufferAttribute(new Float32Array(2 * TRAIL * 2 * 3), 3);
    this.alpha = new THREE.BufferAttribute(new Float32Array(2 * TRAIL * 2), 1);
    this.position.setUsage(THREE.DynamicDrawUsage);
    this.alpha.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', this.position);
    this.geometry.setAttribute('alpha', this.alpha);
    const idx = [];
    for (let t = 0; t < 2; t++) {
      for (let i = 0; i < TRAIL - 1; i++) {
        const a = (t * TRAIL + i) * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    this.geometry.setIndex(idx);
    const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide });
    m.colorNode = vec3(0.95, 0.96, 0.98);
    m.opacityNode = attribute('alpha', 'float').mul(0.55);
    this.mesh = new THREE.Mesh(this.geometry, m);
    this.mesh.name = 'F15SG_vapour';
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = this.mesh.receiveShadow = false;
    this.mesh.visible = false;
    scene.add(this.mesh);
    this._v = new THREE.Vector3();
    this._u = new THREE.Vector3();
  }

  clear() {
    for (const p of this.points) { p.count = 0; p.age.fill(1e9); }
    this.mesh.visible = false;
  }

  /** `tips`: the two wingtips' world positions; `up`: the jet's up; `strength` 0..1 of the vapour now */
  update(dt, tips, up, strength) {
    let any = false;
    this.points.forEach((p, t) => {
      for (let i = 0; i < TRAIL; i++) p.age[i] += dt;
      // a new point each frame (while there is vapour, or while the old ones fade)
      if (strength > 0.01) {
        p.head = (p.head + 1) % TRAIL;
        const i = p.head;
        p.pos[i * 3] = tips[t].x; p.pos[i * 3 + 1] = tips[t].y; p.pos[i * 3 + 2] = tips[t].z;
        p.up[i * 3] = up.x; p.up[i * 3 + 1] = up.y; p.up[i * 3 + 2] = up.z;
        p.age[i] = 0;
        p.strength[i] = strength;
        p.gap[i] = p.on ? 0 : 1; // the first point after a gap: not joined to the one before it
        p.count = Math.min(TRAIL, p.count + 1);
      }
      p.on = strength > 0.01;
      // write the ribbon newest first: two vertices a point, spread along the jet's up, widening as it ages
      for (let k = 0; k < TRAIL; k++) {
        const i = (p.head - k + TRAIL) % TRAIL;
        const life = k < p.count ? Math.max(0, 1 - p.age[i] / TRAIL_LIFE) : 0;
        // (transparent either side of where the vapour started again: not a ribbon joining unrelated points)
        const newer = (i + 1) % TRAIL;
        const a = p.gap[i] || (k > 0 && p.gap[newer]) ? 0 : life * p.strength[i];
        if (a > 0) any = true;
        const width = 0.12 + (1 - life) * 0.9;
        const v = (t * TRAIL + k) * 2;
        for (const side of [0, 1]) {
          const s = side ? width : -width;
          this.position.array[(v + side) * 3] = p.pos[i * 3] + p.up[i * 3] * s;
          this.position.array[(v + side) * 3 + 1] = p.pos[i * 3 + 1] + p.up[i * 3 + 1] * s;
          this.position.array[(v + side) * 3 + 2] = p.pos[i * 3 + 2] + p.up[i * 3 + 2] * s;
          this.alpha.array[v + side] = k === 0 || k >= p.count - 1 ? 0 : a;
        }
      }
    });
    this.mesh.visible = any;
    if (any) {
      this.position.needsUpdate = true;
      this.alpha.needsUpdate = true;
    }
  }
}

class Explosion {
  constructor(scene) {
    const geo = new THREE.IcosahedronGeometry(1, 2);
    this.heat = uniform(0);
    this.smokeOpacity = uniform(0);
    const fire = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    // a boiling ball: brighter at its heart, rippling
    const ripple = sin(positionLocal.x.mul(5.0).add(time.mul(9.0))).mul(sin(positionLocal.y.mul(6.0).sub(time.mul(7.0)))).mul(0.25).add(0.85);
    fire.colorNode = vec3(1.0, 0.55, 0.16).mul(this.heat).mul(ripple).mul(2.0);
    this.fireball = new THREE.Mesh(geo, fire);
    const smoke = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    smoke.colorNode = vec3(0.09, 0.085, 0.08);
    smoke.opacityNode = float(this.smokeOpacity);
    this.smoke = new THREE.Mesh(geo, smoke);
    for (const m of [this.fireball, this.smoke]) {
      m.visible = false;
      m.castShadow = m.receiveShadow = false;
      m.frustumCulled = false;
      scene.add(m);
    }
    this.t = Infinity;
  }

  trigger(x, y, z) {
    this.t = 0;
    this.fireball.position.set(x, y, z);
    this.smoke.position.set(x, y + 4, z);
    this.fireball.visible = this.smoke.visible = true;
  }

  update(dt) {
    if (this.t === Infinity) return;
    this.t += dt;
    const t = this.t;
    const grow = 1 - Math.exp(-t * 5);
    this.fireball.scale.setScalar(4 + grow * 30);
    this.heat.value = Math.max(0, 1 - t / 1.4) ** 1.5;
    this.fireball.visible = this.heat.value > 0.01;
    this.smoke.scale.setScalar(6 + t * 9);
    this.smoke.position.y += dt * 6;
    this.smokeOpacity.value = Math.min(1, t * 2) * Math.max(0, 1 - t / 4.5) * 0.75;
    if (t > 4.5) {
      this.t = Infinity;
      this.fireball.visible = this.smoke.visible = false;
    }
  }
}

export { WingtipTrails, Explosion };
