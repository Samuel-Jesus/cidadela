import * as THREE from "three";

export type IlheusGroup = THREE.Group & {
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

type Gaivota = {
  h: THREE.Group;
  l: THREE.Mesh;
  r: THREE.Mesh;
  i: number;
};

export function criarIlheus(): IlheusGroup {
  const g = new THREE.Group() as IlheusGroup;
  g.name = "Ilheus";
  const PI = Math.PI;
  let sd = 7;
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
      new THREE.Mesh(q, Array.isArray(c) ? c : typeof c === "number" ? mt(c) : c),
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
    c: number,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
  ) => {
    const o = put(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mt(c)), x, y, z);
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

  const itens: ItemAnim[] = [];
  const an: Array<(tt: number) => void> = [];
  const nomes: THREE.Sprite[] = [];
  const sway: THREE.Group[] = [];
  const winM: THREE.MeshStandardMaterial[] = [];
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
    a.font = "600 36px system-ui,sans-serif";
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

  function predio(w: number, h: number, d: number, base: string, win: string) {
    const cols = Math.max(2, Math.round(Math.max(w, d) * 4));
    const rows = Math.round(h * 4);
    const W = cols * 16;
    const H = rows * 16;
    const cv = document.createElement("canvas");
    const ev = document.createElement("canvas");
    cv.width = ev.width = W;
    cv.height = ev.height = H;
    const a = cv.getContext("2d")!;
    const e = ev.getContext("2d")!;
    a.fillStyle = base;
    a.fillRect(0, 0, W, H);
    e.fillStyle = "#000";
    e.fillRect(0, 0, W, H);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const lit = rnd() < 0.4;
        a.fillStyle = lit ? "#ffe7a3" : win;
        a.fillRect(i * 16 + 3, j * 16 + 4, 10, 8);
        if (lit) {
          e.fillStyle = "#ffd27a";
          e.fillRect(i * 16 + 3, j * 16 + 4, 10, 8);
        }
      }
    }
    const sm = new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(cv),
      emissiveMap: new THREE.CanvasTexture(ev),
      emissive: 0xffffff,
      emissiveIntensity: 0,
      roughness: 0.7,
    });
    winM.push(sm);
    const rm = mt(0x8a949c);
    return bx(w, h, d, [sm, sm, rm, rm, sm, sm]);
  }

  const cst = (z: number) => 2.2 + 1.3 * Math.sin(z * 0.45);
  const forma = (off: number) => {
    const p: THREE.Vector2[] = [];
    for (let z = -10; z <= 10.01; z += 0.5) p.push(new THREE.Vector2(cst(z) + off, -z));
    const a0 = Math.atan2(10, cst(10) + off);
    for (let a = a0; a <= 2 * PI - a0; a += 0.08) {
      p.push(new THREE.Vector2(10.9 * Math.cos(a), -10.9 * Math.sin(a)));
    }
    return new THREE.Shape(p);
  };
  const ext = (sh: THREE.Shape, d: number, c: number) => {
    const q = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
    q.rotateX(-PI / 2);
    const o = new THREE.Mesh(q, mt(c));
    o.receiveShadow = true;
    g.add(o);
  };

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
  put(new THREE.Mesh(new THREE.CylinderGeometry(10.95, 10.95, 0.3, 64), mt(0x14608f)), 0, 0.15, 0);
  const mar = put(
    new THREE.Mesh(
      new THREE.RingGeometry(0.01, 10.9, 64, 20),
      mt(0x2a9ad6, { roughness: 0.3 }),
    ),
    0,
    0.3,
    0,
  );
  mar.rotation.x = -PI / 2;
  mar.receiveShadow = true;
  const pm = mar.geometry.attributes.position!;
  const mx: number[] = [];
  const my: number[] = [];
  for (let i = 0; i < pm.count; i++) {
    mx.push(pm.getX(i));
    my.push(pm.getY(i));
  }
  ext(forma(0.8), 0.35, 0xe9d8a6);
  ext(forma(0), 0.4, 0x7cbf5a);
  bx(10.8, 0.03, 1.4, 0x2e86c1, -4.2, 0.4, -4.5);

  item(0, 9, -6.5, 7, () => {
    dome(1.7, 0.75, 0x4c9a3d, 0, 0, 0);
    placa("Morro de Pernambuco", 1.9);
  });
  item(
    0,
    9,
    7,
    5.5,
    () => {
      dome(1, 0.6, 0x5fae4a, 0, -0.1, 0);
      palma();
      placa("Ilha do Sapo", 1.4);
    },
    0,
    0.3,
  );
  item(0, 9, 8, 1.2, () => dome(0.55, 0.7, 0x6bb455, 0, -0.1, 0), 0, 0.3);

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
    cr.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), mt(0x6b4a2a)));
    sway.push(cr);
  }

  [-9.3, -5.8, -3, -1.5, 1.5, 3.5, 6, 8.5].forEach((z) =>
    item(1, 9, cst(z) + 0.2, z, palma, z, 0.33),
  );

  const choupana = () => {
    bx(0.5, 0.3, 0.5, 0xd9c08f);
    co(0.5, 0.4, 0xb89452, 0, 0.3, 0, 4).rotation.y = PI / 4;
    bx(0.12, 0.2, 0.02, 0x4a3320, 0, 0, 0.25);
  };
  [
    [-1.2, 6.2],
    [-1.9, 7.3],
    [-1.2, 8.3],
    [-1.2, -1.8],
    [-1.9, -2.7],
  ].forEach(([x, z], i) => item(1, 3, x!, z!, choupana, i));

  item(
    1,
    2,
    -3.5,
    4.2,
    () => {
      bx(0.6, 0.4, 0.8, 0xf5f0e0);
      rf(0.66, 0.25, 0.84, 0xb5502f, 0, 0.4, 0);
      bx(0.03, 0.3, 0.03, 0x5a3a22, 0, 0.65, 0);
      bx(0.14, 0.03, 0.03, 0x5a3a22, 0, 0.78, 0);
      placa("Capela de São Jorge", 1.3);
    },
    PI,
  );
  item(
    1,
    9,
    -6.5,
    7,
    () => {
      bx(0.04, 0.4, 0.04, 0xf5f0e0);
      bx(0.2, 0.04, 0.04, 0xf5f0e0, 0, 0.25, 0);
    },
    0,
    1.67,
  );

  const cacau = () => {
    cy(0.04, 0.06, 0.35, 0x6b4a2a, 0, 0, 0, 6);
    sp(0.26, 0x2f8f3a, 0, 0.5, 0, 1, 0.8, 1);
    sp(0.04, 0xe8a317, 0.12, 0.3, 0.1, 1, 1.6, 1);
    sp(0.04, 0xd9501e, -0.1, 0.28, -0.1, 1, 1.6, 1);
  };
  [-8.6, -7.4, -6.2, -5].forEach((x) =>
    [-8, -6.8].forEach((z) => item(1, 9, x, z, cacau, x * z)),
  );
  [
    [-8.8, 1.8],
    [-8.8, 3],
    [-9, -3.2],
    [-8, -2.2],
  ].forEach(([x, z], i) => item(1, 9, x!, z!, cacau, i));

  const barco = (
    mn: number,
    mx2: number,
    x: number,
    z: number,
    fn: () => void,
  ) =>
    item(
      mn,
      mx2,
      x,
      z,
      () => {
        const q = new THREE.Group();
        cur.add(q);
        cur = q;
        fn();
        an.push((tt) => {
          q.position.y = Math.sin(tt * 1.5 + x) * 0.03;
          q.rotation.z = Math.sin(tt + x) * 0.04;
          q.position.x = Math.sin(tt * 0.2 + z) * 0.7;
        });
      },
      0,
      0.28,
    );
  barco(1, 2, 4.5, 1, () => {
    sp(0.3, 0x8a5a32, 0, 0.05, 0, 1.7, 0.4, 0.45);
    sp(0.07, 0xe8a317, 0.1, 0.25, 0);
  });

  const casa = (c: number) => () => {
    bx(0.9, 0.5, 0.7, c);
    bx(0.93, 0.04, 0.73, 0xffffff, 0, 0.5);
    rf(0.77, 0.3, 0.97, 0xb5502f, 0, 0.54, 0, PI / 2);
    bx(0.16, 0.28, 0.02, 0x5a3a22, 0, 0, 0.35);
    bx(0.14, 0.14, 0.02, 0x2d4a63, -0.3, 0.22, 0.35);
    bx(0.14, 0.14, 0.02, 0x2d4a63, 0.3, 0.22, 0.35);
  };
  [
    [-5.6, 4.5, 0xf4a6a0],
    [-1.9, 4.6, 0xf2d15c],
    [-7.2, 1.1, 0x7fb8d9],
    [-7.2, 3.6, 0xe98f4a],
    [-2.3, 6.2, 0x8fc99a],
  ].forEach(([x, z, c], i) => item(2, 9, x!, z!, casa(c!), i * 0.7));

  item(2, 9, -3.5, 2.6, () => {
    cy(1, 1, 0.04, 0x7dc46b, 0, 0, 0, 24);
    cy(0.12, 0.12, 0.25, 0xf5f0e0, 0, 0.04, 0, 8);
    co(0.2, 0.18, 0xd8332a, 0, 0.29, 0, 8);
  });
  item(
    2,
    9,
    -1.7,
    2.2,
    () => {
      bx(0.9, 0.7, 0.7, 0xf2c744);
      bx(0.9, 0.4, 0.7, 0xf6e08a, 0, 0.7);
      rf(0.8, 0.2, 0.95, 0xb5502f, 0, 1.1, 0, PI / 2);
      bx(0.95, 0.04, 0.28, 0x2e6fb7, 0, 0.4, 0.45);
      bx(0.2, 0.045, 0.28, 0xffffff, -0.3, 0.4, 0.45);
      bx(0.2, 0.045, 0.28, 0xffffff, 0.3, 0.4, 0.45);
      cy(0.07, 0.07, 0.05, 0x444444, 0.5, 0, 0.7);
      cy(0.07, 0.07, 0.05, 0x444444, 0.2, 0, 0.8);
      placa("Bar Vesúvio", 1.5);
    },
    -PI / 2,
  );

  const rua = (c: number) => () => {
    bx(0.8, 0.015, 18.4, c);
    bx(9, 0.015, 0.6, c, -4.5, 0, 0);
  };
  item(2, 2, 0, 0, rua(0xc9a46a));
  item(3, 9, 0, 0, () => {
    rua(0x474c52)();
    bx(0.04, 0.017, 18.4, 0xf2c94c);
  });
  item(2, 2, 0, -4.5, () => {
    bx(0.7, 0.05, 2.2, 0x8b5e3c);
    bx(0.04, 0.2, 2.2, 0x6b4a2a, -0.33, 0.05);
    bx(0.04, 0.2, 2.2, 0x6b4a2a, 0.33, 0.05);
  });

  const barcaca = () => {
    bx(0.9, 0.14, 1.4, 0x8a6a45, 0, 0.16);
    bx(0.7, 0.04, 1.2, 0x4a2c17, 0, 0.3);
    [
      [-0.4, -0.65],
      [0.4, -0.65],
      [-0.4, 0.65],
      [0.4, 0.65],
    ].forEach(([a, b]) => cy(0.04, 0.04, 0.18, 0x5a3a22, a!, 0, b!, 6));
    const r = rf(0.8, 0.25, 1, 0xcfd6da, 0, 0.42, 0);
    an.push((tt) => {
      r.position.z = Math.sin(tt * 0.6) * 0.55;
    });
  };
  item(2, 9, -6.9, -2.9, () => {
    barcaca();
    placa("Barcaça de cacau", 1.1);
  });
  item(2, 9, -8.6, -0.8, barcaca, PI / 2);
  barco(2, 3, 5.6, -3, () => {
    bx(1.1, 0.18, 0.4, 0x7a4a2a);
    cy(0.025, 0.025, 0.9, 0x5a3a22, 0.1, 0.15, 0, 6);
    rf(0.75, 0.85, 0.03, 0xf5f0e0, 0.3, 0.3, 0);
  });
  item(2, 9, 2.55, -7, () => bx(2.5, 0.2, 0.6, 0x9a8b78, 0, -0.15, 0));

  item(
    3,
    9,
    -3.5,
    4.2,
    () => {
      bx(1, 0.75, 1.5, 0xf5efde);
      rf(1.05, 0.38, 1.5, 0x8c4a32, 0, 0.75, 0);
      [-1, 1].forEach((s) => {
        bx(0.36, 1.35, 0.36, 0xf5efde, s * 0.32, 0, 0.62);
        bx(0.14, 0.16, 0.02, 0x2b3a42, s * 0.32, 0.95, 0.81);
        co(0.26, 0.5, 0x2f7a68, s * 0.32, 1.35, 0.62).rotation.y = PI / 4;
        bx(0.025, 0.2, 0.025, 0xd4a72c, s * 0.32, 1.85, 0.62);
      });
      bx(0.22, 0.34, 0.02, 0x5a3a22, 0, 0, 0.76);
      cy(0.1, 0.1, 0.02, 0x6fb3d9, 0, 0.55, 0.76, 12).rotation.x = PI / 2;
      bx(0.9, 0.06, 0.25, 0xdddddd, 0, 0, 0.9);
      placa("Catedral de São Sebastião", 2.2);
    },
    PI,
  );
  item(
    3,
    9,
    -5.6,
    2.4,
    () => {
      bx(1.5, 0.7, 1, 0xf0dfb8);
      rf(1.5, 0.28, 1, 0xb85c38, 0, 0.7, 0);
      rf(1.4, 0.3, 0.08, 0xf8f1dc, 0, 0.78, 0.66);
      bx(1.4, 0.08, 0.22, 0xffffff, 0, 0.7, 0.6);
      for (let i = 0; i < 4; i++)
        cy(0.05, 0.05, 0.7, 0xffffff, -0.45 + i * 0.3, 0, 0.62, 8);
      bx(1.2, 0.06, 0.3, 0xdddddd, 0, 0, 0.82);
      placa("Teatro Municipal", 1.5);
    },
    PI / 2,
  );
  item(3, 9, -3.5, 0.9, () => {
    bx(1, 0.5, 0.7, 0x9ec9e8);
    bx(1, 0.4, 0.7, 0xdceaf3, 0, 0.5);
    rf(0.8, 0.3, 1.1, 0x8c4a32, 0, 0.9, 0, PI / 2);
    bx(0.9, 0.03, 0.2, 0xffffff, 0, 0.5, 0.45);
    bx(0.16, 0.28, 0.02, 0x5a3a22, 0, 0, 0.35);
    placa("Casa de Jorge Amado", 1.55);
  });
  item(3, 9, 0, -4.5, () => {
    bx(0.9, 0.06, 2.6, 0x8a8f95, 0, 0.02);
    [-0.45, 0.45].forEach((x) => {
      const a = put(
        new THREE.Mesh(
          new THREE.TorusGeometry(1.2, 0.035, 6, 24, PI),
          mt(0xe8e8e8),
        ),
        x,
        0.08,
        0,
      );
      a.rotation.y = PI / 2;
      a.scale.y = 0.4;
    });
    placa("Ponte Lomanto Júnior", 0.9);
  });
  item(3, 9, 3.25, -7, () => bx(3.9, 0.2, 0.6, 0x9a8b78, 0, -0.15, 0));
  item(
    3,
    9,
    2.8,
    -7,
    () => {
      const c = 0xd8332a;
      bx(0.07, 1, 0.07, c, -0.18);
      bx(0.07, 1, 0.07, c, 0.18);
      bx(0.07, 0.07, 0.07, c, 0, 0.9);
      bx(0.1, 0.07, 1.5, c, 0, 1, 0.55);
      const tr = new THREE.Group();
      tr.position.set(0, 1, 0);
      cur.add(tr);
      cur = tr;
      bx(0.015, 0.5, 0.015, 0x222222, 0, -0.5, 0);
      bx(0.2, 0.1, 0.2, 0xe9b02c, 0, -0.6, 0);
      an.push((tt) => {
        tr.position.z = 0.6 + Math.sin(tt * 0.6) * 0.45;
      });
    },
    0,
    0.45,
  );
  item(
    3,
    9,
    1.9,
    -7,
    () =>
      [0xe0522d, 0x2f6fb3, 0xe9b02c, 0x3a9d5d].forEach((c, i) =>
        bx(0.35, 0.2, 0.3, c, (i % 2) * 0.4, Math.floor(i / 2) * 0.2, 0),
      ),
    0,
    0.45,
  );

  const navio = (len: number, cruzeiro: number) => () => {
    const q = new THREE.Group();
    cur.add(q);
    cur = q;
    if (cruzeiro) {
      bx(len, 0.3, 0.6, 0xffffff);
      bx(len, 0.05, 0.61, 0x2e6fb7, 0, 0.1);
      bx(len * 0.8, 0.18, 0.5, 0xf5f5f5, 0, 0.3);
      bx(len * 0.6, 0.18, 0.46, 0xffffff, 0, 0.48);
      bx(len * 0.4, 0.14, 0.4, 0xf5f5f5, 0.1, 0.66);
      cy(0.08, 0.08, 0.25, 0xe8742c, -0.2, 0.8, 0, 8);
      placa("Porto Sul · Cruzeiros", 1.6);
    } else {
      bx(len, 0.28, 0.55, 0x244a6b);
      bx(len, 0.05, 0.56, 0xd8332a, 0, 0.1);
      [0xe0522d, 0x2f6fb3, 0xe9b02c, 0x3a9d5d].forEach((c, i) =>
        bx(0.38, 0.2, 0.4, c, -0.7 + i * 0.42, 0.28),
      );
      bx(0.35, 0.4, 0.45, 0xffffff, len / 2 - 0.3, 0.28);
    }
    an.push((tt) => {
      q.position.y = Math.sin(tt * 1.3 + len) * 0.03;
      q.rotation.z = Math.sin(tt + len) * 0.02;
    });
  };
  item(3, 4, 4.4, -6.1, navio(2.2, 0), 0, 0.28);

  item(4, 9, -4.8, -2.3, () => {
    bx(1.6, 0.6, 0.9, 0x7b4a32);
    [-0.5, 0, 0.5].forEach((x) => rf(0.52, 0.22, 0.9, 0x5a3322, x, 0.6, 0));
    cy(0.09, 0.12, 1.1, 0xb55a3c, 0.55, 0, -0.2);
    bx(0.5, 0.2, 0.02, 0xffffff, -0.3, 0.2, 0.46);
    const fm: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 6),
        new THREE.MeshStandardMaterial({
          color: 0xeeeeee,
          transparent: true,
          roughness: 1,
        }),
      );
      cur.add(m);
      fm.push(m);
    }
    const pod = sp(0.15, 0xe0a21b, -0.55, 1.1, 0, 1, 1.7, 1);
    an.push((tt) => {
      fm.forEach((m, i) => {
        const p = (tt * 0.35 + i / 4) % 1;
        m.position.set(0.55 + p * 0.3, 1.15 + p * 0.9, -0.2);
        m.scale.setScalar(0.06 + p * 0.2);
        (m.material as THREE.MeshStandardMaterial).opacity = 0.7 * (1 - p);
      });
      pod.position.y = 1.1 + Math.sin(tt * 2) * 0.06;
    });
    placa("Polo do Chocolate", 1.9);
  });
  [
    [-2.8, 1],
    [-1.7, 1.3],
    [6.4, 1.2],
    [7.6, 1],
    [8.7, 0.9],
  ].forEach(([z, h], i) =>
    item(4, 4, -1.1, z!, () =>
      predio(0.8, h!, 0.8, ["#e8d9c4", "#cfe3ea", "#f0cfc0"][i % 3]!, "#5a86a3"),
    ),
  );
  [-2, 0.5, 2.5, 4.5, 7].forEach((z, i) =>
    item(
      4,
      9,
      cst(z) + 0.45,
      z,
      () => {
        cy(0.02, 0.02, 0.4, 0xffffff);
        co(0.32, 0.16, i % 2 ? 0xd8332a : 0xf2c744, 0, 0.4, 0, 8);
        bx(0.22, 0.12, 0.22, 0xe9d8a6, 0.3, 0, 0);
        if (!i) placa("Orla · Av. Soares Lopes", 1.1);
      },
      i,
      0.33,
    ),
  );
  [
    [-0.17, 0x2f6fb3, 0.9, 3],
    [0.17, 0xd8332a, 0.7, 3],
    [-0.17, 0xf2c744, 1.3, 4],
    [0.17, 0x3a9d5d, 0.5, 4],
    [-0.17, 0xffffff, 0.8, 5],
  ].forEach(([x, c, v, mn], i) =>
    item(mn!, 9, x!, 0, () => {
      const q = new THREE.Group();
      q.position.y = 0.02;
      cur.add(q);
      cur = q;
      bx(0.2, 0.08, 0.38, c!);
      bx(0.17, 0.07, 0.18, 0x223344, 0, 0.08, -0.03);
      const d = x! < 0 ? 1 : -1;
      an.push((tt) => {
        q.position.z = (((tt * v! * d + i * 3.3) % 18) + 18) % 18 - 9;
        q.rotation.y = d > 0 ? 0 : PI;
      });
    }),
  );

  [
    [-2.8, 2.4],
    [-1.7, 3],
    [6.4, 3.4],
    [7.6, 2.6],
    [8.7, 2],
  ].forEach(([z, h], i) =>
    item(5, 9, -1.1, z!, () =>
      predio(0.85, h!, 0.85, ["#dfe7ee", "#b9c7d3", "#e6e0f0"][i % 3]!, "#3f6f94"),
    ),
  );
  item(
    5,
    9,
    2.2,
    4.6,
    () => {
      const q = new THREE.Group();
      q.position.y = 1.3;
      cur.add(q);
      const gd: THREE.Group[] = [];
      q.add(new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.035, 6, 32), mt(0xffffff)));
      for (let i = 0; i < 6; i++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.02, 0.02), mt(0xdddddd));
        s.rotation.z = (i * PI) / 6;
        q.add(s);
      }
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * 2 * PI;
        const h = new THREE.Group();
        h.position.set(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0);
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(0.17, 0.15, 0.15),
          new THREE.MeshBasicMaterial({
            color: [0xff5a4d, 0xffd23f, 0x3fa9f5, 0x5fd068][i % 4],
          }),
        );
        b.position.y = -0.12;
        h.add(b);
        q.add(h);
        gd.push(h);
      }
      bx(0.06, 1.35, 0.06, 0xcccccc, -0.35, 0, 0).rotation.z = -0.26;
      bx(0.06, 1.35, 0.06, 0xcccccc, 0.35, 0, 0).rotation.z = 0.26;
      an.push((tt) => {
        q.rotation.z = tt * 0.25;
        gd.forEach((h) => {
          h.rotation.z = -q.rotation.z;
        });
      });
      placa("Roda-gigante da Orla", 2.7);
    },
    0,
    0.33,
  );
  item(5, 9, -2.6, -7.4, () => {
    bx(0.7, 0.015, 3.6, 0x333333);
    for (let i = 0; i < 7; i++) bx(0.04, 0.02, 0.25, 0xffffff, 0, 0, -1.5 + i * 0.5);
    bx(0.7, 0.35, 1.4, 0xe8edf0, 1.3, 0, 0);
    bx(0.72, 0.06, 1.45, 0x6fb3d9, 1.3, 0.35, 0);
    cy(0.06, 0.06, 0.7, 0xffffff, 1.3, 0, 0.9, 8);
    bx(0.2, 0.12, 0.2, 0x6fb3d9, 1.3, 0.7, 0.9);
    placa("Aeroporto Jorge Amado", 1.4);
  });
  item(5, 9, 4.25, -9.2, () => bx(2.1, 0.2, 0.7, 0x8c8f93, 0, -0.15, 0));
  item(5, 9, 4.8, -8.1, navio(2.4, 1), 0, 0.28);
  [
    [-9, 4.2],
    [-9.2, -2.8],
  ].forEach(([x, z], i) =>
    item(5, 9, x!, z!, () => {
      cy(0.04, 0.07, 1.9, 0xffffff);
      bx(0.2, 0.1, 0.1, 0xeeeeee, 0, 1.88);
      const b = new THREE.Group();
      b.position.set(0.12, 1.93, 0);
      cur.add(b);
      for (let k = 0; k < 3; k++) {
        const geo = new THREE.BoxGeometry(0.015, 0.9, 0.09);
        geo.translate(0, 0.45, 0);
        const l = new THREE.Mesh(geo, mt(0xffffff));
        l.rotation.x = k * 2.094;
        b.add(l);
      }
      an.push((tt) => {
        b.rotation.x = tt * 1.6 + i;
      });
    }),
  );
  item(5, 9, -0.62, 0, () => {
    bx(0.18, 0.02, 17, 0xd9544d);
    bx(0.18, 0.02, 17, 0xd9544d, 1.24, 0, 0);
  });

  const aviao = new THREE.Group();
  cur = aviao;
  bx(0.8, 0.1, 0.1, 0xf5f5f5, -0.4);
  bx(0.12, 0.02, 0.9, 0xd8332a, -0.35, 0.04);
  bx(0.08, 0.2, 0.02, 0xd8332a, -0.75, 0.05);
  bx(0.08, 0.02, 0.35, 0xd8332a, -0.75, 0.05);
  aviao.scale.setScalar(1.3);
  aviao.visible = false;
  g.add(aviao);
  cur = g;

  const gaiv: Gaivota[] = [];
  for (let i = 0; i < 4; i++) {
    const h = new THREE.Group();
    cur = h;
    const lGeo = new THREE.BoxGeometry(0.3, 0.02, 0.08);
    lGeo.translate(0.15, 0, 0);
    const rGeo = new THREE.BoxGeometry(0.3, 0.02, 0.08);
    rGeo.translate(-0.15, 0, 0);
    const l = new THREE.Mesh(lGeo, mt(0xffffff));
    const r = new THREE.Mesh(rGeo, mt(0xffffff));
    h.add(l, r);
    sp(0.05, 0xffffff, 0, 0, 0, 1, 1, 1.8);
    g.add(h);
    gaiv.push({ h, l, r, i });
    cur = g;
  }

  const nuv: THREE.Group[] = [];
  for (let i = 0; i < 5; i++) {
    const h = new THREE.Group();
    cur = h;
    [
      [0, 0, 0, 1],
      [0.8, -0.1, 0.2, 0.75],
      [-0.8, -0.1, -0.1, 0.7],
    ].forEach(([x, y, z, s]) => sp(s!, 0xffffff, x!, y!, z!, 1.3, 0.7, 1));
    h.children.forEach((m) => {
      (m as THREE.Mesh).material = mt(0xffffff, {
        transparent: true,
        opacity: 0.9,
        roughness: 1,
      });
    });
    h.position.set(-16 + i * 7, 7 + (i % 2) * 1.5, -8 + i * 4);
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
    for (let i = 0; i < pm.count; i++) {
      pm.setZ(
        i,
        Math.sin(mx[i]! * 0.9 + t * 1.5) * 0.04 +
          Math.cos(my[i]! * 1.1 + t * 1.2) * 0.04,
      );
    }
    pm.needsUpdate = true;
    gaiv.forEach(({ h, l, r, i }) => {
      const a = t * (0.3 + i * 0.05) + i * 1.6;
      h.position.set(
        3 + Math.cos(a) * (5 + i * 1.2),
        3.5 + i * 0.4 + Math.sin(t + i) * 0.2,
        Math.sin(a) * (5 + i * 1.2),
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
        Math.cos(a) * 8,
        3.5 + Math.sin(a * 2) * 0.3,
        Math.sin(a) * 8,
      );
      aviao.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
    }
    noite += ((nivel === 5 ? 1 : 0) - noite) * Math.min(1, dt * 1.5);
    winM.forEach((m) => {
      m.emissiveIntensity = noite;
    });
  };

  return g;
}
