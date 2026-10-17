const dirs = new Map<string, -1 | 1>();

export function setPawnPathDir(playerId: string, dir: -1 | 1) {
  dirs.set(playerId, dir);
}

export function consumePawnPathDir(playerId: string): -1 | 1 {
  const dir = dirs.get(playerId) ?? 1;
  dirs.delete(playerId);
  return dir;
}
