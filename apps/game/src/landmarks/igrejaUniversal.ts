import * as THREE from "three";

export type IgrejaUniversalGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    alternarTransito: () => boolean;
    definirNoite: (on: boolean) => boolean;
  };
};

type CarroAnim = {
  o: THREE.Group;
  z: number;
  y: number;
  dir: number;
  x: number;
  v: number;
};

export function criarIgrejaUniversal(): IgrejaUniversalGroup {
  const g = new THREE.Group() as IgrejaUniversalGroup;
  g.name = "IgrejaUniversal";
  const PI = Math.PI;
  let sd = 23;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  const M = (c: number, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(
      Object.assign({ color: c, roughness: 0.8 }, o || {}),
    );

  const m = {
    grass: M(0x7fa83c),
    dirt: M(0x8a7a62),
    asf: M(0x44464b),
    cream: M(0xe9dcc0),
    creamL: M(0xf2e9d3),
    white: M(0xf6f4ee),
    brown: M(0x7a4a3a),
    red: M(0xa0584a),
    gold: M(0xd9a840, { metalness: 0.5, roughness: 0.35 }),
    roof: M(0xbfc3c9, { roughness: 0.5 }),
    jan: M(0x2f6a5a, { roughness: 0.25 }),
    dark: M(0x23262b),
    blue: M(0x2b66b8),
    hedge: M(0x2f6a2a),
    trunk: M(0x7a6a52),
    leaf: M(0x2f8a2e),
    leaf2: M(0x3f9d36),
    conc: M(0xa9a7a0),
    yel: M(0xe0b43a),
    tank: M(0xe9e9e6),
    lamp: M(0xfff3b0, { emissive: 0xffe9a0, emissiveIntensity: 0.5 }),
    mata: M(0x356b2b, { flatShading: true }),
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

  const texto = (
    s: string,
    cor: string,
    w: number,
    h: number,
    px: number,
    bg?: string,
  ) => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = Math.round((512 * h) / w);
    const ctx = c.getContext("2d")!;
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.fillStyle = cor;
    ctx.font = `bold ${px}px Georgia,serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(s, 256, c.height / 2 + 2);
    return new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(c),
        transparent: !bg,
      }),
    );
  };

  const ground = bx(32, 0.6, 26, m.grass, 0, -0.3, 3);
  ground.material = [m.dirt, m.dirt, m.grass, m.dirt, m.dirt, m.dirt];
  bx(32, 0.04, 2.4, m.asf, 0, 0.02, 10.4);
  bx(32, 0.04, 0.06, m.yel, 0, 0.05, 10.4);
  bx(32, 0.28, 2.4, m.conc, 0, 1.7, 13.8);
  [13.8 - 1.15, 13.8 + 1.15].forEach((z) => {
    bx(32, 0.03, 0.05, m.blue, 0, 2.25, z);
    bx(32, 0.03, 0.05, m.blue, 0, 2.05, z);
    for (let x = -15.5; x <= 15.6; x += 0.6) bx(0.04, 0.3, 0.04, m.blue, x, 2.05, z);
  });
  for (let x = -14; x <= 14.1; x += 4.7) bx(0.4, 1.6, 0.5, m.conc, x, 0.8, 13.8);

  bx(13, 3.8, 4.6, m.cream, 0, 1.9, 0);
  bx(13.05, 0.5, 0.05, m.brown, 0, 0.25, 2.33);
  bx(13.2, 0.14, 4.8, m.white, 0, 3.85, 0);
  bx(13.1, 0.08, 0.1, m.white, 0, 2.1, 2.32);
  const janelas: THREE.Mesh[] = [];
  for (let x = -6; x <= 6.01; x += 0.8) {
    [2.55, 3.25].forEach((y) => {
      if (Math.abs(x) < 3 && y === 2.55) return;
      bx(0.3, 0.36, 0.04, m.white, x, y, 2.32);
      janelas.push(bx(0.22, 0.28, 0.05, m.jan, x, y, 2.33));
    });
  }
  for (let x = -6.4; x <= 6.41; x += 1.6) {
    if (Math.abs(x) < 3) continue;
    bx(0.7, 0.9, 0.05, m.white, x, 1.15, 2.32);
    janelas.push(bx(0.5, 0.8, 0.06, m.jan, x, 1.15, 2.33));
    const a = new THREE.Mesh(new THREE.CircleGeometry(0.35, 12, 0, PI), m.white);
    a.position.set(x, 1.6, 2.325);
    g.add(a);
    const b = new THREE.Mesh(new THREE.CircleGeometry(0.27, 12, 0, PI), m.cream);
    b.position.set(x, 1.6, 2.33);
    g.add(b);
  }
  [-1, 1].forEach((s) =>
    [3.7, 4.4, 5.1].forEach((dx) => {
      bx(0.5, 0.2, 0.18, m.white, s * dx, 2.55, 2.4);
      bx(0.5, 0.14, 0.02, m.white, s * dx, 2.7, 2.5);
    }),
  );

  bx(11.5, 2.2, 6.2, m.creamL, 0, 4.9, -0.2);
  bx(11.7, 0.12, 6.4, m.white, 0, 5.95, -0.2);
  const tl = texto("JESUS CRISTO É O SENHOR", "#7a1f1f", 9.2, 0.5, 38);
  tl.position.set(0, 5.55, 2.91);
  g.add(tl);
  const cob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1, 0.9, 4), m.roof);
  cob.rotation.y = PI / 4;
  cob.scale.set((11.5 * 1.04) / 1.414, 1, (6.2 * 1.04) / 1.414);
  cob.position.set(0, 6.45, -0.2);
  g.add(cob);

  bx(14.4, 0.6, 1.8, m.red, 0, 0.3, 3.2);
  bx(7, 0.4, 2.4, m.white, 0, 3.55, 3.3);
  for (let i = 0; i < 6; i++) {
    const x = -2.75 + i * 1.1;
    cyl(0.2, 0.2, 2.75, m.white, x, 1.97, 3.8, g, 14);
    bx(0.5, 0.12, 0.5, m.white, x, 3.3, 3.8);
    bx(0.55, 0.12, 0.55, m.white, x, 0.66, 3.8);
  }
  const fr = new THREE.Shape();
  fr.moveTo(-3.6, 0);
  fr.lineTo(3.6, 0);
  fr.lineTo(0, 1.2);
  fr.closePath();
  const fro = new THREE.Mesh(
    new THREE.ExtrudeGeometry(fr, { depth: 2.4, bevelEnabled: false }),
    m.creamL,
  );
  fro.position.set(0, 3.75, 2.1);
  g.add(fro);
  const logo = texto("UNIVERSAL", "#1d3d8f", 2.6, 0.42, 56, "#f2e9d3");
  logo.position.set(0.2, 4.1, 4.51);
  g.add(logo);
  const cor = new THREE.Shape();
  cor.moveTo(0, -0.12);
  cor.bezierCurveTo(-0.2, 0.05, -0.2, 0.18, -0.1, 0.18);
  cor.bezierCurveTo(-0.05, 0.18, 0, 0.14, 0, 0.1);
  cor.bezierCurveTo(0, 0.14, 0.05, 0.18, 0.1, 0.18);
  cor.bezierCurveTo(0.2, 0.18, 0.2, 0.05, 0, -0.12);
  const heart = new THREE.Mesh(new THREE.ShapeGeometry(cor), M(0xd02a3a));
  heart.scale.setScalar(1.35);
  heart.position.set(-1.3, 4.1, 4.52);
  g.add(heart);
  for (let j = 0; j < 5; j++) {
    bx(14.2 - j * 0.2, 0.12 * (j + 1), 0.55, m.red, 0, 0.06 * (j + 1), 4.35 + (4 - j) * 0.55);
  }
  [-1, 1].forEach((s) => {
    bx(0.2, 0.5, 3.4, m.white, s * 7.1, 0.35, 5.2);
  });

  const torre = (x: number) => {
    bx(2.3, 5.4, 3, m.cream, x, 2.7, 0.3);
    bx(2.4, 0.5, 3.1, m.brown, x, 0.25, 0.3);
    [-1, 1].forEach((s) => bx(0.1, 5.2, 0.08, m.white, x + s * 1.05, 2.7, 1.83));
    bx(2.5, 0.14, 3.2, m.white, x, 5.45, 0.3);
    for (let c = -0.7; c <= 0.71; c += 0.7) {
      for (let r = 0; r < 7; r++) {
        bx(0.26, 0.26, 0.04, m.white, x + c, 0.9 + r * 0.62, 1.82);
        janelas.push(bx(0.18, 0.18, 0.05, m.jan, x + c, 0.9 + r * 0.62, 1.83));
      }
    }
    bx(1.8, 0.6, 2.3, m.white, x, 5.75, 0.3);
    [-0.8, 0.8].forEach((dx) => bx(0.06, 0.3, 0.06, m.white, x + dx, 6.2, 1.4));
    bx(1.9, 0.05, 0.05, m.white, x, 6.35, 1.45);
    const d = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 18, 10, 0, PI * 2, 0, PI / 2),
      m.gold,
    );
    d.scale.set(1, 0.8, 1.2);
    d.position.set(x, 6.05, 0.3);
    g.add(d);
    cyl(0.02, 0.02, 0.4, m.gold, x, 7, 0.3, g, 6);
  };
  torre(-6.5);
  torre(6.5);

  (
    [
      [-4.2, 7.6, 3.4],
      [4.2, 7.6, 3.4],
      [-9.6, 7.4, 3.2],
      [9.6, 7.2, 3.2],
      [-2.6, 8.4, 2.6],
      [2.6, 8.4, 2.6],
      [-6.8, 8.2, 2.8],
      [6.8, 8.2, 2.8],
    ] as const
  ).forEach((p) => {
    const q = new THREE.Group();
    q.position.set(p[0], 0, p[1]);
    g.add(q);
    cyl(0.07, 0.1, p[2], m.trunk, 0, p[2] / 2, 0, q, 8);
    for (let i = 0; i < 8; i++) {
      const yw = new THREE.Group();
      yw.position.y = p[2];
      yw.rotation.y = (i * PI) / 4;
      q.add(yw);
      const tl2 = new THREE.Group();
      tl2.rotation.z = -0.3 - (i % 2) * 0.25;
      yw.add(tl2);
      bx(0.9, 0.02, 0.16, i % 2 ? m.leaf : m.leaf2, 0.45, 0, 0, tl2);
    }
  });
  bx(15, 0.35, 0.5, m.hedge, 0, 0.2, 7.1);
  bx(30, 0.04, 0.04, m.white, 0, 0.5, 9.2);
  for (let x = -14.8; x <= 14.9; x += 0.5) bx(0.06, 0.34, 0.06, m.white, x, 0.33, 9.2);
  [-7.5, 0, 7.5].forEach((x) => {
    cyl(0.04, 0.05, 3.2, m.conc, x, 1.6, 9.6, g, 8);
    bx(0.5, 0.06, 0.2, m.lamp, x, 3.2, 9.6);
  });
  cyl(0.9, 0.9, 3.2, m.tank, 7.5, 2.2, -6.5, g, 20);
  cyl(0.02, 0.02, 5, M(0xd33a2a), -9, 2.5, -5.5, g, 6);
  const predioCores = [0x6b7078, 0xd9dcdf, 0x4a4e55, 0xc9ccd0];
  (
    [
      [-9, 3, -6.5],
      [10, 4, -5.5],
      [-12, 3, -5],
      [0, 3, -8.5],
    ] as const
  ).forEach((b) =>
    bx(
      3,
      b[1],
      2.2,
      M(predioCores[Math.floor(rnd() * 4)]!),
      b[0],
      b[1] / 2,
      b[2],
    ),
  );
  for (let i = 0; i < 26; i++) {
    const r = 0.5 + rnd() * 0.5;
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), m.mata);
    s.position.set(-14 + rnd() * 28, r * 0.6, -9.5 + rnd() * 2);
    g.add(s);
  }

  const carro = (cor: number, onibus: boolean) => {
    const c = new THREE.Group();
    if (onibus) {
      bx(2, 0.55, 0.55, m.white, 0, 0.4, 0, c);
      bx(2.02, 0.14, 0.56, M(0x2f9a4a), 0, 0.3, 0, c);
      bx(1.8, 0.18, 0.57, m.dark, 0, 0.55, 0, c);
    } else {
      bx(0.8, 0.2, 0.4, M(cor), 0, 0.22, 0, c);
      bx(0.45, 0.17, 0.34, M(cor), -0.05, 0.4, 0, c);
      bx(0.4, 0.1, 0.35, m.dark, -0.05, 0.42, 0, c);
    }
    g.add(c);
    return c;
  };
  const faixas: [number, number, number][] = [
    [10.0, 1, 0],
    [10.8, -1, 1],
    [13.3, 1, 0],
    [14.3, -1, 1],
  ];
  const cores = [0xeeeeee, 0xb23a3a, 0x3a5fa8, 0xc6c9cd, 0x23262b, 0xe6e1d0];
  const carros: CarroAnim[] = [];
  faixas.forEach((f, i) => {
    for (let k = 0; k < 3; k++) {
      const bus = i === 1 && k === 0;
      const o = carro(cores[(i * 3 + k) % 6]!, bus);
      const y = f[0]! > 12 ? 1.9 : 0.12;
      carros.push({
        o,
        z: f[0]!,
        y,
        dir: f[1]!,
        x: -15 + k * 10 + i * 2.5,
        v: 2.2 + rnd() * 0.8,
      });
    }
  });
  carros.forEach((c) => {
    c.o.rotation.y = c.dir > 0 ? 0 : PI;
    c.o.position.set(c.x, c.y, c.z);
  });

  let vai = true;
  let noite = false;
  g.userData.alternarTransito = () => (vai = !vai);
  g.userData.definirNoite = (on) => {
    noite = !!on;
    m.jan.emissive.setHex(noite ? 0xffe08a : 0x000000);
    m.jan.emissiveIntensity = noite ? 1 : 0;
    m.lamp.emissiveIntensity = noite ? 2 : 0.5;
    return noite;
  };
  g.userData.tick = (dt) => {
    if (!vai) return;
    carros.forEach((c) => {
      c.x += c.dir * c.v * dt;
      if (c.x > 16) c.x = -16;
      if (c.x < -16) c.x = 16;
      c.o.position.x = c.x;
    });
  };

  return g;
}
