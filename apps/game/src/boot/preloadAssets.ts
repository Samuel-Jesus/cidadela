import { Cache, DefaultLoadingManager } from "three";
import {
  LANDMARK_MODELS,
  preloadLandmarkModels,
} from "../landmarks/GltfLandmark";

export type PreloadStage = "fonts" | "download" | "build" | "ready";

export type PreloadProgress = {
  stage: PreloadStage;
  /** 0–1 global (todas as etapas ponderadas). */
  ratio: number;
  hint: string;
  /** Ex.: "1,2 / 2,9 MB" durante o download. */
  detail?: string;
};

const WEIGHTS: Record<Exclude<PreloadStage, "ready">, number> = {
  fonts: 0.06,
  download: 0.72,
  build: 0.22,
};

const FONT_TIMEOUT_MS = 2500;
const BUILD_TIMEOUT_MS = 15000;

const FONT_FACES = [
  '600 1em "Fredoka"',
  '700 1em "Fredoka"',
  '700 1em "Nunito"',
  '800 1em "Nunito"',
];

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | void> {
  return Promise.race([
    p,
    new Promise<void>((resolve) => window.setTimeout(resolve, ms)),
  ]);
}

function formatMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

async function loadFonts(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  await withTimeout(
    Promise.all(FONT_FACES.map((f) => document.fonts.load(f))).then(
      () => document.fonts.ready,
    ),
    FONT_TIMEOUT_MS,
  ).catch(() => undefined);
}

type DownloadState = { loaded: number; total: number; done: boolean };

/**
 * Baixa cada GLTF com progresso por bytes e deposita o ArrayBuffer no
 * `THREE.Cache`, de onde o `FileLoader` do `useGLTF` lê sem refazer a requisição.
 */
async function downloadModels(
  onBytes: (states: DownloadState[], activeLabel: string | null) => void,
): Promise<void> {
  Cache.enabled = true;
  const states: DownloadState[] = LANDMARK_MODELS.map(() => ({
    loaded: 0,
    total: 0,
    done: false,
  }));

  const activeLabel = () => {
    let best: string | null = null;
    let bestRemaining = -1;
    LANDMARK_MODELS.forEach((m, i) => {
      const s = states[i]!;
      if (s.done) return;
      const remaining = s.total ? s.total - s.loaded : Infinity;
      if (remaining > bestRemaining) {
        bestRemaining = remaining;
        best = m.label;
      }
    });
    return best;
  };

  const emit = () => onBytes(states, activeLabel());

  await Promise.all(
    LANDMARK_MODELS.map(async (m, i) => {
      const s = states[i]!;
      const key = `file:${m.url}`;
      if (Cache.get(key) !== undefined) {
        s.done = true;
        emit();
        return;
      }
      try {
        const res = await fetch(m.url);
        if (!res.ok) throw new Error(`${res.status}`);
        s.total = Number(res.headers.get("content-length")) || 0;
        emit();

        let buffer: ArrayBuffer;
        if (res.body && s.total > 0) {
          // Com gzip o content-length é o tamanho comprimido; o corpo pode passar dele.
          const reader = res.body.getReader();
          const chunks: Uint8Array[] = [];
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            s.loaded += value.length;
            s.total = Math.max(s.total, s.loaded);
            emit();
          }
          const bytes = new Uint8Array(s.loaded);
          let offset = 0;
          for (const c of chunks) {
            bytes.set(c, offset);
            offset += c.length;
          }
          buffer = bytes.buffer;
        } else {
          buffer = await res.arrayBuffer();
          s.total = s.loaded = buffer.byteLength;
        }
        Cache.add(key, buffer);
      } catch {
        // Sem cache: o useGLTF tenta de novo sozinho ao montar a cena.
      } finally {
        s.done = true;
        emit();
      }
    }),
  );
}

/** Parse dos GLTFs pelo mesmo pipeline do drei, acompanhando o LoadingManager. */
function buildModels(onRatio: (r: number) => void): Promise<void> {
  const mgr = DefaultLoadingManager;
  const prev = {
    onStart: mgr.onStart,
    onProgress: mgr.onProgress,
    onLoad: mgr.onLoad,
    onError: mgr.onError,
  };

  return new Promise<void>((resolve) => {
    let started = false;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      Object.assign(mgr, prev);
      onRatio(1);
      resolve();
    };

    mgr.onStart = () => {
      started = true;
    };
    mgr.onProgress = (_url, loaded, total) => {
      started = true;
      onRatio(total > 0 ? loaded / total : 0);
    };
    mgr.onLoad = finish;
    mgr.onError = () => undefined;

    preloadLandmarkModels();

    // Tudo já estava no cache do drei: o manager nem chega a disparar.
    window.setTimeout(() => {
      if (!started) finish();
    }, 50);
    window.setTimeout(finish, BUILD_TIMEOUT_MS);
  });
}

export async function preloadGameAssets(
  onProgress?: (p: PreloadProgress) => void,
): Promise<void> {
  const emit = (p: PreloadProgress) => onProgress?.(p);

  emit({ stage: "fonts", ratio: 0, hint: "Conferindo as passagens…" });
  await loadFonts();

  const downloadBase = WEIGHTS.fonts;
  emit({
    stage: "download",
    ratio: downloadBase,
    hint: "Embarcando a bagagem…",
  });
  await downloadModels((states, label) => {
    const known = states.filter((s) => s.total > 0);
    const total = known.reduce((a, s) => a + s.total, 0);
    const loaded = known.reduce((a, s) => a + s.loaded, 0);
    const doneFrac = states.filter((s) => s.done).length / states.length;
    const frac =
      known.length === states.length && total > 0
        ? loaded / total
        : Math.max(doneFrac, total > 0 ? (loaded / total) * 0.9 : 0);
    emit({
      stage: "download",
      ratio: downloadBase + WEIGHTS.download * frac,
      hint: label ? `Carregando ${label}…` : "Bagagem a bordo!",
      detail: total > 0 ? `${formatMb(loaded)} / ${formatMb(total)} MB` : undefined,
    });
  });

  const buildBase = WEIGHTS.fonts + WEIGHTS.download;
  emit({
    stage: "build",
    ratio: buildBase,
    hint: "Erguendo os cartões-postais de Salvador…",
  });
  await buildModels((r) =>
    emit({
      stage: "build",
      ratio: buildBase + WEIGHTS.build * r,
      hint: "Erguendo os cartões-postais de Salvador…",
    }),
  );

  emit({ stage: "ready", ratio: 1, hint: "Pouso autorizado em Salvador!" });
}
