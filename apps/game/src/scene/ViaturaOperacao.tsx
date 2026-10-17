import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { startTirosSfx, stopTirosSfx } from "../audio/sfx";
import {
  JAIL_ROAD_Y,
  jailRoadParipeStop,
  jailRoadWaypoints,
} from "./JailRoad";
import {
  criarViatura,
  DRIFT_DUR,
  RAID_DUR,
  RAID_SHOOT_END,
  RAID_SHOOT_START,
  type ViaturaGroup,
} from "./viaturas";

const INTERVAL_S = 120;
const CAR_SCALE = 0.18;
const CAR_Y = JAIL_ROAD_Y + 0.02;
const GAP = 0.72;

type Phase = "idle" | "driveIn" | "raid" | "drift" | "driveOut";

type Unit = {
  v: ViaturaGroup;
  lean: number;
  lead: boolean;
  delay: number;
  driveIn: number;
  driveOut: number;
};

function dist(a: [number, number], b: [number, number]) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function buildPath(points: [number, number][]) {
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = dist(points[i]!, points[i + 1]!);
    segLens.push(len);
    total += len;
  }
  return { points, segLens, total };
}

function samplePath(
  path: ReturnType<typeof buildPath>,
  u: number,
): { x: number; z: number; yaw: number } {
  const t = Math.max(0, Math.min(1, u));
  if (path.total <= 1e-6) {
    const p = path.points[0]!;
    return { x: p[0], z: p[1], yaw: 0 };
  }
  let remain = t * path.total;
  for (let i = 0; i < path.segLens.length; i++) {
    const len = path.segLens[i]!;
    const a = path.points[i]!;
    const b = path.points[i + 1]!;
    if (remain <= len || i === path.segLens.length - 1) {
      const s = len > 1e-6 ? remain / len : 1;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      return {
        x: a[0] + dx * s,
        z: a[1] + dz * s,
        yaw: Math.atan2(dx, dz) - Math.PI / 2,
      };
    }
    remain -= len;
  }
  const last = path.points[path.points.length - 1]!;
  return { x: last[0], z: last[1], yaw: 0 };
}

function samplePathByDist(
  path: ReturnType<typeof buildPath>,
  distance: number,
) {
  if (path.total <= 1e-6) return samplePath(path, 0);
  return samplePath(path, Math.max(0, Math.min(1, distance / path.total)));
}

function easeInOut(t: number) {
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t: number) {
  const u = 1 - t;
  return 1 - u * u * u;
}

function pathToParipe(all: [number, number][], stop: [number, number]) {
  const out: [number, number][] = [];
  for (const p of all) {
    if (Math.abs(p[1] - stop[1]) < 0.05 && p[0] < stop[0] - 0.02) {
      out.push(stop);
      return out;
    }
    out.push(p);
    if (Math.abs(p[1] - stop[1]) < 0.05 && Math.abs(p[0] - stop[0]) < 0.08) {
      out[out.length - 1] = stop;
      return out;
    }
  }
  out.push(stop);
  return out;
}

function poseAt(
  v: ViaturaGroup,
  pose: { x: number; z: number; yaw: number },
) {
  v.position.set(pose.x, CAR_Y, pose.z);
  v.rotation.set(0, pose.yaw, 0);
  v.userData.car.rotation.z = 0;
}

function localTime(phaseT: number, delay: number) {
  return Math.max(0, phaseT - delay);
}

export function ViaturaOperacao() {
  const root = useRef<Group>(null);
  const units = useRef<Unit[]>([]);
  const phase = useRef<Phase>("idle");
  const phaseT = useRef(0);
  const waitT = useRef(8);
  const shooting = useRef(false);
  const driftFrom = useRef<{ x: number; z: number; yaw: number }[]>([]);

  const paths = useMemo(() => {
    const all = jailRoadWaypoints();
    const stop = jailRoadParipeStop();
    const to = buildPath(pathToParipe(all, stop));
    const back = buildPath([...to.points].reverse());
    const faceParipe = -Math.PI / 2;
    return { to, back, stop, faceParipe };
  }, []);

  useLayoutEffect(() => {
    const wrap = root.current;
    if (!wrap) return;
    while (wrap.children.length) wrap.remove(wrap.children[0]!);

    const azul = criarViatura("azul");
    const bege = criarViatura("bege");
    for (const v of [azul, bege]) {
      v.scale.setScalar(CAR_SCALE);
      v.visible = false;
      wrap.add(v);
    }
    units.current = [
      {
        v: azul,
        lean: 1,
        lead: true,
        delay: 0,
        driveIn: 7.0,
        driveOut: 6.4,
      },
      {
        v: bege,
        lean: -1,
        lead: false,
        delay: 1.35,
        driveIn: 8.2,
        driveOut: 7.6,
      },
    ];

    return () => {
      stopTirosSfx();
      units.current = [];
      while (wrap.children.length) wrap.remove(wrap.children[0]!);
    };
  }, []);

  useFrame((_, dt) => {
    const list = units.current;
    if (!list.length) return;
    const d = Math.min(dt, 0.05);

    if (phase.current === "idle") {
      waitT.current -= d;
      for (const u of list) u.v.visible = false;
      if (waitT.current <= 0) {
        phase.current = "driveIn";
        phaseT.current = 0;
        shooting.current = false;
        for (const u of list) {
          u.v.userData.resetRaid();
          u.v.visible = false;
          u.v.userData.setSiren(true, 0);
          poseAt(u.v, samplePath(paths.to, 0));
        }
      }
      return;
    }

    phaseT.current += d;

    if (phase.current === "driveIn") {
      let allArrived = true;
      for (const unit of list) {
        const t = localTime(phaseT.current, unit.delay);
        if (t <= 0) {
          unit.v.visible = false;
          allArrived = false;
          continue;
        }
        unit.v.visible = true;
        const raw = Math.min(1, t / unit.driveIn);
        const u = unit.lead ? easeOutCubic(raw) : easeInOut(raw);
        // Mantém a de trás um pouco atrás na pista até a chegada
        const distAlong = unit.lead
          ? u * paths.to.total
          : Math.max(0, u * paths.to.total - GAP * (1 - u * 0.35));
        poseAt(unit.v, samplePathByDist(paths.to, distAlong));
        unit.v.userData.setSiren(true, t);
        if (raw < 1) allArrived = false;
      }
      if (allArrived) {
        phase.current = "raid";
        phaseT.current = 0;
        for (const unit of list) {
          unit.v.visible = true;
          unit.v.userData.resetRaid();
          const x = paths.stop[0] + (unit.lead ? 0 : GAP);
          unit.v.position.set(x, CAR_Y, paths.stop[1]);
          unit.v.rotation.set(0, paths.faceParipe, 0);
        }
      }
      return;
    }

    if (phase.current === "raid") {
      const tc = phaseT.current;
      for (const unit of list) {
        const local = unit.lead ? tc : Math.max(0, tc - 0.45);
        unit.v.userData.tickRaid(d, local);
      }

      const shootT = tc;
      if (
        !shooting.current &&
        shootT >= RAID_SHOOT_START &&
        shootT < RAID_SHOOT_END
      ) {
        shooting.current = true;
        startTirosSfx({ volume: 0.85 });
      }
      if (shooting.current && shootT >= RAID_SHOOT_END) {
        shooting.current = false;
        stopTirosSfx();
      }

      if (tc >= RAID_DUR + 0.5) {
        stopTirosSfx();
        shooting.current = false;
        phase.current = "drift";
        phaseT.current = 0;
        driftFrom.current = list.map((unit) => ({
          x: unit.v.position.x,
          z: unit.v.position.z,
          yaw: unit.v.rotation.y,
        }));
        for (const unit of list) {
          unit.v.userData.resetRaid();
          unit.v.userData.setSiren(true, 0);
        }
      }
      return;
    }

    if (phase.current === "drift") {
      let allDone = true;
      for (let i = 0; i < list.length; i++) {
        const unit = list[i]!;
        const from = driftFrom.current[i]!;
        const t = localTime(phaseT.current, unit.lead ? 0 : 0.38);
        if (t <= 0) {
          allDone = false;
          continue;
        }
        const s = Math.min(1, t / DRIFT_DUR);
        const ease = easeInOut(s);
        const fwd = 0.55 * ease;
        const yaw = from.yaw + Math.PI * ease;
        unit.v.position.set(
          from.x + Math.cos(from.yaw) * fwd,
          CAR_Y,
          from.z - Math.sin(from.yaw) * fwd,
        );
        unit.v.rotation.set(0, yaw, 0);
        unit.v.userData.tickDrift(d, s, unit.lean);
        if (s < 1) allDone = false;
      }
      if (allDone) {
        phase.current = "driveOut";
        phaseT.current = 0;
        for (const unit of list) {
          unit.v.userData.car.rotation.z = 0;
          unit.v.userData.setSiren(true, 0);
        }
      }
      return;
    }

    let allGone = true;
    for (const unit of list) {
      const t = localTime(phaseT.current, unit.lead ? 0 : 1.1);
      if (t <= 0) {
        allGone = false;
        continue;
      }
      const raw = Math.min(1, t / unit.driveOut);
      const u = unit.lead ? easeOutCubic(raw) : easeInOut(raw);
      const distAlong = unit.lead
        ? u * paths.back.total
        : Math.max(0, u * paths.back.total - GAP * (1 - u * 0.4));
      poseAt(unit.v, samplePathByDist(paths.back, distAlong));
      unit.v.userData.setSiren(true, t);
      if (raw < 1) allGone = false;
      if (raw >= 1) unit.v.visible = false;
    }
    if (allGone) {
      phase.current = "idle";
      phaseT.current = 0;
      waitT.current = INTERVAL_S;
      stopTirosSfx();
      for (const unit of list) {
        unit.v.visible = false;
        unit.v.userData.setSiren(false);
        unit.v.userData.resetRaid();
      }
    }
  });

  return <group ref={root} name="viatura-operacao" />;
}
