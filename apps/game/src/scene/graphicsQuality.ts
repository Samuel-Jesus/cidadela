export type GraphicsTier = "low" | "high";

export type GraphicsQuality = {
  tier: GraphicsTier;
  dpr: [number, number];
  antialias: boolean;
  shadows: boolean;
  shadowMapSize: number;
  landmarkTickMaxDist: number;
  landmarkTickHardMaxDist: number;
};

let cached: GraphicsQuality | null = null;

function detectTier(): GraphicsTier {
  if (typeof window === "undefined") return "high";
  try {
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    if (nav.connection?.saveData) return "low";
    if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) {
      return "low";
    }
    if (
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency > 0 &&
      navigator.hardwareConcurrency <= 4
    ) {
      return "low";
    }
    if (window.matchMedia("(max-width: 767px)").matches) return "low";
  } catch {}
  return "high";
}

export function getGraphicsQuality(): GraphicsQuality {
  if (cached) return cached;
  const tier = detectTier();
  cached =
    tier === "low"
      ? {
        tier,
        dpr: [1, 1],
        antialias: false,
        shadows: false,
        shadowMapSize: 512,
        landmarkTickMaxDist: 14,
        landmarkTickHardMaxDist: 22,
      }
      : {
        tier,
        dpr: [1, 1.5],
        antialias: true,
        shadows: true,
        shadowMapSize: 1024,
        landmarkTickMaxDist: 22,
        landmarkTickHardMaxDist: 40,
      };
  return cached;
}

export function resetGraphicsQualityCache(): void {
  cached = null;
}
