import * as THREE from "three";

export type ValencaGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    definirNivel: (n: number) => number;
    nivel: () => number;
    alternarVida: () => boolean;
    pontos: Array<{ nome: string; pos: [number, number, number]; nivel: number }>;
  };
};

type ItemAnim = {
  g: THREE.Group;
  y: number;
  s: number;
  v: number;
  alvo: number;
  alvoNovo: number;
  atraso: number;
  d: number;
  ord?: number;
  lim?: number;
};

type Parte = { it: ItemAnim; min: number };

type Mover = {
  o: THREE.Object3D;
  min: number;
  u: (t: number) => void;
};

type Palma = { top: THREE.Group; f: number };

type Agua = {
  p: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  b: ArrayLike<number>;
  a: number;
};

export function criarValenca(): ValencaGroup {
  const g = new THREE.Group() as ValencaGroup;
  g.name = "Valenca";
  const PI = Math.PI;
  let sd = 31;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  const M = (c: number | THREE.Color, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(
      Object.assign(
        { color: c, roughness: 0.85, flatShading: true },
        o || {},
      ),
    );

  const m = {
    sea: M(0x1f93b8, { roughness: 0.35 }),
    seaS: M(0x0e6a80),
    rio: M(0x3aa7d0, { roughness: 0.35 }),
    sand: M(0xe9d8a6),
    grass: M(0x6f9a3a),
    hill: M(0x4f9145),
    hill2: M(0x3f7d3a),
    asf: M(0x44464b),
    walk: M(0xcfcdc4),
    white: M(0xf4f2ea),
    tile: M(0xc2562f),
    blue: M(0x2b66b8),
    jan: M(0x23303f, { roughness: 0.3 }),
    wood: M(0x8a6a45),
    palha: M(0xd8b24a),
    brick: M(0xa8452e),
    zinco: M(0x9aa0a6, { metalness: 0.3, roughness: 0.6 }),
    laje: M(0xb8b6ae),
    caixa: M(0x2a62c4),
    trunk: M(0x7a6a52),
    leaf: M(0x2f8a2e),
    leaf2: M(0x3f9d36),
    dark: M(0x23262b),
    glass: M(0x7fc8e8, { roughness: 0.2 }),
    lamp: M(0xffe9a0, { emissive: 0xffd070, emissiveIntensity: 0.9 }),
    pele: M(0x7a5238),
    red: M(0xd1495b),
    pool: M(0x25a8d8, { roughness: 0.2 }),
    verde: M(0x3c8d40),
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
      new THREE.CylinderGeometry(rt, rb, h, seg || 10),
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

  const Y0 = 0.2;
  const rx = (z: number) => -5.7 + Math.sin(z * 0.55) * 0.45;
  const itens: ItemAnim[] = [];
  const casas: ItemAnim[] = [];
  const moitas: ItemAnim[] = [];
  const partes: Parte[] = [];
  const movers: Mover[] = [];
  const anims: Array<(t: number) => void> = [];
  const palmas: Palma[] = [];
  const aguas: Agua[] = [];

  const novo = (grp: THREE.Group, x: number, y: number, z: number) => {
    grp.position.set(x, y, z);
    g.add(grp);
    grp.visible = false;
    grp.scale.setScalar(0.001);
    const it: ItemAnim = {
      g: grp,
      y,
      s: 0,
      v: 0,
      alvo: 0,
      alvoNovo: 0,
      atraso: 0,
      d: 0,
    };
    itens.push(it);
    return it;
  };

  const parte = (
    grp: THREE.Group,
    x: number,
    z: number,
    min: number,
    d?: number,
    y?: number,
  ) => {
    const it = novo(grp, x, y == null ? Y0 : y, z);
    it.d = d || 0;
    partes.push({ it, min });
    return it;
  };

  const pontos: Array<{
    nome: string;
    pos: [number, number, number];
    nivel: number;
  }> = [];
  const ponto = (
    nome: string,
    x: number,
    y: number,
    z: number,
    nivel: number,
  ) => pontos.push({ nome, pos: [x, y, z], nivel });

  bx(16, 0.4, 13.9, m.grass, 0, -0.2, -1.35);
  (
    [
      [-6.5, 2.2],
      [-3, 2.8],
      [1, 3.2],
      [5, 2.6],
      [7.4, 2],
    ] as const
  ).forEach((h, i) => {
    const o = ball(h[1], i % 2 ? m.hill : m.hill2, h[0], 0.1, -7, g);
    o.scale.set(1.7, 0.6, 0.5);
  });

  const agua = (
    w: number,
    l: number,
    sw: number,
    sl: number,
    cz: number,
    y: number,
    mt: THREE.Material,
    rio: boolean,
  ) => {
    const ge = new THREE.PlaneGeometry(w, l, sw, sl);
    ge.rotateX(-PI / 2);
    ge.translate(0, 0, cz);
    const p = ge.attributes.position!;
    if (rio) {
      for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + rx(p.getZ(i)));
    }
    const b = (p.array as Float32Array).slice();
    const o = new THREE.Mesh(ge, mt);
    o.position.y = y;
    g.add(o);
    aguas.push({ p, b, a: rio ? 0.02 : 0.05 });
  };
  agua(1.6, 16.6, 3, 24, -0.1, 0.22, m.rio, true);
  agua(16, 5.6, 16, 8, 9.8, 0.16, m.sea, false);
  bx(16, 0.4, 5.6, m.seaS, 0, -0.1, 9.8);
  bx(12.8, 0.1, 1.6, m.sand, 1.6, 0.19, 6.3);

  const arvore = (x: number, z: number) => {
    const a = new THREE.Group();
    cyl(0.06, 0.09, 0.5, m.trunk, 0, 0.25, 0, a, 6);
    ball(0.4, m.verde, 0, 0.75, 0, a);
    ball(0.28, m.leaf2, 0.2, 1, 0.1, a);
    a.position.set(x, Y0, z);
    a.scale.setScalar(0.8 + rnd() * 0.5);
    g.add(a);
  };
  for (let i = 0; i < 14; i++) arvore(-7.8 + rnd() * 1.1, -7.5 + rnd() * 12.5);
  for (let i = 0; i < 12; i++) arvore(-4.4 + rnd() * 12, -7.9 + rnd() * 1.1);

  const palma = (
    x: number,
    y0: number,
    z: number,
    h: number,
    p?: THREE.Object3D,
  ) => {
    const a = new THREE.Group();
    a.position.set(x, y0, z);
    (p || g).add(a);
    const t = cyl(0.04, 0.06, h, m.trunk, 0, h / 2, 0, a, 6);
    t.rotation.z = 0.1;
    const top = new THREE.Group();
    top.position.set(0.05, h, 0);
    a.add(top);
    for (let i = 0; i < 6; i++) {
      const yw = new THREE.Group();
      yw.rotation.y = (i * PI) / 3;
      top.add(yw);
      const tl = new THREE.Group();
      tl.rotation.z = -0.35 - (i % 2) * 0.2;
      yw.add(tl);
      bx(0.6, 0.02, 0.12, i % 2 ? m.leaf : m.leaf2, 0.3, 0, 0, tl);
    }
    palmas.push({ top, f: x });
  };
  for (let x = -4, i = 0; x < 7.8; x += 1.5, i++)
    palma(x, 0.24, 5.9 + rnd() * 0.7, 1.2 + rnd() * 0.4);

  const ilha = new THREE.Group();
  ilha.position.set(4.2, 0.1, 10.8);
  g.add(ilha);
  const mo = ball(1.3, m.hill, 0, 0, 0, ilha);
  mo.scale.set(1.8, 0.35, 1);
  const ar = cyl(2.6, 2.7, 0.12, m.sand, 0, -0.04, 0, ilha, 16);
  ar.scale.z = 0.6;
  (
    [
      [-1.4, 0.4],
      [-0.5, 0.5],
      [0.7, 0.5],
      [1.5, 0.2],
    ] as const
  ).forEach((p) => palma(p[0], 0.3, p[1], 0.9, ilha));

  const rua = (w: number, d: number, x: number, z: number) => {
    const r = new THREE.Group();
    bx(w, 0.03, d, m.asf, 0, 0.02, 0, r);
    parte(r, x, z, 1, 0);
  };
  rua(12.2, 0.7, 1.7, -1.1);
  rua(0.7, 13.2, 2.1, -1.4);

  for (let i = 0; i < 70; i++) {
    const x = -3.2 + rnd() * 10.4;
    const z = -6.8 + rnd() * 11;
    const gb = new THREE.Group();
    const n = 2 + Math.floor(rnd() * 2);
    for (let k = 0; k < n; k++) {
      const rr = 0.18 + rnd() * 0.2;
      const c = new THREE.Color().setHSL(
        0.24 + rnd() * 0.06,
        0.55,
        0.25 + rnd() * 0.1,
      );
      ball(
        rr,
        M(c),
        (rnd() - 0.5) * 0.3,
        rr * 0.7,
        (rnd() - 0.5) * 0.3,
        gb,
      );
    }
    const it = novo(gb, x, Y0, z);
    it.lim = rnd();
    moitas.push(it);
  }

  const pal = [
    0xf4d35e, 0xee964b, 0xf9906a, 0x90e0ef, 0xb5e48c, 0xffafcc, 0xcdb4db,
    0xfefae0,
  ];
  const casa = (x: number, z: number, ord: number) => {
    const gh = new THREE.Group();
    const w = 0.7 + rnd() * 0.14;
    const d = 0.7;
    const fl =
      ord < 0.5 ? 1 + (rnd() < 0.35 ? 1 : 0) : 2 + (rnd() < 0.4 ? 1 : 0);
    const h = fl * 0.5;
    const mat = M(pal[Math.floor(rnd() * pal.length)]!);
    bx(w, h + 0.8, d, mat, 0, h / 2 - 0.4, 0, gh);
    if (ord < 0.62) {
      hip(0.05, 0.6, 0.32, m.tile, 0, h + 0.16, 0, w / 0.85, d / 0.85, gh);
    } else {
      bx(w + 0.06, 0.05, d + 0.06, m.laje, 0, h + 0.03, 0, gh);
      if (rnd() < 0.6) cyl(0.09, 0.09, 0.16, m.caixa, 0.2, h + 0.14, -0.1, gh);
    }
    for (let f = 0; f < fl; f++) {
      if (f === 0) {
        bx(0.14, 0.3, 0.02, m.wood, -0.2, 0.15, d / 2 + 0.011, gh);
        bx(0.14, 0.17, 0.02, m.jan, 0.2, 0.3, d / 2 + 0.011, gh);
      } else {
        bx(0.14, 0.17, 0.02, m.jan, -0.2, 0.3 + f * 0.5, d / 2 + 0.011, gh);
        bx(0.14, 0.17, 0.02, m.jan, 0.2, 0.3 + f * 0.5, d / 2 + 0.011, gh);
      }
    }
    gh.rotation.y = z > -1.1 ? PI : 0;
    const it = novo(gh, x, Y0, z);
    it.ord = ord;
    casas.push(it);
  };

  const res = [
    [-1.3, -5.1, 1.6, 1.1],
    [4.5, 2.4, 1.5, 1.4],
    [-2.2, 0.1, 0.9, 0.65],
  ];
  const xs = [-2.7, -1.7, -0.7, 0.3, 1.3, 2.9, 3.9, 4.9, 5.9, 6.9];
  const zs = [-6.3, -5.3, -4.3, -3.3, -2.3, 0.1, 1.1, 2.1, 3.1];
  const cand: Array<{ x: number; z: number; o: number }> = [];
  xs.forEach((x) =>
    zs.forEach((z) => {
      if (
        res.some(
          (r) =>
            Math.abs(x - r[0]!) < r[2]! + 0.45 &&
            Math.abs(z - r[1]!) < r[3]! + 0.45,
        )
      )
        return;
      cand.push({
        x,
        z,
        o: (Math.hypot(x - 2.1, z + 1.1) / 9) * 0.8 + rnd() * 0.2,
      });
    }),
  );
  cand
    .sort((a, b) => a.o - b.o)
    .forEach((c, i) =>
      casa(
        c.x + (rnd() - 0.5) * 0.08,
        c.z + (rnd() - 0.5) * 0.08,
        i / cand.length,
      ),
    );

  const mt = new THREE.Group();
  bx(2.2, 1.3, 1.8, m.white, 0, 0.65, 0, mt);
  bx(2.3, 0.06, 1.9, m.palha, 0, 1.3, 0, mt);
  hip(0.1, 1.55, 0.7, m.tile, 0, 1.65, 0, 1, 0.85, mt);
  [-0.7, 0.7].forEach((x) => {
    bx(0.55, 2.3, 0.55, m.white, x, 1.15, 0.95, mt);
    hip(0.04, 0.5, 0.55, m.blue, x, 2.58, 0.95, 1, 1, mt);
    bx(0.35, 0.5, 0.03, m.jan, x, 1.9, 1.23, mt);
  });
  bx(0.4, 0.7, 0.03, m.wood, 0, 0.35, 0.92, mt);
  bx(0.1, 0.5, 0.1, m.white, 0, 2.1, 0, mt);
  bx(0.35, 0.1, 0.1, m.white, 0, 2.25, 0, mt);
  bx(2.8, 0.03, 1.2, m.walk, 0, 0.02, 1.9, mt);
  parte(mt, 4.5, 2.1, 1, 0.1);
  ponto("Igreja Matriz de Nossa Senhora do Amparo", 4.5, 2.9, 2.1, 1);

  const mc = new THREE.Group();
  bx(1.6, 0.7, 1.1, m.palha, 0, 0.35, 0, mc);
  bx(1.8, 0.08, 1.3, m.red, 0, 0.74, 0, mc);
  [-0.5, 0, 0.5].forEach((x, i) =>
    bx(
      0.3,
      0.3,
      0.02,
      M([0x2a9d8f, 0xef476f, 0x4cc9f0][i]!),
      x,
      0.4,
      0.56,
      mc,
    ),
  );
  parte(mc, -2.2, 0.1, 2, 0.1);
  ponto("Mercado Municipal", -2.2, 1.2, 0.1, 2);

  const barco = (vela: boolean, cor: number) => {
    const b = new THREE.Group();
    bx(0.9, 0.14, 0.3, M(cor), 0, 0.07, 0, b);
    bx(0.2, 0.12, 0.28, M(cor), 0.5, 0.12, 0, b).rotation.z = 0.4;
    if (vela) {
      cyl(0.015, 0.015, 1, m.wood, 0, 0.6, 0, b, 5);
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.6, 0);
      shape.lineTo(0, 0.9);
      const s = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          flatShading: true,
        }),
      );
      s.position.set(0.04, 0.2, 0);
      b.add(s);
    }
    g.add(b);
    return b;
  };

  const noRio = (
    o: THREE.Object3D,
    min: number,
    v: number,
    off: number,
  ) =>
    movers.push({
      o,
      min,
      u: (t) => {
        const z = -7.5 + ((t * v + off) % 14);
        o.position.set(
          rx(z) + Math.sin(off) * 0.3,
          0.25 + Math.sin(t * 2 + off) * 0.01,
          z,
        );
        o.rotation.y = Math.atan2(-1, 0.2475 * Math.cos(0.55 * z));
        o.rotation.z = Math.sin(t * 2 + off) * 0.03;
      },
    });
  noRio(barco(false, 0x7a4a2a), 0, 0.5, 0);
  noRio(barco(false, 0x2f9a5a), 0, 0.4, 7);
  noRio(barco(true, 0x5a3a20), 2, 0.35, 3.5);

  const fab = new THREE.Group();
  bx(3, 1, 1.9, m.brick, 0, 0.5, 0, fab);
  for (let i = 0; i < 3; i++) {
    const r = bx(0.95, 0.06, 2, m.zinco, -1 + i, 1.1, 0, fab);
    r.rotation.z = 0.4;
  }
  for (let k = 0; k < 5; k++)
    bx(0.28, 0.3, 0.02, m.jan, -1.2 + k * 0.6, 0.55, 0.96, fab);
  cyl(0.15, 0.22, 3, m.brick, 1.1, 1.5, -0.55, fab, 10);
  const S: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0xd0d0d0,
        transparent: true,
        flatShading: true,
      }),
    );
    fab.add(s);
    S.push(s);
  }
  const fit = parte(fab, -1.3, -5.1, 3, 0.2);
  ponto("Companhia Valença Industrial", -1.3, 3.4, -5.1, 3);
  anims.push((t) => {
    if (!fit.g.visible) return;
    S.forEach((s, i) => {
      const p = (t * 0.3 + i / 8) % 1;
      s.position.set(1.1 + p * 0.9, 3.1 + p * 1.3, -0.55);
      s.scale.setScalar(0.12 + p * 0.3);
      (s.material as THREE.MeshStandardMaterial).opacity = 0.6 * (1 - p);
    });
  });

  const pt = new THREE.Group();
  bx(3.2, 0.1, 0.9, m.walk, 0, 0.08, 0, pt);
  [-1, 0, 1].forEach((x) => cyl(0.08, 0.1, 0.3, m.laje, x, 0, 0, pt, 6));
  [-0.4, 0.4].forEach((z) => bx(3.2, 0.12, 0.05, m.wood, 0, 0.2, z, pt));
  parte(pt, -5.9, -1.1, 3, 0.1);
  ponto("Ponte sobre o Rio Una", -5.9, 0.9, -1.1, 3);

  const carro = (cor: number) => {
    const c = new THREE.Group();
    bx(0.5, 0.12, 0.26, M(cor), 0, 0.12, 0, c);
    bx(0.28, 0.1, 0.22, m.glass, -0.03, 0.23, 0, c);
    g.add(c);
    return c;
  };
  (
    [
      [0xef476f, 1, 0],
      [0x4cc9f0, -1, 3],
      [0xffd166, 1, 6],
    ] as const
  ).forEach((a) => {
    const o = carro(a[0]);
    movers.push({
      o,
      min: 3,
      u: (t) => {
        const u = (t * 1.4 + a[2]) % 12;
        o.position.set(
          a[1] > 0 ? -4.2 + u : 7.6 - u,
          Y0 + 0.02,
          a[1] > 0 ? -1.25 : -0.95,
        );
        o.rotation.y = a[1] > 0 ? 0 : PI;
      },
    });
  });

  const fe = new THREE.Group();
  bx(1.3, 0.2, 0.45, m.white, 0, 0.1, 0, fe);
  bx(0.6, 0.25, 0.4, m.blue, 0.1, 0.3, 0, fe);
  cyl(0.06, 0.06, 0.25, m.red, -0.3, 0.5, 0, fe, 8);
  g.add(fe);
  movers.push({
    o: fe,
    min: 3,
    u: (t) => {
      const s = Math.cos(t * 0.25) > 0 ? 1 : -1;
      fe.position.set(
        1.8 + Math.sin(t * 0.25) * 3.6,
        0.2 + Math.sin(t * 2) * 0.01,
        7.7,
      );
      fe.rotation.y = s > 0 ? 0 : PI;
    },
  });

  [
    "#ff9f68",
    "#ffd166",
    "#06d6a0",
    "#ef476f",
    "#4cc9f0",
    "#f4a261",
    "#cdb4db",
  ].forEach((c, i) => {
    const p = new THREE.Group();
    bx(0.95, 0.65, 0.8, M(new THREE.Color(c)), 0, 0.33, 0, p);
    hip(0.05, 0.75, 0.35, m.palha, 0, 0.8, 0, 1, 0.85, p);
    bx(0.2, 0.3, 0.02, m.wood, 0, 0.15, 0.41, p);
    bx(0.2, 0.2, 0.02, m.jan, 0.3, 0.35, 0.41, p);
    p.rotation.y = PI;
    parte(p, -2.3 + i * 1.25, 4.5, 4, 0.1 + i * 0.1);
  });

  const pr = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const x = -3 + i * 1.15;
    const c = M([0xef476f, 0xffd166, 0x06d6a0, 0x4cc9f0][i % 4]!);
    cyl(0.015, 0.015, 0.5, m.white, x, 0.29, 6.5, pr, 5);
    cyl(0, 0.3, 0.12, c, x, 0.58, 6.5, pr, 8);
    bx(0.3, 0.04, 0.14, m.white, x + 0.3, 0.06, 6.5, pr);
  }
  parte(pr, 0, 0, 4, 0.5);
  ponto("Praia de Guaibim", 3.5, 1.3, 6.5, 4);

  const ct = new THREE.Group();
  bx(1.1, 0.1, 0.14, m.white, 0, 0.05, -0.2, ct);
  bx(1.1, 0.1, 0.14, m.white, 0, 0.05, 0.2, ct);
  bx(1, 0.08, 0.5, M(0xf4a261), 0, 0.14, 0, ct);
  bx(0.5, 0.2, 0.36, m.blue, 0.1, 0.28, 0, ct);
  g.add(ct);
  movers.push({
    o: ct,
    min: 4,
    u: (t) => {
      const p = 0.5 + 0.5 * Math.sin(t * 0.3);
      const s = Math.cos(t * 0.3) > 0 ? 1 : -1;
      ct.position.set(
        -2.2 + p * 3.6,
        0.2 + Math.sin(t * 2) * 0.01,
        8.4 + p * 0.7,
      );
      ct.rotation.y = Math.atan2(-0.7 * s, 3.6 * s);
    },
  });

  const to = new THREE.Group();
  cyl(0.1, 0.14, 0.9, m.white, 0, 0.45, 0, to, 8);
  cyl(0.12, 0.12, 0.2, m.red, 0, 1, 0, to, 8);
  cyl(0, 0.14, 0.2, m.dark, 0, 1.2, 0, to, 8);
  parte(to, 4.6, 10.6, 4, 0.3, 0.45);
  ponto("Morro de São Paulo (Ilha de Tinharé)", 4.4, 2.2, 10.8, 4);

  const orla = new THREE.Group();
  bx(12.6, 0.05, 0.45, m.walk, 1.4, 0.03, 0, orla);
  for (let x = -4.4; x <= 7.2; x += 1.6) {
    cyl(0.025, 0.03, 0.7, m.dark, x, 0.38, -0.15, orla, 6);
    ball(0.07, m.lamp, x, 0.76, -0.15, orla);
  }
  parte(orla, 0, 5.6, 5, 0);
  ponto("Orla revitalizada", 1.4, 1, 5.6, 5);

  const mi = new THREE.Group();
  cyl(0.2, 0.32, 2, m.white, 0, 1, 0, mi, 10);
  bx(0.7, 0.3, 0.7, m.blue, 0, 2.15, 0, mi);
  bx(0.8, 0.06, 0.8, m.white, 0, 2.33, 0, mi);
  const fz = new THREE.Group();
  fz.position.y = 2.5;
  mi.add(fz);
  const coneGeo = new THREE.ConeGeometry(0.25, 1, 10, 1, true);
  coneGeo.rotateZ(-PI / 2);
  coneGeo.translate(0.5, 0, 0);
  const cone = new THREE.Mesh(
    coneGeo,
    new THREE.MeshBasicMaterial({
      color: 0xffe08a,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    }),
  );
  fz.add(cone);
  const mit = parte(mi, -3.7, 4.7, 5, 0.2);
  ponto("Mirante do Rio Una", -3.7, 3.1, 4.7, 5);
  anims.push((t) => {
    if (mit.g.visible) fz.rotation.y = t * 1.5;
  });

  const fo = new THREE.Group();
  cyl(0.7, 0.7, 0.08, m.walk, 0, 0.04, 0, fo, 20);
  cyl(0.5, 0.5, 0.14, m.rio, 0, 0.1, 0, fo, 16);
  cyl(0.06, 0.1, 0.3, m.white, 0, 0.2, 0, fo, 8);
  const J: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i++) {
    const b = ball(0.025, m.white, 0, 0, 0, fo);
    J.push(b);
  }
  const fot = parte(fo, 2.1, -1.1, 5, 0.1);
  ponto("Praça da Fonte", 2.1, 0.9, -1.1, 5);
  anims.push((t) => {
    if (fot.g.visible)
      J.forEach((b, i) => {
        const p = (t * 0.8 + i / 10) % 1;
        const a = i * 0.63;
        b.position.set(
          Math.cos(a) * p * 0.35,
          0.3 + Math.sin(p * PI) * 0.4,
          Math.sin(a) * p * 0.35,
        );
      });
  });

  const pi = new THREE.Group();
  bx(0.5, 0.06, 2.8, m.wood, 0, 0.02, 1.6, pi);
  for (let k = 0; k < 4; k++) {
    cyl(0.03, 0.03, 0.3, m.wood, -0.2, -0.05, 0.4 + k * 0.7, pi, 5);
    cyl(0.03, 0.03, 0.3, m.wood, 0.2, -0.05, 0.4 + k * 0.7, pi, 5);
  }
  bx(0.9, 0.5, 0.6, m.white, 0, 0.25, -0.5, pi);
  hip(0.05, 0.7, 0.25, m.blue, 0, 0.62, -0.5, 1, 0.8, pi);
  parte(pi, -3, 6.2, 5, 0.3);
  ponto("Porto turístico", -3, 1, 7.4, 5);

  const ho = new THREE.Group();
  bx(1.5, 2, 1.2, m.white, 0, 1, 0, ho);
  bx(1.6, 0.1, 1.3, m.blue, 0, 2.05, 0, ho);
  for (let f = 0; f < 4; f++)
    bx(1.52, 0.18, 1.22, m.glass, 0, 0.35 + f * 0.45, 0, ho);
  const ht = document.createElement("canvas");
  ht.width = 256;
  ht.height = 48;
  const hc = ht.getContext("2d")!;
  hc.fillStyle = "#1f4f9a";
  hc.fillRect(0, 0, 256, 48);
  hc.fillStyle = "#fff";
  hc.font = "bold 28px Arial,sans-serif";
  hc.textAlign = "center";
  hc.textBaseline = "middle";
  hc.fillText("HOTEL ORLA", 128, 26);
  const hs = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(ht) }),
  );
  hs.position.set(0, 1.8, 0.62);
  ho.add(hs);
  parte(ho, 6.6, 4.3, 5, 0.2);
  ponto("Hotel da Orla", 6.6, 2.6, 4.3, 5);

  let nivel = 0;
  let t = 0;
  let vai = true;
  const frac = [0, 0.25, 0.5, 0.75, 1.001, 1.001];

  const aplicar = () => {
    const f = frac[nivel]!;
    casas.forEach((it) => {
      it.alvoNovo = (it.ord ?? 0) < f ? 1 : 0;
      it.atraso = rnd() * 0.8;
    });
    moitas.forEach((it) => {
      it.alvoNovo =
        nivel === 5
          ? (it.lim ?? 0) > 0.88
            ? 1
            : 0
          : (it.lim ?? 0) > f
            ? 1
            : 0;
      it.atraso = rnd() * 0.6;
    });
    partes.forEach((p) => {
      p.it.alvoNovo = nivel >= p.min ? 1 : 0;
      p.it.atraso = p.it.d;
    });
    movers.forEach((mv) => {
      mv.o.visible = nivel >= mv.min;
    });
  };

  g.userData.definirNivel = (n) => {
    nivel = Math.max(0, Math.min(5, n | 0));
    aplicar();
    return nivel;
  };
  g.userData.nivel = () => nivel;
  g.userData.alternarVida = () => (vai = !vai);
  g.userData.pontos = pontos;
  aplicar();
  itens.forEach((it) => {
    it.alvo = it.alvoNovo;
    it.s = it.alvo;
    it.atraso = 0;
    it.g.visible = it.alvo > 0;
    it.g.scale.setScalar(Math.max(0.001, it.s));
    it.g.position.y = it.y;
  });

  g.userData.tick = (dt) => {
    itens.forEach((it) => {
      if (it.alvoNovo !== it.alvo) {
        it.atraso -= dt;
        if (it.atraso <= 0) it.alvo = it.alvoNovo;
      }
      it.v += (it.alvo - it.s) * dt * 110;
      it.v *= Math.exp(-dt * 8);
      it.s += it.v * dt;
      const s = Math.max(0, it.s);
      it.g.visible = s > 0.01 || it.alvo > 0;
      it.g.scale.setScalar(Math.max(0.001, s));
      it.g.position.y = it.y + (1 - Math.min(1, s)) * 1.8;
    });
    if (!vai) return;
    t += dt;
    aguas.forEach((w) => {
      const p = w.p;
      for (let i = 0; i < p.count; i++) {
        const x = w.b[i * 3]!;
        const z = w.b[i * 3 + 2]!;
        p.setY(
          i,
          Math.sin(x * 1.2 + t * 1.3 + z * 0.7) * w.a +
            Math.cos(z * 1.5 + t) * w.a * 0.6,
        );
      }
      p.needsUpdate = true;
    });
    movers.forEach((mv) => {
      if (mv.o.visible) mv.u(t);
    });
    palmas.forEach((p) => {
      p.top.rotation.z = Math.sin(t * 1.5 + p.f) * 0.07;
    });
    anims.forEach((f) => f(t));
  };

  return g;
}
