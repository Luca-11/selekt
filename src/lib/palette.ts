export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function paletteFromName(name: string): {
  color: string;
  accent: string;
  textOnImg: "light" | "dark";
} {
  const h = hashString(name) % 360;
  const color = `hsl(${h}, 18%, ${22 + (hashString(name + "b") % 18)}%)`;
  const accent = `hsl(${(h + 40) % 360}, 35%, 65%)`;
  return { color, accent, textOnImg: "light" };
}
