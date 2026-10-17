import * as THREE from "three";

export type FeiraSaoJoaquimGroup = THREE.Group & {
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
  d?: number;
  simples?: THREE.Group;
  melhor?: THREE.Group;
  gh?: THREE.Group;
};

type Pessoa = {
  x: number;
  z: number;
  vz: number;
  praca: boolean;
  ph: number;
};

export function criarFeiraSaoJoaquim(): FeiraSaoJoaquimGroup {
  const g = new THREE.Group() as FeiraSaoJoaquimGroup;
  g.name = "FeiraSaoJoaquim";
  const PI = Math.PI;
  let sd = 31;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  const M = (c: number | THREE.Color, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(
      Object.assign({ color: c, roughness: 0.85 }, o || {}),
    );

  const m = {
    dirt: M(0x8a7a62),
    conc: M(0x9c968a),
    verde: M(0x2f7a3a),
    verdeC: M(0x2f8a3a),
    madeira: M(0x6b4f35),
    branco: M(0xf4f2ea),
    preto: M(0x22242a),
    cesta: M(0xc8a05a),
    seca: M(0x8a5a3a),
    lamp: M(0xffe2a0, { emissive: 0xffc860, emissiveIntensity: 0.9 }),
    vidro: M(0xe9f4f4, {
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.2,
    }),
    metal: M(0x4a5a50, { metalness: 0.3, roughness: 0.6 }),
    aco: M(0x7d8186, { metalness: 0.5, roughness: 0.4 }),
    amarelo: M(0xf2c230),
    creme: M(0xf0e2bc),
    pele: M(0x7a5238),
    folha: M(0x2f8a2e),
    folha2: M(0x3f9d36),
    tronco: M(0x7a6a52),
    vaso: M(0x9a5a3a),
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

  const placa = (
    txt: string,
    w: number,
    h: number,
    fundo: string,
    cor: string,
    px: number,
  ) =>
    new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        map: tex(512, Math.round((512 * h) / w), (c, W, H) => {
          c.fillStyle = fundo;
          c.fillRect(0, 0, W, H);
          if (fundo === "#f2c230") {
            for (let i = 0; i < 46; i++) {
              c.fillStyle = ["#2fa04a", "#d23a2a", "#f08a24", "#8a4a8a", "#fff"][
                i % 5
              ]!;
              c.beginPath();
              c.arc(rnd() * W, rnd() * H, 5 + rnd() * 6, 0, 7);
              c.fill();
            }
          }
          c.fillStyle = cor;
          c.font = "bold " + px + "px Arial,sans-serif";
          c.textAlign = "center";
          c.textBaseline = "middle";
          if (fundo === "#f2c230") {
            c.fillStyle = "#f2c230";
            c.fillRect(70, H * 0.22, W - 140, H * 0.56);
            c.fillStyle = cor;
          }
          c.fillText(txt, W / 2, H / 2 + 2);
        }),
      }),
    );

  const base = bx(16, 0.6, 19, m.dirt, 0, -0.3, 1.5);
  base.material = [m.dirt, m.dirt, m.conc, m.dirt, m.dirt, m.dirt];

  const itens: ItemAnim[] = [];
  const barracas: ItemAnim[] = [];
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

  const mosaico = tex(
    128,
    128,
    (c, W, H) => {
      c.fillStyle = "#6a6862";
      c.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i++) {
        c.fillStyle =
          "hsl(" +
          (25 + rnd() * 20) +
          ",12%," +
          (35 + rnd() * 38) +
          "%)";
        c.beginPath();
        const x = rnd() * W;
        const y = rnd() * H;
        c.moveTo(x, y);
        c.lineTo(x + 8 + rnd() * 14, y + rnd() * 8);
        c.lineTo(x + rnd() * 12, y + 8 + rnd() * 14);
        c.closePath();
        c.fill();
      }
    },
    5,
    9,
  );
  const piso = new THREE.Group();
  const pm = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 15),
    new THREE.MeshStandardMaterial({ map: mosaico, roughness: 0.95 }),
  );
  pm.rotation.x = -PI / 2;
  pm.position.set(0, 0.02, 0);
  piso.add(pm);
  const pit = novo(piso, 0, 0, 0.5);

  const cvs = [0x2a62c4, 0xf2c230, 0xf4f2ea, 0xd23a2a, 0x2fa04a];
  const barraca = (x: number, z: number, lado: number, ord: number) => {
    const gh = new THREE.Group();
    const tipo = Math.floor(rnd() * 4);
    bx(1.3, 0.45, 0.65, m.verde, 0, 0.22, 0.1, gh);
    [-0.62, 0.62].forEach((s) =>
      bx(0.05, 1.9, 0.05, m.madeira, s, 0.95, -0.35, gh),
    );
    if (tipo === 0) {
      [0xf08a24, 0xf2d23a, 0x4aa34a, 0xd23a2a, 0x8a4a2a, 0xf08a24].forEach(
        (c, i) => {
          const r = 0.1 + rnd() * 0.05;
          ball(
            r,
            M(c),
            -0.5 + i * 0.2,
            0.45 + r * 0.7,
            0.1 + (i % 2 ? 0.12 : -0.1),
            gh,
          );
        },
      );
      bx(0.4, 0.2, 0.3, m.preto, 0.45, 0.55, 0.2, gh);
    } else if (tipo === 1) {
      bx(1.25, 0.03, 0.03, m.madeira, 0, 1.55, 0.1, gh);
      for (let i = 0; i < 5; i++) {
        cyl(
          0.14,
          0.12,
          0.2,
          m.cesta,
          -0.5 + i * 0.25,
          1.35 - (i % 2) * 0.15,
          0.1,
          gh,
          10,
        );
      }
      bx(0.4, 0.25, 0.4, m.cesta, 0.4, 0.6, 0.1, gh);
    } else if (tipo === 2) {
      [0xc79a4a, 0x3a2a1a, 0xe8d27a, 0xb06a3a].forEach((c, i) => {
        cyl(0.2, 0.22, 0.3, m.branco, -0.45 + i * 0.3, 0.15, 0.5, gh, 10);
        cyl(0.17, 0.17, 0.02, M(c), -0.45 + i * 0.3, 0.31, 0.5, gh, 10);
      });
    } else {
      bx(1.25, 0.03, 0.03, m.madeira, 0, 1.5, 0.1, gh);
      for (let i = 0; i < 6; i++) {
        bx(0.07, 0.35, 0.05, m.seca, -0.5 + i * 0.2, 1.3, 0.1, gh);
      }
      bx(0.6, 0.04, 0.3, m.branco, 0, 0.5, 0.15, gh);
    }
    const simples = new THREE.Group();
    gh.add(simples);
    if (rnd() < 0.5) {
      const t = bx(
        1.5,
        0.03,
        1.1,
        M(cvs[Math.floor(rnd() * 5)]!),
        0,
        1.9,
        0.1,
        simples,
      );
      t.rotation.x = 0.15;
    } else {
      cyl(0.02, 0.02, 1.9, m.madeira, 0.6, 0.95, 0.4, simples, 6);
      cyl(
        0,
        0.8,
        0.25,
        M(cvs[Math.floor(rnd() * 5)]!),
        0.2,
        2,
        0.3,
        simples,
        10,
      );
    }
    const melhor = new THREE.Group();
    gh.add(melhor);
    bx(1.5, 0.06, 1.15, m.verdeC, 0, 1.95, 0.05, melhor);
    bx(1.52, 0.03, 1.17, m.branco, 0, 1.91, 0.05, melhor);
    bx(1.3, 0.22, 0.05, m.amarelo, 0, 1.75, 0.62, melhor);
    ball(0.05, m.lamp, 0, 1.6, 0.62, melhor);
    bx(1.3, 0.1, 0.05, m.verdeC, 0, 0.5, 0.45, melhor);
    melhor.visible = false;
    gh.rotation.y = lado < 0 ? PI / 2 : -PI / 2;
    const it = novo(gh, x, 0, z);
    it.ord = ord;
    it.simples = simples;
    it.melhor = melhor;
    it.gh = gh;
    barracas.push(it);
  };
  [-1, 1].forEach((lado) =>
    [2.3, 4.2].forEach((row) => {
      for (let k = 0; k < 8; k++) barraca(lado * row, -5.2 + k * 1.5, lado, rnd());
    }),
  );
  barracas.sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));
  barracas.forEach((it, i) => {
    it.ord = i / barracas.length;
  });

  const foraItem = (x: number, z: number) => {
    const gf = new THREE.Group();
    const t = Math.floor(rnd() * 3);
    if (t === 0) {
      [0, 1, 2].forEach((i) =>
        cyl(0.2, 0.22, 0.3, m.branco, i * 0.4 - 0.4, 0.15, (i % 2) * 0.2, gf, 10),
      );
    } else if (t === 1) {
      for (let i = 0; i < 4; i++) {
        cyl(
          0.18,
          0.14,
          0.22,
          m.cesta,
          (i % 2) * 0.3 - 0.15,
          0.11 + (i > 1 ? 0.2 : 0),
          0,
          gf,
          10,
        );
      }
    } else {
      bx(0.8, 0.1, 0.5, m.madeira, 0, 0.45, 0, gf);
      [-0.3, 0.3].forEach((s) => {
        const w = cyl(0.2, 0.2, 0.06, m.preto, s, 0.2, 0.3, gf, 12);
        w.rotation.x = PI / 2;
      });
      [0xf08a24, 0x4aa34a, 0xd23a2a].forEach((c, i) =>
        ball(0.12, M(c), -0.25 + i * 0.25, 0.6, 0, gf),
      );
    }
    const it = novo(gf, x, 0, z);
    it.ord = rnd();
    fora.push(it);
  };
  for (let i = 0; i < 22; i++) {
    const side = i % 2 ? 1 : -1;
    foraItem(side * (5.3 + rnd() * 1.8), -6 + rnd() * 14);
  }
  fora.sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));
  fora.forEach((it, i) => {
    it.ord = i / fora.length;
  });
  (
    [
      [-5.8, 6.5, 0x2a62c4],
      [5.9, 7, 0xf2c230],
      [-6.5, 3, 0xd23a2a],
      [6.5, 2.5, 0x2a62c4],
    ] as const
  ).forEach((p) => {
    const u = new THREE.Group();
    cyl(0.03, 0.03, 2, m.aco, 0, 1, 0, u, 6);
    cyl(0, 1, 0.3, M(p[2]), 0, 2.1, 0, u, 12);
    bx(1.1, 0.45, 0.7, m.verde, 0, 0.22, 0.3, u);
    const it = novo(u, p[0], 0, p[1]);
    it.ord = 0.9;
    fora.push(it);
  });

  const cob = new THREE.Group();
  const aba = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 13.4, 22, 1, true, -PI / 2, PI),
    m.vidro,
  );
  aba.rotation.x = -PI / 2;
  aba.position.set(0, 3.1, 0);
  cob.add(aba);
  [-1, 1].forEach((s) => {
    const t = bx(3.4, 0.07, 13.4, m.metal, s * 3.5, 2.95, 0, cob);
    t.rotation.z = -s * 0.17;
    for (let z = -6; z <= 6.1; z += 3) {
      cyl(0.05, 0.05, 3.1, m.aco, s * 1.8, 1.55, z, cob, 8);
      cyl(0.05, 0.05, 2.5, m.aco, s * 5, 1.25, z, cob, 8);
    }
  });
  for (let z = -6; z <= 6.1; z += 3) {
    const arco = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.025, 6, 20, PI),
      m.aco,
    );
    arco.position.set(0, 3.1, z);
    cob.add(arco);
  }
  const cobit = novo(cob, 0, 0, 0);
  cobit.d = 0.2;

  const band = new THREE.Group();
  const tri = new THREE.Shape();
  tri.moveTo(-0.1, 0);
  tri.lineTo(0.1, 0);
  tri.lineTo(0, -0.24);
  const triG = new THREE.ShapeGeometry(tri);
  const bc = [
    M(0x2fa04a, { side: THREE.DoubleSide }),
    M(0xf2c230, { side: THREE.DoubleSide }),
  ];
  const flags: { f: THREE.Mesh; ph: number }[] = [];
  [-4.5, -1.5, 1.5, 4.5].forEach((z, li) => {
    for (let k = 1; k < 20; k++) {
      const s = k / 20;
      const f = new THREE.Mesh(triG, bc[(k + li) % 2]!);
      f.position.set(-4.8 + 9.6 * s, 2.75 - 0.45 * 4 * s * (1 - s), z);
      band.add(f);
      flags.push({ f, ph: k + li * 2 });
    }
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 8; k++) {
      const s = k / 8;
      pts.push(
        new THREE.Vector3(-4.8 + 9.6 * s, 2.75 - 0.45 * 4 * s * (1 - s), z),
      );
    }
    band.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.01, 4),
        m.preto,
      ),
    );
  });
  const bandit = novo(band, 0, 0, 0);
  bandit.d = 0.3;

  const lan = new THREE.Group();
  for (let z = -5; z <= 5.1; z += 1.25) {
    [-1.2, 0, 1.2].forEach((x) => {
      cyl(0.005, 0.005, 0.5, m.preto, x, 3.05, z, lan, 4);
      ball(0.1, m.lamp, x, 2.7, z, lan);
    });
  }
  const lanit = novo(lan, 0, 0, 0);
  lanit.d = 0.6;

  const sg = new THREE.Group();
  [-2.6, 2.6].forEach((x) => cyl(0.07, 0.07, 3.4, m.aco, x, 1.7, 0, sg, 8));
  const sp = placa("FEIRA DE SÃO JOAQUIM", 5, 1, "#f2c230", "#3a2a10", 44);
  sp.position.set(0, 3.1, 0.06);
  sg.add(sp);
  bx(5.3, 1.2, 0.08, m.verde, 0, 3.1, 0, sg);
  const sit = novo(sg, 0, 0, 7.4);

  const lote = new THREE.Group();
  for (let x = -7.8; x <= 7.9; x += 1.6) {
    bx(0.08, 0.9, 0.08, m.madeira, x, 0.45, 10.4, lote);
    bx(0.08, 0.9, 0.08, m.madeira, x, 0.45, -7.4, lote);
  }
  for (let z = -7.4; z <= 10.5; z += 1.6) {
    bx(0.08, 0.9, 0.08, m.madeira, -7.8, 0.45, z, lote);
    bx(0.08, 0.9, 0.08, m.madeira, 7.8, 0.45, z, lote);
  }
  bx(15.6, 0.03, 0.03, m.aco, 0, 0.8, 10.4, lote);
  bx(15.6, 0.03, 0.03, m.aco, 0, 0.8, -7.4, lote);
  bx(0.03, 0.03, 17.8, m.aco, -7.8, 0.8, 1.5, lote);
  bx(0.03, 0.03, 17.8, m.aco, 7.8, 0.8, 1.5, lote);
  (
    [
      [-2, 3],
      [2, -2],
      [0, 6],
      [-3, -4],
    ] as const
  ).forEach((p) => {
    cyl(0.02, 0.02, 0.7, m.madeira, p[0], 0.35, p[1], lote, 6);
    bx(0.2, 0.1, 0.02, M(0xd23a2a), p[0], 0.7, p[1], lote);
  });
  const loteit = novo(lote, 0, 0, 0);

  const rest = new THREE.Group();
  bx(3.6, 1.9, 2.4, m.creme, 0, 0.95, 0, rest);
  hip(0.1, 1.9, 0.7, m.verdeC, 0, 2.25, 0, 1.3, 0.85, rest);
  bx(3.6, 0.08, 1.2, m.verdeC, 0, 1.55, 1.6, rest).rotation.x = 0.2;
  const pr = placa("RESTAURANTE DA FEIRA", 2.8, 0.4, "#2f7a3a", "#ffffff", 36);
  pr.position.set(0, 1.3, 1.22);
  rest.add(pr);
  [-1, 0, 1].forEach((i) => {
    bx(0.5, 0.7, 0.05, m.vidro, i * 1.1, 0.7, 1.22, rest);
  });
  (
    [
      [-1.4, 2.6],
      [0, 2.9],
      [1.4, 2.6],
    ] as const
  ).forEach((p, i) => {
    bx(0.7, 0.05, 0.7, m.madeira, p[0], 0.5, p[1], rest);
    cyl(0.03, 0.03, 0.5, m.madeira, p[0], 0.25, p[1], rest, 6);
    (
      [
        [-0.5, 0],
        [0.5, 0],
      ] as const
    ).forEach((d) =>
      bx(0.3, 0.05, 0.3, m.verde, p[0] + d[0], 0.3, p[1] + d[1], rest),
    );
    cyl(0.02, 0.02, 1.4, m.aco, p[0], 0.7, p[1], rest, 6);
    cyl(
      0,
      0.7,
      0.2,
      M([0xd23a2a, 0xf2c230, 0x2a62c4][i]!),
      p[0],
      1.5,
      p[1],
      rest,
      10,
    );
  });
  const restit = novo(rest, -5.6, 0, 9);
  restit.d = 0.2;

  const jar = new THREE.Group();
  [-1, 1].forEach((s) =>
    [-5.8, -2.2, 1.4, 5].forEach((z) => {
      bx(0.7, 0.35, 0.5, m.vaso, s * 1.5, 0.18, z, jar);
      for (let i = 0; i < 5; i++) {
        ball(
          0.1,
          M([0xe03a6a, 0xf2c230, 0xffffff, 0xe07a2a, 0x8a4ac0][i]!),
          s * 1.5 - 0.25 + i * 0.12,
          0.45 + (i % 2) * 0.06,
          z + (i % 2 ? 0.1 : -0.1),
          jar,
        );
      }
    }),
  );
  const jarit = novo(jar, 0, 0, 0);
  jarit.d = 0.8;

  const palma = (x: number, z: number, h: number) => {
    const p = new THREE.Group();
    p.position.set(x, 0, z);
    g.add(p);
    bx(0.12, h, 0.12, m.tronco, 0, h / 2, 0, p);
    for (let i = 0; i < 8; i++) {
      const yw = new THREE.Group();
      yw.position.y = h;
      yw.rotation.y = (i * PI) / 4;
      p.add(yw);
      const tl = new THREE.Group();
      tl.rotation.z = -0.3 - (i % 2) * 0.25;
      yw.add(tl);
      bx(0.9, 0.02, 0.16, i % 2 ? m.folha : m.folha2, 0.45, 0, 0, tl);
    }
  };
  (
    [
      [-7.2, 9.5, 2.4],
      [7.2, 9.2, 2.2],
      [-7.3, -7, 2.2],
      [7.3, -6.8, 2.4],
    ] as const
  ).forEach((p) => palma(p[0], p[1], p[2]));

  const disco = tex(32, 32, (c) => {
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(16, 16, 15, 0, 7);
    c.fill();
  });
  const N = 90;
  const hp = new Float32Array(N * 3);
  const tp = new Float32Array(N * 3);
  const hc = new Float32Array(N * 3);
  const tc = new Float32Array(N * 3);
  const gente: Pessoa[] = [];
  const col = new THREE.Color();
  const pele = [0x6b4a36, 0x8a5a3c, 0xc08a60, 0xf0c9a0];
  const rou = [
    0xffffff, 0x2fa04a, 0xf2c230, 0xd23a2a, 0x2a62c4, 0xe58aa5, 0xff8a1e,
    0x222222,
  ];
  for (let i = 0; i < N; i++) {
    const praca = i % 4 === 0;
    gente.push({
      x: praca ? -5 + rnd() * 10 : -1.4 + rnd() * 2.8,
      z: praca ? 7 + rnd() * 3 : -6 + rnd() * 12,
      vz: (rnd() < 0.5 ? -1 : 1) * (0.25 + rnd() * 0.35),
      praca,
      ph: rnd() * 6,
    });
    col.setHex(pele[Math.floor(rnd() * 4)]!);
    hc.set([col.r, col.g, col.b], i * 3);
    col.setHex(rou[Math.floor(rnd() * rou.length)]!);
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
    o.geometry.setDrawRange(0, 0);
    g.add(o);
    return o;
  };
  const pH = pts(hp, hc, 0.17);
  const pT = pts(tp, tc, 0.26);

  const FB = [0, 0.2, 0.45, 0.75, 1.001, 1.001];
  const FF = [0, 0, 0, 0.6, 1.001, 1.001];
  const K = [0, 8, 20, 36, 54, 80];
  let nivel = 0;
  let t = 0;
  let vai = true;

  const aplicar = () => {
    barracas.forEach((it) => {
      it.alvoNovo = (it.ord ?? 0) < FB[nivel]! ? 1 : 0;
      it.atraso = rnd() * 0.8;
      if (it.melhor) it.melhor.visible = nivel >= 4;
      if (it.simples) it.simples.visible = nivel < 4;
    });
    fora.forEach((it) => {
      it.alvoNovo = (it.ord ?? 0) < FF[nivel]! ? 1 : 0;
      it.atraso = rnd() * 0.7;
    });
    const on = (it: ItemAnim, v: boolean, d?: number) => {
      it.alvoNovo = v ? 1 : 0;
      if (d !== undefined) it.atraso = d;
    };
    on(pit, nivel >= 4, 0.2);
    on(cobit, nivel >= 4, 0.2);
    on(bandit, nivel >= 2, 0.3);
    on(lanit, nivel === 5, 0.6);
    on(sit, nivel >= 1, 0.1);
    on(loteit, nivel === 0, 0);
    on(restit, nivel === 5, 0.2);
    on(jarit, nivel === 5, 0.8);
    pH.geometry.setDrawRange(0, K[nivel]!);
    pT.geometry.setDrawRange(0, K[nivel]!);
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
      it.g.position.y = it.y + (1 - Math.min(1, s)) * 1.6;
    });
    if (!vai) return;
    t += dt;
    flags.forEach((f) => {
      f.f.rotation.z = 0.25 * Math.sin(t * 2.2 + f.ph);
      f.f.rotation.y = 0.2 * Math.sin(t * 1.6 + f.ph * 0.7);
    });
    const ha = pH.geometry.attributes.position as THREE.BufferAttribute;
    const ta = pT.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < K[nivel]!; i++) {
      const p = gente[i]!;
      p.z += p.vz * dt;
      if (!p.praca) {
        if (p.z > 6.2) {
          p.z = 6.2;
          p.vz *= -1;
        }
        if (p.z < -6.2) {
          p.z = -6.2;
          p.vz *= -1;
        }
      } else {
        p.x += Math.sin(t * 0.3 + p.ph) * dt * 0.3;
        if (p.z > 10) {
          p.z = 10;
          p.vz *= -1;
        }
        if (p.z < 6.6) {
          p.z = 6.6;
          p.vz *= -1;
        }
      }
      const b = Math.abs(Math.sin(t * 5 + p.ph)) * 0.03;
      (ha.array as Float32Array)[i * 3] = p.x;
      (ha.array as Float32Array)[i * 3 + 1] = 0.82 + b;
      (ha.array as Float32Array)[i * 3 + 2] = p.z;
      (ta.array as Float32Array)[i * 3] = p.x;
      (ta.array as Float32Array)[i * 3 + 1] = 0.46 + b * 0.6;
      (ta.array as Float32Array)[i * 3 + 2] = p.z;
    }
    ha.needsUpdate = true;
    ta.needsUpdate = true;
  };

  return g;
}
