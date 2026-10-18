import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { PawnId } from "@cidadela/shared";
import { PawnVisual } from "../pawns/PawnVisual";
import { BOARD_Y, computeSpaceLayouts, type SpaceLayout } from "./layout";
import {
  endJailEscort,
  getJailEscort,
  subscribeJailEscort,
  type JailEscortMission,
} from "./jailEscortState";
import {
  criarViatura,
  DRIFT_DUR,
  type ViaturaEstilo,
  type ViaturaGroup,
} from "./viaturas";

const CAR_SCALE = 0.16;
const CAR_Y = BOARD_Y + 0.04;
const GAP = 0.85;
const APPROACH_S = 4.2;
const ARREST_S = 3.2;
const ESCORT_S = 6.5;
const DROP_S = 2.2;
const LEAVE_S = 3.2;
const AIM_HOLD_TC = 2.6;

type Phase =
  | "idle"
  | "approach"
  | "driftIn"
  | "arrest"
  | "escort"
  | "drop"
  | "leave";

type Unit = {
  v: ViaturaGroup;
  delay: number;
  lean: number;
  index: number;
};

function easeInOut(t: number) {
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t: number) {
  const u = 1 - t;
  return 1 - u * u * u;
}

function dist2(a: [number, number], b: [number, number]) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function buildPath(points: [number, number][]) {
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = dist2(points[i]!, points[i + 1]!);
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

function sampleByDist(path: ReturnType<typeof buildPath>, distance: number) {
  if (path.total <= 1e-6) return samplePath(path, 0);
  return samplePath(path, Math.max(0, Math.min(1, distance / path.total)));
}

function spaceXZ(layout: SpaceLayout): [number, number] {
  return [layout.x, layout.z];
}

function centerPath(
  from: [number, number],
  to: [number, number],
): [number, number][] {
  const mid: [number, number] = [
    (from[0] + to[0]) * 0.5 * 0.15,
    (from[1] + to[1]) * 0.5 * 0.15,
  ];
  const bend: [number, number] = [mid[0] + 1.2, mid[1] - 0.8];
  return [from, bend, to];
}

function approachPath(pickup: [number, number]): [number, number][] {
  const start: [number, number] = [
    pickup[0] * 0.15 + 0.5,
    pickup[1] * 0.15 - 0.5,
  ];
  const mid: [number, number] = [pickup[0] * 0.55, pickup[1] * 0.55];
  return [start, mid, pickup];
}

type Props = {
  onComplete?: (mission: JailEscortMission) => void;
};

export function JailEscort({ onComplete }: Props) {
  const [mission, setMission] = useState<JailEscortMission | null>(() =>
    getJailEscort(),
  );
  const root = useRef<Group>(null);
  const prisoner = useRef<Group>(null);
  const units = useRef<Unit[]>([]);
  const phase = useRef<Phase>("idle");
  const phaseT = useRef(0);
  const missionId = useRef(0);
  const driftFrom = useRef<{ x: number; z: number; yaw: number }[]>([]);
  const layouts = useMemo(() => computeSpaceLayouts(), []);
  const layoutsByIndex = useMemo(() => {
    const m = new Map<number, SpaceLayout>();
    for (const l of layouts) m.set(l.index, l);
    return m;
  }, [layouts]);

  const paths = useMemo(() => {
    if (!mission) return null;
    const fromLay = layoutsByIndex.get(mission.fromIndex);
    const jailLay = layoutsByIndex.get(10);
    if (!fromLay || !jailLay) return null;
    const pickup = spaceXZ(fromLay);
    const jail = spaceXZ(jailLay);
    return {
      approach: buildPath(approachPath(pickup)),
      escort: buildPath(centerPath(pickup, jail)),
      leave: buildPath([
        jail,
        [jail[0] * 0.4, jail[1] * 0.4],
        [0.2, 0.2],
      ]),
      pickup,
      jail,
      facePickup: Math.atan2(pickup[0], pickup[1]) - Math.PI / 2,
    };
  }, [mission, layoutsByIndex]);

  useEffect(() => subscribeJailEscort(() => setMission(getJailEscort())), []);

  useLayoutEffect(() => {
    const wrap = root.current;
    if (!wrap) return;
    while (wrap.children.length) wrap.remove(wrap.children[0]!);
    units.current = [];
    if (!mission) return;

    missionId.current = mission.id;
    const estilos: ViaturaEstilo[] = ["azul", "bege", "azul"];
    const built: Unit[] = [];
    for (let i = 0; i < 3; i++) {
      const v = criarViatura(estilos[i]!);
      v.scale.setScalar(CAR_SCALE);
      v.visible = false;
      wrap.add(v);
      built.push({
        v,
        index: i,
        delay: i * 0.55,
        lean: i % 2 === 0 ? 1 : -1,
      });
    }
    units.current = built;
    phase.current = "approach";
    phaseT.current = 0;

    return () => {
      units.current = [];
      while (wrap.children.length) wrap.remove(wrap.children[0]!);
    };
  }, [mission?.id]);

  useFrame((_, dt) => {
    if (!mission || !paths || phase.current === "idle") return;
    const list = units.current;
    if (!list.length) return;
    const d = Math.min(dt, 0.05);
    phaseT.current += d;
    const t = phaseT.current;
    const pris = prisoner.current;

    const poseCar = (
      unit: Unit,
      pose: { x: number; z: number; yaw: number },
    ) => {
      unit.v.position.set(pose.x, CAR_Y, pose.z);
      unit.v.rotation.set(0, pose.yaw, 0);
      unit.v.userData.car.rotation.z = 0;
    };

    if (phase.current === "approach") {
      let allIn = true;
      for (const unit of list) {
        const local = Math.max(0, t - unit.delay);
        if (local <= 0) {
          unit.v.visible = false;
          allIn = false;
          continue;
        }
        unit.v.visible = true;
        const raw = Math.min(1, local / APPROACH_S);
        const u = unit.index === 0 ? easeOutCubic(raw) : easeInOut(raw);
        const along = Math.max(
          0,
          u * paths.approach.total - unit.index * GAP * (1 - u * 0.25),
        );
        poseCar(unit, sampleByDist(paths.approach, along));
        unit.v.userData.setSiren(true, local);
        if (raw < 1) allIn = false;
      }
      if (pris) pris.visible = false;
      if (allIn) {
        phase.current = "driftIn";
        phaseT.current = 0;
        driftFrom.current = list.map((u) => ({
          x: u.v.position.x,
          z: u.v.position.z,
          yaw: u.v.rotation.y,
        }));
        for (const u of list) u.v.userData.resetRaid();
      }
      return;
    }

    if (phase.current === "driftIn") {
      let done = true;
      for (let i = 0; i < list.length; i++) {
        const unit = list[i]!;
        const from = driftFrom.current[i]!;
        const local = Math.max(0, t - unit.delay * 0.35);
        if (local <= 0) {
          done = false;
          continue;
        }
        const s = Math.min(1, local / DRIFT_DUR);
        const ease = easeInOut(s);
        const fwd = 0.45 * ease;
        const yaw = from.yaw + Math.PI * ease;
        unit.v.position.set(
          from.x + Math.cos(from.yaw) * fwd,
          CAR_Y,
          from.z - Math.sin(from.yaw) * fwd,
        );
        unit.v.rotation.set(0, yaw, 0);
        unit.v.userData.tickDrift(d, s, unit.lean);
        if (s < 1) done = false;
      }
      if (done) {
        phase.current = "arrest";
        phaseT.current = 0;
        for (const u of list) {
          u.v.userData.car.rotation.z = 0;
          u.v.userData.resetRaid();
          u.v.rotation.set(0, paths.facePickup, 0);
        }
      }
      return;
    }

    if (phase.current === "arrest") {
      for (const unit of list) {
        const local = Math.max(0, t - unit.delay * 0.2);
        const tc = Math.min(AIM_HOLD_TC, 0.4 + local * 1.1);
        unit.v.userData.tickRaid(d, tc, { aimOnly: true });
        unit.v.userData.setSiren(true, local);
      }
      if (pris) {
        pris.visible = true;
        const lead = list[0]!;
        const lx = lead.v.position.x;
        const lz = lead.v.position.z;
        const lyaw = lead.v.rotation.y;
        const frontDist = GAP * 0.95;
        const frontX = lx + Math.cos(lyaw) * frontDist;
        const frontZ = lz - Math.sin(lyaw) * frontDist;
        const u = easeInOut(Math.min(1, t / (ARREST_S * 0.85)));
        const sx = paths.pickup[0];
        const sz = paths.pickup[1];
        pris.position.set(
          sx + (frontX - sx) * u,
          BOARD_Y + 0.08,
          sz + (frontZ - sz) * u,
        );
        pris.rotation.y = lyaw;
        const shake = Math.sin(t * 14) * 0.012 * u;
        pris.position.y = BOARD_Y + 0.08 + shake;
        pris.scale.setScalar(1 + Math.sin(t * 9) * 0.02);
      }
      if (t >= ARREST_S) {
        phase.current = "escort";
        phaseT.current = 0;
        for (const u of list) {
          u.v.userData.resetRaid();
          u.v.userData.setSiren(true, 0);
        }
      }
      return;
    }

    if (phase.current === "escort") {
      const u = easeInOut(Math.min(1, t / ESCORT_S));
      const headDist = u * paths.escort.total;
      const head = sampleByDist(paths.escort, headDist);
      if (pris) {
        pris.visible = true;
        pris.position.set(head.x, BOARD_Y + 0.08, head.z);
        pris.rotation.y = head.yaw;
        pris.position.y = BOARD_Y + 0.08 + Math.abs(Math.sin(t * 10)) * 0.03;
      }
      for (const unit of list) {
        const along = Math.max(0, headDist - (unit.index + 1) * GAP);
        const pose = sampleByDist(paths.escort, along);
        poseCar(unit, pose);
        unit.v.visible = true;
        unit.v.userData.setSiren(true, t + unit.index);
        unit.v.userData.tickRaid(d, AIM_HOLD_TC, { aimOnly: true });
      }
      if (t >= ESCORT_S) {
        phase.current = "drop";
        phaseT.current = 0;
        for (const u of list) u.v.userData.resetRaid();
      }
      return;
    }

    if (phase.current === "drop") {
      const u = easeInOut(Math.min(1, t / DROP_S));
      const jail = paths.jail;
      for (const unit of list) {
        const back = (unit.index + 1) * GAP * 0.7;
        const pose = sampleByDist(
          paths.escort,
          paths.escort.total - back * (1 - u * 0.2),
        );
        poseCar(unit, pose);
        unit.v.userData.setSiren(true, t);
        const tc = AIM_HOLD_TC + u * 4;
        unit.v.userData.tickRaid(d, Math.min(9.5, tc), { aimOnly: true });
      }
      if (pris) {
        const lead = list[0]!;
        const fromX = lead.v.position.x + Math.cos(lead.v.rotation.y) * GAP * 0.9;
        const fromZ = lead.v.position.z - Math.sin(lead.v.rotation.y) * GAP * 0.9;
        pris.visible = true;
        pris.position.set(
          fromX + (jail[0] - fromX) * u,
          BOARD_Y + 0.08,
          fromZ + (jail[1] - fromZ) * u,
        );
        pris.rotation.y = Math.atan2(jail[0] - fromX, jail[1] - fromZ);
      }
      if (t >= DROP_S) {
        phase.current = "leave";
        phaseT.current = 0;
        if (pris) pris.visible = false;
        for (const u of list) {
          u.v.userData.resetRaid();
          u.v.userData.setSiren(true, 0);
        }
        driftFrom.current = list.map((u) => ({
          x: u.v.position.x,
          z: u.v.position.z,
          yaw: u.v.rotation.y,
        }));
      }
      return;
    }

    if (phase.current === "leave") {
      let gone = true;
      for (const unit of list) {
        const local = Math.max(0, t - unit.delay * 0.4);
        if (local <= 0) {
          gone = false;
          continue;
        }
        if (local < DRIFT_DUR) {
          const from = driftFrom.current[unit.index]!;
          const s = Math.min(1, local / DRIFT_DUR);
          const ease = easeInOut(s);
          const fwd = 0.4 * ease;
          const yaw = from.yaw + Math.PI * ease;
          unit.v.position.set(
            from.x + Math.cos(from.yaw) * fwd,
            CAR_Y,
            from.z - Math.sin(from.yaw) * fwd,
          );
          unit.v.rotation.set(0, yaw, 0);
          unit.v.userData.tickDrift(d, s, unit.lean);
          gone = false;
        } else {
          const leaveT = local - DRIFT_DUR;
          const raw = Math.min(1, leaveT / (LEAVE_S - DRIFT_DUR));
          const u = easeOutCubic(raw);
          const along = u * paths.leave.total + unit.index * 0.2;
          poseCar(unit, sampleByDist(paths.leave, along));
          unit.v.userData.setSiren(true, leaveT);
          if (raw >= 1) unit.v.visible = false;
          else gone = false;
        }
      }
      if (gone || t >= LEAVE_S + 1.2) {
        phase.current = "idle";
        const done = mission;
        for (const u of list) {
          u.v.visible = false;
          u.v.userData.setSiren(false);
          u.v.userData.resetRaid();
        }
        endJailEscort(done.id);
        onComplete?.(done);
      }
    }
  });

  const pawnId: PawnId | null = mission?.pawnId ?? null;

  return (
    <group name="jail-escort">
      <group ref={root} />
      {pawnId ? (
        <group ref={prisoner} visible={false}>
          <PawnVisual pawnId={pawnId} targetHeight={0.55} />
        </group>
      ) : null}
    </group>
  );
}
