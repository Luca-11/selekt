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
    if (narrow) {
      const viewW = 390;
      const viewH = 100;
      const radius = viewW * 0.36;
      const cx = viewW / 2;
      const hubY = viewH * 0.45;
      const cy = hubY + radius;

      return {
        cx,
        cy,
        radius,
        needleAngle: -90,
        viewW,
        viewH,
        notchR: 2.5,
        tickLen: 8,
        needleTipInset: 5,
        needleBaseInset: 24,
      };
    }

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
    const viewW = width;
    const viewH = height;
    const radius = viewW * 0.36;
    const cx = viewW / 2;
    const hubY = viewH * 0.45;
    const cy = hubY + radius;

    return {
      cx,
      cy,
      radius,
      needleAngle: -90,
      viewW,
      viewH,
      notchR: 2.5,
      tickLen: 8,
      needleTipInset: 5,
      needleBaseInset: 24,
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
    const hubY = geom.cy + geom.radius * Math.sin((geom.needleAngle * Math.PI) / 180);
    return {
      x: geom.cx,
      y: Math.max(geom.tickLen * 2, hubY - geom.tickLen * 1.2),
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
