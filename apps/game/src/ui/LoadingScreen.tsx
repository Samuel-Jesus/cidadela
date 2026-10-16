import { useEffect, useRef, useState, type CSSProperties } from "react";

type Props = {
  /** 0–1; se omitido, barra indeterminada. */
  progress?: number;
  hint?: string;
  detail?: string;
};

const TIPS = [
  "Cobre o aluguel antes do próximo jogador rolar os dados — senão ele é perdido.",
  "Imóvel que ninguém compra vai a leilão para toda a mesa.",
  "Com pousadas e resorts escassos no banco, a construção vira leilão.",
  "Três duplas seguidas no mesmo turno mandam você direto para o Forte.",
  "Negociar com os outros jogadores pode completar aquele grupo de cor.",
  "Imóvel hipotecado não cobra aluguel. Resgate com juros quando puder.",
];

const TIP_INTERVAL_MS = 3600;

const CLOUDS = [
  { top: "10%", scale: 1.1, duration: 26, delay: -4 },
  { top: "22%", scale: 0.7, duration: 18, delay: -11 },
  { top: "34%", scale: 0.9, duration: 22, delay: -17 },
  { top: "6%", scale: 0.55, duration: 15, delay: -2 },
  { top: "46%", scale: 1.3, duration: 30, delay: -21 },
  { top: "28%", scale: 0.5, duration: 13, delay: -8 },
];

function useSmoothedProgress(target: number | undefined): number | null {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const targetRef = useRef(target ?? 0);
  targetRef.current = Math.min(1, Math.max(0, target ?? 0));

  useEffect(() => {
    if (target == null) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const goal = targetRef.current;
      const cur = shownRef.current;
      if (goal > cur) {
        const next = Math.min(goal, cur + Math.max(0.004, (goal - cur) * dt * 6));
        shownRef.current = next;
        setShown(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target == null]);

  return target == null ? null : shown;
}

export function LoadingScreen({
  progress,
  hint = "Embarcando para a Bahia…",
  detail,
}: Props) {
  const smooth = useSmoothedProgress(progress);
  const pct = smooth != null ? Math.round(smooth * 100) : null;
  const [tipIndex, setTipIndex] = useState(() =>
    Math.floor(Math.random() * TIPS.length),
  );

  useEffect(() => {
    const id = window.setInterval(
      () => setTipIndex((i) => (i + 1) % TIPS.length),
      TIP_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="loading"
      role="status"
      aria-busy={pct !== 100}
      aria-label="Carregando Cidadela"
    >
      <div className="loading__sky" aria-hidden>
        <div className="loading__sun" />
        {CLOUDS.map((c, i) => (
          <span
            key={i}
            className="loading__cloud"
            style={
              {
                top: c.top,
                "--cloud-scale": c.scale,
                animationDuration: `${c.duration}s`,
                animationDelay: `${c.delay}s`,
              } as CSSProperties
            }
          />
        ))}
        <SalvadorSkyline />
      </div>

      <div className="loading__content">
        <p className="loading__kicker">Cidadela</p>
        <h1 className="loading__title">
          {pct === 100 ? "Pousando" : "Decolando"}
        </h1>

        <div className="loading__flight" aria-hidden>
          <div className="loading__wind">
            <span />
            <span />
            <span />
          </div>
          <div className="loading__plane">
            <BannerPlane />
          </div>
        </div>

        <div className="loading__route" aria-hidden>
          <span className="loading__airport">CDL</span>
          <div className="loading__track">
            <div
              className={
                pct == null
                  ? "loading__track-fill loading__track-fill--indeterminate"
                  : "loading__track-fill"
              }
              style={pct != null ? { width: `${pct}%` } : undefined}
            />
            {pct != null && (
              <span className="loading__marker" style={{ left: `${pct}%` }}>
                <MarkerPlane />
              </span>
            )}
          </div>
          <span className="loading__airport loading__airport--dest">SSA</span>
        </div>

        <p className="loading__hint">{hint}</p>
        <p className="loading__pct">
          {pct != null ? `${pct}%` : "Preparando o tabuleiro…"}
          {detail && pct !== 100 && (
            <span className="loading__detail"> · {detail}</span>
          )}
        </p>

        <p key={tipIndex} className="loading__tip">
          <strong>Dica de bordo:</strong> {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
}

const INK = "#5c3d2e";

/** Teco-teco rebocando faixa, como os aviões de propaganda das praias de Salvador. */
function BannerPlane() {
  return (
    <svg
      className="loading__plane-svg"
      viewBox="0 0 364 112"
      width="364"
      height="112"
      fill="none"
      stroke={INK}
      strokeWidth="2.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M172 38 L198 60 L172 82" strokeWidth="1.6" />
      <path d="M198 60 L212 60" strokeWidth="1.6" />

      <g className="loading__banner">
        <path
          d="M14 40 C54 33 94 47 134 38 C150 35 162 37 172 40 L172 80 C162 77 150 75 134 78 C94 87 54 73 14 80 Z"
          fill="#fff7ed"
        />
        <path
          d="M14 45 C54 38 94 52 134 43 C150 40 162 42 172 45"
          stroke="#0f766e"
          strokeWidth="3"
        />
        <path
          d="M14 75 C54 68 94 82 134 73 C150 70 162 72 172 75"
          stroke="#f97316"
          strokeWidth="3"
        />
        <text
          x="93"
          y="67"
          textAnchor="middle"
          fill="#c2410c"
          stroke="none"
          fontFamily="Fredoka, system-ui, sans-serif"
          fontSize="22"
          fontWeight="700"
          letterSpacing="2"
        >
          CIDADELA
        </text>
        <path d="M172 36 L172 84" strokeWidth="3" />
      </g>

      <path d="M206 60 L240 57 L243 63 L209 65 Z" fill="#fdba74" />
      <path
        d="M215 58 L208 24 C208 21 211 20 214 21 L228 22 C232 23 236 28 247 50 Z"
        fill="#f97316"
      />
      <circle cx="219" cy="33" r="5" fill="#fff7ed" strokeWidth="1.8" />
      <circle cx="219" cy="33" r="1.8" fill="#0f766e" stroke="none" />

      <path d="M276 46 L290 70" strokeWidth="2" />

      <path
        d="M212 56 C236 46 290 42 318 45 C336 47 346 53 346 60 C346 67 336 72 318 73 L246 72 C230 71 218 66 212 62 Z"
        fill="#fff7ed"
      />
      <path
        d="M226 65 C262 67 310 67 345 62 L345 65.5 C320 70.5 262 71 232 68.5 Z"
        fill="#0f766e"
        stroke="none"
      />
      <rect x="258" y="52" width="11" height="8" rx="2.5" fill="#7dd3fc" strokeWidth="1.8" />
      <rect x="274" y="52" width="11" height="8" rx="2.5" fill="#7dd3fc" strokeWidth="1.8" />
      <rect x="290" y="52" width="11" height="8" rx="2.5" fill="#7dd3fc" strokeWidth="1.8" />
      <path
        d="M306 50 L322 49 C330 50 336 54 338 58 L306 58 Z"
        fill="#7dd3fc"
        strokeWidth="1.8"
      />
      <path d="M309 51 L312 51 L310 56" stroke="#fff7ed" strokeWidth="1.5" />

      <path
        d="M252 42 L318 39 C323 39 324 44 319 45 L254 47 C249 47 248 42 252 42 Z"
        fill="#14b8a6"
      />

      <path d="M294 72 L298 85" />
      <circle cx="298" cy="88" r="5" fill={INK} stroke="none" />
      <circle cx="298" cy="88" r="1.8" fill="#fff7ed" stroke="none" />
      <path d="M223 66 L221 73" strokeWidth="2" />
      <circle cx="221" cy="75" r="2.6" fill={INK} stroke="none" />

      <path
        d="M345 53 C352 54 356 57 356 60 C356 63 352 66 345 67 Z"
        fill="#ea580c"
      />
      <ellipse
        cx="358"
        cy="60"
        rx="2.5"
        ry="22"
        fill="rgba(92, 61, 46, 0.12)"
        stroke="none"
      />
      <rect
        className="loading__prop"
        x="355.5"
        y="38"
        width="5"
        height="44"
        rx="2.5"
        fill={INK}
        stroke="none"
      />
    </svg>
  );
}

function MarkerPlane() {
  return (
    <svg viewBox="0 0 32 24" width="28" height="21" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 12 L8 11 L6 4 L10 4 L16 11 L26 11 C30 11 30 13 26 13 L16 13 L10 20 L6 20 L8 13 L2 12 Z"
        fill="#fff7ed"
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SalvadorSkyline() {
  return (
    <svg
      className="loading__skyline"
      viewBox="0 0 800 140"
      preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 112 C90 82 170 94 250 88 C330 82 380 66 470 68 C560 70 620 86 700 82 C750 80 780 84 800 86 L800 140 L0 140 Z"
        fill="#0f766e"
        opacity="0.4"
      />
      <g fill={INK} opacity="0.45">
        <rect x="104" y="80" width="42" height="14" rx="2" />
        <rect x="117" y="42" width="16" height="40" />
        <rect x="113" y="34" width="24" height="8" rx="2" />
        <path d="M115 34 L125 24 L135 34 Z" />
        <rect x="462" y="22" width="22" height="48" />
        <rect x="456" y="14" width="34" height="10" rx="2" />
        <rect x="484" y="22" width="40" height="6" />
      </g>
      <g fill="#fff7ed" opacity="0.55">
        <rect x="117" y="52" width="16" height="5" />
        <rect x="117" y="66" width="16" height="5" />
      </g>
      <rect x="0" y="106" width="800" height="34" fill="#0e7490" opacity="0.55" />
      <path
        d="M0 112 Q20 108 40 112 T80 112 T120 112 T160 112 T200 112 T240 112 T280 112 T320 112 T360 112 T400 112 T440 112 T480 112 T520 112 T560 112 T600 112 T640 112 T680 112 T720 112 T760 112 T800 112"
        stroke="#fff7ed"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      <g fill={INK} opacity="0.5">
        <ellipse cx="640" cy="106" rx="28" ry="7" />
        <rect x="622" y="92" width="36" height="14" rx="3" />
        <rect x="634" y="84" width="12" height="8" />
      </g>
    </svg>
  );
}
