import * as THREE from "three";

export type ParipeGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    definirNivel: (n: number) => number;
    nivel: () => number;
    alternarVida: () => boolean;
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
  ord?: number;
  lim?: number;
  d?: number;
};

export function criarParipe(): ParipeGroup {
  const g = new THREE.Group() as ParipeGroup;
  g.name = "Paripe";
  const PI = Math.PI;
  let sd = 29;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  const M = (c: number | THREE.Color, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(
      Object.assign({ color: c, roughness: 0.85 }, o || {}),
    );

  const m = {
    sea: M(0x2a9fb5, { roughness: 0.3 }),
    seaS: M(0x0e6a80),
    sand: M(0xe6d3a0),
    dirt: M(0x8a6d52),
    grass: M(0x6f9a3a),
    asf: M(0x44464b),
    walk: M(0xcfcdc4),
    white: M(0xf4f2ea),
    bloco: M(0x9a9a96),
    zinco: M(0x9aa0a6, { metalness: 0.3, roughness: 0.6 }),
    laje: M(0xb8b6ae),
    caixa: M(0x2a62c4),
    jan: M(0x23303f, { roughness: 0.3 }),
    conc: M(0xa9a7a0),
    wood: M(0x8a6a45),
    tile: M(0xc2562f, { flatShading: true }),
    blue: M(0x2b66b8),
    pool: M(0x25a8d8, { roughness: 0.2 }),
    verde: M(0x2fa04a, { flatShading: true }),
    trunk: M(0x7a6a52),
    leaf: M(0x2f8a2e),
    leaf2: M(0x3f9d36),
    glass: M(0x233046, { roughness: 0.2 }),
    dark: M(0x23262b),
    pele: M(0x7a5238),
    fio: M(0x1d1d1d),
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

  const tubo = (pts: [number, number, number][], r: number) => {
    const o = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
        ),
        12,
        r,
        4,
      ),
      m.fio,
    );
    g.add(o);
  };

  const sup = (z: number) => (z >= 0.8 ? 0.3 : 0.3 + ((0.8 - z) / 7.8) * 5.2);

  const sh = new THREE.Shape();
  (
    [
      [-9, 0],
      [-9, 5.5],
      [-7, 5.5],
      [0.8, 0.3],
      [5.6, 0.3],
      [5.9, 0.12],
      [7.2, 0.12],
      [7.2, 0],
    ] as const
  ).forEach((p, i) => {
    if (i) sh.lineTo(p[0], p[1]);
    else sh.moveTo(p[0], p[1]);
  });
  sh.closePath();
  const ter = new THREE.Mesh(
    new THREE.ExtrudeGeometry(sh, { depth: 16, bevelEnabled: false }),
    [m.dirt, m.grass],
  );
  ter.rotation.y = -PI / 2;
  ter.position.x = 8;
  g.add(ter);
  bx(16, 0.03, 1.3, m.sand, 0, 0.13, 6.55);
  const sea = bx(16, 1.2, 5, m.sea, 0, -0.6, 9.7);
  sea.material = [m.seaS, m.seaS, m.sea, m.seaS, m.seaS, m.seaS];
  bx(16, 0.04, 1.3, m.asf, 0, 0.32, 5.0);
  bx(16, 0.05, 0.5, m.walk, 0, 0.33, 4.15);
  bx(16, 0.05, 0.5, m.walk, 0, 0.33, 5.75);

  const pal = [0xf2c230, 0x3a78c2, 0xe58aa5, 0x7bc08a, 0xe8e4d8, 0xe07a3a];
  const becos = new THREE.Group();
  const varal = new THREE.Group();
  g.add(becos);
  g.add(varal);
  const itens: ItemAnim[] = [];
  const casas: ItemAnim[] = [];
  const moitas: ItemAnim[] = [];

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
    };
    itens.push(it);
    return it;
  };

  const casa = (x: number, z: number, ord: number) => {
    const gh = new THREE.Group();
    const w = 0.72 + rnd() * 0.2;
    const d = 0.82;
    const fl = 1 + Math.floor(rnd() * 3);
    const h = fl * 0.55;
    const t = rnd();
    const mat =
      t < 0.58
        ? M(new THREE.Color(0xc2693f).offsetHSL(0, 0, (rnd() - 0.5) * 0.1))
        : t < 0.74
          ? m.bloco
          : M(pal[Math.floor(rnd() * pal.length)]!);
    bx(w, h + 1, d, mat, 0, h / 2 - 0.5, 0, gh);
    if (rnd() < 0.55) {
      bx(w + 0.04, 0.05, d + 0.04, m.laje, 0, h + 0.03, 0, gh);
      if (rnd() < 0.55) cyl(0.1, 0.1, 0.18, m.caixa, 0.2, h + 0.15, -0.12, gh, 10);
    } else {
      const r = bx(w + 0.08, 0.04, d + 0.08, m.zinco, 0, h + 0.08, 0, gh);
      r.rotation.x = 0.14;
    }
    for (let f = 0; f < fl; f++) {
      const n = 1 + (rnd() < 0.5 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        bx(
          0.13,
          0.16,
          0.02,
          m.jan,
          n === 1 ? 0 : k ? 0.2 : -0.2,
          0.3 + f * 0.55,
          d / 2 + 0.011,
          gh,
        );
      }
    }
    const it = novo(gh, x, sup(z), z);
    it.ord = ord;
    casas.push(it);
  };

  for (let r = 0; r < 7; r++) {
    for (let c = -7; c <= 7; c++) {
      const x = c * 0.98 + (rnd() - 0.5) * 0.06;
      const z = 0.2 - r * 1 + (rnd() - 0.5) * 0.05;
      if (Math.abs(x + 0.3) < 0.55 || Math.abs(x - 3.6) < 0.55 || rnd() < 0.12)
        continue;
      casa(x, z, 0.55 * (r / 6) + 0.45 * rnd());
    }
  }
  casas.sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));
  casas.forEach((it, i) => {
    it.ord = i / casas.length;
  });

  [-0.3, 3.6].forEach((x) => {
    const e = bx(0.5, 0.05, 9.4, m.laje, x, 2.9, -3.1, becos);
    e.rotation.x = 0.588;
    for (let k = 0; k < 26; k++) {
      const z = 0.7 - k * 0.3;
      const y = sup(z) + 0.04;
      bx(0.5, 0.03, 0.08, m.conc, x, y, z, becos);
    }
  });

  for (let i = 0; i < 60; i++) {
    const x = -7.3 + rnd() * 14.6;
    const z = 0.4 - rnd() * 7.2;
    const gb = new THREE.Group();
    const n = 2 + Math.floor(rnd() * 2);
    for (let k = 0; k < n; k++) {
      const rr = 0.22 + rnd() * 0.2;
      const c = new THREE.Color().setHSL(
        0.24 + rnd() * 0.06,
        0.55,
        0.22 + rnd() * 0.1,
      );
      ball(
        rr,
        M(c, { flatShading: true }),
        (rnd() - 0.5) * 0.3,
        rr * 0.7,
        (rnd() - 0.5) * 0.3,
        gb,
      );
    }
    const it = novo(gb, x, sup(z), z);
    it.lim = rnd();
    moitas.push(it);
  }

  (
    [
      [-6, 4.6],
      [-2, 4.6],
      [2, 4.6],
      [6, 4.6],
    ] as const
  ).forEach((p) => cyl(0.05, 0.06, 2.2, m.wood, p[0], 1.4, p[1], g, 8));
  (
    [
      [-6, -2],
      [-2, 2],
      [2, 6],
    ] as const
  ).forEach((a) =>
    [1.9, 1.75, 1.6].forEach((y, i) =>
      tubo(
        [
          [a[0], y, 4.6],
          [(a[0] + a[1]) / 2, y - 0.2, 4.6 + i * 0.05],
          [a[1], y, 4.6],
        ],
        0.01,
      ),
    ),
  );
  const cores = [0xe03030, 0xf2c230, 0x2e6ee0, 0xffffff, 0x35b85a];
  for (let k = 0; k < 8; k++) {
    const z = -0.4;
    const y = sup(z) + 1.4;
    bx(
      0.08,
      0.14,
      0.01,
      M(cores[k % 5]!),
      1.2 + k * 0.18,
      y - 0.04 * Math.sin((k / 7) * PI),
      z + 0.5,
      varal,
    );
  }

  const gt = document.createElement("canvas");
  gt.width = 512;
  gt.height = 64;
  const gc = gt.getContext("2d")!;
  gc.fillStyle = "#e8e0cc";
  gc.fillRect(0, 0, 512, 64);
  for (let i = 0; i < 22; i++) {
    gc.fillStyle = `hsl(${Math.floor(rnd() * 360)},75%,55%)`;
    gc.beginPath();
    gc.arc(rnd() * 512, rnd() * 64, 8 + rnd() * 22, 0, 7);
    gc.fill();
  }
  const mu = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 0.5),
    new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(gt),
      roughness: 0.9,
    }),
  );
  mu.position.set(0, 0.6, 3.88);
  g.add(mu);
  bx(14, 0.5, 0.15, m.conc, 0, 0.55, 3.8);

  const jt = document.createElement("canvas");
  jt.width = 64;
  jt.height = 64;
  const jc = jt.getContext("2d")!;
  jc.fillStyle = "#ddd5bd";
  jc.fillRect(0, 0, 64, 64);
  jc.fillStyle = "#4a5560";
  for (let y = 6; y < 64; y += 14) {
    for (let x = 6; x < 64; x += 16) jc.fillRect(x, y, 8, 7);
  }
  const tj = new THREE.CanvasTexture(jt);
  tj.wrapS = tj.wrapT = THREE.RepeatWrapping;
  (
    [
      [-7, 10],
      [-3.5, 13],
      [0, 9],
      [3.8, 12],
      [7, 10.5],
    ] as const
  ).forEach((b) => {
    const t = tj.clone();
    t.needsUpdate = true;
    t.repeat.set(1.2, b[1] / 4);
    bx(
      2,
      b[1],
      1.8,
      new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }),
      b[0],
      5.5 + b[1] / 2,
      -8.3,
    );
  });

  const palma = (x: number, z: number, h: number, y0: number) => {
    const p = new THREE.Group();
    p.position.set(x, y0, z);
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
      bx(0.8, 0.02, 0.14, i % 2 ? m.leaf : m.leaf2, 0.4, 0, 0, tl);
    }
  };
  (
    [
      [-7.4, 2, 2],
      [7.4, 2.2, 2],
      [-7.5, 6.4, 1.8],
      [7.4, 6.3, 1.8],
    ] as const
  ).forEach((p) => palma(p[0], p[1], p[2], 0.2));

  const carro = (cor: number, moto: boolean) => {
    const c = new THREE.Group();
    if (moto) {
      bx(0.5, 0.08, 0.14, M(cor), 0, 0.14, 0, c);
      bx(0.14, 0.2, 0.1, M(cor), -0.05, 0.26, 0, c);
      ball(0.04, m.pele, -0.05, 0.42, 0, c);
      bx(0.08, 0.12, 0.08, m.dark, -0.05, 0.34, 0, c);
    } else {
      bx(0.8, 0.2, 0.4, M(cor), 0, 0.2, 0, c);
      bx(0.45, 0.17, 0.34, M(cor), -0.05, 0.38, 0, c);
      bx(0.4, 0.1, 0.35, m.dark, -0.05, 0.4, 0, c);
    }
    g.add(c);
    return c;
  };
  const vei = (
    [
      [5.2, 1, 0xeeeeee, 0],
      [4.8, -1, 0xb23a3a, 0],
      [5.2, 1, 0x2f6e4a, 1],
      [4.8, -1, 0x3a5fa8, 1],
    ] as const
  ).map((v, i) => {
    const o = carro(v[2], !!v[3]);
    o.rotation.y = v[1] > 0 ? 0 : PI;
    return { o, z: v[0], dir: v[1], x: -8 + i * 4, v: 1.2 + i * 0.3 };
  });

  const pesca = (x: number, z: number, cor: number) => {
    const b = new THREE.Group();
    b.position.set(x, 0, z);
    g.add(b);
    bx(1.4, 0.25, 0.5, M(cor), 0, 0.1, 0, b);
    bx(0.35, 0.22, 0.5, M(cor), 0.85, 0.18, 0, b).rotation.z = 0.4;
    bx(1.2, 0.04, 0.5, m.white, 0, 0.24, 0, b);
    return b;
  };
  const barcos = [
    pesca(-4, 9, 0x2f9a5a),
    pesca(2, 10.2, 0xe8e4d8),
    pesca(6, 8.6, 0x3a78c2),
  ];
  const gente = (
    [
      [-0.3, 0],
      [3.6, 0.5],
      [-0.3, 0.3],
      [3.6, 0.8],
    ] as const
  ).map((p, i) => {
    const f = new THREE.Group();
    g.add(f);
    bx(0.07, 0.14, 0.05, M(cores[i]!), 0, 0.1, 0, f);
    ball(0.04, m.pele, 0, 0.21, 0, f);
    return { f, x: p[0], u: p[1] as number, dir: i % 2 ? 1 : -1 };
  });

  const rs = new THREE.Group();
  bx(5.4, 2.7, 1.5, m.white, -1.6, 1.35, -0.5, rs);
  for (let f = 0; f < 4; f++) {
    bx(5.4, 0.12, 0.3, m.blue, -1.6, 0.55 + f * 0.62, 0.4, rs);
    bx(5.4, 0.18, 0.03, m.white, -1.6, 0.67 + f * 0.62, 0.55, rs);
    for (let k = 0; k < 6; k++) {
      bx(0.34, 0.34, 0.04, m.glass, -3.9 + k * 0.9, 0.4 + f * 0.62, 0.26, rs);
    }
  }
  hip(0.1, 2.7, 0.5, m.verde, -1.6, 2.95, -0.5, 1.45, 0.9, rs);
  bx(3, 1.6, 1.3, m.white, 4.2, 0.8, -0.6, rs);
  hip(0.1, 1.5, 0.4, m.verde, 4.2, 1.8, -0.6, 1.2, 0.95, rs);
  for (let k = 0; k < 3; k++) bx(0.4, 0.36, 0.04, m.glass, 3.4 + k * 0.8, 0.9, 0.1, rs);
  bx(3.4, 0.1, 1.3, m.blue, -1.5, 0.05, 1.3, rs);
  bx(3.2, 0.12, 1.1, m.pool, -1.5, 0.06, 1.3, rs);
  (
    [
      [1.4, 1.1],
      [2.2, 1.4],
      [3, 1.1],
    ] as const
  ).forEach((p) => {
    (
      [
        [-0.35, -0.35],
        [0.35, -0.35],
        [-0.35, 0.35],
        [0.35, 0.35],
      ] as const
    ).forEach((d) =>
      bx(0.05, 0.6, 0.05, m.wood, p[0] + d[0], 0.4, p[1] + d[1], rs),
    );
    hip(0.05, 0.55, 0.35, m.verde, p[0], 0.88, p[1], 1, 1, rs);
  });
  const guardaCores = [0xe03030, 0xf2c230, 0x2e86ab, 0xe58aa5];
  [-3.6, -2.6, -0.4, 0.6].forEach((x, i) => {
    bx(0.4, 0.06, 0.2, m.white, x, 0.14, 2.0, rs);
    cyl(0.02, 0.02, 0.5, m.dark, x + 0.3, 0.3, 2.0, rs, 6);
    cyl(0, 0.32, 0.12, M(guardaCores[i]!), x + 0.3, 0.6, 2.0, rs, 10);
  });
  const rl = document.createElement("canvas");
  rl.width = 512;
  rl.height = 64;
  const rc = rl.getContext("2d")!;
  rc.fillStyle = "#1f4f9a";
  rc.fillRect(0, 0, 512, 64);
  rc.fillStyle = "#fff";
  rc.font = "bold 38px Arial,sans-serif";
  rc.textAlign = "center";
  rc.textBaseline = "middle";
  rc.fillText("RESORT PARIPE", 256, 34);
  const rt = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.28),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(rl) }),
  );
  rt.position.set(-1.6, 2.3, 0.26);
  rs.add(rt);
  const rit = novo(rs, 0, 0.3, 2.4);
  rit.d = 0;
  const partes: ItemAnim[] = [rit];

  const fileira = (z: number, d: number) => {
    const gp = new THREE.Group();
    for (let x = -5.5; x <= 5.6; x += 2.2) {
      bx(0.95, 0.05, 0.95, m.wood, x, 0.03, 0, gp);
      bx(0.7, 0.45, 0.7, m.white, x, 0.3, 0, gp);
      hip(0.05, 0.55, 0.3, m.verde, x, 0.7, 0, 1, 1, gp);
      bx(0.2, 0.2, 0.02, m.glass, x, 0.32, 0.36, gp);
      if (Math.abs(x) < 4) {
        const p2 = new THREE.Group();
        p2.position.set(x + 0.8, 0, 0.2);
        gp.add(p2);
        bx(0.06, 0.7, 0.06, m.trunk, 0, 0.35, 0, p2);
        for (let k = 0; k < 5; k++) {
          const yw = new THREE.Group();
          yw.position.y = 0.7;
          yw.rotation.y = (k * PI * 2) / 5;
          p2.add(yw);
          bx(0.45, 0.02, 0.1, m.leaf, 0.22, 0, 0, yw);
        }
      }
    }
    const it = novo(gp, 0, sup(z), z);
    it.d = d;
    partes.push(it);
  };
  fileira(-1.3, 0.35);
  fileira(-2.9, 0.7);
  fileira(-4.5, 1.05);

  const pl2 = new THREE.Group();
  bx(4, 0.1, 1.6, m.blue, 0, 0.05, 0, pl2);
  bx(3.8, 0.12, 1.4, m.pool, 0, 0.06, 0, pl2);
  [-1.4, -0.5, 0.5, 1.4].forEach((x, i) => {
    bx(0.4, 0.06, 0.2, m.white, x, 0.14, 1.1, pl2);
    cyl(0.02, 0.02, 0.5, m.dark, x + 0.3, 0.3, 1.1, pl2, 6);
    cyl(0, 0.3, 0.12, M(guardaCores[i]!), x + 0.3, 0.6, 1.1, pl2, 10);
  });
  const pit = novo(pl2, 0, sup(-6), -6);
  pit.d = 1.4;
  partes.push(pit);

  let nivel = 0;
  let t = 0;
  let vai = true;
  const frac = [0, 0.25, 0.5, 0.75, 1.001, 0];

  const aplicar = () => {
    const f = frac[nivel]!;
    casas.forEach((it) => {
      it.alvoNovo = nivel <= 4 && (it.ord ?? 0) < f ? 1 : 0;
      it.atraso = nivel === 5 ? rnd() * 0.5 : rnd() * 0.8;
    });
    moitas.forEach((it) => {
      it.alvoNovo =
        nivel === 5 ? ((it.lim ?? 0) > 0.6 ? 1 : 0) : (it.lim ?? 0) > f ? 1 : 0;
      it.atraso = rnd() * 0.6;
    });
    partes.forEach((it) => {
      it.alvoNovo = nivel === 5 ? 1 : 0;
      it.atraso = it.d ?? 0;
    });
    const vivo = nivel >= 1 && nivel <= 4;
    becos.visible = vivo;
    varal.visible = nivel >= 2 && nivel <= 4;
    gente.forEach((q) => {
      q.f.visible = vivo;
    });
  };

  g.userData.definirNivel = (n) => {
    nivel = Math.max(0, Math.min(5, n | 0));
    aplicar();
    return nivel;
  };
  g.userData.nivel = () => nivel;
  g.userData.alternarVida = () => (vai = !vai);
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
    vei.forEach((v) => {
      v.x += v.dir * v.v * dt;
      if (v.x > 9) v.x = -9;
      if (v.x < -9) v.x = 9;
      v.o.position.set(v.x, 0.35, v.z);
    });
    barcos.forEach((b, i) => {
      b.position.y = 0.02 * Math.sin(t * 1.6 + i * 2);
      b.rotation.z = 0.03 * Math.sin(t * 1.3 + i);
    });
    gente.forEach((p) => {
      p.u += p.dir * dt * 0.06;
      if (p.u > 1) {
        p.u = 1;
        p.dir = -1;
      }
      if (p.u < 0) {
        p.u = 0;
        p.dir = 1;
      }
      const z = 0.7 - p.u * 7.4;
      p.f.position.set(
        p.x,
        sup(z) + 0.06 + 0.015 * Math.abs(Math.sin(t * 9 + p.x)),
        z,
      );
    });
  };

  return g;
}
