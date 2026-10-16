import { getPawnDef, type PawnId } from "@cidadela/shared";
import { playSfx, unlockAudio } from "../audio/sfx";

type Props = {
  pawnId: PawnId;
  size?: number;
  selected?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
};

export function LobbyPawnToken({
  pawnId,
  size = 44,
  selected = false,
  disabled = false,
  showLabel = false,
  onClick,
}: Props) {
  const def = getPawnDef(pawnId);
  const interactive = Boolean(onClick) && !disabled;
  const Tag = interactive ? "button" : "div";

  return (
    <Tag
      type={interactive ? "button" : undefined}
      disabled={interactive ? disabled : undefined}
      onClick={onClick}
      className={`lobby-pawn ${selected ? "lobby-pawn--selected" : ""} ${disabled ? "lobby-pawn--disabled" : ""
        } ${interactive ? "lobby-pawn--pick" : ""}`}
      style={{ width: size }}
      aria-label={def.label}
      aria-pressed={interactive ? selected : undefined}
    >
      <svg
        viewBox="0 0 40 52"
        width={size}
        height={Math.round(size * 1.3)}
        aria-hidden
      >
        <ellipse
          cx="20"
          cy="46"
          rx="14"
          ry="4"
          fill="rgba(92,61,46,0.18)"
        />
        <rect
          x="8"
          y="40"
          width="24"
          height="7"
          rx="3.5"
          fill={def.accent}
          stroke="#5c3d2e"
          strokeWidth="2"
        />
        <path
          d="M12 40 L10 18 H30 L28 40 Z"
          fill={def.color}
          stroke="#5c3d2e"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle
          cx="20"
          cy="12"
          r="9"
          fill={def.color}
          stroke="#5c3d2e"
          strokeWidth="2"
        />
        <circle cx="20" cy="5" r="3.2" fill={def.accent} stroke="#5c3d2e" strokeWidth="1.5" />
      </svg>
      {showLabel ? (
        <span className="lobby-pawn__label">{def.label}</span>
      ) : null}
    </Tag>
  );
}

type PickerProps = {
  value: PawnId;
  options: readonly PawnId[];
  onChange: (id: PawnId) => void;
  taken?: ReadonlySet<PawnId>;
};

export function LobbyPawnPicker({
  value,
  options,
  onChange,
  taken,
}: PickerProps) {
  return (
    <div className="lobby-pawn-picker" role="listbox" aria-label="Escolher peão">
      {options.map((id) => {
        const unavailable = Boolean(taken?.has(id) && id !== value);
        return (
          <LobbyPawnToken
            key={id}
            pawnId={id}
            size={48}
            selected={id === value}
            disabled={unavailable}
            showLabel
            onClick={() => {
              if (unavailable) return;
              unlockAudio();
              playSfx("select");
              onChange(id);
            }}
          />
        );
      })}
    </div>
  );
}
