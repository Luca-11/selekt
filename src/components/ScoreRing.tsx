import Link from "next/link";
import { scoreColor } from "@/lib/score";

interface ScoreRingProps {
  score: number;
  max: number;
  partial: boolean;
}

export function ScoreRing({ score, max, partial }: ScoreRingProps) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const fill = max > 0 ? (score / max) * circ : 0;
  const color = scoreColor(score, max);

  return (
    <div className="score-ring">
      <svg width="52" height="52" viewBox="0 0 52 52" aria-label={`Score ${score} sur ${max}`}>
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="3" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text
          x="26"
          y="30"
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill={color}
          fontFamily="var(--font-mono)"
        >
          {score}/{max}
        </text>
      </svg>
      {partial && (
        <span className="score-ring__partial" title="Fiche incomplète">
          partiel
        </span>
      )}
      <Link href="/a-propos#notes" className="score-ring__label">
        Mon avis
      </Link>
    </div>
  );
}
