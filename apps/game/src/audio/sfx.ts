import { getSfxSlot, type SfxSlot } from "./sfxCatalog";
import {
  getOverrideUrl,
  initSfxOverrides,
  resolveSlotUrl,
  subscribeSfxOverrides,
} from "./sfxOverrides";

export type UiSfx = "click" | "hover" | "back" | "select" | "switch" | "error";
export type DiceSfx = "mix" | "fall";
export type GameSfx =
  | "cashGain"
  | "badLuck"
  | "auctionStart"
  | "yourTurn"
  | "payRent"
  | "tiros"
  | "pawnStep"
  | "pawnLand"
  | "payTax"
  | "buyDeed"
  | "mortgage"
  | "build"
  | "victory"
  | "siren"
  | "towTruck";

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

/** Arquivo padrão em /sounds/game; null = só toca após upload no admin. */
const GAME_FILES: Record<GameSfx, string | null> = {
  cashGain: "ganhar_grana.ogg",
  badLuck: "sem_sorte.ogg",
  auctionStart: "start_leilao.ogg",
  yourTurn: "vez_de_jogar.ogg",
  payRent: "pagar_aluguel_perder_grana.ogg",
  tiros: "magiaz_tiros.mp3",
  pawnStep: null,
  pawnLand: null,
  payTax: null,
  buyDeed: null,
  mortgage: null,
  build: null,
  victory: null,
  siren: null,
  towTruck: null,
};

const BASE = "/sounds/ui";
const DICE_BASE = "/sounds/dice";
const GAME_BASE = "/sounds/game";
const CARNAVAL_BASE = "/sounds/carnaval";
const MUTE_KEY = "cidadela.sfx.muted";
const VOLUME_KEY = "cidadela.sfx.volume";

const CARNAVAL_TRACKS = [
  "igor_kanario01.ogg",
  "igor_kanario02.ogg",
] as const;

export const UI_SFX_HOVER_SELECTOR = "button.lobby-cta:not(:disabled)";

const HOVER_COOLDOWN_MS = 90;

let muted = readMuted();
let volume = readVolume();
const cache = new Map<string, HTMLAudioElement>();
let lastHoverAt = 0;
let hoverBound = false;
let mixLoop: HTMLAudioElement | null = null;
let carnavalTrack: HTMLAudioElement | null = null;
let tirosLoop: HTMLAudioElement | null = null;
let previewNode: HTMLAudioElement | null = null;
let overridesReady = false;

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

function uiSlot(id: UiSfx): string {
  return `ui:${id}`;
}
function diceSlot(id: DiceSfx): string {
  return `dice:${id}`;
}
function gameSlot(id: GameSfx): string {
  return `game:${id}`;
}
function carnavalSlot(index: number): string {
  return `carnaval:${index}`;
}

function defaultUrl(file: string, base: string): string {
  return `${base}/${file}`;
}

function bustCacheForSlot(slotId: string): void {
  for (const key of [...cache.keys()]) {
    if (key.startsWith(`${slotId}|`)) {
      cache.delete(key);
    }
  }
}

subscribeSfxOverrides(() => {
  for (const slot of [
    ...Object.keys(FILES).map((k) => uiSlot(k as UiSfx)),
    ...Object.keys(DICE_FILES).map((k) => diceSlot(k as DiceSfx)),
    ...Object.keys(GAME_FILES).map((k) => gameSlot(k as GameSfx)),
    ...CARNAVAL_TRACKS.map((_, i) => carnavalSlot(i)),
  ]) {
    bustCacheForSlot(slot);
  }
});

function getAudioFromUrl(slotId: string, url: string): HTMLAudioElement {
  const key = `${slotId}|${url}`;
  let a = cache.get(key);
  if (!a) {
    a = new Audio(url);
    a.preload = "auto";
    cache.set(key, a);
  }
  return a;
}

function getAudioResolved(
  slotId: string,
  file: string,
  base: string,
): HTMLAudioElement {
  return getAudioFromUrl(slotId, resolveSlotUrl(slotId, defaultUrl(file, base)));
}

function resolveGameUrl(id: GameSfx): string | null {
  const slotId = gameSlot(id);
  const file = GAME_FILES[id];
  const fallback = file ? defaultUrl(file, GAME_BASE) : "";
  const url = resolveSlotUrl(slotId, fallback);
  return url.trim() ? url : null;
}

export async function ensureSfxOverridesReady(): Promise<void> {
  if (overridesReady) return;
  await initSfxOverrides();
  overridesReady = true;
}

export function unlockAudio(): void {
  try {
    const a = getAudioResolved(uiSlot("click"), FILES.click, BASE);
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
    const src = getAudioResolved(uiSlot(id), FILES[id], BASE);
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
    const src = getAudioResolved(diceSlot(id), DICE_FILES[id], DICE_BASE);
    const node = src.cloneNode(true) as HTMLAudioElement;
    node.volume = Math.min(1, Math.max(0, opts?.volume ?? volume * 0.85));
    void node.play().catch(() => undefined);
  } catch {
    return;
  }
}

export function playGameSfx(id: GameSfx, opts?: { volume?: number }): void {
  if (muted || volume <= 0) return;
  const url = resolveGameUrl(id);
  if (!url) return;
  try {
    const src = getAudioFromUrl(gameSlot(id), url);
    const node = src.cloneNode(true) as HTMLAudioElement;
    node.volume = Math.min(1, Math.max(0, opts?.volume ?? volume * 0.9));
    void node.play().catch(() => undefined);
  } catch {
    return;
  }
}

export function startTirosSfx(opts?: { volume?: number }): void {
  stopTirosSfx();
  if (muted || volume <= 0) return;
  const url = resolveGameUrl("tiros");
  if (!url) return;
  try {
    const a = getAudioFromUrl(gameSlot("tiros"), url);
    a.loop = true;
    a.currentTime = 0;
    a.volume = Math.min(1, Math.max(0, opts?.volume ?? volume * 0.85));
    tirosLoop = a;
    void a.play().catch(() => undefined);
  } catch {
    return;
  }
}

export function stopTirosSfx(): void {
  if (!tirosLoop) return;
  try {
    tirosLoop.pause();
    tirosLoop.currentTime = 0;
    tirosLoop.loop = false;
  } catch { }
  tirosLoop = null;
}

export function startDiceMixLoop(): void {
  stopDiceMixLoop();
  if (muted || volume <= 0) return;
  try {
    const a = getAudioResolved(diceSlot("mix"), DICE_FILES.mix, DICE_BASE);
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
  } catch { }
  mixLoop = null;
}

export function playCarnavalMusic(): void {
  stopCarnavalMusic();
  if (muted || volume <= 0) return;
  try {
    const index = Math.floor(Math.random() * CARNAVAL_TRACKS.length);
    const file = CARNAVAL_TRACKS[index]!;
    const a = getAudioResolved(carnavalSlot(index), file, CARNAVAL_BASE);
    a.loop = false;
    a.currentTime = 0;
    a.volume = Math.min(1, volume * 0.8);
    const onEnded = () => {
      if (carnavalTrack === a) carnavalTrack = null;
    };
    a.addEventListener("ended", onEnded, { once: true });
    carnavalTrack = a;
    void a.play().catch(() => undefined);
  } catch {
    return;
  }
}

export function stopCarnavalMusic(): void {
  if (!carnavalTrack) return;
  try {
    carnavalTrack.pause();
    carnavalTrack.currentTime = 0;
  } catch { }
  carnavalTrack = null;
}

export function isCarnavalMusicPlaying(): boolean {
  return Boolean(carnavalTrack && !carnavalTrack.paused);
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
  if (next) {
    stopDiceMixLoop();
    stopCarnavalMusic();
    stopTirosSfx();
    stopSfxPreview();
  }
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
  if (mixLoop) mixLoop.volume = Math.min(1, volume * 0.7);
  if (carnavalTrack) carnavalTrack.volume = Math.min(1, volume * 0.8);
  if (tirosLoop) tirosLoop.volume = Math.min(1, volume * 0.85);
  try {
    localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {
    return;
  }
}

export function stopSfxPreview(): void {
  if (!previewNode) return;
  try {
    previewNode.pause();
    previewNode.currentTime = 0;
    previewNode.loop = false;
  } catch { }
  previewNode = null;
}

/** @returns false se não houver arquivo padrão nem upload. */
export function playSfxSlotPreview(slot: SfxSlot): boolean {
  stopSfxPreview();
  const url = resolveSlotUrl(slot.id, slot.defaultUrl).trim();
  if (!url) return false;
  unlockAudio();
  try {
    const a = new Audio(url);
    a.volume = Math.min(1, Math.max(0.15, volume || 0.55));
    a.loop = slot.playMode === "loop";
    previewNode = a;
    void a.play().catch(() => undefined);
    if (slot.playMode !== "loop") {
      a.addEventListener(
        "ended",
        () => {
          if (previewNode === a) previewNode = null;
        },
        { once: true },
      );
    }
    return true;
  } catch {
    return false;
  }
}

export function slotHasPlayableAudio(slot: SfxSlot): boolean {
  return Boolean(
    getOverrideUrl(slot.id) || slot.defaultUrl.trim(),
  );
}

export function isSfxPreviewPlaying(): boolean {
  return Boolean(previewNode && !previewNode.paused);
}

export function preloadUiSfx(): void {
  void ensureSfxOverridesReady().then(() => {
    for (const id of Object.keys(FILES) as UiSfx[]) {
      getAudioResolved(uiSlot(id), FILES[id], BASE);
    }
    for (const id of Object.keys(DICE_FILES) as DiceSfx[]) {
      getAudioResolved(diceSlot(id), DICE_FILES[id], DICE_BASE);
    }
    for (const id of Object.keys(GAME_FILES) as GameSfx[]) {
      const url = resolveGameUrl(id);
      if (url) getAudioFromUrl(gameSlot(id), url);
    }
    CARNAVAL_TRACKS.forEach((file, i) => {
      getAudioResolved(carnavalSlot(i), file, CARNAVAL_BASE);
    });
  });
}

export function getSlotById(id: string): SfxSlot | undefined {
  return getSfxSlot(id);
}
