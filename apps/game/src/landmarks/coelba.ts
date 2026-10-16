import * as THREE from "three";

export type CoelbaGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    alternarLanca: () => boolean;
  };
};

export function criarCoelba(): CoelbaGroup {
  const g = new THREE.Group() as CoelbaGroup;
  g.name = "Coelba";
  const PI = Math.PI;

  const M = (c: number, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o || {}));

  const m = {
    gravel: M(0xb9b9b6),
    road: M(0x9d9a92),
    curb: M(0xd5d3cb),
    conc: M(0xcac9c1),
    concD: M(0x8b8d8f),
    grey: M(0x9a9ea3),
    grey2: M(0x7d8186),
    dark: M(0x23252a),
    white: M(0xf3f4f2, { roughness: 0.5 }),
    wall: M(0xf2f2ee),
    green: M(0x2e9a3a),
    pipe: M(0x8cc63f, { roughness: 0.5 }),
    orange: M(0xef7f2a, { roughness: 0.55 }),
    red: M(0xb02a2a, { roughness: 0.5 }),
    teal: M(0x2fb5a0),
    win: M(0x1f2c40, { roughness: 0.2 }),
    tire: M(0x1b1b1d),
    hub: M(0xbfc3c8, { metalness: 0.5 }),
    pole: M(0x9b8f7e),
    wire: M(0x1d1d1d),
    skin: M(0x6b4a36),
    vest: M(0xf0762a),
    pants: M(0x47552e),
    lamp: M(0xff9a1a, { emissive: 0xff7a00, emissiveIntensity: 1 }),
    led: M(0x35e06a, { emissive: 0x22cc55, emissiveIntensity: 1 }),
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
    o.castShadow = true;
    o.receiveShadow = true;
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
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 10), mt);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    (p || g).add(o);
    return o;
  };

  const tubo = (pts: number[][], mt: THREE.Material, r: number) => {
    const o = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))),
        16,
        r,
        4,
      ),
      mt,
    );
    o.castShadow = true;
    g.add(o);
    return o;
  };

  bx(16, 0.5, 6.7, m.gravel, 0, -0.25, -2.15);
  bx(16, 0.5, 4.3, m.road, 0, -0.25, 3.35);
  bx(16, 0.1, 0.22, m.curb, 0, 0.02, 1.2);
  bx(16, 0.9, 0.15, m.wall, 0, 0.45, -5.3);
  bx(16, 0.1, 0.17, m.green, 0, 0.88, -5.3);

  const XS = [-5.5, -3.5, -1.5];
  const ZS = [-1, -2.6, -4.2];
  XS.forEach((x) => ZS.forEach((z) => bx(0.12, 2.3, 0.12, m.conc, x, 1.15, z)));
  [2.2, 1.55].forEach((y) => {
    ZS.forEach((z) => bx(4.2, 0.1, 0.1, m.conc, -3.5, y, z));
    XS.forEach((x) => bx(0.1, 0.1, 3.4, m.conc, x, y, -2.6));
  });
  ZS.forEach((z) => {
    for (let x = -5.4; x <= -1.5; x += 0.5) cyl(0.025, 0.03, 0.1, m.dark, x, 2.3, z);
  });
  [
    [-5.5, -4.5, -3.5],
    [-3.5, -2.5, -1.5],
  ].forEach((r) =>
    tubo(
      [
        [r[0], 2.15, -2.6],
        [r[1], 1.3, -2.6],
        [r[2], 2.15, -2.6],
      ],
      m.red,
      0.022,
    ),
  );
  tubo(
    [
      [-5.5, 2.15, -1],
      [-4.5, 1.4, -1.8],
      [-3.5, 2.15, -2.6],
    ],
    m.red,
    0.022,
  );
  tubo(
    [
      [-3.5, 2.15, -4.2],
      [-2.5, 1.4, -3.4],
      [-1.5, 2.15, -2.6],
    ],
    m.red,
    0.022,
  );

  const trafo = (x: number, z: number) => {
    bx(0.8, 0.14, 0.7, m.concD, x, 0.07, z);
    bx(0.55, 0.65, 0.45, m.grey, x, 0.5, z);
    bx(0.06, 0.5, 0.4, m.grey2, x + 0.33, 0.5, z);
    bx(0.06, 0.5, 0.4, m.grey2, x - 0.33, 0.5, z);
    [-0.18, 0, 0.18].forEach((d) => {
      cyl(0.04, 0.05, 0.28, m.dark, x + d, 1.0, z);
      cyl(0.06, 0.06, 0.04, m.hub, x + d, 1.16, z);
    });
  };
  [
    [-4.5, -1.7],
    [-2.5, -3.3],
    [-5.2, -3.7],
    [4.8, -2.6],
    [6.5, -2.6],
  ].forEach((p) => trafo(p[0], p[1]));

  const torre = (x: number, z: number) => {
    [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].forEach((s) =>
      cyl(0.015, 0.015, 1.7, m.grey2, x + s[0] * 0.22, 0.85, z + s[1] * 0.22, g, 6),
    );
    [0.1, 0.6, 1.1, 1.6].forEach((y) => {
      bx(0.46, 0.02, 0.02, m.grey2, x, y, z + 0.22);
      bx(0.46, 0.02, 0.02, m.grey2, x, y, z - 0.22);
      bx(0.02, 0.02, 0.46, m.grey2, x + 0.22, y, z);
      bx(0.02, 0.02, 0.46, m.grey2, x - 0.22, y, z);
    });
    [0.35, 0.85, 1.35].forEach((y) => {
      const a = Math.atan2(0.5, 0.44);
      const len = Math.hypot(0.5, 0.44);
      [0.22, -0.22].forEach((d) => {
        const o = bx(len, 0.015, 0.015, m.grey2, x, y, z + d);
        o.rotation.z = a;
        const q = bx(0.015, 0.015, len, m.grey2, x + d, y, z);
        q.rotation.x = a;
      });
    });
    bx(0.5, 0.12, 0.5, m.concD, x, 0.06, z);
  };
  torre(-2.6, -0.2);
  torre(3.4, -3.6);
  bx(0.35, 0.8, 0.3, M(0xc42b2b), -6.7, 0.4, 0.4);
  bx(0.3, 0.12, 0.3, m.concD, -4.9, 0.06, -2.2);
  cyl(0.17, 0.17, 0.4, m.teal, -4.9, 0.32, -2.2, g, 14);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), m.led);
  led.position.set(-4.5, 0.62, -1.45);
  g.add(led);

  const poste = (x: number) => {
    cyl(0.09, 0.11, 5.3, m.pole, x, 2.65, 3.2);
    bx(1.3, 0.08, 0.08, m.dark, x, 5, 3.2);
    [-0.5, 0, 0.5].forEach((d) => {
      const insulator = cyl(0.025, 0.03, 0.1, m.hub, x, 5.08, 3.2 + d, g, 8);
      insulator.position.z = 3.2 + d;
    });
  };
  poste(4.6);
  poste(-7.3);
  [-0.5, 0, 0.5].forEach((d) =>
    tubo(
      [
        [4.6, 5.12, 3.2 + d],
        [-1.4, 4.7, 3.2 + d],
        [-7.3, 5.12, 3.2 + d],
      ],
      m.wire,
      0.012,
    ),
  );

  const cone = (x: number, z: number) => {
    bx(0.3, 0.03, 0.3, m.dark, x, 0.02, z);
    cyl(0.02, 0.12, 0.42, m.orange, x, 0.24, z, g, 12);
    cyl(0.075, 0.09, 0.07, m.white, x, 0.22, z, g, 12);
  };
  const C: [number, number][] = [
    [-0.7, 1.8],
    [2.3, 1.8],
    [5.3, 1.8],
    [5.3, 4.6],
    [2.3, 4.6],
    [-0.7, 4.6],
  ];
  C.forEach((p, i) => {
    cone(p[0], p[1]);
    const q = C[(i + 1) % 6];
    const dx = q[0] - p[0];
    const dz = q[1] - p[1];
    const f = bx(Math.hypot(dx, dz), 0.02, 0.012, m.orange, (p[0] + q[0]) / 2, 0.3, (p[1] + q[1]) / 2);
    f.rotation.y = -Math.atan2(dz, dx);
  });

  const figura = (pernas: boolean) => {
    const f = new THREE.Group();
    if (pernas) {
      bx(0.08, 0.45, 0.1, m.pants, -0.05, 0.22, 0, f);
      bx(0.08, 0.45, 0.1, m.pants, 0.05, 0.22, 0, f);
    }
    bx(0.2, 0.32, 0.12, m.vest, 0, pernas ? 0.6 : 0.16, 0, f);
    bx(0.06, 0.28, 0.06, m.vest, -0.13, pernas ? 0.6 : 0.16, 0, f);
    bx(0.06, 0.28, 0.06, m.vest, 0.13, pernas ? 0.6 : 0.16, 0, f);
    const y = pernas ? 0.86 : 0.42;
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), m.skin);
    h.position.y = y;
    f.add(h);
    const c = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 10, 8, 0, PI * 2, 0, PI / 2),
      m.white,
    );
    c.position.y = y + 0.02;
    f.add(c);
    return f;
  };
  const op = figura(true);
  op.position.set(4.9, 0, 4.2);
  op.rotation.y = -0.8;
  g.add(op);

  const tr = new THREE.Group();
  tr.position.set(2, 0, 3.2);
  g.add(tr);
  bx(3.2, 0.16, 0.9, m.dark, -0.2, 0.55, 0, tr);
  [
    [-1.3, 0.5],
    [-1.3, -0.5],
    [1, 0.5],
    [1, -0.5],
  ].forEach((p) => {
    const t = cyl(0.3, 0.3, 0.22, m.tire, p[0], 0.3, p[1], tr, 18);
    t.rotation.x = PI / 2;
    const h = cyl(0.16, 0.16, 0.24, m.hub, p[0], 0.3, p[1], tr, 12);
    h.rotation.x = PI / 2;
  });
  bx(1, 0.8, 1, m.white, -1.05, 1.02, 0, tr);
  bx(0.5, 0.42, 1, m.white, -1.78, 0.85, 0, tr);
  bx(0.1, 0.12, 1, m.grey, -2.08, 0.6, 0, tr);
  bx(0.02, 0.3, 0.8, m.win, -1.56, 1.22, 0, tr).rotation.z = 0.25;
  [0.505, -0.505].forEach((z) => bx(0.55, 0.3, 0.01, m.win, -1.1, 1.2, z, tr));
  [0.2, -0.2].forEach((z) => bx(0.02, 0.08, 0.12, m.lamp, -2.1, 0.8, z, tr));
  bx(2, 0.9, 1.05, m.white, 0.5, 1.07, 0, tr);

  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 140;
  const cx = cv.getContext("2d")!;
  const folha = (x: number, c: string) => {
    cx.fillStyle = c;
    cx.beginPath();
    cx.moveTo(x, 105);
    cx.quadraticCurveTo(x - 34, 60, x, 8);
    cx.quadraticCurveTo(x + 34, 60, x, 105);
    cx.fill();
  };
  folha(76, "#4aa34a");
  folha(122, "#2f9bd6");
  folha(172, "#f5a800");
  cx.fillStyle = "#2e7d32";
  cx.font = "bold 24px sans-serif";
  cx.textAlign = "center";
  cx.fillText("COELBA", 124, 134);
  const tex = new THREE.CanvasTexture(cv);
  const mlogo = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6 });
  [1, -1].forEach((s) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), mlogo);
    p.position.set(0.5, 1.07, s * 0.531);
    if (s < 0) p.rotation.y = PI;
    tr.add(p);
  });
  [1.1, 1.95].forEach((y, i) => {
    const p = cyl(0.07, 0.07, 2, m.pipe, 0.5, y - 0.3 + (i ? 0.12 : 0), i ? 0.1 : -0.08, tr, 12);
    p.rotation.z = PI / 2;
  });
  [-0.35, 1.35].forEach((x) => [0.42, -0.42].forEach((z) => bx(0.05, 0.4, 0.05, m.pipe, x, 1.75, z, tr)));
  cyl(0.06, 0.06, 0.08, m.lamp, -1.05, 1.46, 0, tr, 10);
  bx(0.5, 0.25, 0.6, m.white, 1.2, 1.7, 0, tr);

  const L1 = 1.92;
  const L2 = 3;
  const rad = (d: number) => (d * PI) / 180;
  const piv = new THREE.Group();
  piv.position.set(1.2, 1.85, 0);
  tr.add(piv);
  bx(L1, 0.15, 0.15, m.white, L1 / 2, 0, 0, piv);
  const cot = new THREE.Group();
  cot.position.x = L1;
  piv.add(cot);
  bx(L2, 0.13, 0.13, m.white, L2 / 2, 0, 0, cot);
  bx(L2 * 0.55, 0.2, 0.2, m.orange, L2 * 0.7, 0, 0, cot);
  const cesto = new THREE.Group();
  cesto.position.x = L2;
  cot.add(cesto);
  bx(0.42, 0.46, 0.42, m.white, 0, 0.05, 0, cesto);
  const bo = figura(false);
  bo.position.set(0, 0.25, 0);
  cesto.add(bo);

  const e = { u: 1, alvo: 1 };
  const pose = (u: number) => {
    const t1 = rad(178 + (141 - 178) * u);
    const t2 = rad(-2 + (21.4 + 2) * u);
    piv.rotation.z = t1;
    cot.rotation.z = t2 - t1;
    cesto.rotation.z = -t2;
  };
  pose(1);
  g.userData.alternarLanca = () => {
    e.alvo = e.alvo > 0.5 ? 0 : 1;
    return e.alvo > 0.5;
  };
  let t = 0;
  g.userData.tick = (dt: number) => {
    t += dt;
    e.u += (e.alvo - e.u) * Math.min(1, dt * 2);
    pose(e.u);
    m.lamp.emissiveIntensity = 0.2 + 0.9 * (Math.sin(t * 6) > 0 ? 1 : 0);
    m.led.emissiveIntensity = 0.4 + 0.6 * (Math.sin(t * 2) * 0.5 + 0.5);
  };

  return g;
}
