type Props = {
  /** 0–1; se omitido, barra indeterminada. */
  progress?: number;
  hint?: string;
};

export function LoadingScreen({
  progress,
  hint = "Embarcando para a Bahia…",
}: Props) {
  const pct =
    progress != null
      ? Math.round(Math.min(1, Math.max(0, progress)) * 100)
      : null;

  return (
    <div
      className="loading"
      role="status"
      aria-busy="true"
      aria-label="Carregando Cidadela"
    >
      <div className="loading__sky" aria-hidden />
      <div className="loading__content">
        <p className="loading__kicker">Cidadela</p>
        <h1 className="loading__title">Decolando</h1>
        <p className="loading__hint">{hint}</p>

        <div className="loading__flight" aria-hidden>
          <div className="loading__trail" />
          <div className="loading__plane">
            <AirplaneMark />
          </div>
        </div>

        <div className="loading__bar" aria-hidden>
          <div
            className={
              pct == null
                ? "loading__bar-fill loading__bar-fill--indeterminate"
                : "loading__bar-fill"
            }
            style={pct != null ? { width: `${pct}%` } : undefined}
          />
        </div>
        <p className="loading__pct">
          {pct != null ? `${pct}%` : "Preparando o tabuleiro…"}
        </p>
      </div>
    </div>
  );
}

function AirplaneMark() {
  return (
    <svg
      className="loading__plane-svg"
      viewBox="0 0 120 48"
      width="120"
      height="48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 28h42l14-16h8l-8 16h18l10-8h6l-6 12 6 8h-6l-10-6H64l8 14h-8L50 32H8c-3 0-4-4-0-4Z"
        fill="#fff7ed"
        stroke="#5c3d2e"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M22 28V20h6l4 8"
        fill="#fdba74"
        stroke="#5c3d2e"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="96" cy="28" r="3" fill="#0f766e" stroke="#5c3d2e" strokeWidth="1.5" />
    </svg>
  );
}
