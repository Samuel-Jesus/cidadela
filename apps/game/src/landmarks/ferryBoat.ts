import * as THREE from "three";

export type FerryBoatGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    alternarBalsa: () => boolean;
  };
};

export function criarFerryBoat(): FerryBoatGroup {
  const g = new THREE.Group() as FerryBoatGroup;
  g.name = "FerryBoat";
  const PI = Math.PI;

  const M = (c: number, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o || {}));

  const m = {
    hull: M(0x1f4fc6, { roughness: 0.55 }),
    white: M(0xf6f7f5, { roughness: 0.55 }),
    deckG: M(0x4a9a68),
    win: M(0x1f6f78, { roughness: 0.2 }),
    orange: M(0xf07b2a),
    dark: M(0x23262b),
    conc: M(0xaaa8a0),
    sand: M(0xc8c0aa),
    yellow: M(0xf2c230),
    wood: M(0x6b4f35),
    blue: M(0x2b5fb0),
    crane: M(0x3d6db5),
    mast: M(0xdadde0),
    foam: M(0xffffff, { transparent: true, opacity: 0.35, depthWrite: false }),
    gang: M(0xf2f3f0, { side: THREE.DoubleSide }),
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
    p?: THREE.Object3D,
    seg?: number,
  ) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 12), mt);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    (p || g).add(o);
    return o;
  };

  const water = bx(20, 1.2, 14, M(0x2cc4bb, { roughness: 0.25 }), 1, -0.6, 0);
  water.material = [
    M(0x0e7480),
    M(0x0e7480),
    M(0x2cc4bb, { roughness: 0.25 }),
    M(0x0e7480),
    M(0x0e7480),
    M(0x0e7480),
  ];
  bx(6, 1.95, 14, m.sand, -12, -0.225, 0);
  bx(4, 1.95, 5.2, m.conc, -7, -0.225, 0);
  bx(0.12, 0.04, 5.2, m.yellow, -5.06, 0.77, 0);
  [-1.6, 1.6].forEach((z) => cyl(0.12, 0.14, 0.25, m.dark, -5.5, 0.88, z));
  [-1.55, 1.55].forEach((z) =>
    [-0.25, 0, 0.25].forEach((d, i) => cyl(0.14, 0.16, 1.6, m.wood, -4.3 + d, 0, z + (i - 1) * 0.12)),
  );
  bx(3.8, 1.6, 4.2, m.white, -12.3, 1.55, -3.5);
  bx(4, 0.15, 4.4, m.blue, -12.3, 2.42, -3.5);
  [-1, 0, 1].forEach((x) => bx(0.6, 0.4, 0.03, m.win, -12.3 + x, 1.5, -1.38));
  bx(0.9, 0.9, 0.9, m.blue, -10.5, 1.2, 2.5);
  const tubo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, 7, 16, 1, true, 0, PI),
    m.gang,
  );
  tubo.rotation.z = PI / 2;
  tubo.position.set(-11.5, 0.75, -2.4);
  g.add(tubo);
  bx(16, 1.95, 2, m.conc, 2, -0.225, -5.8);
  [
    [2.5, -6.4],
    [3.5, -6.4],
    [2.5, -5.2],
    [3.5, -5.2],
  ].forEach((p) => bx(0.12, 3.4, 0.12, m.crane, p[0], 2.45, p[1]));
  [-6.4, -5.2].forEach((z) => bx(1.2, 0.12, 0.12, m.crane, 3, 4.2, z));
  [2.5, 3.5].forEach((x) => bx(0.12, 0.12, 1.4, m.crane, x, 4.2, -5.8));
  const boom = bx(0.16, 0.14, 5.4, m.crane, 3, 4.35, -3.2);
  boom.rotation.x = -0.12;
  [0xd9542c, 0x2e86ab, 0xe0b53a, 0x3bb273].forEach((c, i) => {
    const box = bx(1.2, 0.5, 0.5, M(c), 6 + (i % 2) * 1.3, 1, -5.8);
    box.position.y = 1 + (i > 1 ? 0.5 : 0);
  });

  const F = new THREE.Group();
  F.position.set(0.3, 0, 0);
  g.add(F);
  const pts: [number, number][] = [
    [-4.4, -1],
    [3.2, -1.1],
    [4.3, -0.4],
    [4.55, 0],
    [4.3, 0.4],
    [3.2, 1.1],
    [-4.4, 1],
  ];
  const plano = (k: number) => {
    const s = new THREE.Shape();
    pts.forEach((p, i) => {
      const x = p[0] * k;
      const y = -p[1] * k;
      if (i) s.lineTo(x, y);
      else s.moveTo(x, y);
    });
    s.closePath();
    return s;
  };
  const ext = (sh: THREE.Shape, d: number, mt: THREE.Material, y: number) => {
    const o = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }), mt);
    o.rotation.x = -PI / 2;
    o.position.y = y;
    o.castShadow = true;
    o.receiveShadow = true;
    F.add(o);
  };
  ext(plano(1), 1.1, m.hull, -0.35);
  ext(plano(0.97), 0.03, m.deckG, 0.75);
  const rampa = bx(0.9, 0.05, 1.9, m.deckG, -4.85, 0.71, 0, F);
  rampa.rotation.z = 0.08;
  [0.78, -0.78].forEach((z) => bx(5.4, 0.9, 0.44, m.white, 0.1, 1.2, z, F));
  bx(5.6, 0.55, 2.14, m.white, 0.1, 1.925, 0, F);
  for (let x = -2.4; x <= 2.61; x += 0.38)
    [1.075, -1.075].forEach((z) => bx(0.28, 0.2, 0.02, m.win, x, 1.95, z, F));
  bx(3.4, 0.5, 1.7, m.white, 0.5, 2.45, 0, F);
  [2.21, -1.21].forEach((x) => bx(0.02, 0.26, 1.4, m.win, x, 2.5, 0, F));
  [0.86, -0.86].forEach((z) => bx(3, 0.2, 0.02, m.win, 0.5, 2.5, z, F));
  bx(1.3, 0.5, 1.3, m.white, 0.7, 2.95, 0, F);
  bx(1.5, 0.05, 1.5, m.white, 0.7, 3.22, 0, F);
  [0.66, -0.66].forEach((d) => {
    bx(1, 0.22, 0.02, m.win, 0.7, 3, d, F);
    bx(0.02, 0.22, 1, m.win, 0.7 + d, 3, 0, F);
  });
  cyl(0.025, 0.025, 1, m.mast, 0.7, 3.75, 0, F, 6);
  bx(0.4, 0.03, 0.03, m.mast, 0.7, 3.95, 0, F);
  bx(0.3, 0.05, 0.05, m.dark, 0.7, 3.3, 0.1, F);
  [-0.6, 0.6].forEach((z) =>
    [-2.35, -1.9, -1.45].forEach((x) => cyl(0.17, 0.17, 0.45, m.orange, x, 2.43, z, F, 14)),
  );
  [-0.6, 0.6].forEach((z) => cyl(0.17, 0.17, 0.45, m.orange, 2.6, 2.43, z, F, 14));
  const R = [-2.7, 2.9];
  [-1.07, 1.07].forEach((z) => {
    bx(5.6, 0.025, 0.025, m.white, 0.1, 2.5, z, F);
    for (let x = -2.7; x <= 2.91; x += 0.5) bx(0.02, 0.3, 0.02, m.white, x, 2.35, z, F);
  });
  R.forEach((x) => bx(0.025, 0.025, 2.14, m.white, x, 2.5, 0, F));
  [
    [-3.9, -0.32],
    [-3.9, 0.32],
    [-3.3, -0.32],
    [-3.3, 0.32],
    [-2.3, -0.32],
    [-2.3, 0.32],
    [-1.7, -0.32],
    [-1.7, 0.32],
    [3.3, -0.3],
    [3.3, 0.3],
  ].forEach((p, i) => {
    const c = [0xdcdde0, 0x2c2f3a, 0xa23a3a, 0x2b5fa8, 0xe6e6e6, 0x3b6e4a][i % 6];
    bx(0.5, 0.14, 0.24, M(c), p[0], 0.86, p[1], F);
    bx(0.25, 0.1, 0.2, m.win, p[0] - 0.02, 0.98, p[1], F);
  });

  const nome = (() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 64;
    const x = c.getContext("2d")!;
    x.fillStyle = "#fff";
    x.font = "bold 44px sans-serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("RIO PARAGUAÇU", 256, 34);
    return new THREE.CanvasTexture(c);
  })();
  [1, -1].forEach((s) => {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 0.28),
      new THREE.MeshStandardMaterial({ map: nome, transparent: true, roughness: 0.6 }),
    );
    p.position.set(-0.2, 0.4, s * 1.075);
    if (s < 0) p.rotation.y = PI;
    F.add(p);
  });
  const espuma = new THREE.Mesh(new THREE.CircleGeometry(1, 28), m.foam);
  espuma.rotation.x = -PI / 2;
  espuma.scale.set(5, 1.7, 1);
  espuma.position.y = 0.01;
  F.add(espuma);

  const sm = (x: number) => x * x * (3 - 2 * x);
  let t = 0;
  let vai = true;
  g.userData.alternarBalsa = () => {
    vai = !vai;
    return vai;
  };
  g.userData.tick = (dt: number) => {
    if (!vai) return;
    t += dt;
    const tt = t % 23;
    let p: number;
    let mov = false;
    if (tt < 4) p = 0;
    else if (tt < 12) {
      p = sm((tt - 4) / 8);
      mov = true;
    } else if (tt < 15) p = 1;
    else {
      p = 1 - sm((tt - 15) / 8);
      mov = true;
    }
    F.position.x = 0.3 + 5.4 * p;
    F.position.y = 0.03 * Math.sin(t * 1.7);
    F.rotation.z = 0.015 * Math.sin(t * 1.2);
    F.rotation.x = 0.012 * Math.sin(t * 0.9);
    m.foam.opacity = (mov ? 0.5 : 0.25) + 0.12 * Math.sin(t * 3);
  };

  return g;
}
