import * as THREE from "three";

export type PelourinhoGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    alternarBatuque: () => boolean;
  };
};

export function criarPelourinho(): PelourinhoGroup {
  const g = new THREE.Group() as PelourinhoGroup;
  g.name = "Pelourinho";
  const PI = Math.PI;
  let sd = 17;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  const M = (c: number, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o || {}));

  const m = {
    dirt: M(0x857866),
    stone: M(0x9b9488),
    white: M(0xf5f3ec),
    blue: M(0x2f66b8),
    tile: M(0xc86a3a, { flatShading: true }),
    win: M(0x22344d, { roughness: 0.2 }),
    wood: M(0x5a3a22),
    dark: M(0x1c1c20),
    rail: M(0x25252a),
    lamp: M(0xffd98a, { emissive: 0xffb84a, emissiveIntensity: 0.8 }),
    skin: M(0x6b4a36),
    yellow: M(0xf2c230),
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

  bx(12.4, 0.6, 16, m.dirt, 0, -0.3, -1);

  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const cx = cv.getContext("2d");
  if (!cx) throw new Error("2d context unavailable");
  cx.fillStyle = "#6f695e";
  cx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 64; i++) {
    const x = (i % 8) * 16 + (((i / 8) | 0) % 2) * 8;
    const y = ((i / 8) | 0) * 16;
    cx.fillStyle = `hsl(30,6%,${46 + rnd() * 18}%)`;
    cx.beginPath();
    if (cx.roundRect) cx.roundRect(x + 1, y + 1, 14, 14, 4);
    else cx.rect(x + 1, y + 1, 14, 14);
    cx.fill();
  }
  const tc = new THREE.CanvasTexture(cv);
  tc.wrapS = tc.wrapT = THREE.RepeatWrapping;
  tc.repeat.set(8, 10);
  const largo = new THREE.Mesh(
    new THREE.PlaneGeometry(12.4, 16),
    new THREE.MeshStandardMaterial({ map: tc, roughness: 0.95 }),
  );
  largo.rotation.x = -PI / 2;
  largo.position.set(0, 0.011, -1);
  g.add(largo);

  const sombra = [0x2d6b4f, 0x2f66b8, 0xb8472f, 0x3a3a42];
  const casa = (x: number, z: number, w: number, h: number, cor: number, lado: number) => {
    const c = new THREE.Group();
    c.position.set(x, 0, z);
    c.rotation.y = (lado * PI) / 2;
    g.add(c);
    const d = 2.2;
    const f = d / 2;
    bx(w, h, d, M(cor), 0, h / 2, 0, c);
    hip(0.15, 1, 0.7, m.tile, 0, h + 0.35, 0, (w * 1.05) / 1.414, (d * 1.05) / 1.414, c);
    bx(w + 0.1, 0.1, d + 0.1, m.white, 0, h - 0.05, 0, c);
    [-1, 1].forEach((s) => bx(0.1, h, 0.1, m.white, s * (w / 2 - 0.05), h / 2, f, c));
    bx(w, 0.25, 0.04, m.stone, 0, 0.125, f + 0.02, c);
    const xs = w > 2.4 ? [-0.85, 0, 0.85] : [-0.6, 0.6];
    const sh = M(sombra[Math.floor(rnd() * 4)]);
    [1.55, 2.5].forEach((y, fl) =>
      xs.forEach((px) => {
        bx(0.34, 0.5, 0.04, m.white, px, y, f + 0.02, c);
        bx(0.26, 0.42, 0.05, m.win, px, y, f + 0.03, c);
        [-0.2, 0.2].forEach((s) => bx(0.08, 0.42, 0.05, sh, px + s, y, f + 0.04, c));
        if (fl === 0) {
          bx(0.5, 0.05, 0.22, m.white, px, y - 0.3, f + 0.1, c);
          bx(0.5, 0.16, 0.02, m.rail, px, y - 0.2, f + 0.2, c);
        }
      }),
    );
    const dx = w > 2.4 ? 0 : -0.6;
    bx(0.42, 0.75, 0.05, m.wood, dx, 0.45, f + 0.03, c);
    const ar = new THREE.Mesh(new THREE.CircleGeometry(0.21, 12, 0, PI), m.wood);
    ar.position.set(dx, 0.83, f + 0.035);
    c.add(ar);
    (w > 2.4 ? [-0.85, 0.85] : [0.6]).forEach((px) => {
      bx(0.3, 0.4, 0.04, m.white, px, 0.62, f + 0.02, c);
      bx(0.22, 0.32, 0.05, m.win, px, 0.62, f + 0.03, c);
    });
    return c;
  };

  (
    [
      [-4.2, 3.2, 0x5a9bd4],
      [-1.4, 3.0, 0xf0c24a],
      [1.4, 3.4, 0xe58aa5],
      [4.2, 2.9, 0x7bc08a],
    ] as const
  ).forEach((e) => casa(-4.9, e[0], 2.7, e[1], e[2], 1));
  (
    [
      [-4.2, 3.1, 0xf29a4a],
      [-1.4, 3.4, 0xdd5b5b],
      [1.4, 2.9, 0x8fc7e0],
      [4.2, 3.2, 0xe9d58a],
    ] as const
  ).forEach((e) => casa(4.9, e[0], 2.7, e[1], e[2], -1));

  bx(6.4, 0.45, 3, m.stone, 0, 0.225, -7);
  bx(3.2, 3.6, 1.4, m.white, 0, 2.25, -7.3);
  [0.9, 2.1, 3.3].forEach((y) => bx(3.3, 0.1, 1.5, m.blue, 0, 0.45 + y, -7.3));
  [-2.1, 2.1].forEach((x) => {
    bx(1, 5.2, 1, m.white, x, 3.05, -7.3);
    bx(1.05, 0.12, 1.05, m.blue, x, 3.4, -7.3);
    bx(0.4, 0.6, 0.05, m.dark, x, 4.5, -6.78);
    hip(0, 0.75, 0.9, m.blue, x, 6.1, -7.3, 1, 1);
  });
  const fr = new THREE.Shape();
  fr.moveTo(-1.8, 0);
  fr.lineTo(1.8, 0);
  fr.lineTo(0, 1);
  fr.closePath();
  const fro = new THREE.Mesh(
    new THREE.ExtrudeGeometry(fr, { depth: 1.4, bevelEnabled: false }),
    m.white,
  );
  fro.position.set(0, 4.05, -8);
  g.add(fro);
  bx(0.9, 1.3, 0.05, m.wood, 0, 1.1, -6.58);
  const ap = new THREE.Mesh(new THREE.CircleGeometry(0.45, 14, 0, PI), m.wood);
  ap.position.set(0, 1.75, -6.58);
  g.add(ap);
  const rosa = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), m.win);
  rosa.position.set(0, 3.1, -6.59);
  g.add(rosa);
  [-1, 1].forEach((s) => bx(0.3, 0.5, 0.04, m.win, s * 0.8, 2.2, -6.59));
  for (let j = 0; j < 4; j++) bx(3.6, 0.11 * (j + 1), 0.5, m.stone, 0, 0.055 * (j + 1), -5.25 + (3 - j) * 0.5);

  bx(0.5, 0.15, 0.5, m.stone, 2.2, 0.075, -1);
  cyl(0.12, 0.14, 1.3, m.stone, 2.2, 0.8, -1);
  const bola = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), m.stone);
  bola.position.set(2.2, 1.5, -1);
  g.add(bola);
  [-4, 0, 4].forEach((z) =>
    [-3.6, 3.6].forEach((x) => {
      cyl(0.03, 0.04, 2.2, m.rail, x, 1.1, z, g, 8);
      bx(0.2, 0.28, 0.2, m.lamp, x, 2.3, z);
      bx(0.26, 0.05, 0.26, m.rail, x, 2.47, z);
    }),
  );

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
  palma(-3, 6.4, 3.2);
  palma(3, 6.4, 2.9);
  bx(1, 0.5, 0.5, m.yellow, -2.4, 0.25, 2);
  cyl(0.02, 0.02, 1.2, m.rail, -2.4, 0.9, 2, g, 6);
  cyl(0, 0.9, 0.3, M(0x2f66b8), -2.4, 1.55, 2, g, 12);

  const figura = (cor: number, saia: boolean, esc?: number) => {
    const f = new THREE.Group();
    if (saia) {
      cyl(0.07, 0.17, 0.3, m.white, 0, 0.15, 0, f, 10);
      bx(0.13, 0.16, 0.09, m.white, 0, 0.38, 0, f);
    } else {
      [-0.03, 0.03].forEach((x) => bx(0.05, 0.2, 0.06, m.dark, x, 0.1, 0, f));
      bx(0.14, 0.2, 0.09, M(cor), 0, 0.3, 0, f);
    }
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), m.skin);
    h.position.y = saia ? 0.5 : 0.46;
    f.add(h);
    if (saia) {
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), m.white);
      t.position.y = 0.55;
      t.scale.y = 0.7;
      f.add(t);
    }
    f.scale.setScalar(esc || 1);
    return f;
  };
  (
    [
      [-2.0, 2.7, 0.5],
      [-2.8, 2.7, 1.2],
      [-1.6, 1.9, 2.2],
    ] as const
  ).forEach((p) => {
    const b = figura(0, true, 1.2);
    b.position.set(p[0], 0, p[1]);
    b.rotation.y = p[2];
    g.add(b);
  });

  const bateria: { f: THREE.Group; v: THREE.Mesh; ph: number }[] = [];
  [0xf2c230, 0xd9342b, 0x2fa84f, 0x222222, 0xf2c230, 0xd9342b].forEach((c, i) => {
    const a = -1 + i * 0.4;
    const f = figura(c, false, 1.2);
    f.position.set(a * 1.1, 0, -3.5 + Math.abs(a) * 0.5);
    f.rotation.y = PI;
    cyl(0.09, 0.09, 0.22, i % 2 ? m.yellow : m.blue, 0, 0.28, 0.12, f, 12);
    const v = bx(0.02, 0.15, 0.02, m.white, 0.08, 0.38, 0.1, f);
    g.add(f);
    bateria.push({ f, v, ph: i * 0.7 });
  });

  const disco = document.createElement("canvas");
  disco.width = disco.height = 32;
  const dc = disco.getContext("2d");
  if (!dc) throw new Error("2d context unavailable");
  dc.fillStyle = "#fff";
  dc.beginPath();
  dc.arc(16, 16, 15, 0, 7);
  dc.fill();
  const dt = new THREE.CanvasTexture(disco);
  const xs: number[] = [];
  const zs: number[] = [];
  const ph: number[] = [];
  for (let n = 0; n < 280; ) {
    const x = -3.6 + rnd() * 7.2;
    const z = -5 + rnd() * 10.6;
    if (
      Math.hypot(x + 2.4, z - 2) < 0.9 ||
      Math.hypot(x - 2.2, z + 1) < 0.45 ||
      (Math.abs(x) < 1.5 && z < -2.2 && z > -4.4)
    )
      continue;
    xs.push(x);
    zs.push(z);
    ph.push(rnd() * 6.28);
    n++;
  }
  const N = xs.length;
  const hp = new Float32Array(N * 3);
  const tp = new Float32Array(N * 3);
  const hc = new Float32Array(N * 3);
  const tcol = new Float32Array(N * 3);
  const col = new THREE.Color();
  const pele = [0x6b4a36, 0x8a5a3c, 0xc08a60, 0xf0c9a0];
  const rou = [0xffffff, 0xf2c230, 0x2e6ee0, 0xe03030, 0x35b85a, 0xff8a1e, 0xffffff, 0xe58aa5];
  for (let i = 0; i < N; i++) {
    col.setHex(pele[Math.floor(rnd() * 4)]);
    hc.set([col.r, col.g, col.b], i * 3);
    col.setHex(rou[Math.floor(rnd() * rou.length)]);
    tcol.set([col.r, col.g, col.b], i * 3);
    hp.set([xs[i], 0.56, zs[i]], i * 3);
    tp.set([xs[i], 0.34, zs[i]], i * 3);
  }
  const pts = (p: Float32Array, c: Float32Array, s: number) => {
    const gm = new THREE.BufferGeometry();
    gm.setAttribute("position", new THREE.BufferAttribute(p, 3));
    gm.setAttribute("color", new THREE.BufferAttribute(c, 3));
    const o = new THREE.Points(
      gm,
      new THREE.PointsMaterial({ size: s, vertexColors: true, map: dt, alphaTest: 0.4 }),
    );
    o.frustumCulled = false;
    g.add(o);
    return o;
  };
  const pH = pts(hp, hc, 0.12);
  const pT = pts(tp, tcol, 0.19);

  const tri = new THREE.Shape();
  tri.moveTo(-0.11, 0);
  tri.lineTo(0.11, 0);
  tri.lineTo(0, -0.26);
  const triG = new THREE.ShapeGeometry(tri);
  const cores = [0xe03030, 0xf2c230, 0x2e6ee0, 0x35b85a, 0xff8a1e, 0xe58aa5].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 0.9 }),
  );
  const bandeiras: { f: THREE.Mesh; ph: number }[] = [];
  [-2.8, 0.2, 3].forEach((z, li) => {
    const pontos: THREE.Vector3[] = [];
    for (let k = 0; k <= 8; k++) {
      const s = k / 8;
      pontos.push(new THREE.Vector3(-3.8 + 7.6 * s, 3.15 - 0.55 * 4 * s * (1 - s), z));
    }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos), 24, 0.008, 4), m.rail));
    for (let k = 1; k < 18; k++) {
      const s = k / 18;
      const f = new THREE.Mesh(triG, cores[(k + li) % 6]);
      f.position.set(-3.8 + 7.6 * s, 3.15 - 0.55 * 4 * s * (1 - s), z);
      g.add(f);
      bandeiras.push({ f, ph: k + li * 3 });
    }
  });

  let t = 0;
  const vai = true;
  let tocar = true;
  g.userData.alternarBatuque = () => (tocar = !tocar);
  g.userData.tick = (dt2) => {
    if (!vai) return;
    t += dt2;
    bandeiras.forEach((b) => {
      b.f.rotation.z = 0.3 * Math.sin(t * 2.2 + b.ph);
      b.f.rotation.y = 0.25 * Math.sin(t * 1.6 + b.ph * 0.7);
    });
    const ha = pH.geometry.attributes.position;
    const ta = pT.geometry.attributes.position;
    const A = tocar ? 0.07 : 0.012;
    for (let i = 0; i < N; i++) {
      const b = Math.abs(Math.sin(t * (tocar ? 5 : 1.5) + ph[i]));
      (ha.array as Float32Array)[i * 3 + 1] = 0.56 + A * b;
      (ta.array as Float32Array)[i * 3 + 1] = 0.34 + A * 0.55 * b;
    }
    ha.needsUpdate = true;
    ta.needsUpdate = true;
    bateria.forEach((b) => {
      const s = tocar ? Math.abs(Math.sin(t * 8 + b.ph)) : 0;
      b.f.position.y = 0.03 * s;
      b.v.rotation.x = tocar ? -0.9 * Math.sin(t * 8 + b.ph) : 0;
    });
  };

  return g;
}
