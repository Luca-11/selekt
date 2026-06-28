import { ARC_SPAN_DEG, roundSvg } from "@/lib/arc-dial";

export interface DialGeom {
  cx: number;
  cy: number;
  radius: number;
  needleAngle: number;
  viewW: number;
  viewH: number;
  notchR: number;
  tickLen: number;
  needleTipInset: number;
  needleBaseInset: number;
}

export function computeDialGeometry(
  width: number,
  height: number,
  narrow: boolean,
): DialGeom {
  if (width <= 0 || height <= 0) {
    return {
      cx: 28,
      cy: 200,
      radius: 168,
      needleAngle: 0,
      viewW: 220,
      viewH: 400,
      notchR: 3.5,
      tickLen: 12,
      needleTipInset: 8,
      needleBaseInset: 46,
    };
  }

  if (narrow) {
    const viewH = Math.max(height * 0.32, 200);
    const radius = Math.min(width * 0.46, viewH * 1.55);
    return {
      cx: width / 2,
      cy: viewH - 20,
      radius,
      needleAngle: -90,
      viewW: width,
      viewH,
      notchR: 4,
      tickLen: 16,
      needleTipInset: 10,
      needleBaseInset: 52,
    };
  }

  const viewW = width;
  const radius = Math.min(height * 0.5, viewW * 0.88);
  return {
    cx: 36,
    cy: height / 2,
    radius,
    needleAngle: 0,
    viewW,
    viewH: height,
    notchR: 4.5,
    tickLen: 18,
    needleTipInset: 12,
    needleBaseInset: 58,
  };
}

/** Point d'ancrage de l'indicateur de navigation, dans les coords du viewBox. */
export function navHintAnchor(geom: DialGeom, narrow: boolean): { x: number; y: number } {
  if (narrow) {
    return {
      x: geom.cx,
      y: geom.cy - geom.radius * 0.48,
    };
  }

  return {
    x: geom.cx + geom.radius * 0.34,
    y: geom.cy,
  };
}

export function arcPathForGeom(geom: DialGeom, spanDeg = ARC_SPAN_DEG, radius = geom.radius): string {
  const start = polar(geom.cx, geom.cy, radius, geom.needleAngle - spanDeg / 2);
  const end = polar(geom.cx, geom.cy, radius, geom.needleAngle + spanDeg / 2);
  const large = spanDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: roundSvg(cx + r * Math.cos(rad)),
    y: roundSvg(cy + r * Math.sin(rad)),
  };
}
