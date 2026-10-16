import * as THREE from "three";

export type AeroportoSalvadorGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    alternarOperacao: () => boolean;
    reiniciarVoo: () => void;
  };
};

export function criarAeroportoSalvador(): AeroportoSalvadorGroup {
  const g = new THREE.Group() as AeroportoSalvadorGroup;
  g.name = "AeroportoSalvador";
  const PI = Math.PI;
  let sd = 21;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  const M = (
    c: number | THREE.Color,
    o?: THREE.MeshStandardMaterialParameters,
  ) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o || {}));

  const m = {
    grass: M(0x7fa83c),
    dirt: M(0x8a7a62),
    sea: M(0x1a8fb5, { roughness: 0.3 }),
    apron: M(0xa6a69f),
    asf: M(0x3d3f44),
    white: M(0xf4f5f7, { roughness: 0.55 }),
    vault: M(0xdfe3e8, { roughness: 0.5 }),
    glass: M(0x2aa38b, { roughness: 0.2, transparent: true, opacity: 0.8 }),
    gl: M(0x1f6f78, { roughness: 0.2 }),
    yellow: M(0xf2c230),
    grey: M(0xaeb0b3),
    dark: M(0x1c1d21),
    blue: M(0x2b7fd0),
    sand: M(0xece4d0),
    bush: M(0x3a6a2a),
    cab: M(0x1e2a36, { roughness: 0.2 }),
    lamp: M(0xfff3b0, { emissive: 0xffe9a0, emissiveIntensity: 0.7 }),
    beac: M(0xff4a2a, { emissive: 0xff2a10, emissiveIntensity: 1 }),
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
    p?: THREE.Object3D,
    seg?: number,
  ) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 14), mt);
    o.position.set(x, y, z);
    (p || g).add(o);
    return o;
  };

  const grass = bx(26, 0.6, 20, m.grass, 0, -0.3, 0);
  grass.material = [m.dirt, m.dirt, m.grass, m.dirt, m.dirt, m.dirt];
  bx(26, 0.6, 2.5, m.sea, 0, -0.4, -11.25);
  bx(17, 0.04, 7.2, m.apron, -2, 0.02, -1.4);
  bx(26, 0.05, 2, m.asf, 0, 0.03, 5.2);
  [-8, 4.2].forEach((x) => bx(1.4, 0.045, 2.4, m.asf, x, 0.03, 3.2));
  for (let x = -12; x <= 12; x += 1) bx(0.5, 0.01, 0.06, m.white, x, 0.06, 5.2);
  [4.25, 6.15].forEach((z) => bx(26, 0.01, 0.05, m.white, 0, 0.06, z));
  bx(26, 0.01, 0.05, m.yellow, 0, 0.05, 2.6);
  [-5, -1.5, 2, 5].forEach((x) => bx(0.05, 0.01, 3.6, m.yellow, x, 0.05, 0.8));
  (
    [
      [9, -6, 2.4],
      [11.5, -3.5, 2],
      [-11, -7, 1.8],
    ] as const
  ).forEach((p) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(p[2], 18, 10), m.sand);
    s.scale.y = 0.45;
    s.position.set(p[0], 0, p[1]);
    g.add(s);
  });
  for (let i = 0; i < 30; i++) {
    const r = 0.35 + rnd() * 0.4;
    const b = new THREE.Mesh(
      new THREE.IcosahedronGeometry(r, 1),
      M(new THREE.Color().setHSL(0.27 + rnd() * 0.05, 0.45, 0.2 + rnd() * 0.08)),
    );
    b.position.set(-12.5 + rnd() * 25, r * 0.7, -10 + rnd() * 2.2);
    g.add(b);
  }

  bx(14, 2.2, 3.2, m.white, -2, 1.1, -7.2);
  const vb = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 1.75, 14, 28, 1, false, 0, PI),
    m.vault,
  );
  vb.rotation.z = PI / 2;
  vb.position.set(-2, 2.2, -7.2);
  g.add(vb);
  bx(13.8, 0.9, 0.05, m.gl, -2, 1.1, -5.58);
  for (let x = -8.6; x <= 4.7; x += 0.8) bx(0.05, 0.9, 0.07, m.white, x, 1.1, -5.57);

  const lt = document.createElement("canvas");
  lt.width = 512;
  lt.height = 128;
  const lc = lt.getContext("2d");
  if (!lc) throw new Error("2d context unavailable");
  lc.fillStyle = "#fff";
  lc.fillRect(0, 0, 512, 128);
  lc.fillStyle = "#1f2f9a";
  lc.font = "bold 52px Arial,sans-serif";
  lc.textAlign = "left";
  lc.textBaseline = "middle";
  lc.fillText("SALVADOR BAHIA", 20, 38);
  lc.fillText("AIRPORT", 20, 96);
  const letr = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 1.1),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(lt), roughness: 0.6 }),
  );
  letr.position.set(0.6, 1.4, -8.81);
  letr.rotation.y = PI;
  g.add(letr);

  const copa = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 4.5, 26, 1, true, -PI / 2, PI),
    m.vault.clone(),
  );
  copa.rotation.x = -PI / 2;
  (copa.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  copa.position.set(-7.3, 0, -9.9);
  g.add(copa);

  const ram = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.2, 0.5, 26, 1, true, 0, PI / 2),
    m.white.clone(),
  );
  (ram.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  ram.position.set(-11, 0.25, -8.2);
  g.add(ram);

  const via = new THREE.Mesh(new THREE.RingGeometry(2.2, 4, 24, 1, 0, PI / 2), m.asf);
  via.rotation.x = -PI / 2;
  via.position.set(-11, 0.035, -8.2);
  g.add(via);
  bx(6, 0.04, 3.5, m.asf, 9, 0.02, -8.5);
  [8.2, 10.1].forEach((x) => bx(1.4, 0.06, 3.2, m.blue, x, 0.95, -8.5));
  for (let i = 0; i < 14; i++)
    bx(
      0.3,
      0.12,
      0.18,
      M([0xeeeeee, 0x23262b, 0xb23a3a, 0x3a5fa8, 0xc6c9cd][i % 5]),
      6.8 + (i % 7) * 0.55,
      0.1,
      -9.4 + (i < 7 ? 0 : 1.4),
    );

  [-5, -1.5, 2, 5].forEach((x) => {
    bx(0.55, 0.55, 1.9, m.glass, x, 1.1, -4.6);
    bx(0.6, 0.04, 1.9, m.white, x, 1.4, -4.6);
    bx(0.6, 0.04, 1.9, m.white, x, 0.8, -4.6);
    bx(0.7, 0.6, 0.6, m.grey, x, 1.1, -3.45);
    cyl(0.05, 0.05, 0.7, m.grey, x, 0.4, -3.2, g, 8);
  });

  cyl(0.5, 0.6, 6, m.grey, -10.2, 3, -3.5, g, 16);
  cyl(0.95, 0.8, 0.8, m.cab, -10.2, 6.4, -3.5, g, 16);
  cyl(1.05, 1.05, 0.12, m.white, -10.2, 6.86, -3.5, g, 16);
  const farol = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), m.beac);
  farol.position.set(-10.2, 7.15, -3.5);
  g.add(farol);
  cyl(0.02, 0.02, 0.3, m.grey, -10.2, 7.05, -3.5, g, 6);

  const mastro = (x: number, z: number) => {
    (
      [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const
    ).forEach((s) => cyl(0.018, 0.018, 5, m.grey, x + s[0] * 0.13, 2.5, z + s[1] * 0.13, g, 6));
    for (let y = 0.5; y < 5; y += 1) {
      bx(0.3, 0.02, 0.02, m.grey, x, y, z + 0.13);
      bx(0.3, 0.02, 0.02, m.grey, x, y, z - 0.13);
      bx(0.02, 0.02, 0.3, m.grey, x + 0.13, y, z);
      bx(0.02, 0.02, 0.3, m.grey, x - 0.13, y, z);
    }
    bx(0.8, 0.1, 0.25, m.grey, x, 5.1, z);
    for (let i = 0; i < 6; i++) bx(0.1, 0.08, 0.1, m.lamp, x - 0.33 + i * 0.13, 5.2, z);
  };
  [-7.2, -3.3, 0.6, 4.4].forEach((x) => mastro(x, -3.8));

  const onibus = new THREE.Group();
  bx(0.9, 0.38, 0.34, M(0x2f9a4a), 0, 0.3, 0, onibus);
  bx(0.92, 0.1, 0.35, m.white, 0, 0.33, 0, onibus);
  bx(0.7, 0.12, 0.36, m.cab, 0, 0.4, 0, onibus);
  onibus.position.set(-6, 0, 0.9);
  g.add(onibus);
  bx(0.5, 0.25, 0.3, M(0x2f9a4a), 2, 0.2, -3.1);
  cyl(0.1, 0.1, 0.45, m.grey, 2, 0.35, -3.1, g, 10).rotation.z = PI / 2;
  (
    [
      [-3, -3.6],
      [-2.6, -3.6],
      [-2.2, -3.6],
    ] as const
  ).forEach((p) => bx(0.3, 0.18, 0.24, m.grey, p[0], 0.15, p[1]));

  const aviao = (tail: number, ac: number) => {
    const a = new THREE.Group();
    const fus = cyl(0.27, 0.27, 3.4, m.white, 0, 0.62, 0, a, 18);
    fus.rotation.z = PI / 2;
    const nariz = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 10), m.white);
    nariz.scale.x = 1.4;
    nariz.position.set(1.7, 0.62, 0);
    a.add(nariz);
    const cone = cyl(0.1, 0.27, 0.9, m.white, -2.05, 0.64, 0, a, 14);
    cone.rotation.z = PI / 2;
    const fin = bx(0.55, 0.8, 0.05, M(tail), -1.75, 1.12, 0, a);
    fin.rotation.z = 0.4;
    bx(0.4, 0.04, 1, m.white, -1.8, 0.7, 0, a);
    [1, -1].forEach((s) => {
      const w = bx(0.8, 0.05, 1.5, m.white, -0.1, 0.5, s * 0.85, a);
      w.rotation.y = -s * 0.5;
      const e = cyl(0.1, 0.1, 0.45, M(ac), 0.35, 0.33, s * 0.75, a, 12);
      e.rotation.z = PI / 2;
    });
    for (let x = -1; x <= 1.2; x += 0.14)
      [0.275, -0.275].forEach((z) => bx(0.05, 0.05, 0.01, m.dark, x, 0.7, z, a));
    bx(0.04, 0.3, 0.04, m.dark, 0.8, 0.25, 0, a);
    [-0.15, 0.15].forEach((z) => bx(0.04, 0.3, 0.04, m.dark, -0.2, 0.25, z, a));
    (
      [
        [0.8, 0],
        [-0.2, -0.15],
        [-0.2, 0.15],
      ] as const
    ).forEach((p) => {
      const r = cyl(0.07, 0.07, 0.06, m.dark, p[0], 0.08, p[1], a, 10);
      r.rotation.x = PI / 2;
    });
    return a;
  };

  (
    [
      [-5, 0xf26b1d, 0xf26b1d],
      [-1.5, 0x143a7b, 0x143a7b],
      [2, 0x8a1f55, 0x8a1f55],
    ] as const
  ).forEach((p) => {
    const a = aviao(p[1], p[2]);
    a.position.set(p[0], 0, -1);
    a.rotation.y = PI / 2;
    g.add(a);
  });
  const movel = aviao(0x2faa4a, 0x2faa4a);
  g.add(movel);

  const K: number[][] = [
    [0, 5, 0, -1, PI / 2, 0, 1],
    [3, 5, 0, 1.4, PI / 2, 0, 1],
    [5.5, 3.8, 0, 2.6, PI, 0, 1],
    [13, -8, 0, 2.6, PI, 0, 1],
    [15.5, -8, 0, 3.6, 1.5 * PI, 0, 1],
    [17, -8, 0, 5.2, 1.5 * PI, 0, 1],
    [19, -7.4, 0, 5.2, 2 * PI, 0, 1],
    [26, 4, 0, 5.2, 2 * PI, 0, 2],
    [27, 6.5, 0.35, 5.2, 2 * PI, 0.22, 1],
    [31, 16, 6, 5.2, 2 * PI, 0.2, 0],
    [33, -16, 5, 5.2, 2 * PI, -0.05, 0],
    [38, -9.5, 0.12, 5.2, 2 * PI, -0.06, 0],
    [44, 0.5, 0, 5.2, 2 * PI, 0, 3],
    [47, 3.5, 0, 5.2, 2 * PI, 0, 1],
    [49, 4.2, 0, 4, 2.5 * PI, 0, 1],
    [50.5, 4.2, 0, 2.6, 2.5 * PI, 0, 1],
    [53, 5, 0, 1.4, 2.5 * PI, 0, 1],
    [56, 5, 0, -1, 2.5 * PI, 0, 1],
  ];
  const ez = [
    (s: number) => s,
    (s: number) => s * s * (3 - 2 * s),
    (s: number) => s * s,
    (s: number) => 1 - (1 - s) * (1 - s),
  ];
  let t = 0;
  let vai = true;
  const pose = () => {
    let i = 0;
    while (i < K.length - 2 && t >= K[i + 1][0]) i++;
    const a = K[i];
    const b = K[i + 1];
    const s = ez[a[6]](Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))));
    const L = (k: number) => a[k] + (b[k] - a[k]) * s;
    movel.position.set(L(1), L(2), L(3));
    movel.rotation.y = L(4);
    movel.rotation.z = L(5);
    movel.visible = !(t > 31 && t < 33);
  };
  pose();

  g.userData.alternarOperacao = () => (vai = !vai);
  g.userData.reiniciarVoo = () => {
    t = 0;
    pose();
  };
  g.userData.tick = (dt) => {
    if (!vai) return;
    t = (t + dt) % 56;
    pose();
    onibus.position.x += dt * 0.9;
    if (onibus.position.x > 5) onibus.position.x = -9;
    m.beac.emissiveIntensity = Math.sin(t * 5) > 0 ? 1.2 : 0.1;
  };

  return g;
}
