export type UiSfx = "click" | "hover" | "back" | "select" | "switch" | "error";
export type DiceSfx = "mix" | "fall";

const FILES: Record<UiSfx, string> = {
  click: "click_004.ogg",
  hover: "pluck_001.ogg",
  back: "back_004.ogg",
  select: "select_001.ogg",
  switch: "switch_001.ogg",
  error: "error_003.ogg",
};

const DICE_FILES: Record<DiceSfx, string> = {
  mix: "mix_dices.ogg",
  fall: "fall_dices.ogg",
};

const BASE = "/sounds/ui";
const DICE_BASE = "/sounds/dice";
const MUTE_KEY = "cidadela.sfx.muted";
const VOLUME_KEY = "cidadela.sfx.volume";

export const UI_SFX_HOVER_SELECTOR = "button.lobby-cta:not(:disabled)";

const HOVER_COOLDOWN_MS = 90;

let muted = readMuted();
let volume = readVolume();
const cache = new Map<string, HTMLAudioElement>();
let lastHoverAt = 0;
let hoverBound = false;
let mixLoop: HTMLAudioElement | null = null;

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

function getAudio(file: string, base = BASE): HTMLAudioElement {
  const key = `${base}/${file}`;
  let a = cache.get(key);
  if (!a) {
    a = new Audio(key);
    a.preload = "auto";
    cache.set(key, a);
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
    const baseVol = opts?.volume ?? (id === "hover" ? volume * 0.45 : volume);
    node.volume = Math.min(1, Math.max(0, baseVol));
    void node.play().catch(() => undefined);
  } catch {
    return;
  }
}

export function playDiceSfx(id: DiceSfx, opts?: { volume?: number }): void {
  if (muted || volume <= 0) return;
  try {
    const src = getAudio(DICE_FILES[id], DICE_BASE);
    const node = src.cloneNode(true) as HTMLAudioElement;
    node.volume = Math.min(1, Math.max(0, opts?.volume ?? volume * 0.85));
    void node.play().catch(() => undefined);
  } catch {
    return;
  }
}

export function startDiceMixLoop(): void {
  stopDiceMixLoop();
  if (muted || volume <= 0) return;
  try {
    const a = getAudio(DICE_FILES.mix, DICE_BASE);
    a.loop = true;
    a.currentTime = 0;
    a.volume = Math.min(1, volume * 0.7);
    mixLoop = a;
    void a.play().catch(() => undefined);
  } catch {
    return;
  }
}

export function stopDiceMixLoop(): void {
  if (!mixLoop) return;
  try {
    mixLoop.pause();
    mixLoop.currentTime = 0;
    mixLoop.loop = false;
  } catch {}
  mixLoop = null;
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
  if (next) stopDiceMixLoop();
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
  for (const file of Object.values(DICE_FILES)) getAudio(file, DICE_BASE);
}
