import * as THREE from "three";

export type HidrometroGroup = THREE.Group & {
  userData: {
    tick: (dt: number) => void;
    alternarTampa: () => boolean;
    alternarRegistro: () => boolean;
  };
};

export function criarHidrometro(): HidrometroGroup {
  const g = new THREE.Group() as HidrometroGroup;
  g.name = "Hidrometro";

  const M = (c: number, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(
      Object.assign({ color: c, roughness: 0.6, metalness: 0.2 }, o || {}),
    );

  const m = {
    pipe: M(0xaeb0b2, { metalness: 0.35, roughness: 0.55 }),
    nut: M(0x9a9c9e, { metalness: 0.4 }),
    blue: M(0x1a2fb4, { roughness: 0.45 }),
    black: M(0x17181a, { roughness: 0.7, metalness: 0 }),
    brass: M(0xd9a21b, { metalness: 0.7, roughness: 0.35 }),
    red: M(0xd92b2b, { metalness: 0, roughness: 0.5 }),
    dark: M(0x0b0b0c),
  };

  const cyl = (
    r: number,
    h: number,
    mt: THREE.Material,
    x: number,
    y: number,
    z: number,
    rz?: number,
    rx?: number,
    seg?: number,
    p?: THREE.Object3D,
  ) => {
    const o = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, seg || 24),
      mt,
    );
    o.position.set(x, y, z);
    o.rotation.z = rz || 0;
    o.rotation.x = rx || 0;
    (p || g).add(o);
    return o;
  };

  const ball = (
    r: number,
    mt: THREE.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mt);
    o.position.set(x, y, z);
    g.add(o);
  };

  const ring = (x: number, y: number, z: number, r: number) => {
    const o = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 6, 18), m.nut);
    o.position.set(x, y, z);
    o.rotation.y = Math.PI / 2;
    g.add(o);
  };

  const Y = 1.3;
  const R = 0.19;
  const PI2 = Math.PI / 2;

  cyl(R, 3.15, m.pipe, -2.675, Y, 0, PI2);
  cyl(R, 3.1, m.pipe, 2.65, Y, 0, PI2);
  [-4.2, 4.2].forEach((x) => {
    ball(R + 0.05, m.pipe, x, Y, 0);
    cyl(R, Y, m.pipe, x, Y / 2, 0);
    cyl(R + 0.05, 0.22, m.nut, x, Y * 0.42, 0);
    cyl(R + 0.03, 0.12, m.nut, x, 0.06, 0);
  });
  [-3.9, 3.9].forEach((x) => {
    ring(x, Y, 0, R + 0.03);
    ring(x + (x < 0 ? 0.1 : -0.1), Y, 0, R + 0.03);
  });

  [-1.02, 1.02].forEach((x) => {
    cyl(0.31, 0.45, m.nut, x, Y, 0, PI2, 0, 6);
    cyl(R + 0.06, 0.2, m.nut, x + (x < 0 ? -0.3 : 0.3), Y, 0, PI2);
  });

  cyl(0.82, 1.15, m.blue, 0, Y - 0.02, 0);
  cyl(0.9, 0.34, m.black, 0, 1.95, 0, 0, 0, 22);
  cyl(0.84, 0.04, m.black, 0, 2.13, 0);

  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const cx = cv.getContext("2d")!;
  const tex = new THREE.CanvasTexture(cv);
  const desenhar = (n: number) => {
    cx.fillStyle = "#f4f4ee";
    cx.fillRect(0, 0, 256, 256);
    cx.textAlign = "center";
    cx.fillStyle = "#1d4fb8";
    cx.font = "bold 28px sans-serif";
    cx.fillText("EMBASA", 128, 60);
    cx.fillStyle = "#111";
    cx.fillRect(40, 80, 176, 40);
    const s = String(n % 100000).padStart(5, "0");
    cx.font = "bold 32px monospace";
    for (let i = 0; i < 5; i++) {
      cx.fillStyle = i === 4 ? "#ff5545" : "#fff";
      cx.fillText(s[i]!, 62 + i * 33, 112);
    }
    cx.fillStyle = "#111";
    cx.font = "15px sans-serif";
    cx.fillText("m³", 226, 112);
    cx.fillStyle = "#d33";
    cx.beginPath();
    cx.arc(86, 182, 28, 0, 7);
    cx.fill();
    cx.fillStyle = "#fff";
    cx.fillRect(84, 158, 4, 24);
    cx.fillStyle = "#222";
    cx.beginPath();
    cx.arc(168, 182, 20, 0, 7);
    cx.fill();
    cx.fillStyle = "#e33";
    cx.fillRect(162, 176, 12, 12);
    tex.needsUpdate = true;
  };
  desenhar(0);
  const dial = new THREE.Mesh(
    new THREE.CircleGeometry(0.74, 32),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }),
  );
  dial.rotation.x = -PI2;
  dial.position.y = 2.16;
  g.add(dial);
  const pivo = new THREE.Group();
  pivo.position.set(0, 2.17, -0.86);
  g.add(pivo);
  cyl(0.9, 0.07, m.black, 0, 0, 0.86, 0, 0, 28, pivo);

  const RX = 2.5;
  cyl(R, 0.9, m.pipe, RX, Y + 0.45, 0);
  cyl(R + 0.05, 0.18, m.nut, RX, Y + 0.9, 0);
  ring(RX, Y + 0.7, 0, R + 0.03);
  cyl(0.3, 0.75, m.brass, RX, 2.6, 0);
  cyl(0.23, 0.9, m.brass, RX, 2.6, 0.45, 0, PI2);
  const boca = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), m.dark);
  boca.position.set(RX, 2.6, 0.91);
  g.add(boca);
  cyl(0.1, 0.3, m.brass, RX, 3.1, 0);
  const volante = new THREE.Group();
  volante.position.set(RX, 3.3, 0);
  g.add(volante);
  cyl(0.07, 1, m.red, 0, 0, 0, PI2, 0, 12, volante);
  cyl(0.1, 0.12, m.red, 0, 0, 0, 0, 0, 12, volante);

  const e = {
    tampa: 1.75,
    tampaAlvo: 1.75,
    reg: 0,
    regAlvo: 0,
    t: 0,
    n: 0,
  };
  pivo.rotation.x = -e.tampa;
  g.userData.alternarTampa = () => {
    e.tampaAlvo = e.tampaAlvo > 0.5 ? 0 : 1.75;
    return e.tampaAlvo > 0.5;
  };
  g.userData.alternarRegistro = () => {
    e.regAlvo = e.regAlvo > 0.5 ? 0 : PI2;
    return e.regAlvo < 0.5;
  };
  g.userData.tick = (dt) => {
    e.tampa += (e.tampaAlvo - e.tampa) * Math.min(1, dt * 6);
    pivo.rotation.x = -e.tampa;
    e.reg += (e.regAlvo - e.reg) * Math.min(1, dt * 6);
    volante.rotation.y = e.reg;
    if (e.regAlvo < 0.5) {
      e.t += dt;
      if (e.t > 0.9) {
        e.t = 0;
        e.n++;
        desenhar(e.n);
      }
    }
  };

  return g;
}
