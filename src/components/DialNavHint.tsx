import type { CSSProperties } from "react";

interface DialNavHintProps {
  narrow: boolean;
  visible: boolean;
  anchorX: number;
  anchorY: number;
}

export function DialNavHint({ narrow, visible, anchorX, anchorY }: DialNavHintProps) {
  const style = {
    "--nav-hint-x": `${anchorX}%`,
    "--nav-hint-y": `${anchorY}%`,
  } as CSSProperties;

  return (
    <div
      className={`brand-dial__nav-hint${narrow ? " brand-dial__nav-hint--mobile" : ""}${
        visible ? "" : " brand-dial__nav-hint--hidden"
      }`}
      style={style}
      aria-hidden="true"
    >
      {narrow ? (
        <svg
          className="brand-dial__nav-hint-icon"
          viewBox="0 0 48 24"
          width="48"
          height="24"
          focusable="false"
        >
          <path
            className="brand-dial__nav-hint-track"
            d="M6 12 H42"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            className="brand-dial__nav-hint-arrow brand-dial__nav-hint-arrow--left"
            d="M10 12 L6 12 M6 12 L8.5 9.5 M6 12 L8.5 14.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            className="brand-dial__nav-hint-arrow brand-dial__nav-hint-arrow--right"
            d="M38 12 L42 12 M42 12 L39.5 9.5 M42 12 L39.5 14.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle className="brand-dial__nav-hint-dot" cx="24" cy="12" r="3" fill="currentColor" />
        </svg>
      ) : (
        <svg
          className="brand-dial__nav-hint-icon"
          viewBox="0 0 24 40"
          width="24"
          height="40"
          focusable="false"
        >
          <rect
            className="brand-dial__nav-hint-mouse"
            x="5"
            y="3"
            width="14"
            height="22"
            rx="7"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <circle className="brand-dial__nav-hint-wheel" cx="12" cy="11" r="2" fill="currentColor" />
          <path
            className="brand-dial__nav-hint-arrow brand-dial__nav-hint-arrow--down"
            d="M12 30 V36 M12 36 L9 33 M12 36 L15 33"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
      <span className="brand-dial__nav-hint-label">{narrow ? "Glisser" : "Scroll"}</span>
    </div>
  );
}
