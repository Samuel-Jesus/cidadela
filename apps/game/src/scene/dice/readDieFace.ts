import type { DieFace } from "@cidadela/engine";
import { Euler, Quaternion, Vector3 } from "three";

const _localUp = new Vector3();
const _inv = new Quaternion();

export function readDieFace(worldQuaternion: Quaternion): DieFace {
  _inv.copy(worldQuaternion).invert();
  _localUp.set(0, 1, 0).applyQuaternion(_inv);

  const ax = Math.abs(_localUp.x);
  const ay = Math.abs(_localUp.y);
  const az = Math.abs(_localUp.z);

  if (ay >= ax && ay >= az) {
    return _localUp.y >= 0 ? 1 : 6;
  }
  if (ax >= ay && ax >= az) {
    return _localUp.x >= 0 ? 2 : 5;
  }
  return _localUp.z >= 0 ? 3 : 4;
}

export function faceFlatness(worldQuaternion: Quaternion): number {
  _inv.copy(worldQuaternion).invert();
  _localUp.set(0, 1, 0).applyQuaternion(_inv);
  return Math.max(
    Math.abs(_localUp.x),
    Math.abs(_localUp.y),
    Math.abs(_localUp.z),
  );
}

export function quaternionWithFaceUp(face: DieFace): Quaternion {
  const e =
    face === 1
      ? new Euler(0, 0, 0)
      : face === 2
        ? new Euler(0, 0, Math.PI / 2)
        : face === 3
          ? new Euler(-Math.PI / 2, 0, 0)
          : face === 4
            ? new Euler(Math.PI / 2, 0, 0)
            : face === 5
              ? new Euler(0, 0, -Math.PI / 2)
              : new Euler(Math.PI, 0, 0);
  return new Quaternion().setFromEuler(e);
}
