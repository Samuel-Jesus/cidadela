import * as THREE from "three";

export type FitinhaDoBonfimGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    pedidos: () => void;
    encher: () => void;
    limpar: () => void;
    amarrar: (n?: number) => void;
    alternarVida: () => void;
  };
};

type PessoaBase = {
  o: THREE.Group;
  corpo: THREE.Group;
  lE: THREE.Group;
  lD: THREE.Group;
  aE: THREE.Group;
  aD: THREE.Group;
  prev: number;
};

type Amarrador = PessoaBase & {
  x: number;
  off: number;
  fez: boolean;
};

type Passeante = PessoaBase & {
  x: number;
  dir: number;
  v: number;
};

type Faisca = {
  s: THREE.Mesh;
  l: number;
  vy: number;
};

export function criarFitinhaDoBonfim(): FitinhaDoBonfimGroup {
  const g = new THREE.Group() as FitinhaDoBonfimGroup;
  g.name = "FitinhaDoBonfim";
  const PI = Math.PI;
  let sd = 37;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  const M = (c: number | THREE.Color, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(
      Object.assign({ color: c, roughness: 0.85 }, o || {}),
    );

  const m = {
    pedra: M(0xcdc5ae),
    pedraE: M(0xb7ae94),
    branco: M(0xf2efe6),
    torre: M(0xe2dcc8),
    ferro: M(0x1d1d20, { metalness: 0.4, roughness: 0.6 }),
    madeira: M(0x5a3a22),
    vidro: M(0x233046, { roughness: 0.25 }),
    telha: M(0x8a8a84, { flatShading: true }),
    cinza: M(0xa9a7a0),
    pele: M(0x7a5238),
    dark: M(0x23262b),
    branca: M(0xffffff),
    tronco: M(0x7a6a52),
    folha: M(0x2f8a2e),
    folha2: M(0x3f9d36),
    verde: M(0x2f8a3a),
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

  const sm = (x: number) => x * x * (3 - 2 * x);

  bx(18, 0.6, 16, m.pedra, 0, -0.3, 0.5).material = [
    m.pedraE,
    m.pedraE,
    m.pedra,
    m.pedraE,
    m.pedraE,
    m.pedraE,
  ];
  bx(14, 0.6, 5.2, m.pedra, 0, 0.3, -0.9);
  bx(14.2, 0.1, 0.2, m.pedraE, 0, 0.62, 1.62);
  bx(14, 0.4, 0.6, m.pedra, 0, 0.2, 1.95);
  bx(14, 0.2, 0.6, m.pedra, 0, 0.1, 2.55);
  bx(14, 0.12, 0.6, m.pedra, 0, 0.06, 3.15);

  bx(9, 4.5, 3.2, m.branco, 0, 2.85, -3.4);
  bx(9.3, 0.2, 3.4, m.pedraE, 0, 5.2, -3.4);
  [-4.3, -2.1, 2.1, 4.3].forEach((x) =>
    bx(0.35, 4.5, 0.2, m.pedraE, x, 2.85, -1.75),
  );
  [-1, 1].forEach((s) => {
    const x = s * 3.6;
    bx(1.7, 6.8, 1.9, m.torre, x, 4, -3);
    bx(1.85, 0.2, 2.05, m.pedraE, x, 5.2, -3);
    bx(1.85, 0.2, 2.05, m.pedraE, x, 7.45, -3);
    cyl(0, 1.05, 0.9, m.telha, x, 7.9, -3, g, 4).rotation.y = PI / 4;
    bx(0.5, 0.8, 0.06, m.vidro, x, 6.4, -2.02);
    const a = new THREE.Mesh(
      new THREE.CircleGeometry(0.25, 12, 0, PI),
      m.vidro,
    );
    a.position.set(x, 6.8, -2.01);
    g.add(a);
  });

  const rel = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 24),
    M(0xf6f4ea),
  );
  rel.position.set(-3.6, 5.6, -2.03);
  g.add(rel);
  const pont = new THREE.Group();
  pont.position.set(-3.6, 5.6, -2.02);
  g.add(pont);
  bx(0.04, 0.32, 0.02, m.dark, 0, 0.14, 0, pont);
  const ph = new THREE.Group();
  ph.position.set(-3.6, 5.6, -2.02);
  g.add(ph);
  bx(0.05, 0.22, 0.02, m.dark, 0, 0.1, 0, ph).rotation.z = 0;
  const rd = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), m.vidro);
  rd.position.set(3.6, 5.6, -2.03);
  g.add(rd);

  const ps = new THREE.Shape();
  [
    [-2.2, 0],
    [2.2, 0],
    [1.6, 0.6],
    [0.9, 1],
    [0.5, 1.5],
    [0.2, 1.7],
    [0, 2.05],
    [-0.2, 1.7],
    [-0.5, 1.5],
    [-0.9, 1],
    [-1.6, 0.6],
  ].forEach((p, i) =>
    i ? ps.lineTo(p[0]!, p[1]!) : ps.moveTo(p[0]!, p[1]!),
  );
  ps.closePath();
  const fro = new THREE.Mesh(
    new THREE.ExtrudeGeometry(ps, { depth: 0.5, bevelEnabled: false }),
    m.pedraE,
  );
  fro.position.set(0, 5.3, -2.2);
  g.add(fro);
  bx(0.14, 0.8, 0.12, m.pedraE, 0, 8, -2);
  bx(0.45, 0.14, 0.12, m.pedraE, 0, 8.1, -2);
  const med = new THREE.Mesh(new THREE.CircleGeometry(0.35, 16), m.vidro);
  med.position.set(0, 6.3, -1.69);
  g.add(med);
  bx(1.3, 2, 0.1, m.madeira, 0, 1.6, -1.8);
  const pa = new THREE.Mesh(
    new THREE.CircleGeometry(0.65, 14, 0, PI),
    m.madeira,
  );
  pa.position.set(0, 2.6, -1.79);
  g.add(pa);
  [-2.9, 2.9].forEach((x) =>
    [1.5, 3.4].forEach((y) => {
      bx(0.5, 0.9, 0.06, m.vidro, x, y + 0.4, -1.78);
      const aa = new THREE.Mesh(
        new THREE.CircleGeometry(0.25, 12, 0, PI),
        m.vidro,
      );
      aa.position.set(x, y + 0.85, -1.77);
      g.add(aa);
    }),
  );
  bx(9.4, 0.18, 3.6, M(0x6f6a62, { flatShading: true }), 0, 5.4, -3.5);

  const FY = 0.62;
  const FZ = 1.5;
  [1.3, 0.65, 0.1].forEach((y) => bx(13.6, 0.08, 0.08, m.ferro, 0, FY + y, FZ));
  for (let x = -6.8; x <= 6.81; x += 0.3) {
    bx(0.04, 1.3, 0.04, m.ferro, x, FY + 0.65, FZ);
    cyl(0, 0.08, 0.2, m.ferro, x, FY + 1.42, FZ, g, 6);
    ball(0.04, m.ferro, x, FY + 1.54, FZ);
  }
  for (let x = -6.8; x <= 6.81; x += 2.27) {
    bx(0.14, 1.5, 0.14, m.ferro, x, FY + 0.75, FZ);
    cyl(0, 0.12, 0.3, m.ferro, x, FY + 1.65, FZ, g, 6);
  }
  [-6.8, 6.8].forEach((x) => {
    bx(0.08, 0.08, 3, m.ferro, x, FY + 1.3, FZ - 1.5);
    bx(0.08, 0.08, 3, m.ferro, x, FY + 0.3, FZ - 1.5);
  });

  const cores = [
    0xe63946, 0xf4a300, 0xffd60a, 0x06d6a0, 0x118ab2, 0x9b5de5, 0xf15bb5,
    0xffffff, 0x00bbf9, 0x8ac926, 0xff7b00, 0x3a86ff,
  ].map((c) => new THREE.Color(c));
  const NF = 420;
  const fx = new Float32Array(NF);
  const fz = new Float32Array(NF);
  const fL = new Float32Array(NF);
  const fph = new Float32Array(NF);
  const fg = new Float32Array(NF);
  const fa = new Float32Array(NF);
  const pos = new Float32Array(NF * 18);
  const col = new Float32Array(NF * 18);
  const idx = new Uint32Array(NF * 12);
  for (let i = 0; i < NF; i++) {
    fx[i] = -6.7 + rnd() * 13.4;
    fz[i] = FZ + (rnd() - 0.5) * 0.26;
    fL[i] = 0.5 + rnd() * 0.85;
    fph[i] = rnd() * 6.28;
    fg[i] = rnd() < 0.5 ? 1 : 0;
    fa[i] = fg[i]!;
    const c = cores[Math.floor(rnd() * 12)]!;
    for (let k = 0; k < 6; k++) {
      col[i * 18 + k * 3] = c.r;
      col[i * 18 + k * 3 + 1] = c.g;
      col[i * 18 + k * 3 + 2] = c.b;
    }
    const b = i * 6;
    idx.set(
      [b, b + 1, b + 2, b + 1, b + 3, b + 2, b + 2, b + 3, b + 4, b + 3, b + 5, b + 4],
      i * 12,
    );
  }
  const fgm = new THREE.BufferGeometry();
  fgm.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  fgm.setAttribute("color", new THREE.BufferAttribute(col, 3));
  fgm.setIndex(new THREE.BufferAttribute(idx, 1));
  const fita = new THREE.Mesh(
    fgm,
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    }),
  );
  fita.frustumCulled = true;
  fita.castShadow = false;
  fita.receiveShadow = false;
  g.add(fita);

  const atualizarFitas = (t: number) => {
    const top = FY + 1.32;
    for (let i = 0; i < NF; i++) {
      fg[i]! += (fa[i]! - fg[i]!) * 0.08;
      const len = fL[i]! * fg[i]!;
      const w = 0.016;
      const wind = Math.sin(t * 1.7 + fx[i]! * 0.4) * 0.5 + 0.5;
      for (let r = 0; r < 3; r++) {
        const tt = r / 2;
        const sw =
          tt * tt * (Math.sin(t * 2.6 + fph[i]! + tt * 2) * 0.06 + wind * 0.07);
        const zs = tt * (Math.sin(t * 2.1 + fph[i]! * 1.3) * 0.05 + 0.04);
        const y = top - tt * len;
        const o = i * 18 + r * 6;
        pos[o] = fx[i]! - w + sw;
        pos[o + 1] = y;
        pos[o + 2] = fz[i]! + zs;
        pos[o + 3] = fx[i]! + w + sw;
        pos[o + 4] = y;
        pos[o + 5] = fz[i]! + zs;
      }
    }
    fgm.attributes.position!.needsUpdate = true;
  };

  const acender = (x: number, k: number) => {
    const c: number[] = [];
    for (let i = 0; i < NF; i++) {
      if (!fa[i] && Math.abs(fx[i]! - x) < 1.3) c.push(i);
    }
    for (let n = 0; n < k && c.length; n++) {
      const j = Math.floor(rnd() * c.length);
      fa[c[j]!] = 1;
      c.splice(j, 1);
    }
  };

  const peles = [0x6b4a36, 0x8a5a3c, 0xc08a60, 0xf0c9a0, 0x5a3a28];
  const camisas = [
    0xe03030, 0x2e6ee0, 0xf2c230, 0x35b85a, 0xffffff, 0xe58aa5, 0x1a2a4a,
    0xff8a1e,
  ];

  const pessoa = (
    camisa: number,
    pele: number,
    calca: number,
  ): PessoaBase => {
    const o = new THREE.Group();
    const corpo = new THREE.Group();
    corpo.position.y = 0.55;
    o.add(corpo);
    const pv = (x: number, y: number, p: THREE.Object3D) => {
      const q = new THREE.Group();
      q.position.set(x, y, 0);
      p.add(q);
      return q;
    };
    const lE = pv(-0.08, 0.55, o);
    const lD = pv(0.08, 0.55, o);
    [lE, lD].forEach((l) => bx(0.12, 0.52, 0.12, M(calca), 0, -0.26, 0, l));
    bx(0.32, 0.42, 0.2, M(camisa), 0, 0.21, 0, corpo);
    const aE = pv(-0.2, 0.4, corpo);
    const aD = pv(0.2, 0.4, corpo);
    [aE, aD].forEach((a) => {
      bx(0.09, 0.4, 0.09, M(camisa), 0, -0.2, 0, a);
      ball(0.05, M(pele), 0, -0.42, 0, a);
    });
    ball(0.095, M(pele), 0, 0.55, 0, corpo);
    const cab = ball(0.1, M(0x1a1410), 0, 0.58, -0.01, corpo);
    cab.scale.y = 0.6;
    o.scale.setScalar(0.95);
    return { o, corpo, lE, lD, aE, aD, prev: 0 };
  };

  const spots = [-5.2, -3.3, -1.3, 0.9, 2.9, 4.9];
  const amarra: Amarrador[] = [];
  spots.forEach((x, i) => {
    const p = pessoa(
      camisas[i % 8]!,
      peles[i % 5]!,
      [0x2e4a7a, 0xc9b27a, 0x23262b][i % 3]!,
    ) as Amarrador;
    p.o.position.set(x, 0.4, 2.0);
    p.o.rotation.y = PI;
    g.add(p.o);
    p.x = x;
    p.off = i * 1.7;
    p.fez = false;
    amarra.push(p);
  });

  const passeio: Passeante[] = [0, 1, 2].map((i) => {
    const p = pessoa(
      camisas[(i + 3) % 8]!,
      peles[(i + 2) % 5]!,
      0x23262b,
    ) as Passeante;
    g.add(p.o);
    p.x = -6 + i * 4;
    p.dir = i % 2 ? 1 : -1;
    p.v = 0.4 + i * 0.12;
    return p;
  });

  const barraca = new THREE.Group();
  barraca.position.set(7.2, 0, 3.9);
  g.add(barraca);
  bx(1.8, 0.6, 0.8, m.madeira, 0, 0.3, 0, barraca);
  [-0.85, 0.85].forEach((x) =>
    bx(0.06, 2, 0.06, m.madeira, x, 1, -0.3, barraca),
  );
  bx(2, 0.05, 1.1, M(0x2f66b8), 0, 2.05, -0.1, barraca).rotation.x = 0.12;
  for (let i = 0; i < 46; i++) {
    const c = cores[i % 12]!;
    bx(
      0.035,
      0.5 + rnd() * 0.35,
      0.01,
      M(c.getHex()),
      -0.8 + i * 0.035,
      1.6,
      -0.28,
      barraca,
    );
  }
  const vend = pessoa(0xffffff, 0x6b4a36, 0xffffff);
  vend.o.position.set(0, 0, -0.7);
  barraca.add(vend.o);
  const tb = ball(0.12, m.branca, 0, 1.1, -0.7, barraca);
  tb.scale.y = 0.7;

  const fmat = [0xffd60a, 0xff7bd0, 0x7be0ff, 0xa0ff7b].map(
    (c) =>
      new THREE.MeshBasicMaterial({
        color: c,
        transparent: true,
      }),
  );
  const fq: Faisca[] = [];
  for (let i = 0; i < 36; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 6),
      fmat[i % 4]!.clone(),
    );
    s.visible = false;
    g.add(s);
    fq.push({ s, l: 0, vy: 0 });
  }
  const faisca = (x: number, y: number, z: number) => {
    const f = fq.find((q) => !q.s.visible);
    if (!f) return;
    f.s.position.set(
      x + (rnd() - 0.5) * 0.2,
      y,
      z + (rnd() - 0.5) * 0.2,
    );
    f.l = 2;
    f.vy = 0.5 + rnd() * 0.5;
    f.s.visible = true;
  };

  let t = 0;
  let vai = true;
  let forca = 0;

  g.userData.alternarVida = () => {
    vai = !vai;
  };
  g.userData.amarrar = (n) => {
    acender(-6 + rnd() * 12, n || 8);
  };
  g.userData.pedidos = () => {
    forca = 3.2;
    amarra.forEach((p) => {
      acender(p.x, 6);
      for (let k = 0; k < 3; k++) faisca(p.x, 1.65, 2.0);
    });
  };
  g.userData.limpar = () => {
    for (let i = 0; i < NF; i++) fa[i] = i % 5 === 0 ? 1 : 0;
  };
  g.userData.encher = () => {
    for (let i = 0; i < NF; i++) fa[i] = 1;
  };
  g.userData.tick = (dt) => {
    t += dt;
    atualizarFitas(t);
    if (!vai) return;
    forca = Math.max(0, forca - dt);
    pont.rotation.z = -t * 0.3;
    ph.rotation.z = -t * 0.03;
    amarra.forEach((p) => {
      const T = 9;
      const c = (t + p.off) % T;
      let tie = 0;
      let wish = 0;
      if (forca > 0) {
        wish = 1;
      } else if (c < 4.5) {
        tie = sm(Math.min(1, c / 0.5));
        p.fez = false;
      } else if (c < 5.2) {
        tie = 1 - sm((c - 4.5) / 0.7);
        if (!p.fez) {
          p.fez = true;
          acender(p.x, 4);
        }
      } else if (c < 8.2) {
        wish = sm(Math.min(1, (c - 5.2) / 0.5));
        if (Math.random() < dt * 2.4) faisca(p.x, 1.6, 2.0);
      } else {
        wish = 1 - sm((c - 8.2) / 0.8);
        tie = 0;
      }
      const wig = Math.sin(t * 14 + p.off) * 0.12 * tie;
      p.corpo.rotation.x = 0.95 * tie - 0.12 * wish;
      p.aE.rotation.x = -1.25 * tie - 1.0 * wish + wig;
      p.aD.rotation.x = -1.25 * tie - 1.0 * wish - wig;
      p.aE.rotation.z = 0.6 * wish;
      p.aD.rotation.z = -0.6 * wish;
      p.lE.rotation.x = -0.15 * tie;
      p.lD.rotation.x = -0.15 * tie;
    });
    passeio.forEach((p) => {
      p.x += p.dir * p.v * dt;
      if (p.x > 7) p.dir = -1;
      if (p.x < -7) p.dir = 1;
      p.o.position.set(p.x, 0.06, 3.9 + Math.sin(p.x) * 0.15);
      p.o.rotation.y = p.dir > 0 ? PI / 2 : -PI / 2;
      const sw = Math.sin(t * 8 + p.x) * 0.6;
      p.lE.rotation.x = sw;
      p.lD.rotation.x = -sw;
      p.aE.rotation.x = -sw * 0.6;
      p.aD.rotation.x = sw * 0.6;
      p.o.position.y += Math.abs(sw) * 0.015;
    });
    fq.forEach((f) => {
      if (!f.s.visible) return;
      f.l -= dt;
      f.s.position.y += f.vy * dt;
      const mat = f.s.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, f.l / 2);
      f.s.scale.setScalar(0.6 + 0.6 * Math.sin(f.l * 6));
      if (f.l <= 0) f.s.visible = false;
    });
  };

  atualizarFitas(0);
  return g;
}
