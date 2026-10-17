import * as THREE from "three";

export type QuartelPoliciaGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    alternarOperacao: () => boolean;
  };
};

type Soldado = {
  o: THREE.Group;
  lE: THREE.Group;
  lD: THREE.Group;
  aE: THREE.Group;
  aD: THREE.Group;
  fz: THREE.Group;
};

type Viatura = {
  car: THREE.Group;
  lr: THREE.Mesh;
  lb: THREE.Mesh;
  off?: number;
};

export function criarQuartel(): QuartelPoliciaGroup {
  const g = new THREE.Group() as QuartelPoliciaGroup;
  g.name = "QuartelPolicia";
  const PI = Math.PI;
  const V = THREE.Vector3;

  const M = (c: number, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o || {}));

  const m = {
    grass: M(0x7fa83c),
    dirt: M(0x8a7a62),
    asf: M(0x484a4f),
    walk: M(0xd5d0c0),
    bege: M(0xdcc08f),
    white: M(0xf3f1ea),
    brown: M(0x6a4a3a),
    glass: M(0x233046, { roughness: 0.2 }),
    tile: M(0xc86a3a),
    dark: M(0x1c1d21),
    black: M(0x15161a),
    blue: M(0x1f4fb0),
    tan: M(0xc9ad88),
    grey: M(0x8d9196),
    conc: M(0xb9b7ae),
    bronze: M(0xa88a4a),
    green: M(0x2f8a3a),
    canhao: M(0x3d5a2e),
    gold: M(0xf2c230),
    glassT: M(0x233046, { transparent: true, opacity: 0.45 }),
    sr: M(0xff2a1a, { emissive: 0xff1100, emissiveIntensity: 1 }),
    sb: M(0x2a5cff, { emissive: 0x1040ff, emissiveIntensity: 1 }),
    skin: M(0x7a5238),
    lamp: M(0xfff3b0, { emissive: 0xffe9a0, emissiveIntensity: 0.6 }),
    trunk: M(0x7a6a52),
    leaf: M(0x2f8a2e),
    leaf2: M(0x3f9d36),
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
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 12), mt);
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

  const texto = (s: string, cor: string, w: number, h: number, bg?: string) => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 48;
    const ctx = c.getContext("2d")!;
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 256, 48);
    }
    ctx.fillStyle = cor;
    ctx.font = "bold 24px Arial,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(s, 128, 26);
    return new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(c),
        transparent: !bg,
      }),
    );
  };

  const ground = bx(34, 0.6, 17, m.grass, 0, -0.3, 3.5);
  ground.material = [m.dirt, m.dirt, m.grass, m.dirt, m.dirt, m.dirt];
  bx(34, 0.04, 8.6, m.asf, 0, 0.02, 6.8);
  bx(16, 0.05, 1, m.walk, 0, 0.05, 1.9);
  [
    [-7, 5.8],
    [7, 5.8],
  ].forEach((p) => bx(3.6, 0.06, 3.4, m.grass, p[0]!, 0.06, p[1]!));
  cyl(1.75, 1.75, 0.08, m.white, 0, 0.06, 5.4, g, 32);
  cyl(1.6, 1.6, 0.1, m.grass, 0, 0.07, 5.4, g, 32);
  bx(1.1, 0.5, 1.1, m.conc, 0, 0.3, 5.4);
  bx(0.7, 0.8, 0.7, m.white, 0, 0.95, 5.4);
  bx(0.3, 0.55, 0.22, m.bronze, 0, 1.6, 5.4);
  ball(0.11, m.bronze, 0, 1.98, 5.4);

  const palma = (x: number, z: number, h: number) => {
    const p = new THREE.Group();
    p.position.set(x, 0, z);
    g.add(p);
    bx(0.14, h, 0.14, m.trunk, 0, h / 2, 0, p);
    for (let i = 0; i < 8; i++) {
      const yw = new THREE.Group();
      yw.position.y = h;
      yw.rotation.y = (i * PI) / 4;
      p.add(yw);
      const tl = new THREE.Group();
      tl.rotation.z = -0.3 - (i % 2) * 0.25;
      yw.add(tl);
      bx(1, 0.025, 0.18, i % 2 ? m.leaf : m.leaf2, 0.5, 0, 0, tl);
    }
  };
  [
    [-3.8, 3.9, 3],
    [3.8, 3.9, 3.2],
    [-9.6, 7.6, 3.4],
    [9.6, 7.4, 3.1],
    [-11, -2.5, 3.4],
    [11, -2.5, 3.2],
    [-1.6, -3.6, 3],
  ].forEach((p) => palma(p[0]!, p[1]!, p[2]!));

  bx(16, 3.2, 2.6, m.bege, 0, 1.6, 0);
  bx(16.05, 0.9, 2.62, m.brown, 0, 0.45, 0);
  bx(16.2, 0.12, 2.8, m.white, 0, 3.2, 0);
  bx(16.1, 0.08, 2.64, m.white, 0, 1.9, 0);
  for (let x = -7; x <= 7.01; x += 1.4) {
    if (Math.abs(x) > 1.5) {
      bx(0.42, 0.55, 0.05, m.white, x, 1.25, 1.31);
      bx(0.32, 0.45, 0.06, m.glass, x, 1.25, 1.31);
    }
    bx(0.5, 0.7, 0.05, m.white, x, 2.55, 1.31);
    bx(0.38, 0.58, 0.06, m.glass, x, 2.55, 1.32);
    const a = new THREE.Mesh(new THREE.CircleGeometry(0.25, 12, 0, PI), m.white);
    a.position.set(x, 2.9, 1.315);
    g.add(a);
    const b = new THREE.Mesh(new THREE.CircleGeometry(0.19, 12, 0, PI), m.glass);
    b.position.set(x, 2.9, 1.325);
    g.add(b);
  }

  const merl = (cx: number, cz: number, w: number, d: number, y: number) => {
    for (let x = -w / 2; x <= w / 2 + 0.01; x += 0.5) {
      [d / 2, -d / 2].forEach((z) => bx(0.28, 0.28, 0.28, m.bege, cx + x, y, cz + z));
    }
    for (let z = -d / 2 + 0.5; z < d / 2 - 0.01; z += 0.5) {
      [w / 2, -w / 2].forEach((x) => bx(0.28, 0.28, 0.28, m.bege, cx + x, y, cz + z));
    }
  };

  const torre = (x: number, h: number, w: number, d: number, z: number) => {
    bx(w, h, d, m.bege, x, h / 2, z);
    bx(w + 0.2, 0.12, d + 0.2, m.white, x, h - 0.05, z);
    merl(x, z, w + 0.1, d + 0.1, h + 0.12);
    bx(w + 0.02, 0.9, d + 0.02, m.brown, x, 0.45, z);
  };
  torre(0, 5.2, 2.8, 2.8, 0.3);
  [-7.9, 7.9].forEach((x) => torre(x, 4.4, 2.2, 2.8, 0));
  bx(1.2, 1.5, 0.08, m.white, 0, 0.95, 1.74);
  bx(0.9, 1.3, 0.1, m.dark, 0, 0.85, 1.75);
  const ap = new THREE.Mesh(new THREE.CircleGeometry(0.45, 14, 0, PI), m.dark);
  ap.position.set(0, 1.5, 1.75);
  g.add(ap);
  [-0.7, 0.7].forEach((x) => {
    bx(0.4, 1, 0.06, m.white, x, 3, 1.74);
    bx(0.3, 0.9, 0.07, m.glass, x, 3, 1.75);
  });
  cyl(0.38, 0.38, 0.06, m.green, 0, 4.5, 1.74, g, 20).rotation.x = PI / 2;
  cyl(0.22, 0.22, 0.08, m.gold, 0, 4.5, 1.76, g, 20).rotation.x = PI / 2;
  const pl = texto("QUARTEL DA POLÍCIA", "#222", 1.8, 0.28, "#f3f1ea");
  pl.position.set(0, 2.1, 1.77);
  g.add(pl);
  [-7.9, 7.9].forEach((x) => {
    bx(0.5, 0.8, 0.06, m.white, x, 2.8, 1.43);
    bx(0.38, 0.7, 0.07, m.glass, x, 2.8, 1.44);
  });

  const soldado = (farda: number, boina: boolean): Soldado => {
    const o = new THREE.Group();
    const pv = (x: number, y: number) => {
      const q = new THREE.Group();
      q.position.set(x, y, 0);
      o.add(q);
      return q;
    };
    const lE = pv(-0.08, 0.55);
    const lD = pv(0.08, 0.55);
    [lE, lD].forEach((l) => {
      bx(0.12, 0.52, 0.12, M(farda), 0, -0.26, 0, l);
      bx(0.13, 0.1, 0.2, m.black, 0, -0.5, 0.03, l);
    });
    bx(0.32, 0.42, 0.2, M(farda), 0, 0.78, 0, o);
    bx(0.34, 0.1, 0.22, m.black, 0, 0.62, 0, o);
    const aE = pv(-0.2, 0.95);
    const aD = pv(0.2, 0.95);
    [aE, aD].forEach((a) => {
      bx(0.09, 0.4, 0.09, M(farda), 0, -0.2, 0, a);
      ball(0.05, m.skin, 0, -0.42, 0, a);
    });
    ball(0.095, m.skin, 0, 1.1, 0, o);
    const bo = ball(0.115, boina ? m.black : M(farda), 0, 1.15, 0, o);
    bo.scale.y = boina ? 0.55 : 0.75;
    const fz = new THREE.Group();
    fz.position.set(0.24, 0.45, 0.08);
    o.add(fz);
    bx(0.04, 0.9, 0.05, m.dark, 0, 0, 0, fz);
    bx(0.05, 0.12, 0.08, m.dark, 0, 0.34, 0.03, fz);
    o.scale.setScalar(0.6);
    return { o, lE, lD, aE, aD, fz };
  };

  const forma: Soldado[] = [];
  const sent: Soldado[] = [];
  const pat: { s: Soldado; off: number }[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      const s = soldado(0x5a6b3a, false);
      s.o.position.set(-8.3 + c * 0.6, 0.07, 4.6 + r * 0.75);
      s.o.rotation.y = PI / 2;
      g.add(s.o);
      forma.push(s);
    }
  }
  [
    [-9.3, 3.8],
    [-11, 3.8],
  ].forEach((p) => {
    const s = soldado(0xb5a276, true);
    s.o.position.set(p[0]!, 0.04, p[1]!);
    g.add(s.o);
    sent.push(s);
  });
  [
    [0, 0],
    [1, 15],
  ].forEach((p) => {
    const s = soldado(0xb5a276, true);
    s.o.position.y = 0.07;
    g.add(s.o);
    pat.push({ s, off: p[1]! });
  });
  bx(1.3, 1.7, 1.3, m.bege, -10.2, 0.85, 3.2);
  bx(1.6, 0.14, 1.6, m.tile, -10.2, 1.8, 3.2);
  const gd = texto("GUARDA", "#222", 0.9, 0.2, "#f3f1ea");
  gd.position.set(-10.2, 1.55, 3.86);
  g.add(gd);
  bx(0.04, 0.5, 1, m.glass, -9.55, 0.95, 3.2);

  const bandeira = (corFn: (ctx: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 160;
    corFn(c.getContext("2d")!);
    return new THREE.CanvasTexture(c);
  };
  const bBR = bandeira((x) => {
    x.fillStyle = "#1ea04a";
    x.fillRect(0, 0, 256, 160);
    x.fillStyle = "#f6d324";
    x.beginPath();
    x.moveTo(128, 14);
    x.lineTo(240, 80);
    x.lineTo(128, 146);
    x.lineTo(16, 80);
    x.fill();
    x.fillStyle = "#1b3a9a";
    x.beginPath();
    x.arc(128, 80, 40, 0, 7);
    x.fill();
    x.strokeStyle = "#fff";
    x.lineWidth = 6;
    x.beginPath();
    x.arc(128, 100, 70, PI * 1.2, PI * 1.75);
    x.stroke();
  });
  const bAZ = bandeira((x) => {
    x.fillStyle = "#f3f3f0";
    x.fillRect(0, 0, 256, 160);
    x.fillStyle = "#2fa5b5";
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(256, 0);
    x.lineTo(0, 160);
    x.fill();
    x.fillStyle = "#1d6a8a";
    x.beginPath();
    x.arc(128, 80, 22, 0, 7);
    x.fill();
  });
  const flags: { geo: THREE.PlaneGeometry; base: Float32Array }[] = [];
  [
    [bBR, -4.9, 5.2],
    [bAZ, -4.9, 6.4],
  ].forEach((f) => {
    const tex = f[0] as THREE.CanvasTexture;
    const fx = f[1] as number;
    const fz = f[2] as number;
    cyl(0.04, 0.05, 3.4, m.grey, fx, 1.7, fz, g, 8);
    const geo = new THREE.PlaneGeometry(1.2, 0.76, 12, 6);
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        map: tex,
        side: THREE.DoubleSide,
        roughness: 0.9,
      }),
    );
    mesh.position.set(fx + 0.62, 3, fz);
    g.add(mesh);
    flags.push({ geo, base: Float32Array.from(geo.attributes.position!.array) });
  });

  const can = new THREE.Group();
  can.position.set(10.2, 0, 5.2);
  can.rotation.y = -0.5;
  can.scale.setScalar(1.15);
  g.add(can);
  cyl(1.7, 1.8, 0.14, m.white, 0, 0.07, 0, can, 28);
  cyl(1.55, 1.55, 0.18, m.grass, 0, 0.09, 0, can, 28);
  bx(1.2, 0.22, 0.7, m.white, 0, 0.25, 0, can);
  [0.55, -0.55].forEach((z) => {
    const w = cyl(0.42, 0.42, 0.3, m.black, 0, 0.67, z, can, 18);
    w.rotation.x = PI / 2;
    const h = cyl(0.2, 0.2, 0.34, m.canhao, 0, 0.67, z, can, 10);
    h.rotation.x = PI / 2;
  });
  bx(1.4, 0.18, 0.5, m.canhao, 0.1, 0.8, 0, can);
  [0.15, -0.15].forEach((z) => {
    const t = bx(1.5, 0.09, 0.12, m.canhao, 0.95, 0.55, z, can);
    t.rotation.z = -0.3;
  });
  const b = cyl(0.1, 0.1, 3.1, m.canhao, 0, 0, 0, can, 12);
  b.rotation.z = 1.2;
  b.position.set(-1.35, 1.55, 0);
  const fb = cyl(0.15, 0.15, 0.26, m.canhao, 0, 0, 0, can, 12);
  fb.rotation.z = 1.2;
  fb.position.set(-2.8, 2.07, 0);
  cyl(0.16, 0.16, 0.3, m.canhao, 0, 0, 0, can, 12).position.set(0.1, 0.85, 0);

  const viatura = (estilo: string): Viatura => {
    const az = estilo === "azul";
    const car = new THREE.Group();
    const cor = az ? m.blue : m.tan;
    const baixo = az ? m.white : m.dark;
    bx(3.1, 0.2, 1.1, m.black, 0, 0.42, 0, car);
    bx(3.1, 0.38, 1.28, baixo, 0, 0.7, 0, car);
    bx(1, 0.2, 1.26, cor, 1.15, 0.99, 0, car);
    bx(1.5, 0.07, 1.22, cor, 0.1, 1.52, 0, car);
    [0.6, -0.6].forEach((z) => bx(1.5, 0.42, 0.02, m.glassT, 0.1, 1.25, z, car));
    bx(0.02, 0.45, 1.14, m.glassT, 0.9, 1.25, 0, car).rotation.z = 0.4;
    bx(1.2, 0.05, 1.2, m.black, -1.1, 0.9, 0, car);
    if (az) bx(1.25, 0.5, 1.22, m.blue, -1.1, 1.2, 0, car);
    else
      [0.58, -0.58].forEach((z) => bx(1.2, 0.3, 0.05, m.tan, -1.1, 1.05, z, car));
    bx(0.15, 0.22, 1.3, m.black, 1.7, 0.58, 0, car);
    [-0.45, 0.45].forEach((z) => bx(0.04, 0.1, 0.25, m.lamp, 1.64, 0.95, z, car));
    [
      [1.05, 0.62],
      [1.05, -0.62],
      [-1.05, 0.62],
      [-1.05, -0.62],
    ].forEach((p) => {
      const w = cyl(0.27, 0.27, 0.2, m.black, p[0]!, 0.27, p[1]!, car, 14);
      w.rotation.x = PI / 2;
    });
    bx(1, 0.07, 0.22, m.black, 0.3, 1.6, 0, car);
    const lr = bx(0.38, 0.08, 0.2, m.sr, 0.1, 1.67, 0, car);
    const lb = bx(0.38, 0.08, 0.2, m.sb, 0.5, 1.67, 0, car);
    [1, -1].forEach((s) => {
      const t = texto(
        az ? "POLÍCIA" : "POLÍCIA MILITAR",
        az ? "#1b3d8a" : "#2a2a2a",
        0.9,
        0.17,
      );
      t.position.set(0.4, 0.8, s * 0.65);
      if (s < 0) t.rotation.y = PI;
      car.add(t);
    });
    car.scale.setScalar(0.55);
    g.add(car);
    return { car, lr, lb };
  };

  (
    [
      [-5.6, 3.2, "azul"],
      [-7.2, 3.2, "bege"],
      [5.6, 3.2, "bege"],
      [7.2, 3.2, "azul"],
    ] as const
  ).forEach((p) => {
    const v = viatura(p[2]);
    v.car.position.set(p[0], 0, p[1]);
  });

  const ang = (f: number) => (f * PI) / 180;
  const anel = (f: number): [number, number] => [
    2.4 * Math.cos(ang(f)),
    5.4 + 2.4 * Math.sin(ang(f)),
  ];
  const pts: [number, number][] = [
    [-15, 8.8],
    [-8, 8.8],
    [-4.4, 8.5],
  ];
  [135, 180, 225, 270, 315, 360, 405, 450].forEach((f) => pts.push(anel(f)));
  pts.push([4.4, 8.5], [8, 8.8], [15, 8.8]);
  const curva = new THREE.CatmullRomCurve3(pts.map((p) => new V(p[0], 0.04, p[1])));
  let us = 0.5;
  let best = 1e9;
  for (let i = 0; i <= 600; i++) {
    const q = curva.getPointAt(i / 600);
    const d = Math.hypot(q.x, q.z - 3.0);
    if (d < best) {
      best = d;
      us = i / 600;
    }
  }
  const moveis: Viatura[] = [
    Object.assign(viatura("azul"), { off: 0 }),
    Object.assign(viatura("bege"), { off: 11 }),
  ];
  const T = 22;
  let t = 0;
  let vai = true;

  const pos = (v: Viatura, tc: number) => {
    let u: number;
    if (tc < 6) u = us * (1 - Math.pow(1 - tc / 6, 2));
    else if (tc < 12) u = us;
    else if (tc < 18) u = us + (1 - us) * Math.pow((tc - 12) / 6, 2);
    else u = -1;
    v.car.visible = u >= 0;
    if (u < 0) return false;
    const q = curva.getPointAt(Math.min(u, 0.9999));
    const tg = curva.getTangentAt(Math.min(u, 0.9999));
    v.car.position.copy(q);
    v.car.rotation.y = Math.atan2(-tg.z, tg.x);
    return tc >= 6 && tc < 12;
  };

  g.userData.alternarOperacao = () => (vai = !vai);
  g.userData.tick = (dt) => {
    if (!vai) return;
    t += dt;
    let parada = false;
    moveis.forEach((v) => {
      const tc = (t + (v.off ?? 0)) % T;
      const p = pos(v, tc);
      if (p) parada = true;
      const f = Math.sin(t * 10) > 0;
      v.lr.material = f ? m.sr : m.dark;
      v.lb.material = f ? m.dark : m.sb;
    });
    const sal = parada;
    forma.forEach((s, i) => {
      const resp = Math.sin(t * 1.2 + i) * 0.01;
      s.o.position.y = 0.07 + resp;
      s.aD.rotation.x = sal ? -2.4 : 0;
      s.aD.rotation.z = sal ? -0.25 : 0;
    });
    sent.forEach((s, i) => {
      s.o.rotation.y = Math.sin(t * 0.4 + i * 2) * 0.4;
    });
    pat.forEach((p) => {
      const k = ((t + p.off) % 30) / 15;
      const a = k < 1 ? k : 2 - k;
      const x = -6.5 + 13 * a;
      p.s.o.position.x = x;
      p.s.o.position.z = 1.9;
      p.s.o.rotation.y = k < 1 ? PI / 2 : -PI / 2;
      const sw = Math.sin(t * 6) * 0.5;
      p.s.lE.rotation.x = sw;
      p.s.lD.rotation.x = -sw;
      p.s.aE.rotation.x = -sw * 0.6;
      p.s.aD.rotation.x = sw * 0.6;
    });
    flags.forEach((f, fi) => {
      const a = f.geo.attributes.position!;
      for (let i = 0; i < a.count; i++) {
        const x = f.base[i * 3]!;
        const u = (x + 0.6) / 1.2;
        a.array[i * 3 + 2] = 0.14 * u * Math.sin(u * 8 - t * 5 + fi);
      }
      a.needsUpdate = true;
    });
  };

  return g;
}
