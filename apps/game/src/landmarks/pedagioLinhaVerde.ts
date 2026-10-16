import * as THREE from "three";

export type PedagioLinhaVerdeGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    alternarTrafego: () => boolean;
    alternarFaixa: (k: number) => boolean;
  };
};

export function criarPedagioLinhaVerde(): PedagioLinhaVerdeGroup {
  const g = new THREE.Group() as PedagioLinhaVerdeGroup;
  g.name = "PedagioLinhaVerde";
  const PI = Math.PI;
  let sd = 3;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  const M = (c: number, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o || {}));

  const m = {
    grass: M(0x7fa83c),
    dirt: M(0x8a6d4c),
    asf: M(0x4b4d52, { roughness: 0.95 }),
    conc: M(0xbdbbb2),
    conc2: M(0xb4b2a9),
    roofW: M(0xf1f2f0),
    roofB: M(0x2b5db8),
    yellow: M(0xf2c230),
    cab: M(0xd8dadd),
    win: M(0x1f2c40, { roughness: 0.2 }),
    dark: M(0x23262b),
    rail: M(0xc4c8cc, { metalness: 0.4, roughness: 0.5 }),
    orange: M(0xf07b2a),
    white: M(0xf4f4f2),
    verde: M(0x35e06a, { emissive: 0x22cc55, emissiveIntensity: 1.1 }),
    verm: M(0xff3b30, { emissive: 0xdd1a10, emissiveIntensity: 1.1 }),
    hill: M(0x6f9a3a),
    trunk: M(0x7a6a52),
    leaf: M(0x2f8a2e),
    leaf2: M(0x3f9d36),
    red: M(0xd13030),
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
    seg?: number,
  ) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 10), mt);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    g.add(o);
    return o;
  };

  const tex = (w: number, h: number, fn: (c: CanvasRenderingContext2D, W: number, H: number) => void) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    fn(c.getContext("2d")!, w, h);
    return new THREE.CanvasTexture(c);
  };

  const plano = (w: number, h: number, t: THREE.Texture, x: number, y: number, z: number, ry?: number) => {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }),
    );
    p.position.set(x, y, z);
    if (ry) p.rotation.y = ry;
    g.add(p);
    return p;
  };

  const terreno = bx(22, 0.6, 20, m.grass, 0, -0.3, 0);
  terreno.material = [m.dirt, m.dirt, m.grass, m.dirt, m.dirt, m.dirt];
  bx(14, 0.04, 18, m.asf, 0, 0.02, 0);
  const linhas = tex(560, 260, (c, W, H) => {
    c.fillStyle = "#4b4d52";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#f2f2ee";
    for (let i = 0; i < 11; i++) {
      const x = (-6 + i * 1.2 + 7) * 40;
      for (let y = 0; y < H; y += 24) c.fillRect(x - 2, y, 4, 12);
    }
    c.fillRect(6, 0, 3, H);
    c.fillRect(W - 9, 0, 3, H);
  });
  [5.75, -5.75].forEach((z) => {
    const p = plano(14, 6.5, linhas, 0, 0.045, z);
    p.rotation.x = -PI / 2;
  });

  bx(12.8, 0.5, 0.4, m.conc2, 0, 2.35, 1.5);
  bx(12.8, 0.5, 0.4, m.conc2, 0, 2.35, -1.5);
  bx(12.8, 0.12, 3.4, m.conc, 0, 2.66, 0);
  bx(7.6, 0.03, 3.4, m.roofW, 0, 2.73, 0);
  [-5.1, 5.1].forEach((x) => bx(2.6, 0.03, 3.4, m.roofB, x, 2.73, 0));
  const logo = tex(256, 56, (c, W, H) => {
    c.fillStyle = "#f4f4f0";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#0f8a5a";
    c.font = "bold 40px Arial,sans-serif";
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText("CLN", 16, 30);
    c.fillStyle = "#2b5db8";
    c.font = "11px Arial,sans-serif";
    c.fillText("Concessionária", 100, 22);
    c.fillText("Litoral Norte", 100, 36);
  });
  plano(1.8, 0.4, logo, -4.9, 2.35, 1.71);

  const chev = tex(64, 32, (c) => {
    c.fillStyle = "#f2c230";
    c.fillRect(0, 0, 64, 32);
    c.strokeStyle = "#111";
    c.lineWidth = 8;
    for (let y = 0; y < 32; y += 16) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(32, y + 12);
      c.lineTo(64, y);
      c.stroke();
    }
  });
  for (let i = 0; i < 11; i++) {
    const x = -6 + i * 1.2;
    bx(0.55, 0.3, 2.6, m.yellow, x, 0.19, 0);
    plano(0.5, 0.28, chev, x, 0.22, 1.31);
    bx(0.38, 0.85, 0.9, m.cab, x, 0.77, -0.45);
    bx(0.3, 0.3, 0.02, m.win, x, 0.9, 0.01);
    if (i % 2 === 0) bx(0.28, 1.85, 0.28, m.conc, x, 1.22, 0.65);
  }

  const lampadas: THREE.Mesh[] = [];
  for (let k = 0; k < 10; k++) {
    const x = -5.4 + k * 1.2;
    const num = tex(64, 64, (c, W, H) => {
      c.fillStyle = "#1d4ed8";
      c.fillRect(0, 0, W, H);
      c.strokeStyle = "#fff";
      c.lineWidth = 3;
      c.strokeRect(3, 3, W - 6, H - 6);
      c.fillStyle = "#fff";
      c.font = "bold 40px Arial,sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(String(k + 1), W / 2, H / 2 + 2);
    });
    plano(0.34, 0.34, num, x, 2.5, 1.71);
    bx(0.3, 0.3, 0.05, m.dark, x, 2.17, 1.72);
    const l = bx(0.2, 0.2, 0.06, m.verde, x, 2.17, 1.74);
    lampadas.push(l);
  }

  const cores = [0xeeeeee, 0xc6c9cd, 0x23262b, 0xb23a3a, 0x3a5fa8, 0xd7d9dc, 0x2f6e4a, 0xe6e1d0];
  const carro = (cor: number, tipo: string) => {
    const c = new THREE.Group();
    if (tipo === "caminhao") {
      bx(0.8, 0.9, 2.2, M(0xe3e3de), 0, 0.65, 0.35, c);
      bx(0.8, 0.75, 0.7, M(0x3a6fb0), 0, 0.58, -1.1, c);
      bx(0.6, 0.2, 0.02, m.win, 0, 0.85, -1.46, c);
    } else {
      bx(0.62, 0.2, 1.5, M(cor), 0, 0.2, 0, c);
      bx(0.54, 0.2, 0.8, M(cor), 0, 0.4, 0.1, c);
      bx(0.5, 0.12, 0.82, m.win, 0, 0.42, 0.1, c);
      [-0.2, 0.2].forEach((x) => bx(0.12, 0.06, 0.02, m.red, x, 0.24, 0.76, c));
    }
    [-0.32, 0.32].forEach((x) => [-0.5, 0.5].forEach((z) => bx(0.08, 0.2, 0.22, m.dark, x, 0.1, z, c)));
    c.position.y = 0.05;
    g.add(c);
    return c;
  };

  type Faixa = { x: number; aberta: boolean; t: number };
  type Veiculo = {
    o: THREE.Group;
    k: number;
    z: number;
    servido: boolean;
    espera: number;
  };
  const faixas: Faixa[] = [];
  const frota: Veiculo[] = [];
  for (let k = 0; k < 10; k++) {
    faixas.push({ x: -5.4 + k * 1.2, aberta: true, t: 3 + rnd() * 10 });
    frota.push({
      o: carro(cores[k % 8], k === 2 ? "caminhao" : "carro"),
      k,
      z: 3 + k * 1.1 + rnd() * 2,
      servido: false,
      espera: 0,
    });
    frota[k].o.position.x = faixas[k].x;
  }
  const lig = (k: number) => {
    lampadas[k].material = faixas[k].aberta ? m.verde : m.verm;
  };

  [-7.3, 7.3].forEach((x) =>
    [
      [-9, -3.5],
      [3.5, 9],
    ].forEach((r) => {
      const z = (r[0] + r[1]) / 2;
      const len = r[1] - r[0];
      bx(0.06, 0.18, len, m.rail, x, 0.35, z);
      bx(0.06, 0.18, len, m.rail, x * 0.999, 0.18, z);
      for (let zz = r[0] + 0.3; zz <= r[1]; zz += 0.8) bx(0.05, 0.4, 0.05, m.dark, x, 0.22, zz);
    }),
  );
  const cone = (x: number, z: number) => {
    cyl(0.02, 0.1, 0.38, m.orange, x, 0.24, z, 12);
    cyl(0.06, 0.075, 0.06, m.white, x, 0.24, z, 12);
  };
  [
    [6.5, 3.2],
    [6.8, 4.3],
    [7, 5.4],
    [-6.5, 3.2],
    [-6.8, 4.3],
    [-7, 5.4],
  ].forEach((p) => cone(p[0], p[1]));

  const placa = tex(256, 160, (c, W, H) => {
    c.fillStyle = "#1d4ed8";
    c.fillRect(0, 0, W, H);
    c.strokeStyle = "#fff";
    c.lineWidth = 4;
    c.strokeRect(5, 5, W - 10, H - 10);
    c.fillStyle = "#fff";
    c.font = "bold 28px Arial,sans-serif";
    c.textAlign = "center";
    c.fillText("COBRANÇA", W / 2, 48);
    c.fillText("AUTOMÁTICA", W / 2, 82);
    c.fillRect(100, 100, 56, 32);
    c.fillStyle = "#1d4ed8";
    c.fillRect(108, 108, 40, 10);
  });
  cyl(0.05, 0.05, 2.8, m.dark, 8, 1.4, 5.5, 8);
  bx(0.06, 0.06, 1.2, m.dark, 7.5, 2.7, 5.5);
  plano(1.2, 0.75, placa, 7.5, 2.35, 5.52);
  [
    [-8.3, -4],
    [8.3, -4],
    [-8.3, 4],
    [8.3, 4],
  ].forEach((p) => {
    cyl(0.04, 0.05, 4, m.rail, p[0], 2, p[1], 8);
    bx(0.5, 0.05, 0.05, m.rail, p[0] + (p[0] < 0 ? 0.25 : -0.25), 4, p[1]);
    bx(0.2, 0.06, 0.12, m.white, p[0] + (p[0] < 0 ? 0.5 : -0.5), 3.95, p[1]);
  });

  const palma = (x: number, z: number, h: number) => {
    const p = new THREE.Group();
    p.position.set(x, 0, z);
    g.add(p);
    bx(0.1, h, 0.1, m.trunk, 0, h / 2, 0, p);
    for (let i = 0; i < 8; i++) {
      const yw = new THREE.Group();
      yw.position.y = h;
      yw.rotation.y = (i * PI) / 4;
      p.add(yw);
      const tl = new THREE.Group();
      tl.rotation.z = -0.3 - (i % 2) * 0.25;
      yw.add(tl);
      bx(0.8, 0.02, 0.15, i % 2 ? m.leaf : m.leaf2, 0.4, 0, 0, tl);
    }
  };
  [
    [-9.2, 2.5, 1.4],
    [9.3, -1.5, 1.6],
    [-9.4, -2, 1.2],
    [9.4, 7, 1.3],
  ].forEach((p) => palma(p[0], p[1], p[2]));
  [
    [-8.5, -7],
    [8.7, -6.5],
  ].forEach((p) => {
    const h = new THREE.Mesh(new THREE.SphereGeometry(2.3, 20, 12), m.hill);
    h.scale.set(1.5, 0.6, 1.2);
    h.position.set(p[0], 0, p[1]);
    g.add(h);
  });

  let vai = true;
  g.userData.alternarTrafego = () => {
    vai = !vai;
    return vai;
  };
  g.userData.alternarFaixa = (k: number) => {
    faixas[k].aberta = !faixas[k].aberta;
    lig(k);
    return faixas[k].aberta;
  };
  g.userData.tick = (dt: number) => {
    if (!vai) return;
    faixas.forEach((f, k) => {
      f.t -= dt;
      if (f.t <= 0) {
        f.t = 6 + rnd() * 10;
        const abertas = faixas.filter((q) => q.aberta).length;
        if (f.aberta && abertas > 7) f.aberta = false;
        else f.aberta = true;
        lig(k);
      }
    });
    frota.forEach((c) => {
      const f = faixas[c.k];
      const alvo = c.servido ? -99 : f.aberta || c.z < 3.6 ? 1.9 : 3.7;
      if (c.z > alvo) c.z = Math.max(alvo, c.z - (c.servido ? 2.6 : 2) * dt);
      if (!c.servido && c.z <= 1.91 && f.aberta) {
        c.espera += dt;
        if (c.espera > 1.5) c.servido = true;
      }
      if (c.servido && c.z < -9) {
        c.z = 9 + rnd() * 4;
        c.servido = false;
        c.espera = 0;
      }
      c.o.position.z = c.z;
    });
  };

  return g;
}
