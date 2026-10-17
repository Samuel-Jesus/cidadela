import * as THREE from "three";

export type ViaturaEstilo = "azul" | "bege";

export type ViaturaGroup = THREE.Group & {
  userData: {
    tickRaid: (dt: number, tc: number) => void;
    /** Cavalo de pau: s em [0,1], leanSign ±1 */
    tickDrift: (dt: number, s: number, leanSign: number) => void;
    resetRaid: () => void;
    clearFx: () => void;
    setSiren: (on: boolean, t?: number) => void;
    car: THREE.Group;
    estilo: ViaturaEstilo;
  };
};

export const RAID_DUR = 10;
export const RAID_SHOOT_START = 1.2;
export const RAID_SHOOT_END = 7.2;
export const DRIFT_DUR = 1.4;

type Oficial = {
  o: THREE.Group;
  lE: THREE.Group;
  lD: THREE.Group;
  aE: THREE.Group;
  aD: THREE.Group;
  arma: THREE.Group;
  fl: THREE.Mesh;
  bico: THREE.Object3D;
  prox: number;
  ap: number;
  S: THREE.Vector3;
  D: THREE.Vector3;
  P: THREE.Vector3;
  i: number;
};

const sm = (x: number) => x * x * (3 - 2 * x);
const cl = (x: number) => Math.max(0, Math.min(1, x));

export function criarViatura(estilo: ViaturaEstilo): ViaturaGroup {
  const g = new THREE.Group() as ViaturaGroup;
  g.name = estilo === "azul" ? "ViaturaAzul" : "ViaturaBege";
  const PI = Math.PI;
  const V = THREE.Vector3;
  const az = estilo === "azul";

  const M = (c: number, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(
      Object.assign({ color: c, roughness: 0.7 }, o || {}),
    );

  const m = {
    white: M(0xf3f4f6),
    blue: M(0x1f4fb0),
    tan: M(0xc9ad88),
    dk: M(0x2b2d31),
    black: M(0x15161a),
    grey: M(0x8d9196),
    glass: M(0x233046, { transparent: true, opacity: 0.4, roughness: 0.1 }),
    lamp: M(0xfff3b0, { emissive: 0xffe9a0, emissiveIntensity: 0.7 }),
    sr: M(0xff2a1a, { emissive: 0xff1100, emissiveIntensity: 1 }),
    sb: M(0x2a5cff, { emissive: 0x1040ff, emissiveIntensity: 1 }),
    amb: M(0xffa21a, { emissive: 0xff8800, emissiveIntensity: 0.8 }),
    skin: M(0x7a5238),
    trace: M(0xffe066, { emissive: 0xffcc22, emissiveIntensity: 1 }),
    flash: M(0xfff2a0, { emissive: 0xffdd55, emissiveIntensity: 2 }),
    smoke: M(0xe8e8e8, {
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
    skid: M(0x1a1a1c),
  };

  const bx = (
    w: number,
    h: number,
    d: number,
    mt: THREE.Material,
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

  const texto = (s: string, cor: string, w: number, h: number) => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 48;
    const x = c.getContext("2d")!;
    x.fillStyle = cor;
    x.font = "bold 34px Arial,sans-serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(s, 128, 26);
    return new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(c),
        transparent: true,
      }),
    );
  };

  const oficial = (cor: number, longa: boolean): Oficial => {
    const o = new THREE.Group();
    const pv = (x: number, y: number, p: THREE.Object3D) => {
      const q = new THREE.Group();
      q.position.set(x, y, 0);
      p.add(q);
      return q;
    };
    const lE = pv(-0.08, 0.55, o);
    const lD = pv(0.08, 0.55, o);
    bx(0.12, 0.52, 0.12, M(0x23262b), 0, -0.26, 0, lE);
    bx(0.12, 0.52, 0.12, M(0x23262b), 0, -0.26, 0, lD);
    bx(0.32, 0.42, 0.2, M(cor), 0, 0.78, 0, o);
    bx(0.34, 0.3, 0.22, m.black, 0, 0.8, 0, o);
    const aE = pv(-0.2, 0.95, o);
    const aD = pv(0.2, 0.95, o);
    [aE, aD].forEach((a) => {
      bx(0.09, 0.4, 0.09, M(cor), 0, -0.2, 0, a);
      ball(0.05, m.skin, 0, -0.42, 0, a);
    });
    ball(0.095, m.skin, 0, 1.1, 0, o);
    const cap = ball(0.115, m.black, 0, 1.14, 0, o);
    cap.scale.y = 0.75;
    const arma = new THREE.Group();
    arma.position.set(0, 0.93, 0.3);
    o.add(arma);
    bx(0.05, 0.07, longa ? 0.6 : 0.28, m.dk, 0, 0, longa ? 0.12 : 0.04, arma);
    bx(0.04, 0.14, 0.05, m.dk, 0, -0.08, 0, arma);
    if (longa) bx(0.05, 0.09, 0.18, m.dk, 0, -0.01, -0.26, arma);
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), m.flash);
    fl.rotation.x = PI / 2;
    fl.position.set(0, 0, longa ? 0.5 : 0.26);
    fl.visible = false;
    arma.add(fl);
    const bico = new THREE.Object3D();
    bico.position.set(0, 0.93, longa ? 0.95 : 0.6);
    o.add(bico);
    o.scale.setScalar(0.95);
    return {
      o,
      lE,
      lD,
      aE,
      aD,
      arma,
      fl,
      bico,
      prox: 0,
      ap: arma.position.z,
      S: new V(),
      D: new V(),
      P: new V(),
      i: 0,
    };
  };

  const car = new THREE.Group();
  g.add(car);
  const corpo = az ? m.blue : m.tan;
  const baixo = az ? m.white : m.dk;
  const fard = az ? 0x1b2a4a : 0x3b4130;

  bx(3.1, 0.2, 1.1, m.black, 0, 0.42, 0, car);
  bx(3.1, 0.38, 1.28, baixo, 0, 0.7, 0, car);
  bx(1, 0.2, 1.26, corpo, 1.15, 0.99, 0, car);
  bx(1.5, 0.07, 1.22, corpo, 0.1, 1.52, 0, car);
  (
    [
      [-0.62, -0.58],
      [-0.62, 0.58],
      [0.85, -0.58],
      [0.85, 0.58],
      [0.1, -0.6],
      [0.1, 0.6],
    ] as const
  ).forEach((p) => bx(0.07, 0.45, 0.07, corpo, p[0], 1.25, p[1], car));
  [0.6, -0.6].forEach((z) => bx(1.5, 0.4, 0.02, m.glass, 0.1, 1.25, z, car));
  bx(0.02, 0.45, 1.14, m.glass, 0.9, 1.25, 0, car).rotation.z = 0.4;
  bx(0.02, 0.4, 1.14, m.glass, -0.64, 1.25, 0, car);
  bx(1.2, 0.05, 1.2, m.black, -1.1, 0.9, 0, car);

  if (az) {
    bx(1.25, 0.5, 1.22, m.blue, -1.1, 1.2, 0, car);
    bx(0.02, 0.34, 0.9, m.dk, -1.73, 1.22, 0, car);
    bx(1.25, 0.12, 1.23, m.white, -1.1, 0.99, 0, car);
    const n = texto("1.0138", "#ffffff", 0.8, 0.2);
    n.position.set(-1.74, 1.22, 0);
    n.rotation.y = -PI / 2;
    car.add(n);
    bx(0.06, 0.45, 1.1, m.black, 1.72, 0.8, 0, car);
    [-0.4, 0, 0.4].forEach((z) =>
      bx(0.05, 0.4, 0.05, m.black, 1.74, 0.8, z, car),
    );
  } else {
    [0.58, -0.58].forEach((z) =>
      bx(1.2, 0.3, 0.05, m.tan, -1.1, 1.05, z, car),
    );
    bx(0.05, 0.3, 1.2, m.tan, -1.7, 1.05, 0, car);
    [0.5, -0.5].forEach((z) =>
      bx(0.05, 0.45, 0.05, m.dk, -0.65, 1.25, z, car),
    );
    bx(0.05, 0.05, 1.05, m.dk, -0.65, 1.5, 0, car);
  }

  bx(0.15, 0.22, 1.3, m.black, 1.7, 0.58, 0, car);
  bx(0.15, 0.22, 1.3, m.black, -1.75, 0.58, 0, car);
  [-0.45, 0.45].forEach((z) => bx(0.04, 0.1, 0.25, m.lamp, 1.64, 0.95, z, car));
  (
    [
      [1.05, 0.62],
      [1.05, -0.62],
      [-1.05, 0.62],
      [-1.05, -0.62],
    ] as const
  ).forEach((p) => {
    const w = cyl(0.27, 0.27, 0.2, m.black, p[0], 0.27, p[1], car, 16);
    w.rotation.x = PI / 2;
    const r = cyl(0.15, 0.15, 0.22, m.grey, p[0], 0.27, p[1], car, 10);
    r.rotation.x = PI / 2;
  });
  bx(1, 0.07, 0.22, m.black, 0.3, 1.6, 0, car);
  const lr = bx(0.38, 0.08, 0.2, m.sr, 0.1, 1.67, 0, car);
  const lb = bx(0.38, 0.08, 0.2, m.sb, 0.5, 1.67, 0, car);
  if (!az) bx(0.3, 0.06, 0.18, m.amb, 0.3, 1.67, 0, car);

  const portas: { pg: THREE.Group; s: number }[] = [];
  [1, -1].forEach((s) =>
    (
      [
        [0.9, 0],
        [0, 1],
      ] as const
    ).forEach((d) => {
      const pg = new THREE.Group();
      pg.position.set(d[0], 0, s * 0.64);
      car.add(pg);
      bx(0.62, 0.38, 0.04, corpo, -0.33, 0.73, 0, pg);
      bx(0.62, 0.12, 0.045, baixo, -0.33, 0.58, 0, pg);
      bx(0.56, 0.4, 0.02, m.glass, -0.33, 1.22, 0, pg);
      if (d[1] === 0) {
        const t = texto(
          az ? "POLÍCIA" : "POLÍCIA MILITAR",
          az ? "#1b3d8a" : "#2a2a2a",
          0.6,
          0.13,
        );
        t.position.set(-0.33, 0.73, s * 0.03);
        if (s < 0) t.rotation.y = PI;
        pg.add(t);
        const b = cyl(0.07, 0.07, 0.02, m.sr, -0.55, 0.85, s * 0.03, pg, 16);
        b.rotation.x = PI / 2;
      }
      portas.push({ pg, s });
    }),
  );

  const lugares = [
    [0.4, -0.3, -1, 0],
    [0.4, 0.3, 1, 0],
    [-0.25, -0.3, -1, 1],
    [-0.25, 0.3, 1, 1],
  ] as const;
  const ofs = lugares.map((l, i) => {
    const of = oficial(fard, i % 2 === 0);
    car.add(of.o);
    of.S = new V(l[0], 0.3, l[1]);
    of.D = new V(l[0] - 0.1, 0, l[2] * 1.0);
    of.P = new V(l[3] ? -0.15 : 0.55, 0, l[2] * 1.25);
    of.i = i;
    of.o.position.copy(of.S);
    return of;
  });

  const trac: { t: THREE.Mesh; life: number }[] = [];
  const fais: { s: THREE.Mesh; l: number }[] = [];
  const fum: { s: THREE.Mesh; l: number; vx: number }[] = [];
  const marcas: THREE.Mesh[] = [];
  let im = 0;
  let skidCd = 0;
  for (let i = 0; i < 24; i++) {
    const t = bx(0.5, 0.025, 0.025, m.trace, 0, -9, 0);
    t.visible = false;
    trac.push({ t, life: 0 });
  }
  for (let i = 0; i < 20; i++) {
    const s = ball(0.07, m.flash, 0, -9, 0);
    s.visible = false;
    fais.push({ s, l: 0 });
  }
  for (let i = 0; i < 16; i++) {
    const s = ball(0.3, m.smoke, 0, -9, 0);
    s.visible = false;
    fum.push({ s, l: 0, vx: 0 });
  }
  for (let i = 0; i < 40; i++) {
    const s = bx(0.35, 0.012, 0.09, m.skid, 0, -9, 0);
    s.visible = false;
    marcas.push(s);
  }

  const wp = new V();
  const disparar = (of: Oficial) => {
    const slot = trac.find((q) => !q.t.visible);
    if (!slot) return;
    of.bico.getWorldPosition(wp);
    g.worldToLocal(wp);
    slot.t.position.copy(wp);
    slot.t.visible = true;
    slot.life = 0.55;
    slot.t.rotation.y = PI / 2;
  };

  const pontoOf = (of: Oficial, tc: number) => {
    const t0 = 0.4 + 0.18 * of.i;
    const t1 = RAID_SHOOT_END - 0.3 + 0.1 * of.i;
    const a = new V();
    const dir = (p: THREE.Vector3, q: THREE.Vector3) =>
      Math.atan2(q.x - p.x, q.z - p.z);
    let yaw = 0;
    let lev = 0;
    let aim = 0;
    let mov = 0;
    let tiro = false;
    if (tc < t0) a.copy(of.S);
    else if (tc < t0 + 1) {
      const s = (tc - t0) / 1;
      lev = sm(cl(s * 3));
      mov = 1;
      if (s < 0.45) {
        a.lerpVectors(of.S, of.D, s / 0.45);
        yaw = dir(of.S, of.D);
      } else {
        a.lerpVectors(of.D, of.P, (s - 0.45) / 0.55);
        yaw = dir(of.D, of.P);
      }
    } else if (tc < t1) {
      a.copy(of.P);
      lev = 1;
      aim = sm(cl((tc - t0 - 1) / 0.3));
      yaw = dir(of.D, of.P);
      tiro = aim > 0.95 && tc < t1 - 0.15 && tc >= RAID_SHOOT_START;
    } else if (tc < t1 + 1.1) {
      const s = (tc - t1) / 1.1;
      mov = 1;
      lev = 1 - sm(cl((s - 0.6) / 0.4));
      aim = 1 - sm(cl(s * 5));
      if (s < 0.55) {
        a.lerpVectors(of.P, of.D, s / 0.55);
        yaw = dir(of.P, of.D);
      } else {
        a.lerpVectors(of.D, of.S, (s - 0.55) / 0.45);
        yaw = dir(of.D, of.S);
      }
    } else a.copy(of.S);
    a.y = 0.3 * (1 - lev);
    return { a, yaw, lev, aim, mov, tiro };
  };

  const aplicar = (of: Oficial, r: ReturnType<typeof pontoOf>, tt: number) => {
    of.o.position.copy(r.a);
    of.o.rotation.y = r.yaw;
    of.o.scale.set(0.95, 0.95 * (0.8 + 0.2 * r.lev), 0.95);
    const sw = r.mov ? Math.sin(tt * 16) * 0.7 : 0;
    of.lE.rotation.x = sw;
    of.lD.rotation.x = -sw;
    const ar =
      -1.45 * r.aim +
      (r.mov ? Math.sin(tt * 16) * 0.5 : 0) * (1 - r.aim);
    of.aE.rotation.x = ar;
    of.aD.rotation.x = r.aim > 0 ? ar : -ar;
    of.fl.visible = r.tiro && Math.sin(tt * 70 + of.i) > -0.2;
    of.arma.position.z = of.ap - (of.fl.visible ? 0.05 : 0);
    of.prox -= 1 / 60;
    if (r.tiro && of.prox <= 0) {
      disparar(of);
      of.prox = 0.1 + Math.random() * 0.06;
    }
  };

  const luz = (tt: number, on: boolean) => {
    if (!on) {
      lr.material = m.sr;
      lb.material = m.sb;
      return;
    }
    const f = Math.sin(tt * 10) > 0;
    lr.material = f ? m.sr : m.dk;
    lb.material = f ? m.dk : m.sb;
  };

  const tickFx = (dt: number) => {
    trac.forEach((q) => {
      if (!q.t.visible) return;
      q.t.position.x += 28 * dt;
      q.life -= dt;
      if (q.life <= 0) {
        q.t.visible = false;
        const f = fais.find((k) => !k.s.visible);
        if (f) {
          f.s.position.copy(q.t.position);
          f.l = 0.18;
          f.s.visible = true;
        }
      }
    });
    fais.forEach((f) => {
      if (!f.s.visible) return;
      f.l -= dt;
      f.s.scale.setScalar(1 + (0.18 - f.l) * 10);
      if (f.l <= 0) f.s.visible = false;
    });
    fum.forEach((f) => {
      if (!f.s.visible) return;
      f.l -= dt;
      f.s.position.x += f.vx * dt;
      f.s.position.y += 0.5 * dt;
      f.s.scale.addScalar(dt * 1.4);
      if (f.l <= 0) f.s.visible = false;
    });
  };

  let sirenT = 0;

  g.userData.car = car;
  g.userData.estilo = estilo;
  g.userData.setSiren = (on, t = 0) => {
    sirenT = t;
    luz(sirenT, on);
  };
  g.userData.clearFx = () => {
    trac.forEach((q) => {
      q.t.visible = false;
    });
    fais.forEach((f) => {
      f.s.visible = false;
    });
    fum.forEach((f) => {
      f.s.visible = false;
    });
    marcas.forEach((mk) => {
      mk.visible = false;
    });
    skidCd = 0;
    car.rotation.z = 0;
  };
  g.userData.resetRaid = () => {
    g.userData.clearFx();
    ofs.forEach((of) => {
      of.o.position.copy(of.S);
      of.o.rotation.y = 0;
      of.o.scale.setScalar(0.95);
      of.fl.visible = false;
      of.prox = 0;
    });
    portas.forEach((p) => {
      p.pg.rotation.y = 0;
    });
  };

  g.userData.tickRaid = (dt, tc) => {
    const ab =
      tc < 0.4
        ? 0
        : tc < 1.0
          ? (tc - 0.4) / 0.6
          : tc < RAID_SHOOT_END
            ? 1
            : tc < RAID_SHOOT_END + 0.7
              ? 1 - (tc - RAID_SHOOT_END) / 0.7
              : 0;
    portas.forEach((p) => {
      p.pg.rotation.y = p.s * sm(ab) * 1.0;
    });
    ofs.forEach((of) => aplicar(of, pontoOf(of, tc), tc));
    luz(sirenT + tc, true);
    tickFx(dt);
  };

  g.userData.tickDrift = (dt, s, leanSign) => {
    const esp = Math.sin(sm(cl(s)) * PI);
    car.rotation.z = 0.07 * esp * leanSign;
    luz(sirenT + s * 4, true);
    if (esp > 0.05) {
      skidCd -= dt;
      if (skidCd <= 0) {
        skidCd = 0.05;
        [-0.62, 0.62].forEach((z) => {
          car.localToWorld(wp.set(-1.05, 0.05, z));
          g.worldToLocal(wp);
          const mk = marcas[im++ % marcas.length]!;
          mk.position.set(wp.x, 0.08, wp.z);
          mk.rotation.y = -car.rotation.y;
          mk.visible = true;
          const f = fum.find((q) => !q.s.visible);
          if (f) {
            f.s.position.set(wp.x, 0.3, wp.z);
            f.s.scale.setScalar(0.4);
            f.l = 0.9;
            f.vx = -0.3 + Math.random() * 0.6;
            f.s.visible = true;
          }
        });
      }
    }
    tickFx(dt);
  };

  g.userData.resetRaid();
  return g;
}
