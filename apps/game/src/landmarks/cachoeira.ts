import * as THREE from "three";

export type CachoeiraGroup = THREE.Group & {
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
  ord?: number;
};

type Pessoa = {
  x: number;
  z: number;
  vz: number;
  praca: boolean;
  ph: number;
};

type Barco = {
  o: THREE.Group;
  x: number;
  z: number;
  v: number;
  dir: number;
};

type Flag = { f: THREE.Mesh; ph: number };

export function criarCachoeira(): CachoeiraGroup {
  const g = new THREE.Group() as CachoeiraGroup;
  g.name = "Cachoeira";
  const PI = Math.PI;
  let sd = 41;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  const M = (c: number | THREE.Color, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(
      Object.assign({ color: c, roughness: 0.85 }, o || {}),
    );

  const m = {
    grama: M(0x6f9a3a),
    terra: M(0x8a7a62),
    rio: M(0x3d6f8f, { roughness: 0.25 }),
    telha: M(0xb25a34, { flatShading: true }),
    branco: M(0xf4f2ea),
    creme: M(0xefe3c4),
    azul: M(0x3a6fc0),
    madeira: M(0x5a3a22),
    pedra: M(0xb9b2a0),
    cobble: M(0x8a8478),
    ferro: M(0x3a3a40, { metalness: 0.4, roughness: 0.6 }),
    tronco: M(0x7a6a52),
    verde: M(0x3f7a30, { flatShading: true }),
    pele: M(0x7a5238),
    preto: M(0x22242a),
    lamp: M(0xffe2a0, { emissive: 0xffc860, emissiveIntensity: 0.9 }),
    fogo: M(0xff8a1e, { emissive: 0xff6a00, emissiveIntensity: 1.2 }),
    fogo2: M(0xffd23a, { emissive: 0xffc010, emissiveIntensity: 1.2 }),
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
    fn: (c: CanvasRenderingContext2D, W: number, H: number) => void,
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

  const sup1 = (x: number) =>
    x <= 1 ? 0.3 : Math.min(3.6, 0.3 + (x - 1) * 0.4125);
  const sup2 = (x: number) =>
    x >= -3 ? 0.3 : Math.min(2.6, 0.3 + (-3 - x) * 0.46);

  const sh = new THREE.Shape();
  [
    [-12, 0],
    [-12, 2.6],
    [-8, 2.6],
    [-3, 0.3],
    [-2.8, 0.05],
    [0.8, 0.05],
    [1, 0.3],
    [9, 3.6],
    [12, 3.6],
    [12, 0],
  ].forEach((p, i) =>
    i ? sh.lineTo(p[0]!, p[1]!) : sh.moveTo(p[0]!, p[1]!),
  );
  sh.closePath();
  const ter = new THREE.Mesh(
    new THREE.ExtrudeGeometry(sh, { depth: 18, bevelEnabled: false }),
    [m.terra, m.grama],
  );
  ter.position.z = -9;
  g.add(ter);
  bx(3.6, 0.12, 18, m.rio, -1, 0.1, 0);

  const mata = (x: number, z: number, y: number, r: number) => {
    const c = new THREE.Color().setHSL(
      0.26 + rnd() * 0.05,
      0.5,
      0.2 + rnd() * 0.1,
    );
    ball(r, M(c, { flatShading: true }), x, y, z).scale.y = 0.8;
  };
  for (let i = 0; i < 10; i++)
    mata(-1.6 + rnd() * 1.2, -4.2 + rnd() * 1.8, 0.35, 0.3 + rnd() * 0.25);
  (
    [
      [8, -9, 4, 2.2, 0.8],
      [-7, -9, 3.6, 2, 0.7],
      [0, -10, 5, 2.6, 0.9],
      [11, -6, 3, 1.4, 0.8],
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
  for (let i = 0; i < 40; i++) {
    const side = rnd() < 0.5;
    const x = side ? 4 + rnd() * 6 : -11 + rnd() * 7;
    const z = -8.8 + rnd() * 3.6;
    mata(x, z, (side ? sup1(x) : sup2(x)) + 0.1, 0.3 + rnd() * 0.35);
  }

  const itens: ItemAnim[] = [];
  const casas: ItemAnim[] = [];
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

  const pal = [
    0xefe3c4, 0xf2c24a, 0xe58aa5, 0x4a78c2, 0xf4f4ee, 0x7bc08a, 0xf0d4b8,
  ];
  const casa = (x: number, z: number, lado: number) => {
    const gh = new THREE.Group();
    const w = 0.62 + rnd() * 0.18;
    const d = 0.62;
    const fl = 1 + Math.floor(rnd() * 2.4);
    const h = fl * 0.45;
    const y = lado > 0 ? sup1(x) : sup2(x);
    bx(w, h + 1, d, M(pal[Math.floor(rnd() * 7)]!), 0, h / 2 - 0.5, 0, gh);
    bx(w + 0.04, 0.05, d + 0.04, m.branco, 0, h, 0, gh);
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
    for (let f = 0; f < fl; f++) {
      for (let k = -1; k <= 1; k += 2) {
        if (f === 0 && k === 1) continue;
        bx(0.1, 0.17, 0.03, m.azul, k * 0.17, 0.28 + f * 0.45, d / 2 + 0.012, gh);
      }
    }
    bx(0.12, 0.28, 0.03, m.madeira, 0.17, 0.16, d / 2 + 0.012, gh);
    gh.rotation.y = lado > 0 ? -PI / 2 : PI / 2;
    const it = novo(gh, x, y, z);
    it.ord =
      lado > 0
        ? Math.hypot(x - 3, z - 1) * 0.1 + rnd() * 0.35
        : Math.hypot(x + 3, z - 2.2) * 0.1 + 0.5 + rnd() * 0.35;
    casas.push(it);
  };

  for (let xi = 0; xi < 8; xi++) {
    for (let zi = 0; zi < 15; zi++) {
      const x = 1.5 + xi * 0.9 + (rnd() - 0.5) * 0.08;
      const z = -7.3 + zi + (rnd() - 0.5) * 0.08;
      if (
        Math.abs(z - 0.3) < 0.55 ||
        Math.abs(x - 4.6) < 0.55 ||
        (x > 2.3 && x < 4.2 && z > -2.8 && z < 2.6) ||
        rnd() < 0.1
      )
        continue;
      casa(x, z, 1);
    }
  }
  for (let xi = 0; xi < 6; xi++) {
    for (let zi = 0; zi < 12; zi++) {
      const x = -4.3 - xi * 0.9;
      const z = -6.2 + zi * 1.05;
      if (Math.abs(z - 2.2) < 0.6 || rnd() < 0.18) continue;
      casa(x, z, -1);
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
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.05, 0.8), mp);
  r1.position.set(5, 1.95, 0.3);
  r1.rotation.z = 0.39;
  rua.add(r1);
  bx(0.8, 0.05, 15, mp, 4.6, sup1(4.6) + 0.03, 0, rua);
  bx(1.8, 0.05, 1.8, mp, 3.1, sup1(3.1) + 0.04, 1, rua);
  const ruit = novo(rua, 0, 0, 0);
  ruit.d = 0;

  const azul = tex(
    128,
    128,
    (c) => {
      c.fillStyle = "#f4f4f0";
      c.fillRect(0, 0, 128, 128);
      c.strokeStyle = "#2a4aa0";
      c.lineWidth = 9;
      for (let r = 0; r < 8; r++) {
        c.beginPath();
        for (let x = 0; x <= 128; x += 16) {
          const y = r * 16 + ((x / 16) % 2 ? 10 : 2);
          x ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        c.stroke();
      }
    },
    2,
    2,
  );
  const mx = new THREE.Group();
  bx(1.6, 1.7, 1.5, m.branco, 0, 0.85, 0, mx);
  bx(1.2, 0.9, 2.2, m.branco, 0, 0.45, -1.8, mx);
  hip(0.1, 1.2, 0.5, m.telha, 0, 1.15, -1.8, 1.1, 1.6, mx);
  [-0.65, 0.65].forEach((x) => {
    bx(0.5, 2.4, 0.5, m.creme, x, 1.2, 0.1, mx);
    bx(0.55, 0.1, 0.55, m.pedra, x, 2.4, 0.1, mx);
    bx(0.2, 0.35, 0.04, m.vidro, x, 2.0, 0.37, mx);
    const sp = new THREE.Mesh(
      new THREE.CylinderGeometry(0, 0.38, 1.1, 4),
      new THREE.MeshStandardMaterial({ map: azul, roughness: 0.6 }),
    );
    sp.rotation.y = PI / 4;
    sp.position.set(x, 3, 0.1);
    mx.add(sp);
    cyl(0, 0.03, 0.3, m.preto, x, 3.7, 0.1, mx, 6);
  });
  const fr = new THREE.Shape();
  fr.moveTo(-0.8, 0);
  fr.lineTo(0.8, 0);
  fr.lineTo(0, 0.5);
  fr.closePath();
  const pe = new THREE.Mesh(
    new THREE.ExtrudeGeometry(fr, { depth: 0.2, bevelEnabled: false }),
    m.branco,
  );
  pe.position.set(0, 1.7, 0.65);
  mx.add(pe);
  bx(0.4, 0.7, 0.05, m.madeira, 0, 0.35, 0.76, mx);
  const jr = new THREE.Mesh(new THREE.CircleGeometry(0.14, 14), m.vidro);
  jr.position.set(0, 1.3, 0.76);
  mx.add(jr);
  mx.rotation.y = -PI / 2;
  const mxit = novo(mx, 3.1, sup1(3.1), -1.2);
  mxit.d = 0.2;

  const arv = new THREE.Group();
  cyl(0.06, 0.08, 0.5, m.tronco, 0, 0.25, 0, arv, 8);
  ball(0.35, m.verde, 0, 0.7, 0, arv);
  ball(0.25, m.verde, 0.2, 0.6, 0.1, arv);
  const arit = novo(arv, 3.1, sup1(3.1) + 0.04, 1);
  arit.d = 0.3;

  const grande = (
    _x: number,
    _z: number,
    w: number,
    fl: number,
    cor: number,
    rot: number,
  ) => {
    const gg = new THREE.Group();
    const h = fl * 0.5;
    bx(w, h + 1, 0.9, M(cor), 0, h / 2 - 0.5, 0, gg);
    bx(w + 0.06, 0.05, 0.96, m.branco, 0, h, 0, gg);
    hip(0.08, 1, 0.45, m.telha, 0, h + 0.22, 0, (w + 0.2) / 1.414, 1.1 / 1.414, gg);
    for (let f = 0; f < fl; f++) {
      for (let k = 0; k < Math.floor(w / 0.4); k++) {
        bx(
          0.12,
          0.22,
          0.03,
          m.azul,
          -w / 2 + 0.25 + k * 0.4,
          0.3 + f * 0.5,
          0.46,
          gg,
        );
        if (f === 1)
          bx(
            0.2,
            0.03,
            0.1,
            m.ferro,
            -w / 2 + 0.25 + k * 0.4,
            0.18 + f * 0.5,
            0.5,
            gg,
          );
      }
    }
    gg.rotation.y = rot;
    return gg;
  };
  const gA = novo(grande(0, 0, 1.7, 2, 0xf1c2c8, -PI / 2), 2.2, sup1(2.2), 2.6);
  const gB = novo(grande(0, 0, 1.5, 2, 0xf2c24a, -PI / 2), 2.2, sup1(2.2), -3.4);
  const gC = novo(grande(0, 0, 1.3, 2, 0x3a62c8, PI), 3.1, sup1(3.1), 3.2);
  [gA, gB, gC].forEach((it, i) => {
    it.d = 0.1 * i;
  });

  const cap = new THREE.Group();
  bx(0.9, 0.8, 0.9, m.branco, 0, 0.4, 0, cap);
  const dm = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 16, 10, 0, PI * 2, 0, PI / 2),
    m.branco,
  );
  dm.position.y = 0.8;
  cap.add(dm);
  cyl(0.02, 0.02, 0.3, m.preto, 0, 1.35, 0, cap, 6);
  bx(0.2, 0.4, 0.04, m.madeira, 0, 0.2, 0.46, cap);
  cap.rotation.y = -PI / 2;
  const capit = novo(cap, 7.4, sup1(7.4), -4.6);
  capit.d = 0.2;

  const pt = new THREE.Group();
  bx(5.4, 0.1, 0.5, m.ferro, 0, 0.55, 0, pt);
  [-0.26, 0.26].forEach((z) => {
    bx(5.4, 0.07, 0.07, m.ferro, 0, 1.1, z, pt);
    bx(5.4, 0.05, 0.05, m.ferro, 0, 0.58, z, pt);
    for (let k = 0; k < 12; k++) {
      const x = -2.5 + k * 0.45;
      bx(0.04, 0.55, 0.04, m.ferro, x, 0.84, z, pt);
      const d = bx(0.04, 0.62, 0.04, m.ferro, x + 0.22, 0.84, z, pt);
      d.rotation.z = (k % 2 ? 1 : -1) * 0.7;
    }
  });
  [-1.3, 1.3].forEach((x) => bx(0.4, 0.6, 0.7, m.pedra, x, 0.25, 0, pt));
  const pit = novo(pt, -1, 0, 2.2);
  pit.d = 0.4;

  const or = new THREE.Group();
  bx(0.5, 0.06, 14, m.pedra, 1.2, 0.33, 0, or);
  for (let z = -6; z <= 6.1; z += 2) {
    cyl(0.025, 0.03, 0.7, m.ferro, 1.05, 0.7, z, or, 6);
    ball(0.07, m.lamp, 1.05, 1.08, z, or);
  }
  const orit = novo(or, 0, 0, 0);
  orit.d = 0.3;

  const pl = new THREE.Group();
  const polos: number[] = [];
  for (let z = -6; z <= 6.1; z += 3) {
    cyl(0.03, 0.04, 1, m.madeira, 4.9, sup1(4.9) + 0.5, z, pl, 6);
    polos.push(z);
  }
  for (let k = 0; k < polos.length - 1; k++) {
    [1.0, 0.9].forEach((h) => {
      const pts = [
        new THREE.Vector3(4.9, sup1(4.9) + h, polos[k]!),
        new THREE.Vector3(
          4.9,
          sup1(4.9) + h - 0.12,
          (polos[k]! + polos[k + 1]!) / 2,
        ),
        new THREE.Vector3(4.9, sup1(4.9) + h, polos[k + 1]!),
      ];
      pl.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.005, 3),
          m.preto,
        ),
      );
    });
  }
  const plit = novo(pl, 0, 0, 0);
  plit.d = 0.6;

  const cores = [
    0xe63946, 0xf4a300, 0xffd60a, 0x06d6a0, 0x118ab2, 0x9b5de5,
  ].map(
    (c) =>
      new THREE.MeshStandardMaterial({
        color: c,
        side: THREE.DoubleSide,
        roughness: 0.9,
      }),
  );
  const tri = new THREE.Shape();
  tri.moveTo(-0.07, 0);
  tri.lineTo(0.07, 0);
  tri.lineTo(0, -0.17);
  const triG = new THREE.ShapeGeometry(tri);
  const festa = new THREE.Group();
  const flags: Flag[] = [];
  const fio = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    sag: number,
    n: number,
  ) => {
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 8; k++) {
      const s = k / 8;
      pts.push(
        new THREE.Vector3(
          a.x + (b.x - a.x) * s,
          a.y + (b.y - a.y) * s - sag * 4 * s * (1 - s),
          a.z + (b.z - a.z) * s,
        ),
      );
    }
    festa.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.006, 3),
        m.preto,
      ),
    );
    for (let k = 1; k < n; k++) {
      const s = k / n;
      const f = new THREE.Mesh(triG, cores[k % 6]!);
      f.position.set(
        a.x + (b.x - a.x) * s,
        a.y + (b.y - a.y) * s - sag * 4 * s * (1 - s),
        a.z + (b.z - a.z) * s,
      );
      festa.add(f);
      flags.push({ f, ph: k });
    }
  };
  [-3, 0, 3].forEach((z) =>
    fio(
      new THREE.Vector3(-4.4, 2.4, z),
      new THREE.Vector3(1.4, 2.4, z),
      0.35,
      22,
    ),
  );
  [4.3, 4.9].forEach((x) =>
    fio(
      new THREE.Vector3(x, sup1(x) + 1.3, -6.5),
      new THREE.Vector3(x, sup1(x) + 1.3, 6.5),
      0.4,
      34,
    ),
  );
  bx(1.2, 0.12, 0.8, m.madeira, 0, 0.06, 0, festa);
  bx(1.2, 0.7, 0.06, M(0xd9342b), 0, 0.45, -0.35, festa);
  [-0.45, 0, 0.45].forEach((x, i) =>
    ball(
      0.06,
      M([0xffd60a, 0xff7bd0, 0x7be0ff][i]!, {
        emissive: [0xffd60a, 0xff7bd0, 0x7be0ff][i],
        emissiveIntensity: 1,
      }),
      x,
      0.85,
      -0.3,
      festa,
    ),
  );
  festa.position.set(0, 0, 0);
  const feit = novo(festa, 0, 0, 0);
  feit.d = 0.2;

  const fgn = new THREE.Group();
  bx(0.6, 0.12, 0.8, m.madeira, 0, 0.06, 0, fgn);
  [0, 1, 2].forEach((i) => {
    const c = cyl(
      0,
      0.14,
      0.5,
      i % 2 ? m.fogo2 : m.fogo,
      (i - 1) * 0.1,
      0.35,
      0,
      fgn,
      6,
    );
    c.userData.ph = i;
  });
  const fit = novo(fgn, 3.2, sup1(3.1) + 0.05, 2.2);
  fit.d = 0.4;

  const pal2 = new THREE.Group();
  bx(1.3, 0.15, 0.9, m.madeira, 0, 0.07, 0, pal2);
  bx(1.3, 0.8, 0.06, M(0x2a3a8a), 0, 0.55, -0.4, pal2);
  [-0.5, 0, 0.5].forEach((x) => ball(0.06, m.lamp, x, 1, -0.35, pal2));
  pal2.rotation.y = -PI / 2;
  const palit = novo(pal2, 2.7, sup1(2.7) + 0.04, 0.3);
  palit.d = 0.5;

  const mkBarco = (cor: number, lan: boolean) => {
    const b = new THREE.Group();
    bx(0.9, 0.14, 0.3, M(cor), 0, 0.1, 0, b);
    bx(0.3, 0.12, 0.3, M(cor), 0.55, 0.18, 0, b).rotation.z = 0.4;
    bx(0.5, 0.04, 0.34, m.branco, -0.1, 0.32, 0, b);
    cyl(0.02, 0.02, 0.3, m.madeira, -0.1, 0.2, 0.12, b, 6);
    if (lan) ball(0.06, m.lamp, 0.3, 0.3, 0, b);
    g.add(b);
    return b;
  };
  const barcos: Barco[] = [
    mkBarco(0xe8e4d8, false),
    mkBarco(0x3a78c2, false),
    mkBarco(0xd9342b, true),
    mkBarco(0xf2c230, true),
  ].map((b, i) => ({
    o: b,
    x: -1.6 + i * 0.8,
    z: -6 + i * 3,
    v: 0.25 + i * 0.07,
    dir: i % 2 ? 1 : -1,
  }));

  const disco = tex(32, 32, (c) => {
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(16, 16, 15, 0, 7);
    c.fill();
  });
  const N = 110;
  const hp = new Float32Array(N * 3);
  const tp = new Float32Array(N * 3);
  const hc = new Float32Array(N * 3);
  const tc = new Float32Array(N * 3);
  const gente: Pessoa[] = [];
  const col = new THREE.Color();
  const peles = [0x6b4a36, 0x8a5a3c, 0xc08a60, 0xf0c9a0];
  const rou = [
    0xffffff, 0x2fa04a, 0xf2c230, 0xd23a2a, 0x2a62c4, 0xe58aa5, 0xff8a1e,
    0x222222,
  ];
  for (let i = 0; i < N; i++) {
    const praca = i % 5 < 3;
    gente.push({
      x: praca ? 2.3 + rnd() * 1.7 : 4.6 + (rnd() - 0.5) * 0.3,
      z: praca ? -0.2 + rnd() * 2.6 : -6 + rnd() * 12,
      vz: (rnd() < 0.5 ? -1 : 1) * (0.15 + rnd() * 0.25),
      praca,
      ph: rnd() * 6,
    });
    col.setHex(peles[Math.floor(rnd() * 4)]!);
    hc.set([col.r, col.g, col.b], i * 3);
    col.setHex(rou[Math.floor(rnd() * 8)]!);
    tc.set([col.r, col.g, col.b], i * 3);
  }
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
    const cx = -5 + rnd() * 12;
    const cy = 4.6 + rnd() * 1.5;
    const cz = -3 + rnd() * 6;
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

  const FC = [0, 0.18, 0.42, 0.72, 1.001, 1.001];
  const K = [0, 6, 14, 26, 40, 110];
  let nivel = 0;
  let t = 0;
  let vai = true;
  let tf = 0;

  const on = (it: ItemAnim, v: boolean, d: number) => {
    it.alvoNovo = v ? 1 : 0;
    it.atraso = d;
  };

  const aplicar = () => {
    casas.forEach((it) => {
      it.alvoNovo = (it.ord ?? 0) < FC[nivel]! ? 1 : 0;
      it.atraso = rnd() * 0.8;
    });
    on(ruit, nivel >= 1, 0.1);
    on(mxit, nivel >= 2, 0.2);
    on(arit, nivel >= 2, 0.4);
    on(pit, nivel >= 2, 0.4);
    on(gA, nivel >= 3, 0.1);
    on(gB, nivel >= 3, 0.3);
    on(gC, nivel >= 3, 0.5);
    on(capit, nivel >= 4, 0.2);
    on(orit, nivel >= 4, 0.3);
    on(plit, nivel >= 4, 0.6);
    on(feit, nivel === 5, 0.2);
    on(fit, nivel === 5, 0.5);
    on(palit, nivel === 5, 0.4);
    pH.geometry.setDrawRange(0, K[nivel]!);
    pT.geometry.setDrawRange(0, K[nivel]!);
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
        nivel >= 1 && (i < 1 || (i === 1 && nivel >= 3) || (i >= 2 && nivel === 5));
      b.z += b.dir * b.v * dt;
      if (b.z > 8) b.dir = -1;
      if (b.z < -8) b.dir = 1;
      b.o.position.set(b.x, 0.12 + 0.015 * Math.sin(t * 1.6 + i), b.z);
      b.o.rotation.y = b.dir > 0 ? PI / 2 : -PI / 2;
    });
    flags.forEach((f) => {
      f.f.rotation.z = 0.3 * Math.sin(t * 2.4 + f.ph);
    });
    fgn.children.forEach((c) => {
      if (c.userData.ph !== undefined) {
        c.scale.set(1, 0.8 + 0.35 * Math.abs(Math.sin(t * 9 + c.userData.ph * 2)), 1);
      }
    });
    const ha = pH.geometry.attributes.position!;
    const ta = pT.geometry.attributes.position!;
    const haArr = ha.array as Float32Array;
    const taArr = ta.array as Float32Array;
    for (let i = 0; i < K[nivel]!; i++) {
      const p = gente[i]!;
      p.z += p.vz * dt;
      if (!p.praca) {
        if (p.z > 6.2 || p.z < -6.2) p.vz *= -1;
      } else {
        p.x += Math.sin(t * 0.4 + p.ph) * dt * 0.15;
        if (p.z > 2.4 || p.z < -0.2) p.vz *= -1;
      }
      const y = sup1(p.x) + 0.03 + Math.abs(Math.sin(t * 5 + p.ph)) * 0.015;
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
