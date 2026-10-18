import * as THREE from "three";

export type LencoisGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    definirNivel: (n: number) => number;
    nivel: () => number;
    alternarVida: () => boolean;
    alternarNomes: () => boolean;
    base: THREE.Group;
  };
};

type ItemAnim = {
  g: THREE.Group;
  y: number;
  min: number;
  max: number;
  s: number;
  v: number;
  alvo: number;
  alvoNovo: number;
  atraso: number;
};

type Bruma = { b: THREE.Mesh; i: number };

export function criarLencois(): LencoisGroup {
  const g = new THREE.Group() as LencoisGroup;
  g.name = "Lencois";
  const PI = Math.PI;
  let sd = 17;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  const C: Record<string, THREE.MeshStandardMaterial> = {};
  const mt = (c: number, o?: THREE.MeshStandardMaterialParameters) => {
    const k = c + JSON.stringify(o || 0);
    return (
      C[k] ||
      (C[k] = new THREE.MeshStandardMaterial(
        Object.assign({ color: c, flatShading: true, roughness: 0.8 }, o),
      ))
    );
  };
  const MA = (c: number | THREE.Material) =>
    typeof c === "number" ? mt(c) : c;

  let cur: THREE.Object3D = g;
  const put = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number) => {
    o.position.set(x, y, z);
    cur.add(o);
    return o;
  };

  const bx = (
    w: number,
    h: number,
    d: number,
    c: number | THREE.Material | THREE.Material[],
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const q = new THREE.BoxGeometry(w, h, d);
    q.translate(0, h / 2, 0);
    return put(
      new THREE.Mesh(q, Array.isArray(c) ? c : MA(c)),
      x,
      y,
      z,
    );
  };

  const cy = (
    r1: number,
    r2: number,
    h: number,
    c: number,
    x = 0,
    y = 0,
    z = 0,
    s = 10,
  ) => {
    const q = new THREE.CylinderGeometry(r1, r2, h, s);
    q.translate(0, h / 2, 0);
    return put(new THREE.Mesh(q, mt(c)), x, y, z);
  };

  const co = (
    r: number,
    h: number,
    c: number,
    x: number,
    y: number,
    z: number,
    s = 4,
  ) => cy(0, r, h, c, x, y, z, s);

  const sp = (
    r: number,
    c: number | THREE.Material,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
  ) => {
    const o = put(
      new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), MA(c)),
      x,
      y,
      z,
    );
    o.scale.set(sx, sy, sz);
    return o;
  };

  const dome = (
    r: number,
    sy: number,
    c: number,
    x: number,
    y: number,
    z: number,
  ) => {
    const o = put(
      new THREE.Mesh(
        new THREE.SphereGeometry(r, 14, 8, 0, PI * 2, 0, PI / 2),
        mt(c),
      ),
      x,
      y,
      z,
    );
    o.scale.y = sy;
    return o;
  };

  const rf = (
    w: number,
    h: number,
    d: number,
    c: number,
    x = 0,
    y = 0,
    z = 0,
    ry = 0,
  ) => {
    const q = new THREE.ExtrudeGeometry(
      new THREE.Shape([
        new THREE.Vector2(-w / 2, 0),
        new THREE.Vector2(w / 2, 0),
        new THREE.Vector2(0, h),
      ]),
      { depth: d, bevelEnabled: false },
    );
    q.translate(0, 0, -d / 2);
    const o = put(new THREE.Mesh(q, mt(c)), x, y, z);
    o.rotation.y = ry;
    return o;
  };

  const tex = (
    w: number,
    h: number,
    fn: (c: CanvasRenderingContext2D, W: number, H: number) => void,
    rx = 1,
    ry = 1,
  ) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    fn(c.getContext("2d")!, w, h);
    const q = new THREE.CanvasTexture(c);
    q.wrapS = q.wrapT = THREE.RepeatWrapping;
    q.repeat.set(rx, ry);
    return q;
  };

  const lamp = new THREE.MeshStandardMaterial({
    color: 0xffe2a0,
    emissive: 0xffc860,
    emissiveIntensity: 0.5,
  });

  const itens: ItemAnim[] = [];
  const an: Array<(tt: number) => void> = [];
  const nomes: THREE.Sprite[] = [];
  const sway: THREE.Group[] = [];
  const bruma: Bruma[] = [];
  let nivel = 0;
  let t = 0;
  let vai = true;
  let mostrarNomes = true;
  let noite = 0;

  function item(
    min: number,
    max: number,
    x: number,
    z: number,
    fn: () => void,
    ry = 0,
    y = 0.4,
  ) {
    const h = new THREE.Group();
    h.position.set(x, y, z);
    h.rotation.y = ry;
    cur = h;
    fn();
    h.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = o.receiveShadow = true;
      }
    });
    h.scale.setScalar(0.001);
    h.visible = false;
    g.add(h);
    cur = g;
    const it: ItemAnim = {
      g: h,
      y,
      min,
      max,
      s: 0,
      v: 0,
      alvo: 0,
      alvoNovo: 0,
      atraso: 0,
    };
    itens.push(it);
    return it;
  }

  function placa(txt: string, y: number, x = 0, z = 0) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 88;
    const a = c.getContext("2d")!;
    a.fillStyle = "rgba(15,25,35,.86)";
    a.beginPath();
    if (typeof a.roundRect === "function") a.roundRect(0, 0, 512, 88, 40);
    else a.rect(0, 0, 512, 88);
    a.fill();
    a.fillStyle = "#fff";
    a.font = "600 34px system-ui,sans-serif";
    a.textAlign = "center";
    a.textBaseline = "middle";
    a.fillText(txt, 256, 46);
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(c),
        depthTest: false,
        transparent: true,
      }),
    );
    s.scale.set(2.5, 0.43, 1);
    s.position.set(x, y, z);
    s.renderOrder = 9;
    cur.add(s);
    nomes.push(s);
  }

  const base = new THREE.Group();
  g.add(base);
  g.userData.base = base;
  cur = base;
  put(new THREE.Mesh(new THREE.CylinderGeometry(11.3, 11.6, 0.5, 64), mt(0x3b2a1e)), 0, -0.25, 0);
  put(
    new THREE.Mesh(
      new THREE.TorusGeometry(11.35, 0.12, 8, 64),
      mt(0xd4a72c, { metalness: 0.5, roughness: 0.4 }),
    ),
    0,
    0,
    0,
  ).rotation.x = PI / 2;
  cur = g;
  const chao = put(
    new THREE.Mesh(new THREE.CylinderGeometry(10.9, 10.9, 0.4, 64), mt(0xa8b060)),
    0,
    0.2,
    0,
  );
  chao.receiveShadow = true;
  (
    [
      [-4, -6, 2, 0xc9a46a],
      [6, 5.5, 1.6, 0xd8b87a],
      [-2, 6, 1.4, 0xb8c070],
    ] as const
  ).forEach(([x, z, r, c]) => {
    const m = cy(r, r, 0.02, c, x, 0.4, z, 14);
    m.scale.z = 0.7;
  });

  function fita(pts: [number, number][], w: number) {
    const c = new THREE.CatmullRomCurve3(
      pts.map((p) => new THREE.Vector3(p[0], 0, p[1])),
    );
    const n = 60;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const p = c.getPoint(u);
      const tg = c.getTangent(u);
      const ww = w * (0.8 + 0.5 * u);
      pos.push(
        p.x - tg.z * ww,
        0,
        p.z + tg.x * ww,
        p.x + tg.z * ww,
        0,
        p.z - tg.x * ww,
      );
      uv.push(u * 14, 0, u * 14, 1);
      if (i < n) {
        const a = i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const q = new THREE.BufferGeometry();
    q.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    q.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    q.setIndex(idx);
    q.computeVertexNormals();
    return q;
  }

  const aguaTex = tex(128, 32, (c, W, H) => {
    c.fillStyle = "#2e9fd0";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "rgba(255,255,255,.35)";
    for (let i = 0; i < 16; i++)
      c.fillRect(rnd() * W, rnd() * H, 10 + rnd() * 20, 2);
  });
  const rio = put(
    new THREE.Mesh(
      fita(
        [
          [-1.1, -6.3],
          [-1.5, -5],
          [-1.1, -3.3],
          [-0.2, -1.9],
          [0.4, -0.5],
          [0.3, 1.2],
          [1, 2.9],
          [2.4, 4.6],
          [3.2, 6.8],
          [3.4, 9.7],
        ],
        0.42,
      ),
      new THREE.MeshStandardMaterial({
        map: aguaTex,
        roughness: 0.3,
        side: THREE.DoubleSide,
      }),
    ),
    0,
    0.43,
    0,
  );
  rio.receiveShadow = true;

  const quedaTex = tex(64, 128, (c, W, H) => {
    c.fillStyle = "#bfe9f5";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#ffffff";
    for (let i = 0; i < 14; i++)
      c.fillRect(rnd() * W, rnd() * H, 3 + rnd() * 4, 20 + rnd() * 40);
  });

  const queda = (w: number, h: number, x: number, y: number, z: number) => {
    const m = put(
      new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
          map: quedaTex,
          transparent: true,
          opacity: 0.88,
          side: THREE.DoubleSide,
        }),
      ),
      x,
      y + h / 2,
      z,
    );
    for (let i = 0; i < 4; i++) {
      const b = sp(0.3, 0xffffff, x + (i - 1.5) * 0.12, y + 0.1, z + 0.15);
      b.material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      bruma.push({ b, i });
    }
    return m;
  };

  const serra = (
    r: number,
    h: number,
    sx: number,
    sz: number,
    c1: number,
    c2: number,
    c3: number,
  ) => {
    (
      [
        [r, r * 0.82, h * 0.4, c1],
        [r * 0.82, r * 0.76, h * 0.4, c2],
        [r * 0.76, r * 0.74, h * 0.2, c3],
      ] as const
    ).reduce((y, [a, b, hh, c]) => {
      cy(a, b, hh, c, 0, y, 0, 9).scale.set(sx, 1, sz);
      return y + hh;
    }, 0);
    cy(r * 0.74, r * 0.74, 0.1, 0x9aa65a, 0, h, 0, 9).scale.set(sx, 1, sz);
  };

  item(0, 9, 4.5, -7.3, () => {
    serra(2.4, 3.2, 1.25, 1, 0x7e9a4a, 0xb5653a, 0xc98a52);
    cy(0.04, 0.06, 0.3, 0x6b4a2a, 0.4, 3.2, 0, 5);
    sp(0.3, 0x2f6f2a, 0.4, 3.6, 0, 1, 0.7, 1);
    placa("Morro do Pai Inácio", 4.4);
  }, 0.3);
  item(0, 9, -7.2, -1.5, () =>
    serra(2.2, 2.2, 1, 1.8, 0x7e9a4a, 0xb5653a, 0xc98a52),
  0.2);
  item(0, 9, -6.5, -6, () =>
    serra(1.8, 1.7, 1.2, 1, 0x7e9a4a, 0xb5653a, 0xc98a52),
  0.6);
  item(0, 9, -7.6, 4.4, () =>
    serra(1.2, 1.1, 1, 1, 0x7e9a4a, 0xb5653a, 0xc98a52),
  );
  item(0, 9, 8.4, -1.5, () =>
    serra(1.3, 1.3, 1, 1.2, 0x7e9a4a, 0xb5653a, 0xc98a52),
  1);
  item(0, 9, -1.4, -8.4, () => {
    bx(3.4, 0.6, 2, 0x7e9a4a);
    bx(3.2, 1.2, 1.8, 0xb5653a, 0, 0.6, 0);
    bx(3.2, 0.8, 1.8, 0xc98a52, 0, 1.8, 0);
    bx(3.3, 0.12, 1.9, 0x9aa65a, 0, 2.6, 0);
    queda(0.45, 2.15, 0.3, 0.45, 0.93);
    cy(0.7, 0.7, 0.04, 0x45d6c8, 0.2, 0, 1.5, 16);
    placa("Cachoeira da Fumaça", 3.2);
  });
  item(0, 9, 2.6, -4.9, () => {
    dome(0.7, 0.8, 0x8a8478, 0, 0, -0.2);
    dome(0.5, 0.8, 0x9a9488, 0.5, 0, -0.1);
    queda(0.3, 0.55, 0.1, 0.1, 0.1);
    cy(0.55, 0.55, 0.04, 0x45d6c8, 0.1, 0, 0.6, 14);
    placa("Cachoeira da Primavera", 1.5);
  });
  item(0, 9, -4.4, 2.8, () => {
    const s = bx(0.8, 0.08, 2.6, 0x7a4a2a, 0, 0.35, 0);
    s.rotation.x = 0.4;
    const w = bx(0.5, 0.02, 2.5, 0xffffff, 0, 0.4, 0);
    w.rotation.x = 0.4;
    w.material = new THREE.MeshBasicMaterial({
      map: quedaTex,
      transparent: true,
      opacity: 0.7,
    });
    cy(0.6, 0.6, 0.04, 0x45d6c8, 0, 0, 1.8, 14);
    placa("Ribeirão do Meio", 1.5);
  }, 0.3);

  function palma() {
    cy(0.04, 0.07, 0.85, 0x8a6a3f, 0, 0, 0, 6);
    const cr = new THREE.Group();
    cr.position.y = 0.85;
    cur.add(cr);
    const lg = new THREE.BoxGeometry(0.55, 0.02, 0.14);
    lg.translate(0.27, 0, 0);
    for (let i = 0; i < 6; i++) {
      const l = new THREE.Mesh(lg, mt(0x2f9e44));
      l.rotation.y = i * 1.047;
      l.rotation.z = -0.35;
      cr.add(l);
    }
    sway.push(cr);
  }
  (
    [
      [-2.3, -3.2],
      [-0.4, -3],
      [-1.2, 4.2],
      [3.3, 5.4],
      [1, 6],
      [-2.6, -5.6],
    ] as const
  ).forEach(([x, z], i) => item(0, 9, x, z, palma, i));

  for (let n = 0, k = 0; n < 60 && k < 26; n++) {
    const x = -9 + rnd() * 18;
    const z = -9 + rnd() * 18;
    if (
      x * x + z * z > 90 ||
      (x > -3.6 && x < 8 && z > -4.2 && z < 5) ||
      (z < -5 && x > -3 && x < 7.5) ||
      (x < -4.6 && z > -4 && z < 0.8)
    )
      continue;
    k++;
    const kk = k;
    item(
      0,
      9,
      x,
      z,
      () => {
        sp(
          0.26,
          [0x8f9a3f, 0x6f8f3a, 0xb0a850][kk % 3]!,
          0,
          0.18,
          0,
          1.3,
          0.7,
          1.3,
        );
        sp(0.14, 0xf2c230, 0.15, 0.34, 0.05);
      },
      kk,
      0.4,
    );
  }

  const tenda = () => {
    rf(0.7, 0.5, 0.8, 0xf6f3ea);
    bx(0.04, 0.55, 0.04, 0x8b5e3c, 0, 0, 0.42);
    bx(0.04, 0.55, 0.04, 0x8b5e3c, 0, 0, -0.42);
    bx(0.18, 0.28, 0.01, 0x4a3a2a, 0, 0, 0.41);
  };
  (
    [
      [1.8, -3.6],
      [2.8, -3.2],
      [1.6, -1],
      [1.7, 1.4],
      [2.2, 3],
      [-1.8, -2.5],
      [-2, -0.2],
      [-1.9, 1.9],
      [-1.6, 3.8],
    ] as const
  ).forEach(([x, z], i) =>
    item(
      1,
      2,
      x,
      z,
      () => {
        tenda();
        if (!i) placa("Acampamento dos garimpeiros", 1.3);
      },
      i * 1.3,
    ),
  );
  item(1, 2, 2.4, -2.2, () => {
    [0, 1, 2].forEach((i) => {
      const l = bx(0.3, 0.05, 0.05, 0x5a3a22);
      l.rotation.y = i * 1.05;
    });
    const f = co(0.12, 0.3, 0xff8a1e, 0, 0.05, 0, 6);
    (f as THREE.Mesh).material = new THREE.MeshBasicMaterial({
      color: 0xffa030,
    });
    an.push((tt) => f.scale.set(1, 1 + 0.35 * Math.sin(tt * 14), 1));
  });

  const garimpeiro = () => {
    const q = new THREE.Group();
    cur.add(q);
    cur = q;
    bx(0.1, 0.2, 0.08, 0xb08a5a, 0, 0.05, 0);
    sp(0.05, 0xc08a60, 0, 0.3, 0);
    co(0.1, 0.07, 0xd9c08f, 0, 0.31, 0, 8);
    cy(0.1, 0.1, 0.02, 0x9a9ea4, 0.12, 0.12, 0.06, 10);
    an.push((tt) => {
      q.rotation.x = 0.25 + 0.2 * Math.sin(tt * 2 + q.id);
    });
  };
  (
    [
      [-0.45, -3.4],
      [0.95, 0],
      [1.25, 2.3],
    ] as const
  ).forEach(([x, z], i) => item(1, 3, x, z, garimpeiro, i + 1.5));

  const H: [number, number, number][] = [
    [4.9, -3, 0],
    [6.2, -0.6, -PI / 2],
    [6.2, 1.2, -PI / 2],
    [4.6, 2.9, PI],
    [6, 3, PI],
    [1.8, 2.2, PI / 2],
    [1.9, 3.6, PI / 2],
    [-2.6, -0.6, PI / 2],
    [-2.7, 1.2, PI / 2],
    [-2.5, 3, PI / 2],
  ];
  const casaPedra = () => {
    bx(0.9, 0.45, 0.7, 0xb89a78);
    rf(0.77, 0.28, 0.97, 0xa5553a, 0, 0.45, 0, PI / 2);
    bx(0.16, 0.26, 0.02, 0x5a3a22, 0, 0, 0.35);
    bx(0.12, 0.12, 0.02, 0x3a2a1a, -0.3, 0.2, 0.35);
    bx(0.12, 0.12, 0.02, 0x3a2a1a, 0.3, 0.2, 0.35);
  };
  H.forEach(([x, z, r]) => item(2, 2, x, z, casaPedra, r));

  item(
    2,
    9,
    -2.3,
    1.9,
    () => {
      bx(0.8, 0.5, 1, 0xf6f3ea);
      rf(0.86, 0.28, 1.05, 0xa5553a, 0, 0.5, 0);
      bx(0.3, 0.85, 0.3, 0xf6f3ea, 0, 0, 0.6);
      co(0.22, 0.3, 0xa5553a, 0, 0.85, 0.6, 4).rotation.y = PI / 4;
      bx(0.14, 0.24, 0.02, 0x5a3a22, 0, 0, 0.76);
      placa("Igreja do Senhor dos Passos", 1.7);
    },
    PI / 2,
  );
  (
    [
      [2.2, 0.7],
      [3.8, 0.7],
      [2.2, -0.7],
      [3.8, -0.7],
    ] as const
  ).forEach(([x, z], i) =>
    item(2, 2, x, z, () => {
      bx(0.5, 0.22, 0.3, 0x8b5e3c);
      rf(0.6, 0.22, 0.45, 0xf6f3ea, 0, 0.7, 0, PI / 2);
      bx(0.03, 0.7, 0.03, 0x5a3a22, -0.24, 0, 0);
      bx(0.03, 0.7, 0.03, 0x5a3a22, 0.24, 0, 0);
      if (!i) placa("Praça do Mercado", 1.2);
    }),
  );
  item(2, 2, 0, 0, () => {
    bx(6, 0.015, 5.6, 0xc4a574, 4.2, 0, 0.6);
    bx(2.2, 0.015, 4.4, 0xc4a574, -2.2, 0, 1.2);
  });
  item(
    2,
    2,
    0.4,
    0.9,
    () => {
      bx(1.8, 0.07, 0.5, 0x8b5e3c, 0, 0.02, 0);
      bx(1.8, 0.18, 0.03, 0x6b4a2a, 0, 0.1, 0.24);
      bx(1.8, 0.18, 0.03, 0x6b4a2a, 0, 0.1, -0.24);
    },
    0,
    0.42,
  );
  item(2, 3, -3.2, -1.8, () => {
    cy(0.8, 0.8, 0.04, 0x5a4630, 0, 0, 0, 14);
    cy(0.55, 0.55, 0.045, 0x3b2d1e, 0, 0, 0, 14);
    dome(0.3, 0.5, 0xa89a7a, 0.9, 0, 0.5);
    dome(0.22, 0.5, 0xa89a7a, -0.8, 0, 0.6);
    bx(1.2, 0.08, 0.25, 0x8b5e3c, 0.9, 0.06, -0.5).rotation.y = 0.35;
    garimpeiro();
    placa("Lavra de diamantes", 1.2);
  });
  item(
    2,
    3,
    -0.9,
    -4.7,
    () => {
      const w = new THREE.Group();
      w.position.y = 0.5;
      cur.add(w);
      cur = w;
      put(
        new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 6, 16), mt(0x8b5e3c)),
        0,
        0,
        0,
      ).rotation.y = PI / 2;
      for (let i = 0; i < 6; i++) {
        const s = bx(0.03, 0.9, 0.04, 0x8b5e3c, 0, -0.45, 0);
        s.rotation.x = (i * PI) / 6;
        s.position.y = 0;
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 2 * PI;
        bx(
          0.36,
          0.04,
          0.08,
          0x6b4a2a,
          0,
          Math.sin(a) * 0.45,
          Math.cos(a) * 0.45,
        );
      }
      cur = w.parent!;
      bx(0.06, 0.8, 0.06, 0x5a3a22, -0.3, -0.4, 0);
      bx(0.06, 0.8, 0.06, 0x5a3a22, 0.3, -0.4, 0);
      an.push((tt) => {
        w.rotation.x = -tt * 0.8;
      });
      placa("Roda d'água", 1.4);
    },
    0,
  );
  item(2, 4, 0, 0, () => {
    const q = new THREE.Group();
    cur.add(q);
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Group();
      m.position.z = i * 0.6;
      q.add(m);
      cur = m;
      bx(0.16, 0.14, 0.34, 0x7a5a3a, 0, 0.1, 0);
      bx(0.1, 0.12, 0.1, 0x7a5a3a, 0, 0.2, 0.22);
      (
        [
          [-0.05, -0.12],
          [0.05, -0.12],
          [-0.05, 0.12],
          [0.05, 0.12],
        ] as const
      ).forEach(([x, z]) => bx(0.03, 0.12, 0.03, 0x4a3a2a, x, 0, z));
      bx(0.18, 0.1, 0.2, 0xd9c08f, 0, 0.24, 0);
    }
    cur = g;
    q.rotation.y = PI;
    an.push((tt) =>
      q.position.set(5.3, 0, 4.5 - ((tt * 0.25) % 1) * 9),
    );
  });

  const paral = new THREE.MeshStandardMaterial({
    map: tex(
      128,
      128,
      (c, W, H) => {
        c.fillStyle = "#6f6b63";
        c.fillRect(0, 0, W, H);
        for (let i = 0; i < 70; i++) {
          c.fillStyle = `hsl(${20 + rnd() * 20},10%,${38 + rnd() * 30}%)`;
          c.fillRect(rnd() * W, rnd() * H, 14 + rnd() * 10, 10 + rnd() * 8);
        }
      },
      6,
      6,
    ),
    roughness: 0.95,
  });
  item(3, 9, 0, 0, () => {
    bx(6, 0.015, 5.6, paral, 4.2, 0, 0.6);
    bx(2.2, 0.015, 4.4, paral, -2.2, 0, 1.2);
  });
  item(3, 9, 3, 0, () => {
    cy(1, 1, 0.03, 0xcfc8b4, 0, 0, 0, 24);
    placa("Praça Horácio de Matos", 1.9);
  });
  item(3, 4, 3, 0, () => {
    cy(0.35, 0.35, 0.06, 0xe8e2d0, 0, 0.03, 0, 10);
    for (let i = 0; i < 6; i++) {
      const a = (i * PI) / 3;
      cy(
        0.015,
        0.015,
        0.4,
        0xffffff,
        Math.cos(a) * 0.3,
        0.08,
        Math.sin(a) * 0.3,
        5,
      );
    }
    co(0.5, 0.3, 0xb5502f, 0, 0.5, 0, 10);
  });
  item(3, 9, 3, -1.9, () => {
    bx(1, 0.7, 1.3, 0xfafaf5);
    rf(1.06, 0.35, 1.35, 0xa5553a, 0, 0.7, 0);
    bx(0.4, 1.1, 0.4, 0xfafaf5, 0, 0, 0.7);
    bx(0.18, 0.22, 0.02, 0x2b3a42, 0, 0.85, 0.91);
    dome(0.26, 0.9, 0x2e6fb7, 0, 1.1, 0.7);
    bx(0.025, 0.2, 0.025, 0xd4a72c, 0, 1.5, 0.7);
    bx(0.2, 0.32, 0.02, 0x5a3a22, 0, 0, 0.92);
    placa("Igreja do Rosário", 2.1);
  });
  item(
    3,
    9,
    4.6,
    0.2,
    () => {
      bx(1.9, 0.55, 1, 0xf0d9a8);
      rf(2, 0.3, 1.1, 0xa5553a, 0, 0.55, 0, 0).rotation.y = PI / 2;
      for (let i = 0; i < 5; i++)
        bx(0.22, 0.36, 0.02, 0x4a3a2a, -0.76 + i * 0.38, 0, 0.51);
      bx(1.95, 0.05, 1.05, 0xffffff, 0, 0.5, 0);
      placa("Mercado Cultural", 1.4);
    },
    -PI / 2,
  );
  item(
    3,
    9,
    1.5,
    0.1,
    () => {
      bx(1.1, 0.5, 0.8, 0xf2d15c);
      bx(1.1, 0.4, 0.8, 0xfff6d8, 0, 0.5, 0);
      rf(0.9, 0.3, 1.15, 0xa5553a, 0, 0.9, 0, PI / 2);
      bx(1.15, 0.04, 0.5, 0xffffff, 0, 0.5, 0.4);
      bx(0.16, 0.28, 0.02, 0x5a3a22, 0, 0, 0.41);
      placa("Casa de Cultura Afrânio Peixoto", 1.6);
    },
    PI / 2,
  );
  item(
    3,
    9,
    3,
    1.9,
    () => {
      bx(1.1, 0.9, 0.8, 0xe8e2d0);
      rf(1.1, 0.4, 0.82, 0xdfe8f0, 0, 0.9, 0);
      [-0.4, 0, 0.4].forEach((x) => {
        rf(0.14, 0.24, 0.02, 0x2e6fb7, x, 0.35, 0.41);
        rf(0.14, 0.24, 0.02, 0x2e6fb7, x, 0, 0.41);
      });
      [-0.55, 0.55].forEach((x) => co(0.06, 0.3, 0xe8e2d0, x, 0.9, 0.4, 4));
      placa("Casarão neogótico", 1.7);
    },
    PI,
  );

  const casarao = (c: number, h: number) => () => {
    bx(0.9, h, 0.7, c);
    bx(0.93, 0.04, 0.73, 0xffffff, 0, h);
    rf(0.77, 0.3, 0.97, 0xa5553a, 0, h + 0.04, 0, PI / 2);
    bx(0.16, 0.28, 0.02, 0x5a3a22, 0, 0, 0.35);
    [-0.28, 0.28].forEach((x) => {
      bx(0.13, 0.18, 0.02, 0x2d4a63, x, h - 0.28, 0.35);
      if (h > 0.6) bx(0.13, 0.18, 0.02, 0x2d4a63, x, 0.2, 0.35);
    });
  };
  const CC = [
    0xf4a6a0, 0xf2d15c, 0x7fb8d9, 0xe98f4a, 0x8fc99a, 0xf4a6a0, 0x7fb8d9,
    0xf2d15c, 0xe98f4a, 0x8fc99a,
  ];
  H.forEach(([x, z, r], i) =>
    item(3, 9, x, z, casarao(CC[i]!, i % 3 ? 0.5 : 0.8), r),
  );
  item(
    3,
    9,
    0.4,
    0.9,
    () => {
      bx(1.8, 0.1, 0.55, 0x8a8478, 0, 0.02, 0);
      bx(1.8, 0.18, 0.05, 0x9a9488, 0, 0.1, 0.25);
      bx(1.8, 0.18, 0.05, 0x9a9488, 0, 0.1, -0.25);
      put(
        new THREE.Mesh(
          new THREE.TorusGeometry(0.5, 0.05, 6, 12, PI),
          mt(0x8a8478),
        ),
        -0.4,
        -0.02,
        0,
      );
      put(
        new THREE.Mesh(
          new THREE.TorusGeometry(0.5, 0.05, 6, 12, PI),
          mt(0x8a8478),
        ),
        0.45,
        -0.02,
        0,
      );
    },
    0,
    0.42,
  );
  (
    [
      [1.9, -1.1],
      [4.1, -1.1],
      [1.9, 1.1],
      [4.1, 1.1],
    ] as const
  ).forEach(([x, z]) =>
    item(3, 9, x, z, () => {
      cy(0.015, 0.015, 0.6, 0x333333);
      sp(0.06, lamp, 0, 0.64, 0);
    }),
  );

  const pousada = () => {
    bx(1.2, 0.35, 0.8, 0xa89a7a);
    bx(1.2, 0.35, 0.8, 0xc9a46a, 0, 0.35, 0);
    rf(1, 0.35, 1.05, 0xa5553a, 0, 0.7, 0, PI / 2);
    bx(1.3, 0.04, 0.2, 0x6b4a2a, 0, 0.35, 0.5);
    bx(0.16, 0.28, 0.02, 0x5a3a22, 0, 0, 0.41);
    bx(0.3, 0.12, 0.02, 0x2e6fb7, 0.35, 0.2, 0.41);
  };
  (
    [
      [6.9, -3.2, -PI / 2],
      [7, 4.4, PI],
      [1.9, 4.6, PI / 2],
    ] as const
  ).forEach(([x, z, r], i) =>
    item(
      4,
      9,
      x,
      z,
      () => {
        pousada();
        if (!i) placa("Pousada histórica", 1.5);
      },
      r,
    ),
  );
  item(
    4,
    9,
    5,
    -4.2,
    () => {
      bx(0.5, 0.012, 2.6, 0xc9a46a);
      const j = new THREE.Group();
      cur.add(j);
      cur = j;
      bx(0.2, 0.1, 0.38, 0x3a7d44, 0, 0.06, 0);
      bx(0.17, 0.07, 0.2, 0xf2c744, 0, 0.16, -0.04);
      (
        [
          [-0.11, -0.12],
          [0.11, -0.12],
          [-0.11, 0.12],
          [0.11, 0.12],
        ] as const
      ).forEach(([x, z]) => {
        cy(0.05, 0.05, 0.03, 0x222222, x, 0.03, z, 8).rotation.z = PI / 2;
      });
      an.push((tt) => {
        j.position.z = Math.sin(tt * 0.5) * 1.1;
        j.rotation.y = Math.cos(tt * 0.5) > 0 ? 0 : PI;
      });
      cur = g;
    },
    Math.atan2(-1, -2.2),
  );
  item(
    4,
    9,
    4.5,
    -7.3,
    () => {
      bx(0.9, 0.05, 0.5, 0x8b5e3c, -0.3, 0, 0.3);
      cy(0.015, 0.015, 0.7, 0x5a3a22, 0.4, 0, 0.3, 5);
      bx(0.28, 0.16, 0.01, 0xd8332a, 0.54, 0.6, 0.3);
      (
        [
          [-0.5, 0.3, 0x2e6fb7],
          [-0.3, 0.2, 0xe05fa5],
          [-0.1, 0.4, 0xf2c744],
        ] as const
      ).forEach(([x, z, c]) => {
        bx(0.06, 0.12, 0.05, c, x, 0.05, z);
        sp(0.035, 0xf0c9a0, x, 0.2, z);
      });
    },
    0,
    3.55,
  );
  (
    [
      [0, 0xf2c744, -4.2],
      [1, 0xe0522d, -3.9],
      [2, 0x2e6fb7, -4.5],
    ] as const
  ).forEach(([i, c]) =>
    item(
      4,
      9,
      -4.4,
      2.8,
      () => {
        const s = sp(0.07, c, 0, 0.45, -1);
        an.push((tt) => {
          const u = (tt * 0.35 + i * 0.33) % 1;
          s.position.set(0, 0.5 - u * 0.95, -1.1 + u * 2.2);
        });
        s.rotation.x = 0.4;
      },
      0.3,
    ),
  );
  item(
    4,
    9,
    -5.1,
    -1.6,
    () => {
      rf(0.7, 0.7, 0.2, 0x2a2a2a);
      const l = bx(0.5, 0.5, 0.02, 0, 0, 0, 0.12);
      l.material = new THREE.MeshBasicMaterial({
        color: 0x2ec4ff,
        transparent: true,
        opacity: 0.8,
      });
      an.push((tt) => {
        (l.material as THREE.MeshBasicMaterial).opacity =
          0.55 + 0.3 * Math.sin(tt * 2);
      });
      placa("Gruta Azul", 1.1);
    },
    PI / 2,
  );
  item(4, 9, 3, -0.2, () => {
    [-1.6, 1.6].forEach((x) =>
      cy(0.015, 0.015, 1.6, 0x5a3a22, x, 0, 0, 5),
    );
    const f: [THREE.Mesh, number][] = [];
    for (let k = 1; k < 18; k++) {
      const s = k / 18;
      const m = new THREE.Mesh(
        new THREE.ShapeGeometry(
          new THREE.Shape([
            new THREE.Vector2(-0.08, 0),
            new THREE.Vector2(0.08, 0),
            new THREE.Vector2(0, -0.2),
          ]),
        ),
        new THREE.MeshBasicMaterial({
          color: [0xd8332a, 0xf2c744, 0x2e6fb7, 0x3a9d5d][k % 4],
          side: THREE.DoubleSide,
        }),
      );
      m.position.set(-1.6 + 3.2 * s, 1.6 - 0.2 * 4 * s * (1 - s), 0);
      cur.add(m);
      f.push([m, k]);
    }
    an.push((tt) =>
      f.forEach(([m, k]) => {
        m.rotation.z = 0.25 * Math.sin(tt * 2.2 + k);
      }),
    );
  });
  (
    [
      [6.6, -5.6, 0xe0522d],
      [7.2, -5.2, 0x2e6fb7],
      [-1.4, 6.9, 0xf2c744],
    ] as const
  ).forEach(([x, z, c], i) =>
    item(4, 9, x, z, () => {
      co(0.3, 0.28, c, 0, 0, 0, 10).scale.z = 1.2;
      bx(0.5, 0.01, 0.4, 0x3a7d44, 0, 0, 0);
      if (!i) placa("Camping", 0.9);
    }),
  );

  const dm = new THREE.MeshStandardMaterial({
    color: 0x9fe8ff,
    metalness: 0.3,
    roughness: 0.1,
    emissive: 0x2a9fd0,
    emissiveIntensity: 0.5,
    flatShading: true,
    transparent: true,
    opacity: 0.92,
  });
  item(5, 9, 3, 0, () => {
    cy(0.3, 0.38, 0.35, 0x8a8478, 0, 0, 0, 10);
    const d = put(new THREE.Mesh(new THREE.OctahedronGeometry(0.4), dm), 0, 0.85, 0);
    d.scale.y = 1.4;
    const s: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const e = sp(0.03, 0xffffff, 0, 0, 0);
      e.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      s.push(e);
    }
    an.push((tt) => {
      d.rotation.y = tt * 0.9;
      s.forEach((e, i) => {
        const a = tt * 1.5 + (i * PI) / 2;
        e.position.set(
          Math.cos(a) * 0.6,
          0.85 + Math.sin(tt * 3 + i) * 0.4,
          Math.sin(a) * 0.6,
        );
        e.scale.setScalar(0.6 + 0.6 * Math.sin(tt * 5 + i));
      });
    });
    placa("Monumento ao Diamante", 1.9);
  });
  item(
    5,
    9,
    6.6,
    6.6,
    () => {
      bx(1.8, 0.6, 0.9, 0xf1e6cf);
      bx(1.5, 0.4, 0.8, 0x8b5e3c, 0, 0.6, 0);
      co(1.2, 0.55, 0xc9a24a, 0, 1, 0, 10).scale.set(1.3, 1, 0.8);
      bx(1.6, 0.04, 0.3, 0x6b4a2a, 0, 0.6, 0.55);
      for (let i = 0; i < 4; i++)
        bx(0.3, 0.3, 0.02, 0x2e6fb7, -0.6 + i * 0.4, 0.15, 0.46);
      placa("Ecolodge da Chapada", 2);
    },
    PI,
  );
  item(5, 9, 6, 4.9, () => {
    bx(1.7, 0.05, 0.9, 0xf5f5f5);
    bx(1.5, 0.07, 0.7, 0x39c6e8);
    [-0.6, -0.2, 0.2, 0.6].forEach((x) =>
      bx(0.22, 0.08, 0.4, 0xffffff, x, 0, 0.65),
    );
  });
  (
    [
      [8, 5.2],
      [8.3, 3.4],
    ] as const
  ).forEach(([x, z]) =>
    item(
      5,
      9,
      x,
      z,
      () => {
        bx(0.7, 0.4, 0.7, 0xf1e6cf);
        co(0.65, 0.45, 0xc9a24a, 0, 0.4, 0, 8);
        bx(0.14, 0.24, 0.02, 0x5a3a22, 0, 0, 0.36);
      },
      PI / 2,
    ),
  );
  item(5, 9, -5, 4.4, () => {
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < 4; i++) {
        const p = bx(
          0.7,
          0.03,
          0.45,
          0x1f3a6b,
          -1.2 + i * 0.8,
          0.3,
          -0.4 + r * 0.85,
        );
        p.rotation.x = -0.5;
        bx(
          0.03,
          0.3,
          0.03,
          0x888888,
          -1.2 + i * 0.8,
          0,
          -0.4 + r * 0.85,
        );
      }
    placa("Energia solar", 1.1);
  });
  item(5, 9, -3.5, 7.4, () => {
    bx(3.6, 0.015, 0.7, 0x333333);
    for (let i = 0; i < 7; i++)
      bx(0.25, 0.02, 0.04, 0xffffff, -1.5 + i * 0.5, 0, 0);
    bx(1, 0.35, 0.6, 0xe8edf0, 0, 0, -0.9);
    bx(1.05, 0.06, 0.65, 0x6fb3d9, 0, 0.35, -0.9);
    placa("Aeroporto Horácio de Matos", 1.3, 0, -0.9);
  });

  const aviao = new THREE.Group();
  cur = aviao;
  bx(0.8, 0.1, 0.1, 0xf5f5f5, -0.4);
  bx(0.12, 0.02, 0.9, 0x2e6fb7, -0.35, 0.04);
  bx(0.08, 0.2, 0.02, 0x2e6fb7, -0.75, 0.05);
  aviao.scale.setScalar(1.2);
  aviao.visible = false;
  g.add(aviao);
  cur = g;

  const faixas = tex(128, 64, (c, _W, H) => {
    ["#e0522d", "#f2c744", "#2e6fb7", "#3a9d5d"].forEach((k, i) => {
      c.fillStyle = k;
      c.fillRect(i * 32, 0, 32, H);
    });
  });
  (
    [
      [2.5, -6.5, 4.8],
      [7, -5, 5.4],
      [0.5, -3, 4.2],
    ] as const
  ).forEach(([x, z, y], i) =>
    item(
      5,
      9,
      x,
      z,
      () => {
        const q = new THREE.Group();
        cur.add(q);
        const b = new THREE.Mesh(
          new THREE.SphereGeometry(0.55, 14, 10),
          new THREE.MeshStandardMaterial({ map: faixas, roughness: 0.7 }),
        );
        b.scale.y = 1.15;
        b.position.y = 0.6;
        q.add(b);
        const k = bx(0.22, 0.16, 0.22, 0x8b5e3c, 0, -0.5, 0);
        q.add(k);
        cy(0.01, 0.01, 0.5, 0x333333, 0.08, -0.35, 0.08, 4);
        cur = g;
        an.push((tt) => {
          q.position.y = Math.sin(tt * 0.7 + i * 2) * 0.25;
          q.rotation.y = tt * 0.2 + i;
        });
      },
      i,
      y,
    ),
  );

  const estrelas: THREE.PointsMaterial[] = [];
  item(5, 9, 0, 0, () => {
    const N = 80;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = rnd() * PI * 2;
      const r = 3 + rnd() * 9;
      pos.set([Math.cos(a) * r, 8 + rnd() * 5, Math.sin(a) * r], i * 3);
    }
    const q = new THREE.BufferGeometry();
    q.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.14,
      transparent: true,
      depthWrite: false,
    });
    const P = new THREE.Points(q, m);
    P.frustumCulled = false;
    cur.add(P);
    estrelas.push(m);
  }, 0, 0);

  const aves: Array<{
    h: THREE.Group;
    l: THREE.Mesh;
    r: THREE.Mesh;
    i: number;
  }> = [];
  for (let i = 0; i < 3; i++) {
    const h = new THREE.Group();
    cur = h;
    const lGeo = new THREE.BoxGeometry(0.3, 0.02, 0.1);
    lGeo.translate(0.15, 0, 0);
    const rGeo = new THREE.BoxGeometry(0.3, 0.02, 0.1);
    rGeo.translate(-0.15, 0, 0);
    const l = new THREE.Mesh(lGeo, mt(0x2e5fd0));
    const r = new THREE.Mesh(rGeo, mt(0x2e5fd0));
    h.add(l, r);
    sp(0.05, 0xf2c230, 0, 0, 0, 1, 1, 1.8);
    g.add(h);
    aves.push({ h, l, r, i });
    cur = g;
  }

  const nuv: THREE.Group[] = [];
  for (let i = 0; i < 5; i++) {
    const h = new THREE.Group();
    cur = h;
    (
      [
        [0, 0, 0, 1],
        [0.8, -0.1, 0.2, 0.75],
        [-0.8, -0.1, -0.1, 0.7],
      ] as const
    ).forEach(([x, y, z, s]) => sp(s, 0xffffff, x, y, z, 1.3, 0.7, 1));
    h.children.forEach((m) => {
      (m as THREE.Mesh).material = mt(0xffffff, {
        transparent: true,
        opacity: 0.9,
        roughness: 1,
      });
    });
    h.position.set(-16 + i * 7, 8 + (i % 2) * 1.5, -8 + i * 4);
    g.add(h);
    nuv.push(h);
    cur = g;
  }

  const aplicar = () => {
    itens.forEach((it) => {
      it.alvoNovo = nivel >= it.min && nivel <= it.max ? 1 : 0;
      it.atraso = rnd() * 0.7;
    });
    aviao.visible = nivel >= 5;
  };

  g.userData.definirNivel = (n) => {
    nivel = Math.max(0, Math.min(5, n | 0));
    aplicar();
    return nivel;
  };
  g.userData.nivel = () => nivel;
  g.userData.alternarVida = () => (vai = !vai);
  g.userData.alternarNomes = () => {
    mostrarNomes = !mostrarNomes;
    nomes.forEach((s) => {
      s.visible = mostrarNomes;
    });
    return mostrarNomes;
  };
  aplicar();
  itens.forEach((it) => {
    it.alvo = it.alvoNovo;
    it.s = it.alvo;
    it.atraso = 0;
    it.g.visible = it.alvo > 0;
    it.g.scale.setScalar(Math.max(0.001, it.s));
  });

  g.userData.tick = (dt) => {
    dt = Math.min(dt, 0.05);
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
      it.g.position.y = it.y + (1 - Math.min(1, s)) * 1.2;
    });
    if (!vai) return;
    t += dt;
    an.forEach((f) => f(t));
    sway.forEach((c, i) => {
      c.rotation.z = Math.sin(t * 1.4 + i) * 0.06;
    });
    aguaTex.offset.x -= dt * 0.4;
    quedaTex.offset.y += dt * 0.9;
    bruma.forEach(({ b, i }) => {
      const p = (t * 0.5 + i / 4) % 1;
      b.scale.setScalar(0.5 + p * 0.9);
      (b.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - p);
      b.position.y = 0.1 + p * 0.4;
    });
    aves.forEach(({ h, l, r, i }) => {
      const a = t * (0.25 + i * 0.05) + i * 2;
      h.position.set(
        Math.cos(a) * (5 + i * 1.3),
        4 + i * 0.5 + Math.sin(t + i) * 0.2,
        Math.sin(a) * (5 + i * 1.3),
      );
      h.rotation.y = -a;
      const f = Math.sin(t * 8 + i) * 0.5;
      l.rotation.z = f;
      r.rotation.z = -f;
    });
    nuv.forEach((c, i) => {
      c.position.x += dt * (0.25 + i * 0.05);
      if (c.position.x > 18) c.position.x = -18;
    });
    if (aviao.visible) {
      const a = t * 0.4;
      aviao.position.set(
        Math.cos(a) * 8.5,
        5.5 + Math.sin(a * 2) * 0.3,
        Math.sin(a) * 8.5,
      );
      aviao.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
    }
    noite += ((nivel === 5 ? 1 : 0) - noite) * Math.min(1, dt * 1.5);
    lamp.emissiveIntensity = 0.5 + 1.1 * noite;
    dm.emissiveIntensity = 0.4 + 0.9 * noite;
    estrelas.forEach((m) => {
      m.opacity = noite * (0.65 + 0.35 * Math.sin(t * 2));
    });
  };

  return g;
}
