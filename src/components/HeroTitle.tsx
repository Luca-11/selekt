interface HeroTitleProps {
  lines: string[];
}

export function HeroTitle({ lines }: HeroTitleProps) {
  return (
    <h1 className="hero__title">
      {lines.map((line, index) => (
        <span
          key={line}
          className="hero__line"
          style={{ animationDelay: `${index * 90}ms` }}
        >
          {line}
        </span>
      ))}
    </h1>
  );
}
