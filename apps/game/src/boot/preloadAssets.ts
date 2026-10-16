import { preloadLandmarkModels } from "../landmarks/GltfLandmark";

const MODEL_URLS = [
  "/models/elevador-lacerda.gltf",
  "/models/forte-sao-marcelo.gltf",
  "/models/farol-da-barra.gltf",
  "/models/hidrometro.gltf",
] as const;

export type PreloadProgress = {
  loaded: number;
  total: number;
  ratio: number;
};

export async function preloadGameAssets(
  onProgress?: (p: PreloadProgress) => void,
): Promise<void> {
  const total = MODEL_URLS.length;
  let loaded = 0;
  const bump = () => {
    loaded += 1;
    onProgress?.({ loaded, total, ratio: loaded / total });
  };

  onProgress?.({ loaded: 0, total, ratio: 0 });

  await Promise.all(
    MODEL_URLS.map(async (url) => {
      try {
        const res = await fetch(url);
        if (res.ok) await res.arrayBuffer();
      } catch {
      } finally {
        bump();
      }
    }),
  );

  preloadLandmarkModels();
}
