import * as THREE from "three";

export type MorroSaoPauloGroup = THREE.Group & {
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

type Fogo = {
  geo: THREE.BufferGeometry;
  mat: THREE.PointsMaterial;
  dir: [number, number, number][];
  o: [number, number, number];
  k: number;
  N: number;
  pos: Float32Array;
};

export function criarMorroSaoPaulo(): MorroSaoPauloGroup {
  const g = new THREE.Group() as MorroSaoPauloGroup;
  g.name = "MorroSaoPaulo";
  const PI = Math.PI;
  let sd = 11;
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
      new THREE.Mesh(
        q,
        Array.isArray(c) ? c : typeof c === "number" ? mt(c) : c,
      ),
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
    const mat = typeof c === "number" ? mt(c) : c;
    const o = put(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat), x, y, z);
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

  const cabo = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    r: number,
    c: number,
  ) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const L = d.length();
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 6), mt(c));
    o.position.copy(a).addScaledVector(d, 0.5);
    o.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      d.normalize(),
    );
    cur.add(o);
    return o;
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
  let nivel = 0;
  let t = 0;
  let vai = true;
  let mostrarNomes = true;
  let noite = 0;
  let raio: THREE.MeshBasicMaterial | null = null;

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

  const CX = -0.3;
  const hw = (z: number) =>
    (3.9 + 0.5 * Math.sin(z * 0.5)) *
    Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(z) / 10, 6)));
  const ee = (z: number) => CX + hw(z);
  const ww = (z: number) => CX - hw(z);

  const forma = (oe: number, ow: number) => {
    const p: THREE.Vector2[] = [];
    for (let z = -9.9; z <= 9.91; z += 0.4) {
      const h = hw(z);
      p.push(new THREE.Vector2(CX + h + oe * Math.min(1, h / 2), -z));
    }
    for (let z = 9.9; z >= -9.91; z -= 0.4) {
      const h = hw(z);
      p.push(new THREE.Vector2(CX - h - ow * Math.min(1, h / 2), -z));
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
  put(new THREE.Mesh(new THREE.CylinderGeometry(10.95, 10.95, 0.3, 64), mt(0x14608f)), 0, -0.15, 0);
  const mar = put(
    new THREE.Mesh(
      new THREE.RingGeometry(0.01, 10.9, 64, 20),
      mt(0x1fa3d8, { roughness: 0.3 }),
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
  ext(forma(2.6, 1.4), 0.33, 0x45d6c8);
  ext(forma(0.8, 0.5), 0.36, 0xf0dfae);
  ext(forma(0, 0), 0.4, 0x6fb256);

  const hh = (dx: number, dz: number) =>
    0.6 * Math.sqrt(Math.max(0, 6.76 - dx * dx - dz * dz));
  item(0, 9, -0.5, -6.2, () => dome(2.6, 0.6, 0x3f8f3a, 0, -0.05, 0));
  (
    [
      [1.5, 0.6],
      [0.6, 1.7],
      [1.1, -1.0],
      [-1.2, -1.3],
      [0, -1.8],
      [1.9, -0.3],
      [-0.2, 0.9],
      [-1.5, -0.2],
    ] as const
  ).forEach(([dx, dz], i) =>
    item(
      0,
      9,
      -0.5 + dx,
      -6.2 + dz,
      () => {
        cy(0.04, 0.06, 0.3, 0x6b4a2a, 0, 0, 0, 6);
        sp(0.34, i % 2 ? 0x2f7d32 : 0x3b9a3c, 0, 0.5, 0, 1, 0.9, 1);
      },
      i,
      0.4 + hh(dx, dz) - 0.15,
    ),
  );

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

  item(
    0,
    9,
    -8,
    0.8,
    () => {
      dome(0.9, 0.7, 0x4f9e44, 0, -0.1, 0);
      palma();
      placa("Ilha da Saudade", 1.5);
    },
    0,
    0.3,
  );
  item(0, 9, -7.6, -6, () => dome(0.55, 0.7, 0x5fae4a, 0, -0.1, 0), 0, 0.3);

  const del: Array<{ d: THREE.Group; i: number }> = [];
  for (let i = 0; i < 2; i++) {
    const d = new THREE.Group();
    cur = d;
    sp(0.1, 0x6d7b8a, 0, 0, 0, 2.8, 0.9, 0.9);
    co(0.05, 0.12, 0x5a6877, 0, 0.07, 0, 3);
    sp(0.05, 0x6d7b8a, 0.3, -0.01, 0, 1.6, 0.6, 0.6);
    g.add(d);
    del.push({ d, i });
    cur = g;
  }
  [-5, -3, -1, 1, 3, 5, 7].forEach((z) =>
    item(0, 9, ee(z) + 0.1, z, palma, z, 0.33),
  );
  [-5, -2, 2, 5].forEach((z) =>
    item(0, 9, ww(z) - 0.05, z, palma, z + 1, 0.33),
  );

  item(
    1,
    9,
    -2.8,
    -8.3,
    () => {
      const p = 0xb9a98a;
      bx(1.7, 0.5, 1.5, p);
      for (let i = 0; i < 6; i++) {
        bx(0.16, 0.14, 0.16, p, -0.72 + i * 0.29, 0.5, 0.67);
        bx(0.16, 0.14, 0.16, p, -0.72 + i * 0.29, 0.5, -0.67);
      }
      for (let i = 0; i < 3; i++) {
        bx(0.16, 0.14, 0.16, p, -0.77, 0.5, -0.35 + i * 0.35);
        bx(0.16, 0.14, 0.16, p, 0.77, 0.5, -0.35 + i * 0.35);
      }
      (
        [
          [-0.85, -0.75],
          [0.85, -0.75],
          [-0.85, 0.75],
          [0.85, 0.75],
        ] as const
      ).forEach(([x, z]) => {
        cy(0.2, 0.22, 0.75, p, x, 0, z, 8);
        co(0.24, 0.2, 0x8c4a32, x, 0.75, z, 8);
      });
      bx(0.34, 0.38, 0.03, 0x3a2a1a, 0, 0, 0.76);
      [-0.4, 0.4].forEach((x) => {
        cy(0.04, 0.05, 0.4, 0x2b2b2b, x, 0.5, 0.5, 8).rotation.x = PI / 2.6;
      });
      cy(0.015, 0.015, 0.8, 0x5a3a22, 0, 0.5, 0, 5);
      const fl = bx(0.3, 0.18, 0.01, 0xd8332a, 0.16, 1.1, 0);
      an.push((tt) => {
        fl.rotation.y = Math.sin(tt * 3) * 0.35;
      });
      placa("Fortaleza de Tapirandu", 1.9);
    },
    PI / 6,
  );

  const choupana = () => {
    bx(0.5, 0.3, 0.5, 0xd9c08f);
    co(0.5, 0.4, 0xb89452, 0, 0.3, 0, 4).rotation.y = PI / 4;
    bx(0.12, 0.2, 0.02, 0x4a3320, 0, 0, 0.25);
  };
  (
    [
      [-3.0, 0.2],
      [-3.3, 1.6],
      [-2.9, 3.1],
      [-2.9, -1],
      [-2.9, 4.6],
    ] as const
  ).forEach(([x, z], i) => item(1, 2, x, z, choupana, i));

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
  barco(1, 2, -6, -0.4, () => {
    sp(0.3, 0x8a5a32, 0, 0.05, 0, 1.7, 0.4, 0.45);
    sp(0.07, 0xe8a317, 0.1, 0.25, 0);
  });
  barco(1, 2, 5.8, -2.5, () => {
    sp(0.3, 0x8a5a32, 0, 0.05, 0, 1.7, 0.4, 0.45);
    sp(0.07, 0xd8332a, -0.1, 0.25, 0);
  });

  item(
    2,
    9,
    -3.2,
    -3.4,
    () => {
      const c = 0x9a8f7a;
      bx(0.4, 1.2, 0.5, c, -0.5);
      bx(0.4, 1.2, 0.5, c, 0.5);
      put(
        new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.12, 6, 14, PI), mt(c)),
        0,
        1.2,
        0,
      );
      [-0.64, 0.64].forEach((x) => bx(0.28, 0.6, 0.5, c, x, 1.2, 0));
      bx(1.6, 0.25, 0.5, c, 0, 1.82, 0);
      [-0.7, 0.7].forEach((x) => co(0.12, 0.25, c, x, 2.07, 0, 4));
      co(0.1, 0.28, 0x8c4a32, 0, 2.07, 0, 4);
      placa("Portal de Morro de São Paulo", 2.7);
    },
    PI / 2,
  );
  item(
    2,
    9,
    -1.6,
    -1.2,
    () => {
      bx(0.8, 0.55, 1.1, 0xf8f4ea);
      rf(0.86, 0.3, 1.15, 0xb5502f, 0, 0.55, 0);
      bx(0.35, 1, 0.35, 0xf8f4ea, 0, 0, 0.7);
      co(0.25, 0.35, 0x2e6fb7, 0, 1, 0.7, 4).rotation.y = PI / 4;
      bx(0.025, 0.2, 0.025, 0xd4a72c, 0, 1.33, 0.7);
      bx(0.16, 0.26, 0.02, 0x5a3a22, 0, 0, 0.88);
      bx(0.1, 0.12, 0.02, 0x2d4a63, 0, 0.62, 0.88);
      placa("Igrejinha de N. Sra. da Luz", 1.9);
    },
    PI / 2,
  );
  item(
    2,
    9,
    -2.1,
    -0.2,
    () => {
      const p = 0xa59b86;
      bx(1.1, 0.75, 0.35, p);
      bx(0.4, 0.45, 0.05, 0x2a2a2a, 0, 0.12, 0.18);
      cy(0.2, 0.2, 0.04, p, 0, 0.57, 0.18, 12);
      bx(1.15, 0.14, 0.55, p, 0, 0, 0.5);
      bx(1.0, 0.11, 0.45, 0x3aa0e0, 0, 0.04, 0.5);
      cy(0.02, 0.02, 0.2, 0x8fd8ff, 0, 0.25, 0.22, 6);
      placa("Fonte Grande (1746)", 1.35);
    },
    PI / 2,
  );
  item(2, 9, 0, -1.2, () => {
    cy(0.95, 0.95, 0.03, 0xc9c2b0, 0, 0, 0, 24);
    placa("Praça Aureliano Lima", 1.6);
  });
  item(2, 9, 0.45, -1.55, () => {
    cy(0.06, 0.08, 0.5, 0x6b4a2a, 0, 0, 0, 6);
    sp(0.55, 0x2f8f3a, 0, 0.85, 0, 1.2, 0.7, 1.2);
    sp(0.35, 0x3c9f40, 0.4, 0.95, 0.1);
  });

  const casa = (c: number) => () => {
    bx(0.9, 0.5, 0.7, c);
    bx(0.93, 0.04, 0.73, 0xffffff, 0, 0.5);
    rf(0.77, 0.3, 0.97, 0xb5502f, 0, 0.54, 0, PI / 2);
    bx(0.16, 0.28, 0.02, 0x5a3a22, 0, 0, 0.35);
    bx(0.14, 0.14, 0.02, 0x2d4a63, -0.3, 0.22, 0.35);
    bx(0.14, 0.14, 0.02, 0x2d4a63, 0.3, 0.22, 0.35);
  };
  (
    [
      [-1.1, 0.4, 0xf4a6a0, PI / 2],
      [-1.1, 1.7, 0xf2d15c, PI / 2],
      [-1.1, 3, 0x7fb8d9, PI / 2],
      [1.1, 0.5, 0xe98f4a, -PI / 2],
      [1.1, 1.8, 0x8fc99a, -PI / 2],
      [1.1, 3.1, 0xf4a6a0, -PI / 2],
      [0.9, -3, 0x7fb8d9, 0],
      [-1, -3, 0xf2d15c, 0],
    ] as const
  ).forEach(([x, z, c, r]) => item(2, 9, x, z, casa(c), r));

  const rua = (c: number) => () => {
    bx(0.7, 0.015, 12.6, c, 0, 0, 2.8);
    bx(3.4, 0.015, 0.55, c, 1.7, 0, -1.2);
  };
  item(2, 2, 0, 0, rua(0xe8d3a0));
  item(3, 9, 0, 0, rua(0x9c968a));
  item(2, 9, -5, -2, () => {
    bx(2.6, 0.2, 0.5, 0x8b5e3c, 0, -0.15, 0);
    [-1.1, 0, 1.1].forEach((x) =>
      [-0.2, 0.2].forEach((z) =>
        cy(0.04, 0.04, 0.5, 0x5a3a22, x, -0.4, z, 6),
      ),
    );
  });
  barco(2, 3, -6.4, 1.6, () => {
    bx(1.1, 0.18, 0.4, 0x7a4a2a);
    cy(0.025, 0.025, 0.9, 0x5a3a22, 0.1, 0.15, 0, 6);
    rf(0.75, 0.85, 0.03, 0xf5f0e0, 0.3, 0.3, 0);
  });
  barco(2, 3, 7.4, 3, () => {
    bx(1.1, 0.18, 0.4, 0x2e6fb7);
    cy(0.025, 0.025, 0.9, 0x5a3a22, 0.1, 0.15, 0, 6);
    rf(0.75, 0.85, 0.03, 0xffd23f, 0.3, 0.3, 0);
  });

  raio = new THREE.MeshBasicMaterial({
    color: 0xffeaa0,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  item(
    3,
    9,
    -0.5,
    -6.2,
    () => {
      bx(0.8, 0.4, 0.8, 0xf4f0e6);
      cy(0.28, 0.22, 1.5, 0xf8f8f4, 0, 0.4, 0, 16);
      cy(0.265, 0.255, 0.2, 0xd8332a, 0, 0.9, 0, 16);
      cy(0.34, 0.34, 0.06, 0x333333, 0, 1.9, 0, 16);
      cy(0.17, 0.17, 0.32, 0xa8dcec, 0, 1.96, 0, 12);
      co(0.2, 0.2, 0x333333, 0, 2.28, 0, 12);
      const b = new THREE.Group();
      b.position.y = 2.1;
      cur.add(b);
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 0.12), raio!);
      m.position.x = 1.1;
      b.add(m);
      an.push((tt) => {
        b.rotation.y = tt * 1.8;
      });
      placa("Farol do Morro", 2.8);
    },
    0,
    1.85,
  );

  (
    [
      [0, 0xd8332a],
      [1, 0x2e6fb7],
      [2, 0xf2c744],
      [3, 0x3a9d5d],
      [4, 0xe05fa5],
    ] as const
  ).forEach(([i, c]) => {
    const a = PI * 0.12 + i * PI * 0.44;
    item(
      3,
      9,
      Math.cos(a) * 1.2,
      -1.2 + Math.sin(a) * 1.2,
      () => {
        bx(0.4, 0.18, 0.28, 0x8b5e3c);
        co(0.36, 0.22, c, 0, 0.5, 0, 8);
        cy(0.015, 0.015, 0.5, 0x5a3a22, -0.15, 0, -0.1, 5);
        cy(0.015, 0.015, 0.5, 0x5a3a22, 0.15, 0, 0.1, 5);
        sp(0.05, lamp, 0, 0.42, 0);
        if (!i) placa("Feirinha de artesanato", 1.2);
      },
      a,
    );
  });

  const pousada = (w: number, fl: number) => () => {
    bx(w, 0.45 * fl + 0.1, 0.8, 0xf6efe0);
    for (let k = 1; k < fl; k++) bx(w + 0.1, 0.04, 0.95, 0x8b5e3c, 0, 0.45 * k, 0);
    co(w * 0.75, 0.4, 0xc9a24a, 0, 0.45 * fl + 0.1, 0, 8).scale.set(1, 1, 0.8);
    bx(0.16, 0.28, 0.02, 0x5a3a22, 0, 0, 0.4);
    bx(0.14, 0.14, 0.02, 0x2e6fb7, -0.35, 0.2, 0.4);
    bx(0.14, 0.14, 0.02, 0x2e6fb7, 0.35, 0.2, 0.4);
  };
  (
    [
      [-2.5, 1, PI / 2],
      [-2.5, 2.6, PI / 2],
      [2.1, -3.1, 0],
    ] as const
  ).forEach(([x, z, r]) => item(3, 9, x, z, pousada(1.1, 2), r));

  item(
    3,
    3,
    -6,
    -3.4,
    () => {
      const q = new THREE.Group();
      cur.add(q);
      cur = q;
      bx(1.7, 0.16, 0.5, 0xffffff);
      bx(1.3, 0.2, 0.46, 0x2e6fb7, 0, 0.16, 0);
      bx(1.1, 0.07, 0.47, 0x1f2c40, 0, 0.3, 0);
      bx(0.5, 0.18, 0.3, 0xffffff, -0.2, 0.36, 0);
      an.push((tt) => {
        q.position.y = Math.sin(tt * 1.3) * 0.03;
        q.rotation.z = Math.sin(tt) * 0.02;
      });
      placa("Catamarã de Salvador", 1.2);
    },
    0,
    0.28,
  );

  (
    [
      [-0.17, 0, 3],
      [0.17, 1, 3],
    ] as const
  ).forEach(() =>
    item(3, 9, 0, 0, () => {
      const q = new THREE.Group();
      q.position.y = 0.02;
      cur.add(q);
      cur = q;
      bx(0.3, 0.08, 0.22, 0x8b5e3c, 0, 0.12, 0);
      [-0.1, 0.1].forEach((s) => {
        cy(0.07, 0.07, 0.03, 0x222222, 0, 0.07, s * 1.5, 8).rotation.x =
          PI / 2;
      });
      bx(0.32, 0.16, 0.1, 0x6b4a2a, 0, 0.12, 0.3);
      sp(0.06, 0x6b4a2a, 0, 0.32, 0.34, 1, 1, 1.5);
      an.push((tt) => {
        q.position.z = 3 + Math.sin(tt * 0.2) * 5.5;
        q.rotation.y = Math.cos(tt * 0.2) > 0 ? 0 : PI;
      });
    }),
  );

  const guarda = (c: number) => () => {
    cy(0.02, 0.02, 0.45, 0xffffff);
    co(0.34, 0.16, c, 0, 0.45, 0, 8);
  };
  [-2.3, -0.2, 0.9, 2.4, 3.9].forEach((z, i) =>
    item(
      3,
      9,
      ee(z) + 0.55,
      z,
      guarda(i % 2 ? 0xd8332a : 0xf2c744),
      i,
      0.33,
    ),
  );

  item(
    4,
    9,
    -2.4,
    -5,
    () => {
      bx(1, 0.1, 0.9, 0x8b5e3c);
      (
        [
          [-0.4, -0.35],
          [0.4, -0.35],
          [-0.4, 0.35],
          [0.4, 0.35],
        ] as const
      ).forEach(([x, z]) => {
        cy(0.04, 0.05, 0.5, 0x5a3a22, x, -0.5, z, 6);
        cy(0.03, 0.03, 0.7, 0x5a3a22, x, 0.1, z, 6);
      });
      co(0.75, 0.4, 0xc9a24a, 0, 0.8, 0, 8);
      (
        [
          [-0.2, 0],
          [0.2, 0.15],
        ] as const
      ).forEach(([x, z]) => {
        bx(0.25, 0.05, 0.25, 0xffffff, x, 0.25, z);
        cy(0.02, 0.02, 0.2, 0x5a3a22, x, 0.1, z, 5);
      });
      sp(0.05, lamp, 0, 0.78, 0);
      placa("Toca do Morcego · pôr do sol", 1.5);
    },
    PI / 2,
    1.13,
  );

  item(4, 9, 0.2, -6, () => {
    const a = new THREE.Vector3(0, 0.8, 0);
    const b = new THREE.Vector3(3.2, -0.85, 5.4);
    bx(0.06, 0.6, 0.06, 0xb9bcc2, 0, 0.1, 0);
    bx(0.06, 0.7, 0.06, 0xb9bcc2, 3.2, -1.5, 5.4);
    cabo(a, b, 0.012, 0x333333);
    const ig = cur;
    const r = new THREE.Group();
    ig.add(r);
    cur = r;
    bx(0.07, 0.16, 0.05, 0xe0522d, 0, -0.3, 0);
    sp(0.045, 0xf0c9a0, 0, -0.1, 0);
    bx(0.01, 0.12, 0.01, 0x333333, 0, -0.14, 0);
    cur = ig;
    an.push((tt) => {
      const s = (tt * 0.12) % 1.3;
      const p = Math.min(1, s);
      r.visible = s < 1.05;
      r.position.lerpVectors(a, b, Math.pow(p, 1.3));
    });
    placa("Tirolesa do Farol", 1.3, 1.6, 2.7);
  });

  [0, 1.1, 2.2, 3.3].forEach((z, i) =>
    item(
      4,
      9,
      ee(z) - 0.25,
      z,
      () => {
        (
          [
            [-0.25, -0.25],
            [0.25, -0.25],
            [-0.25, 0.25],
            [0.25, 0.25],
          ] as const
        ).forEach(([x, zz]) => cy(0.02, 0.02, 0.5, 0x5a3a22, x, 0, zz, 5));
        co(0.5, 0.3, 0xc9a24a, 0, 0.5, 0, 8);
        bx(0.5, 0.18, 0.16, 0x8b5e3c, 0, 0, 0.3);
        bx(
          0.4,
          0.1,
          0.12,
          [0xd8332a, 0x2e6fb7, 0xf2c744, 0x3a9d5d][i]!,
          0,
          0.18,
          0.3,
        );
        if (!i) placa("Segunda Praia", 1.2);
      },
      -PI / 2,
    ),
  );
  [-1.2, 0.4, 1.6, 3.1].forEach((z, i) =>
    item(
      4,
      9,
      ee(z) + 0.95,
      z,
      guarda(i % 2 ? 0xffffff : 0x2e6fb7),
      i,
      0.33,
    ),
  );
  item(4, 9, 2.4, 4.3, pousada(1.4, 3), PI / 2);
  item(4, 9, -2.5, 5.4, pousada(1.2, 2), PI / 2);

  const lancha = (x: number, z: number, c: number) =>
    barco(4, 9, x, z, () => {
      bx(0.9, 0.15, 0.32, 0xffffff);
      bx(0.5, 0.04, 0.34, c, 0, 0.1, 0);
      bx(0.35, 0.2, 0.26, 0xdcecf5, 0.1, 0.15, 0);
      bx(0.4, 0.03, 0.3, c, 0.1, 0.35, 0);
    });
  lancha(6.6, -1, 0xd8332a);
  lancha(7.4, 0.8, 0x2e6fb7);
  lancha(-7, -3.5, 0xf2c744);

  item(
    5,
    9,
    0.4,
    7.7,
    () => {
      const w = 0xf6efe0;
      bx(2.4, 0.9, 1.1, w);
      bx(2, 0.6, 0.9, w, 0, 0.9, 0);
      bx(2.2, 0.05, 0.3, 0x8b5e3c, 0, 0.9, 0.6);
      co(1.5, 0.7, 0xc9a24a, 0, 1.5, 0, 10).scale.set(1.25, 1, 0.7);
      for (let i = 0; i < 5; i++)
        bx(0.28, 0.3, 0.02, 0x2e6fb7, -0.9 + i * 0.45, 0.3, 0.56);
      bx(0.3, 0.5, 0.02, 0x5a3a22, 0, 0, 0.56);
      placa("Resort Quarta Praia", 2.5);
    },
    PI / 2,
  );
  item(5, 9, 1.9, 5.8, () => {
    bx(1.7, 0.05, 0.9, 0xf5f5f5);
    bx(1.5, 0.07, 0.7, 0x39c6e8, 0, 0, 0);
    [-0.6, -0.2, 0.2, 0.6].forEach((x) =>
      bx(0.22, 0.08, 0.4, 0xffffff, x, 0, 0.65),
    );
    [-0.4, 0.4].forEach((x) => {
      cy(0.02, 0.02, 0.5, 0xffffff, x, 0, -0.65, 5);
      co(0.3, 0.12, 0xe05fa5, x, 0.5, -0.65, 8);
    });
  });
  (
    [
      [-2, 7.2],
      [-2, 8.3],
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
  [5, 6.4, 7.8].forEach((z, i) =>
    item(
      5,
      9,
      5.6,
      z,
      () => {
        (
          [
            [-0.3, -0.3],
            [0.3, -0.3],
            [-0.3, 0.3],
            [0.3, 0.3],
          ] as const
        ).forEach(([x, zz]) =>
          cy(0.03, 0.03, 0.45, 0x5a3a22, x, -0.3, zz, 5),
        );
        bx(0.9, 0.06, 0.9, 0x8b5e3c, 0, 0.15, 0);
        bx(0.6, 0.35, 0.6, 0xffffff, 0, 0.21, 0);
        co(0.55, 0.3, 0xc9a24a, 0, 0.56, 0, 8);
        if (!i) placa("Palafitas", 1.3);
      },
      0,
      0.33,
    ),
  );
  item(
    5,
    9,
    4.7,
    6.4,
    () => {
      bx(0.3, 0.06, 3.6, 0x8b5e3c, 0, 0.15, 0);
      [-1.6, 0, 1.6].forEach((z) =>
        cy(0.03, 0.03, 0.45, 0x5a3a22, 0, -0.3, z, 5),
      );
    },
    0,
    0.33,
  );
  item(5, 9, -6, 4.2, () => {
    bx(2.8, 0.2, 0.5, 0x8b5e3c, 0, -0.15, 0);
    [-1.2, 0, 1.2].forEach((x) =>
      [-0.2, 0.2].forEach((z) =>
        cy(0.04, 0.04, 0.5, 0x5a3a22, x, -0.4, z, 6),
      ),
    );
    placa("Marina · Iates", 1.2);
  });
  (
    [
      [-6.2, 3.3],
      [-5.8, 5.1],
    ] as const
  ).forEach(([x, z]) =>
    barco(5, 9, x, z, () => {
      bx(1.5, 0.2, 0.48, 0xffffff);
      bx(1.5, 0.05, 0.49, 0x1f3a6b, 0, 0.08, 0);
      bx(0.8, 0.2, 0.38, 0xf5f5f5, -0.1, 0.2, 0);
      bx(0.5, 0.16, 0.3, 0xdcecf5, -0.1, 0.4, 0);
      cy(0.01, 0.01, 0.5, 0xffffff, -0.2, 0.56, 0, 4);
    }),
  );

  const fogos: Fogo[] = [];
  item(5, 9, 0, 0, () => {
    (
      [
        [6.5, 6, -4, 0xffd23f],
        [-7, 6.5, 2, 0xff5aa5],
        [0, 7.5, -9, 0x5fd0ff],
      ] as const
    ).forEach(([x, y, z, c], k) => {
      const N = 48;
      const pos = new Float32Array(N * 3);
      const dir: [number, number, number][] = [];
      for (let i = 0; i < N; i++) {
        const a = rnd() * PI * 2;
        const b = Math.acos(2 * rnd() - 1);
        dir.push([
          Math.sin(b) * Math.cos(a),
          Math.cos(b),
          Math.sin(b) * Math.sin(a),
        ]);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: c,
        size: 0.16,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const P = new THREE.Points(geo, mat);
      P.frustumCulled = false;
      cur.add(P);
      fogos.push({ geo, mat, dir, o: [x, y, z], k, N, pos });
    });
  }, 0, 0);

  const gaiv: Array<{
    h: THREE.Group;
    l: THREE.Mesh;
    r: THREE.Mesh;
    i: number;
  }> = [];
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
    h.position.set(-16 + i * 7, 7 + (i % 2) * 1.5, -8 + i * 4);
    g.add(h);
    nuv.push(h);
    cur = g;
  }

  const aplicar = () =>
    itens.forEach((it) => {
      it.alvoNovo = nivel >= it.min && nivel <= it.max ? 1 : 0;
      it.atraso = rnd() * 0.7;
    });

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
    del.forEach(({ d, i }) => {
      const a = (t * 0.3 + i * 0.5) % 1;
      if (a < 0.45) {
        const u = a / 0.45;
        d.visible = true;
        d.position.set(
          6.8 + i * 1.2 + u * 1.6,
          0.3 + Math.sin(u * PI) * 0.55 - 0.08,
          i ? 3.6 : -4.6,
        );
        d.rotation.z = Math.cos(u * PI) * 0.8;
      } else d.visible = false;
    });
    noite += ((nivel === 5 ? 1 : 0) - noite) * Math.min(1, dt * 1.5);
    lamp.emissiveIntensity = 0.5 + 1.1 * noite;
    if (raio) raio.opacity = 0.18 + 0.45 * noite;
    if (nivel >= 5)
      fogos.forEach((f) => {
        const u = ((t + f.k * 1.3) % 3.6) / 3.6;
        const e = Math.min(1, u / 0.45);
        const R = 2 * (1 - (1 - e) * (1 - e));
        for (let i = 0; i < f.N; i++) {
          const d = f.dir[i]!;
          f.pos[i * 3] = f.o[0] + d[0] * R;
          f.pos[i * 3 + 1] = f.o[1] + d[1] * R - u * u * 1.2;
          f.pos[i * 3 + 2] = f.o[2] + d[2] * R;
        }
        f.geo.attributes.position!.needsUpdate = true;
        f.mat.opacity = u < 0.45 ? 1 : Math.max(0, 1 - (u - 0.45) / 0.55);
        f.mat.size = u < 0.05 ? 0.05 : 0.16;
      });
  };

  return g;
}
