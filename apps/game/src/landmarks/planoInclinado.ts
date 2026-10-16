import * as THREE from "three";

export type PlanoInclinadoGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    alternarCabines: () => boolean;
  };
};

export function criarPlanoInclinado(): PlanoInclinadoGroup {
  const g = new THREE.Group() as PlanoInclinadoGroup;
  g.name = "PlanoInclinado";
  const PI = Math.PI;
  const A = 0.49;
  const SA = Math.sin(A);
  const CA = Math.cos(A);
  const L = 9;
  const TZ = -4.5;
  const TY = 4.8;
  const PY = TY - L * SA;
  const tanA = Math.tan(A);
  let sd = 5;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  const M = (c: number | THREE.Color, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o || {}));

  const m = {
    grass: M(0x7ea83a),
    dirt: M(0x8a6d4c),
    conc: M(0xa59f92),
    wallA: M(0xb9b4a6),
    wallB: M(0xc9c4b6),
    rail: M(0x6f7378, { metalness: 0.5, roughness: 0.4 }),
    dark: M(0x1d2026),
    cream: M(0xf1e2b4),
    creamL: M(0xf4efdf),
    yellow: M(0xf4c430),
    pink: M(0xe98aa2),
    pink2: M(0xe8627a),
    roof: M(0x45464a, { flatShading: true }),
    tile: M(0xb98e5c, { flatShading: true }),
    tile2: M(0xc9a36a, { flatShading: true }),
    white: M(0xf6f6f2),
    win: M(0x233046, { roughness: 0.2 }),
    blue: M(0x2b66b8, { roughness: 0.5 }),
    blueD: M(0x1e4f95),
    glass: M(0x2a3a52, { roughness: 0.2 }),
    modern: M(0xdfe1e3),
    metal: M(0x8d98a8),
    trunk: M(0x7a6a52),
    leaf: M(0x2f8a2e),
    leaf2: M(0x3f9d36),
    cable: M(0x222222),
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
  ) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, 4), mt);
    o.rotation.y = PI / 4;
    o.scale.set(sx, 1, sz);
    o.position.set(x, y, z);
    o.castShadow = true;
    g.add(o);
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

  const placa = (txt: string, w: number, h: number, x: number, y: number, z: number) => {
    const t = tex(512, 64, (c, W, H) => {
      c.fillStyle = "#efe3b6";
      c.fillRect(0, 0, W, H);
      c.strokeStyle = "#1f2a55";
      c.lineWidth = 3;
      c.strokeRect(5, 5, W - 10, H - 10);
      c.fillStyle = "#1f2a55";
      c.font = "bold 34px Georgia,serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(txt, W / 2, H / 2 + 2);
    });
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }),
    );
    p.position.set(x, y, z);
    g.add(p);
  };

  const sh = new THREE.Shape();
  sh.moveTo(-8, 0);
  sh.lineTo(-8, TY);
  sh.lineTo(TZ, TY);
  sh.lineTo(TZ + L * CA, PY);
  sh.lineTo(7.5, PY);
  sh.lineTo(7.5, 0);
  sh.closePath();
  const ter = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 12, bevelEnabled: false }), [
    m.dirt,
    m.grass,
  ]);
  ter.rotation.y = -PI / 2;
  ter.position.x = 6;
  ter.receiveShadow = true;
  g.add(ter);

  const mosaico = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 4),
    new THREE.MeshStandardMaterial({
      roughness: 0.9,
      map: tex(
        128,
        64,
        (c, W, H) => {
          c.fillStyle = "#ece8de";
          c.fillRect(0, 0, W, H);
          c.strokeStyle = "#22262b";
          c.lineWidth = 20;
          [16, 48].forEach((y0) => {
            c.beginPath();
            for (let x = 0; x <= W; x += 4) {
              const y = y0 + 10 * Math.sin((x / W) * PI * 2);
              if (x) c.lineTo(x, y);
              else c.moveTo(x, y);
            }
            c.stroke();
          });
        },
        6,
        4,
      ),
    }),
  );
  mosaico.rotation.x = -PI / 2;
  mosaico.position.set(0, PY + 0.01, 5.5);
  mosaico.receiveShadow = true;
  g.add(mosaico);

  const T = new THREE.Group();
  T.position.set(0, TY, TZ);
  T.rotation.x = A;
  g.add(T);
  bx(3.7, 0.12, L, m.conc, 0, 0.02, L / 2, T);

  const plano = (w: number, t: THREE.Texture, x: number, y: number) => {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(w, L),
      new THREE.MeshStandardMaterial({ map: t, roughness: 1 }),
    );
    p.rotation.x = -PI / 2;
    p.position.set(x, y, L / 2);
    T.add(p);
  };
  const lastro = tex(
    16,
    16,
    (c) => {
      c.fillStyle = "#8d8a82";
      c.fillRect(0, 0, 16, 16);
      c.fillStyle = "#5a4a3c";
      c.fillRect(0, 6, 16, 4);
    },
    1,
    L / 0.18,
  );
  const degraus = tex(
    16,
    16,
    (c) => {
      c.fillStyle = "#b7b2a6";
      c.fillRect(0, 0, 16, 16);
      c.fillStyle = "#6f6b62";
      c.fillRect(0, 0, 16, 5);
    },
    1,
    L / 0.22,
  );
  [-0.9, 0.9].forEach((x) => {
    plano(0.9, lastro, x, 0.09);
    [-0.2, 0.2].forEach((d) => bx(0.04, 0.05, L, m.rail, x + d, 0.11, L / 2, T));
  });
  plano(0.55, degraus, 0, 0.09);
  bx(0.2, 0.7, L, m.wallA, -1.8, 0.3, L / 2, T);
  bx(0.2, 0.7, L, m.wallB, 1.8, 0.3, L / 2, T);
  const cores = [0xe84855, 0xf9c80e, 0x2e86ab, 0x3bb273, 0xf6f6f2];
  for (let i = 0; i < 15; i++) bx(0.02, 0.18, 0.3, M(cores[i % 5]), -1.69, 0.4, 0.6 + i * 0.55, T);

  type Cabine = { c: THREE.Group; cab: THREE.Mesh };
  const cabine = (tx: number): Cabine => {
    const c = new THREE.Group();
    c.position.set(tx, 0.1, 2);
    T.add(c);
    const n = new THREE.Group();
    n.rotation.x = -A;
    c.add(n);
    bx(1.2, 0.07, 1.8, m.dark, 0, 0.98, 0, n);
    bx(1.1, 0.8, 1.7, m.blue, 0, 1.4, 0, n);
    bx(1.2, 0.07, 1.8, m.blueD, 0, 1.83, 0, n);
    [-0.5, 0, 0.5].forEach((z) =>
      [0.556, -0.556].forEach((x) => bx(0.012, 0.36, 0.4, m.glass, x, 1.45, z, n)),
    );
    [0.86, -0.86].forEach((z) => bx(0.6, 0.2, 0.02, m.white, 0, 1.5, z, n));
    [-0.5, 0.5].forEach((sx) => {
      bx(0.06, 1 - 0.75 * tanA, 0.06, m.dark, sx, (1 + 0.75 * tanA) / 2, -0.75, n);
      bx(0.06, 1 + 0.75 * tanA, 0.06, m.dark, sx, (1 - 0.75 * tanA) / 2, 0.75, n);
      const d = bx(0.03, 0.03, 1.8, m.dark, sx, 0.4, 0, n);
      d.rotation.x = 0.588;
      bx(0.14, 0.1, 0.34, m.dark, sx, 0.4, -0.75, n);
      bx(0.14, 0.1, 0.34, m.dark, sx, -0.4, 0.75, n);
    });
    const cab = bx(0.02, 0.02, 1, m.cable, tx, 0.14, 0.5, T);
    return { c, cab };
  };
  const cA = cabine(-0.9);
  const cB = cabine(0.9);

  bx(3.8, 2.4, 2, m.cream, 0, TY + 1.2, -5.5);
  bx(2.9, 1.35, 0.05, m.dark, 0, TY + 0.85, TZ - 0.03 + 0.05);
  bx(0.5, 1.3, 0.4, m.cream, 0, TY + 0.8, -4.3);
  [-1.7, 1.7].forEach((x) => bx(0.45, 2.4, 0.5, m.cream, x, TY + 1.2, -4.3));
  hip(0.6, 2.1, 0.55, m.roof, 0, TY + 2.68, -5.5, 1.4, 0.95);
  placa("PLANO GONÇALVES", 3, 0.4, 0, TY + 1.8, TZ + 0.0);

  bx(2.6, 2.2, 2, m.pink, -3.6, TY + 1.1, -6.3);
  hip(0.5, 1.9, 0.6, m.tile, -3.6, TY + 2.5, -6.3, 1, 0.85);
  [-0.8, 0, 0.8].forEach((dx) =>
    [0.7, 1.55].forEach((y) => {
      bx(0.34, 0.52, 0.04, m.white, -3.6 + dx, TY + y, -5.29);
      bx(0.24, 0.42, 0.05, m.win, -3.6 + dx, TY + y, -5.28);
    }),
  );
  bx(5.4, 3.2, 1.5, m.creamL, 1, TY + 1.6, -7.25);
  hip(0.5, 2.2, 0.7, m.tile2, 1, TY + 3.55, -7.25, 1.75, 0.6);
  for (let k = 0; k < 7; k++)
    [2.3, 0.9].forEach((y) => {
      bx(0.3, 0.5, 0.04, m.white, 1 - 2.4 + k * 0.8, TY + y, -6.49);
      bx(0.22, 0.42, 0.05, m.win, 1 - 2.4 + k * 0.8, TY + y, -6.48);
    });
  bx(2.2, 3.6, 1.4, m.creamL, -3, TY + 1.8, -7.3);
  bx(0.8, 5, 0.8, m.creamL, -4.3, TY + 2.5, -7.3);
  hip(0, 0.65, 0.8, m.tile, -4.3, TY + 5.4, -7.3, 1, 1);
  bx(2.4, 1.3, 2.2, m.metal, 4, TY + 0.65, -6.2);
  bx(2.4, 1.4, 2.2, m.modern, 4, TY + 2, -6.2);
  bx(1.6, 0.6, 0.04, m.win, 3.9, TY + 0.95, -5.08);

  const B = PY;
  bx(4, 1.9, 1.8, m.creamL, 0, B + 0.95, 4.4);
  bx(1.5, 1.05, 0.05, m.dark, 0, B + 0.53, 5.3);
  [-1.1, 0, 1.1].forEach((x) => {
    bx(0.56, 0.42, 0.03, m.white, x, B + 1.55, 5.31);
    bx(0.5, 0.36, 0.04, m.win, x, B + 1.55, 5.32);
  });
  placa("PLANO INCLINADO GONÇALVES", 3.2, 0.28, 0, B + 1.2, 5.31);
  bx(0.9, 2.3, 1.8, m.yellow, -2.45, B + 1.15, 4.4);
  bx(1.2, 1.9, 1.8, m.creamL, -3.5, B + 0.95, 4.4);
  bx(1.6, 2.1, 1.8, m.pink2, 2.8, B + 1.05, 4.4);
  bx(1.2, 2.4, 1.8, m.creamL, 4.4, B + 1.2, 4.4);

  const bush = (x: number, u: number) => {
    const b = new THREE.Group();
    const n = 2 + Math.floor(rnd() * 2);
    for (let i = 0; i < n; i++) {
      const r = 0.4 + rnd() * 0.35;
      const c = new THREE.Color().setHSL(0.23 + rnd() * 0.06, 0.55, 0.24 + rnd() * 0.12);
      const o = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M(c));
      o.position.set((rnd() - 0.5) * 0.7, r * 0.8, (rnd() - 0.5) * 0.7);
      o.castShadow = true;
      b.add(o);
    }
    b.position.set(x, TY - u * SA, TZ + u * CA);
    g.add(b);
  };
  for (let i = 0; i < 16; i++) bush(-2.4 - rnd() * 3.4, 0.4 + rnd() * 8);
  for (let i = 0; i < 18; i++) bush(2.4 + rnd() * 3.4, 0.4 + rnd() * 8);

  const palma = (x: number, u: number, h: number) => {
    const p = new THREE.Group();
    p.position.set(x, TY - u * SA, TZ + u * CA);
    g.add(p);
    bx(0.12, h, 0.12, m.trunk, 0, h / 2, 0, p);
    for (let i = 0; i < 8; i++) {
      const yaw = new THREE.Group();
      yaw.position.y = h;
      yaw.rotation.y = (i * PI) / 4;
      p.add(yaw);
      const tilt = new THREE.Group();
      tilt.rotation.z = -0.3 - (i % 2) * 0.25;
      yaw.add(tilt);
      bx(0.9, 0.025, 0.17, i % 2 ? m.leaf : m.leaf2, 0.45, 0, 0, tilt);
    }
  };
  palma(3.1, 4, 1.3);

  const UMIN = 1.3;
  const UMAX = L - 1.3;
  let vai = true;
  let t = 0;
  const sm = (x: number) => x * x * (3 - 2 * x);
  const pos = (c: Cabine, u: number) => {
    c.c.position.z = u;
    c.cab.position.z = u / 2;
    c.cab.scale.z = u;
  };
  pos(cA, UMIN);
  pos(cB, UMAX);
  g.userData.alternarCabines = () => {
    vai = !vai;
    return vai;
  };
  g.userData.tick = (dt: number) => {
    if (!vai) return;
    t += dt;
    const tt = t % 17;
    let p: number;
    if (tt < 2.5) p = 0;
    else if (tt < 8.5) p = sm((tt - 2.5) / 6);
    else if (tt < 11) p = 1;
    else p = 1 - sm((tt - 11) / 6);
    pos(cA, UMIN + (UMAX - UMIN) * p);
    pos(cB, UMIN + (UMAX - UMIN) * (1 - p));
  };

  return g;
}
