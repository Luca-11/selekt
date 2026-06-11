"use client";

interface AnimatedCountProps {
  value: number;
}

export function AnimatedCount({ value }: AnimatedCountProps) {
  return (
    <span key={value} className="animated-count">
      {value}
    </span>
  );
}
