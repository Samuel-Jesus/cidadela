export type UiSfx = "click" | "hover" | "back" | "select" | "switch" | "error";

const FILES: Record<UiSfx, string> = {
  click: "click_004.ogg",
  hover: "pluck_001.ogg",
  back: "back_004.ogg",
  select: "select_001.ogg",
  switch: "switch_001.ogg",
  error: "error_003.ogg",
};

const BASE = "/sounds/ui";
const MUTE_KEY = "cidadela.sfx.muted";
const VOLUME_KEY = "cidadela.sfx.volume";

export const UI_SFX_HOVER_SELECTOR = "button.lobby-cta:not(:disabled)";

const HOVER_COOLDOWN_MS = 90;

let muted = readMuted();
let volume = readVolume();
const cache = new Map<string, HTMLAudioElement>();
let lastHoverAt = 0;
let hoverBound = false;

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function readVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw == null) return 0.55;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.55;
  } catch {
    return 0.55;
  }
}

function getAudio(file: string): HTMLAudioElement {
  let a = cache.get(file);
  if (!a) {
    a = new Audio(`${BASE}/${file}`);
    a.preload = "auto";
    cache.set(file, a);
  }
  return a;
}

export function unlockAudio(): void {
  try {
    const a = getAudio(FILES.click);
    a.volume = 0;
    void a
      .play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
        a.volume = volume;
      })
      .catch(() => undefined);
  } catch {
    return;
  }
}

export function playSfx(id: UiSfx, opts?: { volume?: number }): void {
  if (muted || volume <= 0) return;
  try {
    const src = getAudio(FILES[id]);
    const node = src.cloneNode(true) as HTMLAudioElement;
    const base = opts?.volume ?? (id === "hover" ? volume * 0.45 : volume);
    node.volume = Math.min(1, Math.max(0, base));
    void node.play().catch(() => undefined);
  } catch {
    return;
  }
}

export function playHoverSfx(): void {
  const now = performance.now();
  if (now - lastHoverAt < HOVER_COOLDOWN_MS) return;
  lastHoverAt = now;
  playSfx("hover");
}

export function bindUiSfxHover(): void {
  if (hoverBound || typeof document === "undefined") return;
  hoverBound = true;
  document.addEventListener("pointerover", (e) => {
    if (!(e.target instanceof Element)) return;
    if (e.pointerType === "touch") return;
    const btn = e.target.closest(UI_SFX_HOVER_SELECTOR);
    if (!btn) return;
    const from = e.relatedTarget instanceof Node ? e.relatedTarget : null;
    if (from && btn.contains(from)) return;
    playHoverSfx();
  });
}

export function isSfxMuted(): boolean {
  return muted;
}

export function setSfxMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    return;
  }
}

export function toggleSfxMuted(): boolean {
  setSfxMuted(!muted);
  return muted;
}

export function getSfxVolume(): number {
  return volume;
}

export function setSfxVolume(next: number): void {
  volume = Math.min(1, Math.max(0, next));
  try {
    localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {
    return;
  }
}

export function preloadUiSfx(): void {
  for (const file of Object.values(FILES)) getAudio(file);
}
