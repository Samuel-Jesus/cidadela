import * as THREE from "three";

export type ForteSaoMarceloGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
  };
};

export function criarForteSaoMarcelo(): ForteSaoMarceloGroup {
  const g = new THREE.Group() as ForteSaoMarceloGroup;
  g.name = "ForteSaoMarcelo";
  const PI = Math.PI;

  const M = (c: number, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o || {}));

  const m = {
    stone: M(0x8d8b82),
    stoneL: M(0xaaa89b),
    terr: M(0x3b3d3f),
    court: M(0x6d6f6c),
    drum: M(0x9a988d),
    dark: M(0x1c1d1e),
    deck: M(0xbdbaa8),
    post: M(0x77786f),
    trunk: M(0x7a6a52),
    leaf: M(0x2f8a2e),
    leaf2: M(0x3f9d36),
    white: M(0xf4f6f4),
    hull: M(0xe9ecee),
    sand: M(0xead9a0),
  };

  const agua = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 1, 64), [
    M(0x0e7480, { roughness: 0.4 }),
    M(0x25bdb6, { roughness: 0.25, metalness: 0.1 }),
    M(0x0e7480),
  ]);
  agua.position.y = -0.5;
  g.add(agua);

  const disco = (
    r: number,
    c: number,
    x: number,
    z: number,
    y: number,
    sz?: number,
  ) => {
    const o = new THREE.Mesh(
      new THREE.CircleGeometry(r, 48),
      M(c, { roughness: 0.5 }),
    );
    o.rotation.x = -PI / 2;
    o.position.set(x, y, z);
    o.scale.y = sz || 1;
    g.add(o);
  };
  disco(4.7, 0x62d8c8, 0, 0, 0.012);
  disco(4.1, 0x8fe4cf, 0, 0, 0.016);
  disco(1.5, 0xead9a0, -2.9, 2.3, 0.022, 0.75);

  const anel = (
    ro: number,
    ri: number,
    h: number,
    mt: THREE.Material,
    y: number,
  ) => {
    const s = new THREE.Shape();
    s.absarc(0, 0, ro, 0, PI * 2, false);
    const p = new THREE.Path();
    p.absarc(0, 0, ri, 0, PI * 2, true);
    s.holes.push(p);
    const o = new THREE.Mesh(
      new THREE.ExtrudeGeometry(s, {
        depth: h,
        bevelEnabled: false,
        curveSegments: 48,
      }),
      mt,
    );
    o.rotation.x = -PI / 2;
    o.position.y = y;
    g.add(o);
    return o;
  };

  const cyl = (
    r: number,
    h: number,
    mt: THREE.Material,
    x: number,
    y: number,
    z: number,
    seg?: number,
    p?: THREE.Object3D,
  ) => {
    const o = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, seg || 12),
      mt,
    );
    o.position.set(x, y, z);
    (p || g).add(o);
    return o;
  };

  const bx = (
    w: number,
    h: number,
    d: number,
    mt: THREE.Material,
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

  anel(3.3, 2.55, 1.2, m.stone, 0);
  anel(3.3, 2.55, 0.05, m.terr, 1.2);
  anel(3.3, 3.17, 0.24, m.stoneL, 1.25);
  anel(2.65, 2.55, 0.18, m.stoneL, 1.25);
  cyl(2.56, 0.6, m.court, 0, 0.3, 0, 48);
  anel(2.15, 1.75, 0.45, m.stone, 0.6);
  anel(2.15, 1.75, 0.04, m.terr, 1.05);
  cyl(1.72, 0.95, m.drum, 0, 1.075, 0, 48);

  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const cx = cv.getContext("2d")!;
  cx.fillStyle = "#74777a";
  cx.fillRect(0, 0, 256, 256);
  cx.strokeStyle = "#4d5053";
  cx.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    const a = (i * PI) / 9;
    cx.beginPath();
    cx.moveTo(128, 128);
    cx.lineTo(128 + Math.cos(a) * 128, 128 + Math.sin(a) * 128);
    cx.stroke();
  }
  [118, 84, 50].forEach((r) => {
    cx.beginPath();
    cx.arc(128, 128, r, 0, 7);
    cx.stroke();
  });
  const roof = new THREE.Mesh(
    new THREE.CircleGeometry(1.76, 48),
    new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(cv),
      roughness: 0.9,
    }),
  );
  roof.rotation.x = -PI / 2;
  roof.position.y = 1.56;
  g.add(roof);
  anel(1.78, 1.68, 0.1, m.stoneL, 1.55);
  bx(0.3, 0.4, 0.05, m.dark, 0.3, 0.85, 1.72);
  bx(0.4, 0.5, 0.05, m.dark, 0, 0.85, -1.72);

  const palma = (a: number, R: number, h: number) => {
    const p = new THREE.Group();
    p.position.set(Math.cos(a) * R, 0.6, Math.sin(a) * R);
    g.add(p);
    const t = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.1, h, 8),
      m.trunk,
    );
    t.position.y = h / 2;
    t.rotation.z = 0.08;
    p.add(t);
    const top = new THREE.Group();
    top.position.set(-0.04, h, 0);
    p.add(top);
    for (let i = 0; i < 9; i++) {
      const yaw = new THREE.Group();
      yaw.rotation.y = (i * PI * 2) / 9;
      top.add(yaw);
      const tilt = new THREE.Group();
      tilt.rotation.z = -0.3 - (i % 2) * 0.25;
      yaw.add(tilt);
      bx(0.85, 0.025, 0.16, i % 2 ? m.leaf : m.leaf2, 0.42, 0, 0, tilt);
    }
  };
  (
    [
      [0.7, 2.15, 1.1],
      [2.3, 2.2, 1],
      [-0.6, 2.15, 1.25],
      [-1.9, 2.2, 0.95],
    ] as const
  ).forEach((q) => palma(q[0], q[1], q[2]));

  const d = new THREE.Vector2(-0.55, 0.83).normalize();
  const cais = new THREE.Group();
  cais.position.set(d.x * 3.15, 0, d.y * 3.15);
  cais.rotation.y = Math.atan2(-d.y, d.x);
  g.add(cais);
  const L = 3.6;
  bx(L, 0.07, 0.34, m.deck, L / 2, 0.3, 0, cais);
  bx(0.95, 0.07, 0.75, m.deck, L + 0.3, 0.3, 0, cais);
  bx(0.7, 0.1, 0.7, m.deck, -0.1, 0.28, 0, cais);
  bx(0.05, 0.5, 0.5, m.dark, -0.02, 0.6, 0, cais);
  for (let x = 0.3; x <= L; x += 0.6) {
    [-0.15, 0.15].forEach((z) => {
      cyl(0.045, 0.8, m.post, x, -0.1, z, 8, cais);
      cyl(0.02, 0.25, m.post, x, 0.43, z * 1.1, 6, cais);
    });
  }
  [-0.16, 0.16].forEach((z) => bx(L, 0.03, 0.03, m.post, L / 2, 0.55, z, cais));
  [-0.28, 0.28].forEach((z) =>
    cyl(0.06, 0.22, m.dark, L + 0.55, 0.43, z, 10, cais),
  );
  (
    [
      [0.12, -0.3],
      [0.12, 0.3],
      [L + 0.55, -0.34],
      [L + 0.55, 0.34],
    ] as const
  ).forEach((q) => cyl(0.05, 0.8, m.post, q[0], -0.1, q[1], 8, cais));

  const bar = new THREE.Group();
  g.add(bar);
  bx(0.55, 0.1, 0.17, m.hull, 0, 0.1, 0, bar);
  cyl(0.012, 0.9, m.post, 0, 0.55, 0, 6, bar);
  const tri = new THREE.Shape();
  tri.moveTo(0, 0);
  tri.lineTo(0, 0.8);
  tri.lineTo(0.4, 0);
  const vela = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tri, { depth: 0.01, bevelEnabled: false }),
    m.white,
  );
  vela.position.set(-0.03, 0.17, 0);
  bar.add(vela);
  let ang = 0.9;
  const pos = () => {
    bar.position.set(Math.cos(ang) * 6.3, 0, Math.sin(ang) * 6.3);
    bar.rotation.y = Math.atan2(-Math.cos(ang), -Math.sin(ang));
  };
  pos();
  g.userData.tick = (dt) => {
    ang += dt * 0.1;
    pos();
  };

  return g;
}
