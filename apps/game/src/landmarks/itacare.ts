import * as THREE from "three";

export type ItacareGroup = THREE.Group & {
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
  d: number;
  lim?: number;
  ord?: number;
  n?: number;
};

type Gente = {
  x: number;
  z: number;
  vx: number;
  rua: boolean;
  ph: number;
  br: boolean;
};

type Barco = {
  o: THREE.Group;
  x: number;
  z: number;
  v: number;
  dir: number;
};

type Surfista = {
  o: THREE.Group;
  x: number;
  v: number;
  ph: number;
};

type Flag = { f: THREE.Mesh; ph: number };

export function criarItacare(): ItacareGroup {
  const g = new THREE.Group() as ItacareGroup;
  g.name = "Itacare";
  const PI = Math.PI;
  let sd = 43;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  const M = (c: number | THREE.Color, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(
      Object.assign({ color: c, roughness: 0.85 }, o || {}),
    );

  const m = {
    grama: M(0x6f9a3a),
    terra: M(0x8a7a62),
    areia: M(0xe8d6a2),
    mar: M(0x1fa3b8, { roughness: 0.25 }),
    marS: M(0x0e6a80),
    rio: M(0x3f8a8a, { roughness: 0.25 }),
    telha: M(0xb25a34, { flatShading: true }),
    palha: M(0xa07a3a, { flatShading: true }),
    branco: M(0xf4f2ea),
    azul: M(0x2f6fc0),
    madeira: M(0x6b4f35),
    pedra: M(0xb9b2a0),
    cobble: M(0x8a8478),
    rocha: M(0x4a4038, { flatShading: true }),
    tronco: M(0x7a6a52),
    folha: M(0x2f8a2e),
    folha2: M(0x3f9d36),
    pele: M(0x7a5238),
    preto: M(0x22242a),
    lamp: M(0xffe2a0, { emissive: 0xffc860, emissiveIntensity: 0.9 }),
    espuma: M(0xffffff, {
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
    vidro: M(0x233046),
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

  const tex = (
    w: number,
    h: number,
    fn: (c: CanvasRenderingContext2D, w: number, h: number) => void,
    rx?: number,
    ry?: number,
  ) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    fn(c.getContext("2d")!, w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx || 1, ry || 1);
    return t;
  };

  const sup = (z: number) =>
    z >= 3.2 ? 0.3 : Math.min(3.6, 0.3 + ((3.2 - z) / 9.2) * 3.3);

  const sh = new THREE.Shape();
  (
    [
      [-9, 0],
      [-9, 3.6],
      [-6, 3.6],
      [3.2, 0.3],
      [4.2, 0.3],
      [4.6, 0.12],
      [5.4, 0.1],
      [5.5, 0],
    ] as const
  ).forEach((p, i) => (i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])));
  sh.closePath();
  const ter = new THREE.Mesh(
    new THREE.ExtrudeGeometry(sh, { depth: 18, bevelEnabled: false }),
    [m.terra, m.grama],
  );
  ter.rotation.y = -PI / 2;
  ter.position.x = 11;
  g.add(ter);
  bx(18, 0.04, 2, m.areia, 2, 0.14, 4.5);
  const marMesh = bx(22, 1.2, 6, m.mar, 0, -0.6, 8.5);
  marMesh.material = [m.marS, m.marS, m.mar, m.marS, m.marS, m.marS];
  bx(4, 0.1, 14.5, m.rio, -9, 0, -1.75);
  bx(2, 0.7, 14.5, m.grama, -12, -0.05, -1.75);
  (
    [
      [-6, -9, 3.4, 2.4, 0.8],
      [4, -9.5, 4.4, 2.6, 0.9],
      [10, -8, 3, 1.4, 0.8],
      [-12, -6, 3, 1.6, 0.7],
    ] as const
  ).forEach((h) => {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(h[2], 20, 12),
      M(0x4a7a30, { flatShading: true }),
    );
    s.scale.set(h[3], h[4], 1);
    s.position.set(h[0], 0, h[1]);
    g.add(s);
  });
  for (let i = 0; i < 14; i++) {
    const r = 0.15 + rnd() * 0.3;
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), m.rocha);
    s.position.set(
      i < 7 ? -6.2 + rnd() * 1.6 : 8.6 + rnd() * 2,
      0.1,
      i < 7 ? 4.6 + rnd() * 0.8 : 4.2 + rnd() * 1,
    );
    s.scale.y = 0.7;
    g.add(s);
  }

  const palma = (x: number, z: number, h: number, y: number) => {
    const p = new THREE.Group();
    p.position.set(x, y, z);
    g.add(p);
    bx(0.1, h, 0.1, m.tronco, 0, h / 2, 0, p);
    for (let i = 0; i < 8; i++) {
      const yw = new THREE.Group();
      yw.position.y = h;
      yw.rotation.y = i * (PI / 4);
      p.add(yw);
      const tl = new THREE.Group();
      tl.rotation.z = -0.3 - (i % 2) * 0.25;
      yw.add(tl);
      bx(0.8, 0.02, 0.14, i % 2 ? m.folha : m.folha2, 0.4, 0, 0, tl);
    }
  };
  (
    [
      [-3, 3.9],
      [-0.5, 4],
      [2, 3.8],
      [4.5, 4],
      [7, 3.9],
      [9.5, 3.8],
      [-5, 3.4],
    ] as const
  ).forEach((p) => palma(p[0], p[1], 1.8 + rnd() * 0.5, 0.15));

  const itens: ItemAnim[] = [];
  const casas: ItemAnim[] = [];
  const moitas: ItemAnim[] = [];
  const fora: ItemAnim[] = [];

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

  for (let i = 0; i < 70; i++) {
    const x = -6.5 + rnd() * 16.5;
    const z = -5.8 + rnd() * 8.6;
    const gb = new THREE.Group();
    const n = 2 + Math.floor(rnd() * 2);
    for (let k = 0; k < n; k++) {
      const rr = 0.2 + rnd() * 0.2;
      const c = new THREE.Color().setHSL(
        0.25 + rnd() * 0.06,
        0.55,
        0.2 + rnd() * 0.1,
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

  const pal = [
    0x5fc6c0, 0xf2c24a, 0xe58aa5, 0xf4f4ee, 0xf29a4a, 0x7bc08a, 0x4a78c2,
  ];
  const casa = (x: number, z: number) => {
    const gh = new THREE.Group();
    const w = 0.62 + rnd() * 0.18;
    const d = 0.62;
    const fl = 1 + Math.floor(rnd() * 2);
    const h = fl * 0.45;
    const t = rnd();
    bx(
      w,
      h + 1,
      d,
      M(pal[Math.floor(rnd() * 7)]!),
      0,
      h / 2 - 0.5,
      0,
      gh,
    );
    bx(w + 0.04, 0.05, d + 0.04, m.branco, 0, h, 0, gh);
    if (t < 0.6) {
      hip(
        0.08,
        1,
        0.4,
        m.telha,
        0,
        h + 0.2,
        0,
        (w + 0.12) / 1.414,
        (d + 0.12) / 1.414,
        gh,
      );
    } else {
      hip(
        0.02,
        1,
        0.5,
        m.palha,
        0,
        h + 0.25,
        0,
        (w + 0.2) / 1.414,
        (d + 0.2) / 1.414,
        gh,
      );
    }
    for (let f = 0; f < fl; f++) {
      for (let k = -1; k <= 1; k += 2) {
        if (f === 0 && k === 1) continue;
        bx(0.1, 0.17, 0.03, m.azul, k * 0.17, 0.28 + f * 0.45, d / 2 + 0.012, gh);
      }
    }
    bx(0.12, 0.28, 0.03, m.madeira, 0.17, 0.16, d / 2 + 0.012, gh);
    const it = novo(gh, x, sup(z), z);
    it.ord = Math.hypot(x - 1, z - 1.2) * 0.09 + rnd() * 0.35;
    casas.push(it);
  };
  for (let xi = 0; xi < 17; xi++) {
    for (let zi = 0; zi < 9; zi++) {
      const x = -6 + xi + (rnd() - 0.5) * 0.08;
      const z = -5.5 + zi * 0.95 + (rnd() - 0.5) * 0.08;
      if (
        Math.abs(z - 0.9) < 0.5 ||
        Math.abs(x - 2) < 0.5 ||
        Math.abs(x - 7) < 0.5 ||
        (x < -3.6 && z > -3.2 && z < 0.5) ||
        z > 2.5 ||
        rnd() < 0.12
      ) {
        continue;
      }
      casa(x, z);
    }
  }
  casas.sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));
  casas.forEach((it, i) => {
    it.ord = i / casas.length;
  });

  const pedr = tex(
    64,
    64,
    (c) => {
      c.fillStyle = "#807a6e";
      c.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 30; i++) {
        c.fillStyle = `hsl(30,6%,${36 + Math.random() * 24}%)`;
        c.fillRect(
          (i % 6) * 10 + Math.random() * 3,
          Math.floor(i / 6) * 12 + Math.random() * 3,
          8,
          9,
        );
      }
    },
    4,
    4,
  );
  const rua = new THREE.Group();
  const mp = new THREE.MeshStandardMaterial({ map: pedr, roughness: 0.95 });
  bx(17, 0.05, 0.8, mp, 2, sup(0.9) + 0.03, 0.9, rua);
  bx(17, 0.05, 0.8, mp, 2, 0.34, 2.8, rua);
  [2, 7].forEach((x) => {
    const r = bx(0.8, 0.05, 9.77, mp, x, 1.95, -1.4, rua);
    r.rotation.x = 0.344;
  });
  const ruit = novo(rua, 0, 0, 0);

  const ig = new THREE.Group();
  bx(2.4, 0.6, 2.2, m.pedra, 0, 0.3, 0, ig);
  bx(1.4, 1.1, 1.6, m.branco, 0, 1.15, 0, ig);
  bx(1.2, 0.7, 1.6, m.branco, 0, 0.95, -1.3, ig);
  hip(0.1, 1.2, 0.45, m.telha, 0, 1.7, -1.3, 1.1, 1.1, ig);
  bx(0.5, 1.8, 0.5, m.branco, 0, 1.6, 0.35, ig);
  bx(0.56, 0.08, 0.56, m.azul, 0, 2.5, 0.35, ig);
  hip(0.05, 0.36, 0.5, m.telha, 0, 2.8, 0.35, 1, 1, ig);
  bx(0.04, 0.3, 0.04, m.preto, 0, 3.2, 0.35, ig);
  const fr = new THREE.Shape();
  fr.moveTo(-0.8, 0);
  fr.lineTo(0.8, 0);
  fr.lineTo(0, 0.45);
  fr.closePath();
  const pe = new THREE.Mesh(
    new THREE.ExtrudeGeometry(fr, { depth: 0.2, bevelEnabled: false }),
    m.branco,
  );
  pe.position.set(0, 1.7, 0.6);
  ig.add(pe);
  bx(0.4, 0.7, 0.05, m.azul, 0, 0.95, 0.81, ig);
  [-0.5, 0.5].forEach((x) => bx(0.2, 0.35, 0.04, m.azul, x, 1.3, 0.81, ig));
  const igit = novo(ig, -5, sup(-1.5), -1.5);
  igit.d = 0.1;

  const prc = new THREE.Group();
  bx(1.8, 0.05, 1.8, mp, 0, 0.03, 0, prc);
  cyl(0.06, 0.08, 0.5, m.tronco, 0, 0.25, 0, prc, 8);
  ball(0.4, M(0x3f7a30, { flatShading: true }), 0, 0.75, 0, prc);
  bx(0.9, 0.1, 0.9, m.pedra, 0.9, 0.05, 0.9, prc);
  const pcit = novo(prc, 2, sup(0.9) + 0.03, 0.4);
  pcit.d = 0.3;

  const sg = tex(256, 48, (c, W, H) => {
    c.fillStyle = "#2f6fc0";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#fff";
    c.font = "bold 28px Arial,sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("POUSADA", 128, 26);
  });
  const pousadas: ItemAnim[] = [];
  [-2.5, 0, 2.5, 5, 7.5, 9.2].forEach((x, i) => {
    const p = new THREE.Group();
    const cor = [0xf2c24a, 0x5fc6c0, 0xe58aa5, 0xf29a4a, 0xf4f4ee, 0x7bc08a][i]!;
    bx(1.5, 0.1, 1.1, m.madeira, 0, 0.05, 0, p);
    bx(1.3, 0.9, 0.9, M(cor), 0, 0.55, 0, p);
    hip(0.1, 1.1, 0.5, i % 2 ? m.palha : m.telha, 0, 1.25, 0, 1.1, 0.85, p);
    [-0.4, 0.4].forEach((a) =>
      [0.4, 0.85].forEach((y) => {
        bx(0.26, 0.28, 0.03, m.branco, a, y, 0.46, p);
        bx(0.2, 0.22, 0.04, m.azul, a, y, 0.47, p);
      }),
    );
    bx(0.3, 0.5, 0.04, m.madeira, 0, 0.35, 0.46, p);
    const sn = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.13),
      new THREE.MeshBasicMaterial({ map: sg }),
    );
    sn.position.set(0, 1.1, 0.47);
    p.add(sn);
    const it = novo(p, x, 0.3, 2.55);
    it.d = i * 0.12;
    it.n = i;
    pousadas.push(it);
  });

  const quiosques = [-1, 3, 6].map((x, i) => {
    const q = new THREE.Group();
    (
      [
        [-0.4, -0.4],
        [0.4, -0.4],
        [-0.4, 0.4],
        [0.4, 0.4],
      ] as const
    ).forEach((d) => bx(0.05, 0.7, 0.05, m.madeira, d[0], 0.35, d[1], q));
    hip(0.03, 0.8, 0.4, m.palha, 0, 0.9, 0, 1, 1, q);
    bx(0.5, 0.3, 0.3, m.madeira, 0, 0.15, 0, q);
    [-0.3, 0.3].forEach((s) =>
      cyl(0.07, 0.07, 0.2, m.branco, s, 0.1, 0.5, q, 8),
    );
    const it = novo(q, x, 0.17, 4.1);
    it.d = i * 0.2;
    return it;
  });

  const cores = [
    0xe63946, 0xf4a300, 0xffd60a, 0x06d6a0, 0x118ab2, 0x9b5de5, 0xf15bb5,
    0xff7b00,
  ];
  for (let i = 0; i < 16; i++) {
    const u = new THREE.Group();
    cyl(0.015, 0.015, 0.6, m.madeira, 0, 0.3, 0, u, 6);
    cyl(0, 0.35, 0.12, M(cores[i % 8]!), 0, 0.65, 0, u, 10);
    bx(0.35, 0.04, 0.2, m.branco, 0.35, 0.07, 0.1, u);
    const it = novo(
      u,
      -3 + i * 0.85 + (rnd() - 0.5) * 0.2,
      0.15,
      4.5 + (i % 2) * 0.55,
    );
    it.ord = rnd();
    fora.push(it);
  }
  fora.sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));
  fora.forEach((it, i) => {
    it.ord = i / fora.length;
  });

  const or = new THREE.Group();
  bx(18, 0.06, 0.5, m.pedra, 2, 0.32, 3.5, or);
  for (let x = -6; x <= 10; x += 2) {
    cyl(0.025, 0.03, 0.7, m.preto, x, 0.7, 3.4, or, 6);
    ball(0.07, m.lamp, x, 1.08, 3.4, or);
  }
  const orit = novo(or, 0, 0, 0);
  orit.d = 0.3;

  const pr = new THREE.Group();
  bx(2.6, 0.1, 0.5, m.madeira, 0, 0.25, 0, pr);
  for (let x = -1; x <= 1.1; x += 0.7) {
    [-0.2, 0.2].forEach((z) =>
      cyl(0.05, 0.05, 0.7, m.madeira, x, 0, z, pr, 6),
    );
  }
  const prit = novo(pr, -8, 0, 2.2);

  const mkBarco = (cor: number) => {
    const b = new THREE.Group();
    bx(0.9, 0.14, 0.3, M(cor), 0, 0.1, 0, b);
    const proa = bx(0.3, 0.12, 0.3, M(cor), 0.55, 0.18, 0, b);
    proa.rotation.z = 0.4;
    bx(0.5, 0.04, 0.34, m.branco, -0.1, 0.32, 0, b);
    cyl(0.02, 0.02, 0.3, m.madeira, -0.1, 0.2, 0.12, b, 6);
    g.add(b);
    return b;
  };
  const barcos: Barco[] = [0x2f9a5a, 0xe8e4d8, 0xd9342b, 0xf2c230].map(
    (c, i) => ({
      o: mkBarco(c),
      x: -9.5 + i * 0.9,
      z: -6 + i * 4,
      v: 0.22 + i * 0.06,
      dir: i % 2 ? 1 : -1,
    }),
  );

  const surfistas: Surfista[] = [0, 1, 2, 3].map((i) => {
    const s = new THREE.Group();
    bx(0.55, 0.03, 0.13, M(cores[i * 2]!), 0, 0.04, 0, s);
    bx(0.08, 0.2, 0.06, m.preto, 0, 0.17, 0, s);
    ball(0.045, m.pele, 0, 0.32, 0, s);
    const braco = bx(0.14, 0.03, 0.03, m.pele, 0.1, 0.2, 0, s);
    braco.rotation.z = 0.3;
    g.add(s);
    return { o: s, x: -2 + i * 3, v: 0.9 + i * 0.15, ph: i * 1.7 };
  });

  const ondas = [0, 1, 2, 3, 4].map((i) => {
    const e = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.02, 0.12),
      m.espuma.clone(),
    );
    e.position.set(2, 0.02, 5.6 + i * 0.55);
    g.add(e);
    return e;
  });

  const festa = new THREE.Group();
  const flags: Flag[] = [];
  bx(1.6, 0.15, 1, m.madeira, 0, 0.07, 0, festa);
  bx(1.6, 0.9, 0.06, M(0x2a3a8a), 0, 0.6, -0.45, festa);
  [-0.6, -0.2, 0.2, 0.6].forEach((x, i) => {
    const cols = [0xffd60a, 0xff7bd0, 0x7be0ff, 0xa0ff7b] as const;
    ball(
      0.07,
      M(cols[i]!, { emissive: cols[i]!, emissiveIntensity: 1 }),
      x,
      1.1,
      -0.4,
      festa,
    );
  });
  const fit = novo(festa, 5.8, 0.17, 4.5);
  fit.d = 0.2;

  const band = new THREE.Group();
  const tri = new THREE.Shape();
  tri.moveTo(-0.07, 0);
  tri.lineTo(0.07, 0);
  tri.lineTo(0, -0.17);
  const triG = new THREE.ShapeGeometry(tri);
  const bm = [0xffffff, 0x118ab2, 0xffd60a].map(
    (c) =>
      new THREE.MeshStandardMaterial({
        color: c,
        side: THREE.DoubleSide,
        roughness: 0.9,
      }),
  );
  (
    [
      [-1, 1.5],
      [2.2, 1.2],
    ] as const
  ).forEach((a) => {
    const z = a[0];
    for (let k = 1; k < 30; k++) {
      const s = k / 30;
      const f = new THREE.Mesh(triG, bm[k % 3]!);
      f.position.set(-5.5 + s * 15, 1.6 - 0.4 * 4 * s * (1 - s), z + 4.5);
      band.add(f);
      flags.push({ f, ph: k });
    }
  });
  const bit = novo(band, 0, 0, 0);
  bit.d = 0.3;

  const lan = new THREE.Group();
  for (let x = -4; x <= 9; x += 0.8) {
    ball(
      0.07,
      m.lamp,
      x,
      1.15 + Math.sin(x) * 0.1,
      4.9 + (x % 1.6 > 0.8 ? 0.4 : 0),
      lan,
    );
  }
  const lait = novo(lan, 0, 0, 0);
  lait.d = 0.6;
  const partes = [fit, bit, lait];

  const disco = tex(32, 32, (c) => {
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(16, 16, 15, 0, 7);
    c.fill();
  });
  const N = 130;
  const hp = new Float32Array(N * 3);
  const tp = new Float32Array(N * 3);
  const hc = new Float32Array(N * 3);
  const tc = new Float32Array(N * 3);
  const gente: Gente[] = [];
  const col = new THREE.Color();
  const peles = [0x6b4a36, 0x8a5a3c, 0xc08a60, 0xf0c9a0];
  const rou = [
    0xffffff, 0x2fa04a, 0xf2c230, 0xd23a2a, 0x2a62c4, 0xe58aa5, 0xff8a1e,
    0x222222,
  ];
  for (let i = 0; i < N; i++) {
    const rua2 = i < 24;
    gente.push({
      x: rua2 ? -4 + rnd() * 12 : -3 + rnd() * 13,
      z: rua2 ? 0.9 + (rnd() - 0.5) * 0.3 : 3.8 + rnd() * 1.7,
      vx: (rnd() < 0.5 ? -1 : 1) * (0.15 + rnd() * 0.25),
      rua: rua2,
      ph: rnd() * 6,
      br: rnd() < 0.8,
    });
    col.setHex(peles[Math.floor(rnd() * 4)]!);
    hc.set([col.r, col.g, col.b], i * 3);
  }
  const cor = (n: number) => {
    gente.forEach((p, i) => {
      col.setHex(n === 5 && p.br ? 0xffffff : rou[Math.floor(rnd() * 8)]!);
      tc.set([col.r, col.g, col.b], i * 3);
    });
  };
  cor(0);

  const pts = (p: Float32Array, c: Float32Array, s: number) => {
    const gm = new THREE.BufferGeometry();
    gm.setAttribute("position", new THREE.BufferAttribute(p, 3));
    gm.setAttribute("color", new THREE.BufferAttribute(c, 3));
    const o = new THREE.Points(
      gm,
      new THREE.PointsMaterial({
        size: s,
        vertexColors: true,
        map: disco,
        alphaTest: 0.4,
      }),
    );
    o.frustumCulled = false;
    g.add(o);
    return o;
  };
  const pH = pts(hp, hc, 0.09);
  const pT = pts(tp, tc, 0.14);
  pH.geometry.setDrawRange(0, 0);
  pT.geometry.setDrawRange(0, 0);

  const NP = 300;
  const fp = new Float32Array(NP * 3);
  const fc = new Float32Array(NP * 3);
  const fv = new Float32Array(NP * 3);
  const fl = new Float32Array(NP);
  const fb = new Float32Array(NP * 3);
  const fogos = pts(fp, fc, 0.1);
  fogos.visible = false;
  for (let i = 0; i < NP; i++) fp[i * 3 + 1] = -9;

  const estourar = () => {
    const cx = -5 + rnd() * 13;
    const cy = 4.6 + rnd() * 1.5;
    const cz = 6.5 + rnd() * 3;
    col.setHSL(rnd(), 1, 0.6);
    let n = 0;
    for (let i = 0; i < NP && n < 50; i++) {
      if (fl[i]! > 0) continue;
      n++;
      fl[i] = 1.6;
      fp[i * 3] = cx;
      fp[i * 3 + 1] = cy;
      fp[i * 3 + 2] = cz;
      const a = rnd() * PI * 2;
      const b = Math.acos(2 * rnd() - 1);
      const sp = 0.9 + rnd() * 0.6;
      fv[i * 3] = Math.sin(b) * Math.cos(a) * sp;
      fv[i * 3 + 1] = Math.cos(b) * sp;
      fv[i * 3 + 2] = Math.sin(b) * Math.sin(a) * sp;
      fb[i * 3] = col.r;
      fb[i * 3 + 1] = col.g;
      fb[i * 3 + 2] = col.b;
    }
  };

  const FC = [0, 0.15, 0.38, 0.7, 1.001, 1.001];
  const FF = [0, 0, 0, 0.3, 0.6, 1.001];
  const K = [0, 4, 10, 22, 40, 130];
  let nivel = 0;
  let t = 0;
  let vai = true;
  let tf = 0;

  const on = (it: ItemAnim, v: boolean, d: number) => {
    it.alvoNovo = v ? 1 : 0;
    it.atraso = d;
  };

  const aplicar = () => {
    const f = FC[nivel]!;
    casas.forEach((it) => {
      it.alvoNovo = (it.ord ?? 0) < f ? 1 : 0;
      it.atraso = rnd() * 0.8;
    });
    moitas.forEach((it) => {
      it.alvoNovo =
        nivel === 5 ? ((it.lim ?? 0) > 0.55 ? 1 : 0) : (it.lim ?? 0) > f ? 1 : 0;
      it.atraso = rnd() * 0.6;
    });
    fora.forEach((it) => {
      it.alvoNovo = (it.ord ?? 0) < FF[nivel]! ? 1 : 0;
      it.atraso = rnd() * 0.7;
    });
    on(ruit, nivel >= 1, 0.1);
    on(prit, nivel >= 1, 0.2);
    on(igit, nivel >= 2, 0.2);
    on(pcit, nivel >= 2, 0.4);
    pousadas.forEach((it) =>
      on(it, nivel >= 4 || (nivel === 3 && (it.n ?? 0) < 3), 0.1 + (it.n ?? 0) * 0.12),
    );
    quiosques.forEach((it, i) => on(it, nivel >= 3, i * 0.2));
    on(orit, nivel >= 4, 0.3);
    partes.forEach((it) => on(it, nivel === 5, it.d));
    pH.geometry.setDrawRange(0, K[nivel]!);
    pT.geometry.setDrawRange(0, K[nivel]!);
    cor(nivel);
    pT.geometry.attributes.color!.needsUpdate = true;
    fogos.visible = nivel === 5;
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
      it.g.position.y = it.y + (1 - Math.min(1, s)) * 1.4;
    });
    if (!vai) return;
    t += dt;

    barcos.forEach((b, i) => {
      b.o.visible =
        nivel >= 1 &&
        (i < 2 || (i === 2 && nivel >= 3) || (i === 3 && nivel === 5));
      b.z += b.dir * b.v * dt;
      if (b.z > 8.5) b.dir = -1;
      if (b.z < -8) b.dir = 1;
      b.o.position.set(b.x, 0.06 + 0.015 * Math.sin(t * 1.6 + i), b.z);
      b.o.rotation.y = b.dir > 0 ? PI / 2 : -PI / 2;
    });

    surfistas.forEach((s, i) => {
      s.o.visible =
        nivel >= 2 &&
        (i < 1 || (i < 2 && nivel >= 3) || (i < 4 && nivel === 5));
      s.x += s.v * dt;
      if (s.x > 10.5) s.x = -3;
      s.o.position.set(
        s.x,
        0.06 + 0.04 * Math.sin(t * 3 + s.ph),
        6.4 + Math.sin(s.x * 0.7 + s.ph) * 0.4,
      );
      s.o.rotation.y = -PI / 2 + Math.sin(t * 2 + s.ph) * 0.2;
      s.o.rotation.x = Math.sin(t * 3 + s.ph) * 0.1;
    });

    ondas.forEach((e, i) => {
      const p = (t * 0.35 + i * 0.2) % 1;
      e.position.z = 7.8 - p * 2.3;
      (e.material as THREE.MeshStandardMaterial).opacity = 0.55 * Math.sin(p * PI);
      e.visible = nivel >= 0;
    });

    flags.forEach((f) => {
      f.f.rotation.z = 0.3 * Math.sin(t * 2.4 + f.ph);
    });

    const ha = pH.geometry.attributes.position!;
    const ta = pT.geometry.attributes.position!;
    const haArr = ha.array as Float32Array;
    const taArr = ta.array as Float32Array;
    for (let i = 0; i < K[nivel]!; i++) {
      const p = gente[i]!;
      p.x += p.vx * dt;
      if (p.x > 10 || p.x < (p.rua ? -4 : -3)) p.vx *= -1;
      const y =
        (p.rua ? sup(0.9) + 0.04 : 0.17) +
        Math.abs(Math.sin(t * (nivel === 5 && !p.rua ? 6 : 4) + p.ph)) *
          (nivel === 5 && !p.rua ? 0.04 : 0.015);
      haArr[i * 3] = p.x;
      haArr[i * 3 + 1] = y + 0.3;
      haArr[i * 3 + 2] = p.z;
      taArr[i * 3] = p.x;
      taArr[i * 3 + 1] = y + 0.16;
      taArr[i * 3 + 2] = p.z;
    }
    ha.needsUpdate = true;
    ta.needsUpdate = true;

    if (nivel === 5) {
      tf -= dt;
      if (tf <= 0) {
        tf = 0.9 + rnd() * 0.8;
        estourar();
      }
      for (let i = 0; i < NP; i++) {
        if (fl[i]! > 0) {
          fl[i]! -= dt;
          fv[i * 3 + 1]! -= 1.2 * dt;
          fp[i * 3]! += fv[i * 3]! * dt;
          fp[i * 3 + 1]! += fv[i * 3 + 1]! * dt;
          fp[i * 3 + 2]! += fv[i * 3 + 2]! * dt;
          const k = Math.max(0, fl[i]! / 1.6);
          fc[i * 3] = fb[i * 3]! * k;
          fc[i * 3 + 1] = fb[i * 3 + 1]! * k;
          fc[i * 3 + 2] = fb[i * 3 + 2]! * k;
          if (fl[i]! <= 0) fp[i * 3 + 1] = -9;
        }
      }
      fogos.geometry.attributes.position!.needsUpdate = true;
      fogos.geometry.attributes.color!.needsUpdate = true;
    }
  };

  return g;
}
