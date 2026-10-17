import * as THREE from "three";

export type FarolDaBarraGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    alternarLuz: () => boolean;
  };
};

export function criarFarolDaBarra(): FarolDaBarraGroup {
  const g = new THREE.Group() as FarolDaBarraGroup;
  g.name = "FarolDaBarra";
  const PI = Math.PI;
  let sd = 11;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  const M = (c: number, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o || {}));

  const m = {
    stone: M(0x756f63, { flatShading: true }),
    stoneL: M(0xa59f90),
    terr: M(0x595c5e),
    white: M(0xf2f2ea),
    roof: M(0xd2905a, { flatShading: true }),
    dark: M(0x1d1e20),
    win: M(0x2d4a3a),
    black: M(0x16181c, { roughness: 0.5 }),
    glass: M(0xa8dcec, { transparent: true, opacity: 0.6, roughness: 0.15 }),
    lamp: M(0xffe9a0, { emissive: 0xffcf4d, emissiveIntensity: 1.2 }),
    grass: M(0x7fa33f),
    dirt: M(0x8c6d4c),
    path: M(0xcdb9ad),
    bush: M(0x3f7a2a),
    rock: M(0x4a3f38, { flatShading: true }),
    sea: M(0x1a66b0, { roughness: 0.3 }),
    seaS: M(0x0f4580),
    shallow: M(0x35b5d0, { roughness: 0.3 }),
    foam: M(0xffffff, { transparent: true, opacity: 0.6 }),
    blue: M(0x3a6fd0),
    post: M(0xe8e8e8),
    beam: M(0xfff0a8, {
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
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
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 16), mt);
    o.position.set(x, y, z);
    g.add(o);
    return o;
  };

  const ball = (
    r: number,
    mt: THREE.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mt);
    o.position.set(x, y, z);
    g.add(o);
    return o;
  };

  const sea = bx(17, 1, 13, m.sea, -1.5, -0.85, -0.5);
  sea.material = [m.seaS, m.seaS, m.sea, m.seaS, m.seaS, m.seaS];
  bx(12, 0.02, 10.1, m.shallow, 1, -0.345, 0.95);
  bx(0.16, 0.01, 9.5, m.foam, -5.05, -0.33, 0.9);
  bx(12, 0.01, 0.16, m.foam, 1, -0.33, -4.15);
  const land = bx(11.2, 1.35, 9.3, m.grass, 1.4, -0.675, 1.35);
  land.material = [m.dirt, m.dirt, m.grass, m.dirt, m.dirt, m.dirt];
  for (let i = 0; i < 24; i++) {
    const o = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.18 + rnd() * 0.25, 0),
      m.rock,
    );
    if (i < 12) o.position.set(-4.2 + (rnd() - 0.5) * 0.8, -0.05, -3.3 + rnd() * 7.5);
    else o.position.set(-4.2 + rnd() * 8.2, -0.05, -3.3 + (rnd() - 0.5) * 0.8);
    o.scale.y = 0.7;
    g.add(o);
  }

  const P: [number, number][] = [
    [-2.8, 1.5],
    [2.6, 1.5],
    [2.6, -1.4],
    [-0.2, -2.1],
    [-2.8, -0.7],
  ];
  const poly = (k: number) => {
    const s = new THREE.Shape();
    P.forEach((p, i) => {
      const x = -0.1 + (p[0] + 0.1) * k;
      const y = -(-0.2 + (p[1] + 0.2) * k);
      if (i) s.lineTo(x, y);
      else s.moveTo(x, y);
    });
    s.closePath();
    return s;
  };
  const pr = (shape: THREE.Shape, h: number, mt: THREE.Material, y: number) => {
    const o = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false }),
      mt,
    );
    o.rotation.x = -PI / 2;
    o.position.y = y;
    g.add(o);
  };
  const anel = (
    ko: number,
    ki: number,
    h: number,
    mt: THREE.Material,
    y: number,
  ) => {
    const s = poly(ko);
    s.holes.push(new THREE.Path(poly(ki).getPoints()));
    pr(s, h, mt, y);
  };
  anel(1, 0.88, 1.2, m.stone, 0);
  pr(poly(0.9), 1.15, m.terr, 0);
  anel(1.01, 0.95, 0.18, m.white, 1.2);

  bx(0.9, 0.95, 0.08, m.stoneL, 0.5, 0.55, 1.54);
  bx(0.4, 0.55, 0.04, m.dark, 0.5, 0.4, 1.585);
  const arco = new THREE.Mesh(new THREE.CircleGeometry(0.2, 14, 0, PI), m.dark);
  arco.position.set(0.5, 0.68, 1.585);
  g.add(arco);
  (
    [
      [-2.8, 1.5],
      [2.6, 1.5],
      [2.6, -1.4],
      [-2.8, -0.7],
      [-0.2, -2.1],
    ] as const
  ).forEach((p) => {
    cyl(0.2, 0.2, 0.32, m.stoneL, p[0], 1.36, p[1], 12);
    cyl(0, 0.24, 0.2, m.stone, p[0], 1.62, p[1], 12);
  });
  bx(4.3, 0.7, 1.2, m.white, 0.35, 1.55, 0.8);
  for (let i = 0; i < 7; i++) bx(0.2, 0.3, 0.03, m.win, -1.5 + i * 0.6, 1.62, 1.41);
  const tri = new THREE.Shape();
  tri.moveTo(-0.75, 0);
  tri.lineTo(0.75, 0);
  tri.lineTo(0, 0.5);
  const tel = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tri, { depth: 4.5, bevelEnabled: false }),
    m.roof,
  );
  tel.rotation.y = PI / 2;
  tel.position.set(-1.9, 1.9, 0.8);
  g.add(tel);
  bx(1.8, 0.55, 1, m.white, 1.5, 1.45, -0.7);

  const TX = -0.8;
  const TZ = -0.7;
  const B = 1.15;
  const r = (y: number) => 0.52 - 0.12 * (y / 3.05);
  (
    [
      [0, 0.8, m.white],
      [0.8, 1.75, m.black],
      [1.75, 3.05, m.white],
    ] as const
  ).forEach((b) =>
    cyl(r(b[1]), r(b[0]), b[1] - b[0], b[2], TX, B + (b[0] + b[1]) / 2, TZ, 24),
  );
  cyl(0.52, 0.44, 0.3, m.black, TX, B + 3.2, TZ, 24);
  const rail = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.02, 6, 24), m.black);
  rail.rotation.x = PI / 2;
  rail.position.set(TX, B + 3.45, TZ);
  g.add(rail);
  cyl(0.3, 0.3, 0.6, m.glass, TX, B + 3.65, TZ, 16);
  for (let i = 0; i < 8; i++) {
    const a = (i * PI) / 4;
    bx(
      0.03,
      0.6,
      0.03,
      m.white,
      TX + Math.cos(a) * 0.3,
      B + 3.65,
      TZ + Math.sin(a) * 0.3,
    );
  }
  ball(0.12, m.lamp, TX, B + 3.65, TZ);
  cyl(0, 0.36, 0.32, m.black, TX, B + 4.11, TZ, 16);
  ball(0.05, m.black, TX, B + 4.32, TZ);
  const beams = new THREE.Group();
  beams.position.set(TX, B + 3.65, TZ);
  g.add(beams);
  [0, PI].forEach((a) => {
    const piv = new THREE.Group();
    piv.rotation.y = a;
    beams.add(piv);
    const c = new THREE.Mesh(
      new THREE.ConeGeometry(1, 4.5, 20, 1, true),
      m.beam,
    );
    c.rotation.z = PI / 2;
    c.position.x = 2.25;
    piv.add(c);
  });

  bx(0.7, 0.04, 3.3, m.path, 0.5, 0.02, 3.15);
  bx(10.6, 0.04, 0.5, m.path, 1.3, 0.02, 4.8);
  bx(0.5, 0.04, 8.2, m.path, -3.7, 0.02, 0.9);
  [-1.9, -1, 1, 1.9].forEach((dx) => {
    for (let i = 0; i < 4; i++) {
      const s = ball(0.17, m.bush, 0.5 + dx, 0.15, 2.1 + i * 0.7);
      s.scale.y = 0.9;
    }
  });
  ball(0.28, m.bush, -0.45, 0.25, 1.95);
  ball(0.28, m.bush, 1.45, 0.25, 1.95);
  bx(0.7, 0.12, 0.25, m.blue, 4.6, 0.3, 4.2);
  (
    [
      [-3.7, 0],
      [-3.7, 3],
      [2.9, 4.7],
      [5.5, 4.7],
    ] as const
  ).forEach((p) => {
    cyl(0.025, 0.025, 0.8, m.post, p[0], 0.4, p[1], 6);
    ball(0.06, m.post, p[0], 0.82, p[1]);
  });

  const barco = new THREE.Group();
  bx(0.4, 0.07, 0.14, m.white, 0, 0, 0, barco);
  bx(0.14, 0.08, 0.1, m.white, -0.05, 0.07, 0, barco);
  barco.position.set(-6, -0.3, -5.5);
  g.add(barco);

  let on = true;
  g.userData.alternarLuz = () => {
    on = !on;
    beams.visible = on;
    m.lamp.emissiveIntensity = on ? 1.2 : 0;
    return on;
  };
  let t = 0;
  g.userData.tick = (dt) => {
    t += dt;
    if (on) beams.rotation.y += dt * 1.4;
    m.foam.opacity = 0.5 + 0.3 * Math.sin(t * 1.6);
    barco.position.x += dt * 0.5;
    if (barco.position.x > 6) barco.position.x = -9;
  };

  return g;
}
