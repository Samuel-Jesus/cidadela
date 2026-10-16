import * as THREE from "three";

type TremState = {
  o: THREE.Group;
  dir: number;
  s: number;
  v: number;
  est: "run" | "stop";
  tm: number;
  pas: boolean;
};

export type MetroDeSalvadorGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    alternarTrens: () => void;
  };
};

export function criarMetroDeSalvador(): MetroDeSalvadorGroup {
  const g = new THREE.Group() as MetroDeSalvadorGroup;
  g.name = "MetroDeSalvador";
  const PI = Math.PI;

  const M = (c: number, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o || {}));

  const m = {
    grass: M(0x7aa23a),
    dirt: M(0x8c6d4c),
    conc: M(0xb9bbbd),
    concD: M(0x9a9c9e),
    rlg: M(0xd0d3d6),
    rail: M(0x7d8187, { metalness: 0.5, roughness: 0.4 }),
    yellow: M(0xf2b807),
    glass: M(0x9fd0e8, { transparent: true, opacity: 0.4, roughness: 0.1 }),
    fence: M(0x2e9a5a, { transparent: true, opacity: 0.55 }),
    fenceD: M(0x1f6e3e),
    pink: M(0xc96a5e),
    walk: M(0xdcdad0),
    white: M(0xf4f5f7, { roughness: 0.5 }),
    red: M(0xc8283a, { roughness: 0.5 }),
    blue: M(0x2f6fc8, { roughness: 0.5 }),
    dark: M(0x1c2331),
    win: M(0x24344f, { roughness: 0.2 }),
    door: M(0x2f5f9f),
    grey: M(0x8d9196),
    lamp: M(0xfff6c0, { emissive: 0xffe9a0, emissiveIntensity: 0.8 }),
    trunk: M(0x7a6a52),
    leaf: M(0x2f8a2e),
    leaf2: M(0x3f9d36),
    dome: M(0xdedfe0),
    wire: M(0x2a2a2a),
  };

  const bx = (
    w: number,
    h: number,
    d: number,
    mt: THREE.Material | THREE.Material[],
    x: number,
    y: number,
    z: number,
    p?: THREE.Object3D,
  ) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mt);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    (p || g).add(o);
    return o;
  };

  const cyl = (
    rt: number,
    rb: number,
    h: number,
    mt: THREE.Material,
    x: number,
    y: number,
    z: number,
    seg?: number,
  ) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 10), mt);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    g.add(o);
    return o;
  };

  const terreno = bx(22, 0.6, 9, m.grass, 0, -0.3, 0);
  terreno.material = [m.dirt, m.dirt, m.grass, m.dirt, m.dirt, m.dirt];
  bx(22, 1, 2.4, m.conc, 0, 0.5, 0);
  [-1.15, 1.15].forEach((z) => {
    bx(22, 0.12, 0.14, m.concD, 0, 1.06, z);
    bx(22, 0.03, 0.03, m.rlg, 0, 1.42, z);
    bx(22, 0.03, 0.03, m.rlg, 0, 1.26, z);
    for (let x = -10.75; x <= 10.8; x += 0.5) bx(0.03, 0.32, 0.03, m.rlg, x, 1.28, z);
  });
  [-1.9, 1.9].forEach((z) => {
    bx(22, 0.8, 0.03, m.fence, 0, 0.4, z);
    bx(22, 0.04, 0.04, m.fenceD, 0, 0.8, z);
  });
  bx(22, 0.03, 0.55, m.pink, 0, 0.015, 3.3);
  bx(22, 0.03, 0.5, m.walk, 0, 0.015, 3.95);

  const cv = document.createElement("canvas");
  cv.width = cv.height = 16;
  const cx = cv.getContext("2d")!;
  cx.fillStyle = "#8c8a84";
  cx.fillRect(0, 0, 16, 16);
  cx.fillStyle = "#5a4a3c";
  cx.fillRect(6, 0, 4, 16);
  const tx = new THREE.CanvasTexture(cv);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(69, 1);
  tx.magFilter = THREE.NearestFilter;
  const lastro = new THREE.Mesh(
    new THREE.PlaneGeometry(21.8, 2),
    new THREE.MeshStandardMaterial({ map: tx, roughness: 1 }),
  );
  lastro.rotation.x = -PI / 2;
  lastro.position.y = 1.035;
  lastro.receiveShadow = true;
  g.add(lastro);
  [-0.75, 0.75].forEach((z) =>
    [-0.15, 0.15].forEach((d) => bx(21.8, 0.04, 0.03, m.rail, 0, 1.09, z + d)),
  );
  bx(7.6, 0.16, 0.7, m.walk, 0, 1.12, 0);

  const cob = new THREE.Group();
  cob.position.y = 1.1;
  cob.scale.y = 1.35;
  g.add(cob);
  for (let x = -3.6; x <= 3.61; x += 0.6) {
    const a = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.035, 6, 24, PI), m.yellow);
    a.rotation.y = PI / 2;
    a.position.x = x;
    a.castShadow = true;
    cob.add(a);
  }
  const casca = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 7.6, 24, 1, true, 0, PI),
    m.glass,
  );
  casca.rotation.z = PI / 2;
  (casca.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  cob.add(casca);
  [-1.2, 1.2].forEach((z) => bx(7.6, 0.05, 0.05, m.yellow, 0, 0, z, cob));

  for (let x = -10.5; x <= 10.6; x += 3) {
    if (Math.abs(x) < 4) continue;
    [-1, 1].forEach((s) => {
      cyl(0.03, 0.035, 1.4, m.grey, x, 1.7, s * 1.1, 8);
      bx(0.04, 0.04, 0.4, m.grey, x, 2.35, s * 0.92);
    });
  }
  [-0.75, 0.75].forEach((z) => bx(21.8, 0.012, 0.012, m.wire, 0, 2.05, z));

  const palma = (x: number, z: number, h: number) => {
    const p = new THREE.Group();
    p.position.set(x, 0, z);
    g.add(p);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, h, 8), m.trunk);
    t.position.y = h / 2;
    t.castShadow = true;
    p.add(t);
    for (let i = 0; i < 8; i++) {
      const yaw = new THREE.Group();
      yaw.position.y = h;
      yaw.rotation.y = (i * PI) / 4;
      p.add(yaw);
      const tilt = new THREE.Group();
      tilt.rotation.z = -0.3 - (i % 2) * 0.25;
      yaw.add(tilt);
      bx(0.7, 0.02, 0.13, i % 2 ? m.leaf : m.leaf2, 0.35, 0, 0, tilt);
    }
  };
  for (let x = -9; x <= 9.1; x += 3.6) palma(x, 2.65, 1 + (((x * 7) % 3) + 3) % 3 * 0.12);

  const pas = new THREE.Group();
  pas.position.set(6.2, 3.2, 0);
  g.add(pas);
  bx(0.7, 0.1, 8.4, m.yellow, 0, 0, 0, pas);
  bx(0.78, 0.06, 8.4, m.yellow, 0, 0.62, 0, pas);
  [-0.34, 0.34].forEach((x) => bx(0.02, 0.45, 8.2, m.glass, x, 0.32, 0, pas));
  [-2.6, 2.6].forEach((z) => cyl(0.14, 0.16, 3.2, m.concD, 6.2, 1.6, z, 12));
  cyl(0.85, 0.85, 0.3, m.white, 8.6, 0.15, -3.2, 24);
  const domo = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 24, 12, 0, PI * 2, 0, PI / 2),
    m.dome,
  );
  domo.position.set(8.6, 0.3, -3.2);
  domo.castShadow = true;
  g.add(domo);

  const L = 2;
  const Y = 1.44;
  const carro = (tr: THREE.Group, cx0: number, i: number) => {
    bx(L, 0.6, 0.7, m.white, cx0, Y, 0, tr);
    bx(L + 0.005, 0.07, 0.705, m.red, cx0, Y + 0.17, 0, tr);
    bx(L + 0.005, 0.07, 0.705, m.blue, cx0, Y - 0.12, 0, tr);
    [0.351, -0.351].forEach((s) => {
      [-0.9, -0.3, 0.3, 0.9].forEach((x) => bx(0.26, 0.18, 0.01, m.win, cx0 + x, Y + 0.06, s, tr));
      [-0.6, 0, 0.6].forEach((x) => bx(0.2, 0.42, 0.012, m.door, cx0 + x, Y - 0.02, s, tr));
    });
    bx(L - 0.1, 0.06, 0.55, m.grey, cx0, Y + 0.33, 0, tr);
    bx(0.45, 0.08, 0.4, m.rlg, cx0 - 0.5, Y + 0.4, 0, tr);
    bx(0.45, 0.08, 0.4, m.rlg, cx0 + 0.5, Y + 0.4, 0, tr);
    [-0.6, 0.6].forEach((x) => bx(0.45, 0.1, 0.5, m.dark, cx0 + x, 1.12, 0, tr));
    if (i === 1) {
      bx(0.5, 0.04, 0.3, m.dark, cx0, 1.8, 0, tr);
      bx(0.5, 0.02, 0.07, m.dark, cx0 + 0.1, 2.06, 0, tr);
      const a1 = bx(0.02, 0.34, 0.02, m.dark, cx0 - 0.05, 1.92, 0, tr);
      a1.rotation.z = 0.5;
      const a2 = bx(0.02, 0.34, 0.02, m.dark, cx0 + 0.25, 1.92, 0, tr);
      a2.rotation.z = -0.5;
    }
    if (i < 2) bx(0.07, 0.5, 0.55, m.dark, cx0 + L / 2 + 0.03, Y, 0, tr);
    const cab = (s: number) => {
      bx(0.14, 0.5, 0.68, m.dark, cx0 + s * (L / 2 + 0.07), Y, 0, tr);
      bx(0.12, 0.14, 0.64, m.white, cx0 + s * (L / 2 + 0.06), Y - 0.28, 0, tr);
      bx(0.02, 0.24, 0.54, m.win, cx0 + s * (L / 2 + 0.145), Y + 0.07, 0, tr);
      [-0.24, 0.24].forEach((z) =>
        bx(0.02, 0.06, 0.07, m.lamp, cx0 + s * (L / 2 + 0.145), Y - 0.14, z, tr),
      );
    };
    if (i === 2) cab(1);
    if (i === 0) cab(-1);
  };

  const mkTrem = (z: number, dir: number, s0: number): TremState => {
    const tr = new THREE.Group();
    tr.position.z = z;
    if (dir < 0) tr.rotation.y = PI;
    g.add(tr);
    [-L - 0.07, 0, L + 0.07].forEach((c, i) => carro(tr, c, i));
    const t: TremState = { o: tr, dir, s: s0, v: 2, est: "run", tm: 0, pas: false };
    tr.position.x = dir * s0;
    return t;
  };

  const trens = [mkTrem(0.75, 1, -9), mkTrem(-0.75, -1, -3)];
  let vai = true;
  g.userData.alternarTrens = () => {
    vai = !vai;
  };
  g.userData.tick = (dt: number) => {
    if (!vai) return;
    const VM = 3;
    const A = 1.2;
    trens.forEach((t) => {
      if (t.est === "stop") {
        t.tm -= dt;
        if (t.tm <= 0) {
          t.est = "run";
          t.pas = true;
        }
      } else {
        if (!t.pas) {
          const d = -t.s;
          if (d <= 0.03) {
            t.s = 0;
            t.v = 0;
            t.est = "stop";
            t.tm = 3.5;
          } else if (d <= (t.v * t.v) / (2 * A) + 0.05) t.v = Math.max(t.v - A * dt, 0.3);
          else t.v = Math.min(t.v + A * dt, VM);
        } else t.v = Math.min(t.v + A * dt, VM);
        if (t.est === "run") t.s += t.v * dt;
        if (t.s > 14) {
          t.s = -14;
          t.pas = false;
        }
      }
      t.o.position.x = t.dir * t.s;
    });
  };

  return g;
}
