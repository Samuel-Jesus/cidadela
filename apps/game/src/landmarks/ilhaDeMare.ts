import * as THREE from "three";

export type IlhaDeMareGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    definirNivel: (n: number) => number;
    nivel: () => number;
  };
};

type ItemAnim = {
  g: THREE.Group;
  y: number;
  s: number;
  v: number;
  alvo: number;
};

export function criarIlhaDeMare(): IlhaDeMareGroup {
  const g = new THREE.Group() as IlhaDeMareGroup;
  g.name = "IlhaDeMare";
  const PI = Math.PI;
  let sd = 13;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  const M = (c: number | THREE.Color, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(
      Object.assign({ color: c, roughness: 0.82 }, o || {}),
    );

  const m = {
    sea: M(0x2cc4bb, { roughness: 0.25 }),
    seaS: M(0x0e7480),
    shal: M(0x86e6d4, { roughness: 0.3 }),
    sand: M(0xe6d3a0),
    grass: M(0x7fa83c),
    dirt: M(0x8a7a62),
    wood: M(0x8a6a45),
    woodD: M(0x6b4f35),
    white: M(0xf4f2ea),
    tile: M(0xc2562f, { flatShading: true }),
    blue: M(0x2b66b8),
    glass: M(0x233046, { roughness: 0.2 }),
    trunk: M(0x7a6a52),
    leaf: M(0x2f8a2e),
    leaf2: M(0x3f9d36),
    verde: M(0x2fa04a, { flatShading: true }),
    pool: M(0x25a8d8, { roughness: 0.2 }),
    poolB: M(0x1f6fc0),
    barco: M(0x2f9a5a),
    dark: M(0x23262b),
    palha: M(0xa07a3a, { flatShading: true }),
    morro: M(0x4a7a30, { flatShading: true }),
    pele: M(0x7a5238),
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
    const o = new THREE.Mesh(
      new THREE.CylinderGeometry(rt, rb, h, seg || 12),
      mt,
    );
    o.position.set(x, y, z);
    (p || g).add(o);
    return o;
  };

  const ball = (
    r: number,
    mt: THREE.Material,
    x: number,
    y: number,
    z: number,
    p?: THREE.Object3D,
  ) => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mt);
    o.position.set(x, y, z);
    (p || g).add(o);
    return o;
  };

  const hip = (
    r0: number,
    r1: number,
    h: number,
    mt: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sz: number,
    p?: THREE.Object3D,
  ) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, 4), mt);
    o.rotation.y = PI / 4;
    o.scale.set(sx, 1, sz);
    o.position.set(x, y, z);
    (p || g).add(o);
    return o;
  };

  const sea = bx(20, 1.2, 14, m.sea, 0, -0.6, 0);
  sea.material = [m.seaS, m.seaS, m.sea, m.seaS, m.seaS, m.seaS];
  const rasa = new THREE.Mesh(new THREE.CircleGeometry(7.5, 32), m.shal);
  rasa.rotation.x = -PI / 2;
  rasa.scale.y = 0.75;
  rasa.position.set(0, 0.012, 2.8);
  g.add(rasa);
  const land = bx(15, 0.9, 5.5, m.grass, 0, -0.45, -2.25);
  land.material = [m.dirt, m.dirt, m.grass, m.dirt, m.dirt, m.dirt];
  const cs = new THREE.Shape();
  cs.moveTo(-7.5, -0.5);
  cs.bezierCurveTo(-4, -2.6, 4, -2.6, 7.5, -0.5);
  cs.lineTo(7.5, 0);
  cs.lineTo(-7.5, 0);
  cs.closePath();
  const praia = new THREE.Mesh(
    new THREE.ExtrudeGeometry(cs, { depth: 0.34, bevelEnabled: false }),
    m.sand,
  );
  praia.rotation.x = -PI / 2;
  praia.position.y = -0.3;
  g.add(praia);

  const morros: [number, number, number, number, number, number][] = [
    [-4.5, -3.8, 3.2, 1.6, 0.7, 1.1],
    [3.8, -4.2, 3.4, 1.6, 0.8, 1.2],
    [0, -4.8, 3.6, 1.8, 0.9, 1],
    [-6.2, -2.5, 2, 1.2, 0.6, 1],
  ];
  morros.forEach((q) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(q[2], 20, 12), m.morro);
    s.scale.set(q[3], q[4], q[5]);
    s.position.set(q[0], -0.2, q[1]);
    g.add(s);
    for (let i = 0; i < 9; i++) {
      const a = (rnd() - 0.5) * 1.6 * q[2] * q[3];
      const b = (rnd() - 0.5) * 1.6 * q[2] * q[5];
      const k =
        1 - (a / (q[2] * q[3])) ** 2 - (b / (q[2] * q[5])) ** 2;
      if (k <= 0) continue;
      const r = 0.3 + rnd() * 0.35;
      const c = new THREE.Color().setHSL(
        0.26 + rnd() * 0.05,
        0.5,
        0.2 + rnd() * 0.1,
      );
      const bsh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 1),
        M(c, { flatShading: true }),
      );
      bsh.position.set(
        q[0] + a,
        0.1 + q[2] * q[4] * Math.sqrt(k) + r * 0.4,
        q[1] + b,
      );
      g.add(bsh);
    }
  });

  const palma = (x: number, z: number, h: number, y0?: number) => {
    const p = new THREE.Group();
    p.position.set(x, y0 === undefined ? 0.3 : y0, z);
    g.add(p);
    bx(0.1, h, 0.1, m.trunk, 0, h / 2, 0, p);
    for (let i = 0; i < 8; i++) {
      const yw = new THREE.Group();
      yw.position.y = h;
      yw.rotation.y = (i * PI) / 4;
      p.add(yw);
      const tl = new THREE.Group();
      tl.rotation.z = -0.3 - (i % 2) * 0.25;
      yw.add(tl);
      bx(0.85, 0.02, 0.15, i % 2 ? m.leaf : m.leaf2, 0.42, 0, 0, tl);
    }
  };
  (
    [
      [-7, -0.8, 2],
      [-5.4, -3, 2.4],
      [-2.5, -3.2, 2.2],
      [2.2, -3.4, 2.3],
      [5.5, -3.2, 2.1],
      [7.1, -1.2, 1.8],
      [6.8, 0.1, 1.6],
      [-6.9, 0.4, 1.6],
    ] as const
  ).forEach((p) => palma(p[0], p[1], p[2]));

  bx(1.3, 1, 0.9, m.white, -6.3, 0.8, -1.3);
  hip(0.1, 0.9, 0.5, m.tile, -6.3, 1.55, -1.3, 1.05, 0.75);
  bx(0.2, 0.35, 0.05, m.blue, -6.3, 0.62, -0.83);
  bx(0.14, 0.2, 0.05, m.blue, -6.7, 1.0, -0.83);
  bx(0.14, 0.2, 0.05, m.blue, -5.9, 1.0, -0.83);
  bx(0.3, 0.5, 0.3, m.white, -6.9, 1.6, -1.0);
  ball(0.1, m.dark, -6.9, 1.95, -1.0);
  (
    [
      [6.5, -3.7, 0x5fc6c0],
      [5, -4.2, 0xe58aa5],
    ] as const
  ).forEach((c) => {
    bx(1.1, 0.7, 0.9, M(c[2]), c[0], 0.65, c[1]);
    hip(0.1, 0.85, 0.4, m.tile, c[0], 1.2, c[1], 0.95, 0.8);
  });
  bx(0.6, 0.1, 3.2, m.wood, 0.2, 0.38, 3.4);
  for (let z = 2.2; z <= 4.8; z += 0.8) {
    [-0.25, 0.25].forEach((x) =>
      cyl(0.05, 0.05, 0.8, m.woodD, 0.2 + x, 0, z, g, 6),
    );
  }

  const tx = document.createElement("canvas");
  tx.width = 256;
  tx.height = 48;
  const tc = tx.getContext("2d")!;
  tc.fillStyle = "#fff";
  tc.font = "bold 22px Arial,sans-serif";
  tc.textAlign = "center";
  tc.textBaseline = "middle";
  tc.fillText("DEUS DO IMPOSSÍVEL", 128, 26);
  const nome = new THREE.CanvasTexture(tx);

  const pesca = new THREE.Group();
  pesca.position.set(-2.6, 0, 3.4);
  pesca.rotation.y = 0.5;
  g.add(pesca);
  bx(2, 0.35, 0.7, m.barco, 0, 0.12, 0, pesca);
  bx(0.5, 0.3, 0.7, m.barco, 1.15, 0.2, 0, pesca).rotation.z = 0.4;
  bx(2.1, 0.06, 0.75, m.white, 0, 0.32, 0, pesca);
  [-0.8, 0, 0.8].forEach((x) =>
    [0.3, -0.3].forEach((z) =>
      cyl(0.02, 0.02, 0.5, m.white, x, 0.6, z, pesca, 6),
    ),
  );
  bx(1.7, 0.03, 0.7, M(0xe8e4d8), 0, 0.86, 0, pesca);
  const pn = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.2),
    new THREE.MeshBasicMaterial({ map: nome, transparent: true }),
  );
  pn.position.set(0, 0.14, 0.36);
  pesca.add(pn);

  const escuna = new THREE.Group();
  escuna.position.set(5.5, 0, 4.6);
  escuna.rotation.y = -0.3;
  g.add(escuna);
  bx(2.8, 0.5, 0.95, m.dark, 0, 0.18, 0, escuna);
  bx(2.82, 0.12, 0.97, m.white, 0, 0.44, 0, escuna);
  bx(2.3, 0.05, 0.9, m.white, -0.1, 0.52, 0, escuna);
  [-1, 1].forEach((x) =>
    [0.4, -0.4].forEach((z) =>
      cyl(0.02, 0.02, 0.7, m.dark, x, 0.9, z, escuna, 6),
    ),
  );
  bx(2.3, 0.05, 1, M(0xdad7cc), -0.1, 1.28, 0, escuna);
  cyl(0.025, 0.025, 2.2, m.white, 0.5, 1.6, 0, escuna, 6);
  const flagCores = [0xe03030, 0xf2c230, 0x2e6ee0, 0xffffff, 0xe58aa5];
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Group();
    f.position.set(-0.8 + i * 0.35, 0.55, i % 2 ? 0.2 : -0.2);
    escuna.add(f);
    bx(0.1, 0.2, 0.08, M(flagCores[i]!), 0, 0.1, 0, f);
    ball(0.045, m.pele, 0, 0.26, 0, f);
  }

  const nad: { f: THREE.Group; ph: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const f = new THREE.Group();
    f.position.set(4.0 + rnd() * 2.6, 0.02, 5.6 + rnd() * 1.2);
    g.add(f);
    ball(0.06, m.pele, 0, 0.06, 0, f);
    const a = bx(0.03, 0.2, 0.03, m.pele, -0.05, 0.18, 0, f);
    a.rotation.z = 0.3;
    const b = bx(0.03, 0.2, 0.03, m.pele, 0.05, 0.18, 0, f);
    b.rotation.z = -0.3;
    nad.push({ f, ph: rnd() * 6 });
  }
  (
    [
      [6.5, 6.0],
      [7, 5.4],
    ] as const
  ).forEach((p) => {
    const j = new THREE.Group();
    j.position.set(p[0], 0, p[1]);
    g.add(j);
    bx(
      0.55,
      0.12,
      0.22,
      M(p[0] > 6.8 ? 0xf2c230 : 0x2b2b30),
      0,
      0.06,
      0,
      j,
    );
    bx(0.15, 0.1, 0.15, m.white, 0.05, 0.17, 0, j);
  });

  const pousada = (cor: number) => {
    const p = new THREE.Group();
    bx(2.4, 0.1, 1.8, m.wood, 0, 0.05, 0, p);
    bx(2, 0.7, 1.3, M(cor), 0, 0.5, -0.15, p);
    hip(0.1, 1.35, 0.5, m.tile, 0, 1.1, -0.15, 1.1, 0.9, p);
    bx(2.3, 0.06, 0.62, m.tile, 0, 0.93, 0.55, p).rotation.x = 0.18;
    [-0.95, -0.32, 0.32, 0.95].forEach((x) =>
      bx(0.06, 0.62, 0.06, m.white, x, 0.45, 0.72, p),
    );
    [-0.55, 0.55].forEach((x) => {
      bx(0.34, 0.4, 0.04, m.white, x, 0.55, 0.5, p);
      bx(0.26, 0.32, 0.05, m.glass, x, 0.55, 0.51, p);
      [-0.2, 0.2].forEach((s) =>
        bx(0.07, 0.32, 0.05, m.blue, x + s, 0.55, 0.52, p),
      );
    });
    bx(0.38, 0.55, 0.05, m.woodD, 0, 0.4, 0.5, p);
    const rede = bx(0.9, 0.04, 0.12, M(0xe85a5a), 0.4, 0.32, 0.9, p);
    rede.rotation.z = 0.15;
    return p;
  };

  const pCores = [0x5fc6c0, 0xf2c24a, 0xe58aa5, 0xf4f4f0];
  const lotes = [-4.5, -1.5, 1.5, 4.5];
  const itens: ItemAnim[] = [];
  const novo = (grp: THREE.Group, x: number, y: number, z: number) => {
    grp.position.set(x, y, z);
    g.add(grp);
    grp.visible = false;
    grp.scale.setScalar(0.001);
    const it: ItemAnim = { g: grp, y, s: 0, v: 0, alvo: 0 };
    itens.push(it);
    return it;
  };
  const pit = lotes.map((x, i) => novo(pousada(pCores[i]!), x, 0.3, -0.9));
  pit.forEach((it) => {
    const p = new THREE.Group();
    p.position.set(1.35, 0, 0.55);
    it.g.add(p);
    bx(0.08, 0.8, 0.08, m.trunk, 0, 0.4, 0, p);
    for (let k = 0; k < 6; k++) {
      const yw = new THREE.Group();
      yw.position.y = 0.8;
      yw.rotation.y = (k * PI) / 3;
      p.add(yw);
      const tl = new THREE.Group();
      tl.rotation.z = -0.35;
      yw.add(tl);
      bx(0.55, 0.02, 0.12, m.leaf, 0.27, 0, 0, tl);
    }
  });

  const resort = new THREE.Group();
  bx(3.4, 1.4, 1.5, m.white, -3.2, 1, -1.3, resort);
  hip(0.1, 1.9, 0.6, m.verde, -3.2, 1.99, -1.3, 1.25, 0.95, resort);
  for (let k = 0; k < 4; k++) {
    [0.5, 1.05].forEach((y) => {
      bx(0.34, 0.42, 0.04, m.white, -4.3 + k * 0.72, 0.55 + y, -0.54, resort);
      bx(0.26, 0.34, 0.05, m.glass, -4.3 + k * 0.72, 0.55 + y, -0.53, resort);
    });
  }
  bx(3.5, 0.06, 0.3, m.wood, -3.2, 1.1, -0.45, resort);
  bx(3.5, 0.2, 0.03, m.white, -3.2, 1.22, -0.3, resort);
  (
    [
      [-0.2, -1.2],
      [0.9, -1.4],
      [0.4, -0.2],
    ] as const
  ).forEach((p) => {
    (
      [
        [-0.4, -0.4],
        [0.4, -0.4],
        [-0.4, 0.4],
        [0.4, 0.4],
      ] as const
    ).forEach((d) =>
      bx(0.06, 0.7, 0.06, m.woodD, p[0] + d[0], 0.65, p[1] + d[1], resort),
    );
    hip(0.05, 0.75, 0.45, m.verde, p[0], 1.2, p[1], 1, 1, resort);
    bx(0.9, 0.05, 0.9, m.wood, p[0], 0.32, p[1], resort);
  });
  bx(3.2, 0.1, 1.6, m.poolB, 4.1, 0.35, -1.5, resort);
  bx(3, 0.12, 1.4, m.pool, 4.1, 0.36, -1.5, resort);
  (
    [
      [2.9, -0.3],
      [3.6, -0.3],
      [4.3, -0.3],
      [5, -0.3],
    ] as const
  ).forEach((p) => {
    bx(0.5, 0.1, 0.22, m.white, p[0], 0.36, p[1], resort);
    bx(0.5, 0.04, 0.22, m.blue, p[0], 0.42, p[1], resort);
  });
  const guardaCores = [0xe03030, 0xf2c230, 0x2e86ab];
  (
    [
      [2.9, 0.1],
      [4, 0.1],
      [5.1, 0.1],
    ] as const
  ).forEach((p, i) => {
    cyl(0.02, 0.02, 0.7, m.dark, p[0], 0.65, p[1], resort, 6);
    cyl(0, 0.4, 0.15, M(guardaCores[i]!), p[0], 1.03, p[1], resort, 10);
  });
  for (let x = -3.2; x <= 2.1; x += 0.8) {
    bx(0.5, 0.35, 0.4, m.white, x, 0.5, 0.45, resort);
    bx(0.6, 0.05, 0.5, m.white, x, 0.72, 0.45, resort);
  }
  bx(0.5, 0.1, 2.8, m.wood, 2.2, 0.4, 3.1, resort);
  for (let z = 1.8; z <= 4.4; z += 0.8) {
    [-0.25, 0.25].forEach((x) =>
      cyl(0.05, 0.05, 0.8, m.woodD, 2.2 + x, 0, z, resort, 6),
    );
  }
  cyl(0.5, 0.5, 0.06, m.wood, 2.2, 0.4, 4.6, resort, 12);
  cyl(0.02, 0.6, 0.5, m.palha, 2.2, 0.98, 4.6, resort, 10);
  const rit = novo(resort, 0, 0, 0);
  rit.y = 0.3;

  let nivel = 0;
  let t = 0;
  const aplicar = () => {
    pit.forEach((it, i) => {
      it.alvo = nivel >= 1 && nivel <= 4 && i < nivel ? 1 : 0;
    });
    rit.alvo = nivel === 5 ? 1 : 0;
  };
  g.userData.definirNivel = (n) => {
    nivel = Math.max(0, Math.min(5, n | 0));
    aplicar();
    return nivel;
  };
  g.userData.nivel = () => nivel;
  g.userData.tick = (dt) => {
    t += dt;
    itens.forEach((it) => {
      it.v += (it.alvo - it.s) * dt * 110;
      it.v *= Math.exp(-dt * 8);
      it.s += it.v * dt;
      const s = Math.max(0, it.s);
      it.g.visible = s > 0.01 || it.alvo > 0;
      it.g.scale.setScalar(Math.max(0.001, s));
      it.g.position.y = it.y + (1 - Math.min(1, s)) * 1.6;
    });
    pesca.rotation.z = 0.02 * Math.sin(t * 1.7);
    pesca.position.y = 0.02 * Math.sin(t * 1.9);
    escuna.rotation.z = 0.025 * Math.sin(t * 1.3);
    escuna.position.y = 0.02 * Math.sin(t * 1.5 + 1);
    nad.forEach((n) => {
      n.f.position.y = 0.02 + 0.04 * Math.abs(Math.sin(t * 2.5 + n.ph));
    });
  };

  return g;
}
