const DB_NAME = "cidadela-sfx";
const DB_VERSION = 1;
const STORE = "overrides";

export type SfxOverrideMeta = {
  slotId: string;
  fileName: string;
  mimeType: string;
  updatedAt: number;
  size: number;
};

type StoredRow = SfxOverrideMeta & { blob: Blob };

let dbPromise: Promise<IDBDatabase> | null = null;
const urlBySlot = new Map<string, string>();
const metaBySlot = new Map<string, SfxOverrideMeta>();
const listeners = new Set<() => void>();

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "slotId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
  return dbPromise;
}

function notify(): void {
  for (const fn of listeners) fn();
}

export function subscribeSfxOverrides(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function revokeUrl(slotId: string): void {
  const prev = urlBySlot.get(slotId);
  if (prev) {
    URL.revokeObjectURL(prev);
    urlBySlot.delete(slotId);
  }
}

export async function initSfxOverrides(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  const rows = await new Promise<StoredRow[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as StoredRow[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  for (const row of rows) {
    revokeUrl(row.slotId);
    urlBySlot.set(row.slotId, URL.createObjectURL(row.blob));
    metaBySlot.set(row.slotId, {
      slotId: row.slotId,
      fileName: row.fileName,
      mimeType: row.mimeType,
      updatedAt: row.updatedAt,
      size: row.size,
    });
  }
  notify();
}

export function getOverrideUrl(slotId: string): string | null {
  return urlBySlot.get(slotId) ?? null;
}

export function getOverrideMeta(slotId: string): SfxOverrideMeta | null {
  return metaBySlot.get(slotId) ?? null;
}

export function hasOverride(slotId: string): boolean {
  return urlBySlot.has(slotId);
}

export function listOverrideMetas(): SfxOverrideMeta[] {
  return [...metaBySlot.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function setSfxOverride(
  slotId: string,
  file: File,
): Promise<SfxOverrideMeta> {
  if (!file.type.startsWith("audio/") && !/\.(ogg|mp3|wav|aiff|aif|webm|m4a)$/i.test(file.name)) {
    throw new Error("Envie um arquivo de áudio (ogg, mp3, wav, webm…).");
  }
  const maxBytes = 8 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Arquivo maior que 8 MB.");
  }
  const blob = file.slice(0, file.size, file.type || "audio/mpeg");
  const meta: SfxOverrideMeta = {
    slotId,
    fileName: file.name,
    mimeType: blob.type || "audio/mpeg",
    updatedAt: Date.now(),
    size: blob.size,
  };
  const row: StoredRow = { ...meta, blob };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  revokeUrl(slotId);
  urlBySlot.set(slotId, URL.createObjectURL(blob));
  metaBySlot.set(slotId, meta);
  notify();
  return meta;
}

export async function clearSfxOverride(slotId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(slotId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  revokeUrl(slotId);
  metaBySlot.delete(slotId);
  notify();
}

export async function clearAllSfxOverrides(): Promise<void> {
  const ids = [...metaBySlot.keys()];
  for (const id of ids) {
    await clearSfxOverride(id);
  }
}

export function resolveSlotUrl(slotId: string, defaultUrl: string): string {
  return getOverrideUrl(slotId) ?? defaultUrl;
}
