"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import type { Brand } from "@/types/brand";
import { BrandDialPanel } from "@/components/BrandDialPanel";
import { DialNavHint } from "@/components/DialNavHint";
import {
  ARC_SPAN_DEG,
  clampIndex,
  DIAL_DURATION,
  GHOST_SPAN_DEG,
  isNotchVisible,
  notchAngle,
  notchZone,
  polarToCartesian,
  roundSvg,
  STEP_DEG,
  WHEEL_IDLE_RESET_MS,
  WHEEL_MIN_STEP_MS_MOUSE,
  WHEEL_MIN_STEP_MS_TRACKPAD,
  WHEEL_STEP_THRESHOLD_TRACKPAD,
  isMouseWheel,
  type DialMotion,
} from "@/lib/arc-dial";
import { arcPathForGeom, computeDialGeometry, navHintAnchor, type DialGeom } from "@/lib/dial-geometry";
import { useDialRotation } from "@/hooks/useDialRotation";

interface BrandDialProps {
  brands: Brand[];
  immersive?: boolean;
  libraryTotal?: number;
  filteredTotal?: number;
  hasActiveFilters?: boolean;
}

function useNarrowDial(): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return narrow;
}

function useDialGeometry(
  containerRef: React.RefObject<HTMLElement | null>,
  narrow: boolean,
): { geom: DialGeom; ready: boolean } {
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const [state, setState] = useState<{ geom: DialGeom; ready: boolean }>(() => ({
    geom: computeDialGeometry(1, 1, narrow),
    ready: false,
  }));

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;

      const { width: lastW, height: lastH } = lastSizeRef.current;
      const widthChanged = Math.abs(rect.width - lastW) > 1;
      const heightChanged = Math.abs(rect.height - lastH) > 1;

      if (!widthChanged && !heightChanged && lastW > 0) return;

      lastSizeRef.current = { width: rect.width, height: rect.height };
      setState({
        geom: computeDialGeometry(rect.width, rect.height, narrow),
        ready: true,
      });
    };

    measure();
    const frame = requestAnimationFrame(measure);

    const observer = new ResizeObserver(() => measure());
    observer.observe(node);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [containerRef, narrow]);

  return state;
}

export function BrandDial({
  brands,
  immersive = false,
  libraryTotal,
  filteredTotal,
  hasActiveFilters = false,
}: BrandDialProps) {
  const labelId = useId();
  const layoutRef = useRef<HTMLElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const narrow = useNarrowDial();
  const { geom, ready: geomReady } = useDialGeometry(dialRef, narrow);

  const totalLibrary = libraryTotal ?? brands.length;
  const totalFiltered = filteredTotal ?? brands.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const animDurationRef = useRef<number>(DIAL_DURATION.scroll);
  const dragRef = useRef({ start: 0, startIndex: 0 });
  const wheelAccumulator = useRef(0);
  const wheelLastStepAt = useRef(0);
  const wheelIdleTimer = useRef<number | null>(null);
  const [navHintVisible, setNavHintVisible] = useState(false);

  const dismissNavHint = useCallback(() => {
    setNavHintVisible((visible) => {
      if (!visible) return visible;
      try {
        sessionStorage.setItem("selekt-dial-hint-seen", "1");
      } catch {
        /* sessionStorage indisponible */
      }
      return false;
    });
  }, []);

  useEffect(() => {
    try {
      setNavHintVisible(sessionStorage.getItem("selekt-dial-hint-seen") !== "1");
    } catch {
      setNavHintVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!navHintVisible) return;
    const timeout = window.setTimeout(dismissNavHint, 10_000);
    return () => window.clearTimeout(timeout);
  }, [dismissNavHint, navHintVisible]);

  const safeIndex = clampIndex(activeIndex, brands.length);
  const [animDuration, setAnimDuration] = useState<number>(DIAL_DURATION.scroll);
  const rotationIndex = useDialRotation(safeIndex, animDuration);
  const panelIndex = clampIndex(Math.round(rotationIndex), brands.length);
  const panelBrand = brands[panelIndex];

  useEffect(() => {
    if (activeIndex >= brands.length) {
      setActiveIndex(Math.max(0, brands.length - 1));
    }
  }, [activeIndex, brands.length]);

  const goTo = useCallback(
    (index: number, nextMotion: DialMotion) => {
      if (brands.length === 0) return;
      const duration = DIAL_DURATION[nextMotion];
      animDurationRef.current = duration;
      setAnimDuration(duration);
      setActiveIndex(clampIndex(index, brands.length));
    },
    [brands.length],
  );

  const step = useCallback(
    (delta: number, nextMotion: DialMotion) => {
      dismissNavHint();
      goTo(safeIndex + delta, nextMotion);
    },
    [dismissNavHint, goTo, safeIndex],
  );

  useEffect(() => {
    const node = immersive ? layoutRef.current : dialRef.current;
    if (!node || brands.length === 0) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (brands.length <= 1) return;

      const now = Date.now();
      const mouseWheel = isMouseWheel(event);

      if (mouseWheel) {
        if (now - wheelLastStepAt.current < WHEEL_MIN_STEP_MS_MOUSE) return;
        if (Math.abs(event.deltaY) < 1) return;
        step(event.deltaY > 0 ? 1 : -1, "scroll");
        wheelAccumulator.current = 0;
        wheelLastStepAt.current = now;
        return;
      }

      if (now - wheelLastStepAt.current < WHEEL_MIN_STEP_MS_TRACKPAD) return;

      let delta = event.deltaY;
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        delta *= 16;
      } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        delta *= window.innerHeight;
      }
      if (Math.abs(delta) < 2) return;

      wheelAccumulator.current += delta;

      if (wheelIdleTimer.current) window.clearTimeout(wheelIdleTimer.current);
      wheelIdleTimer.current = window.setTimeout(() => {
        wheelAccumulator.current = 0;
        wheelIdleTimer.current = null;
      }, WHEEL_IDLE_RESET_MS);

      if (Math.abs(wheelAccumulator.current) < WHEEL_STEP_THRESHOLD_TRACKPAD) return;

      const direction = wheelAccumulator.current > 0 ? 1 : -1;
      step(direction, "scroll");
      wheelAccumulator.current = 0;
      wheelLastStepAt.current = now;
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      node.removeEventListener("wheel", onWheel);
      if (wheelIdleTimer.current) window.clearTimeout(wheelIdleTimer.current);
    };
  }, [brands.length, immersive, step]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const nextKeys = narrow ? ["ArrowRight", "ArrowDown"] : ["ArrowDown", "ArrowRight"];
      const prevKeys = narrow ? ["ArrowLeft", "ArrowUp"] : ["ArrowUp", "ArrowLeft"];

      if (nextKeys.includes(event.key)) {
        event.preventDefault();
        step(1, "keyboard");
      } else if (prevKeys.includes(event.key)) {
        event.preventDefault();
        step(-1, "keyboard");
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [narrow, step]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dismissNavHint();
    if (brands.length <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      start: narrow ? event.clientX : event.clientY,
      startIndex: safeIndex,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;

    const current = narrow ? event.clientX : event.clientY;
    const delta = current - dragRef.current.start;
    const pxPerStep = narrow ? 40 : Math.max(48, geom.radius * 0.08);
    const offset = Math.round(-delta / pxPerStep);
    const next = clampIndex(dragRef.current.startIndex + offset, brands.length);

    if (next !== activeIndex) {
      goTo(next, "drag");
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const innerRadius = geom.radius - 14;
  const outerRadius = geom.radius + 10;
  const hub = polarToCartesian(geom.cx, geom.cy, geom.radius, geom.needleAngle);
  const needleTip = polarToCartesian(
    geom.cx,
    geom.cy,
    geom.radius + geom.tickLen * 1.75,
    geom.needleAngle,
  );
  const needleTail = polarToCartesian(
    geom.cx,
    geom.cy,
    geom.radius - geom.tickLen * 1.15,
    geom.needleAngle,
  );

  const layoutClass = [
    "brand-dial-layout",
    narrow ? "brand-dial-layout--mobile" : "",
    immersive ? "brand-dial-layout--immersive" : "",
    geomReady ? "brand-dial-layout--ready" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const stageStyle = {
    "--dial-aspect-w": geom.viewW,
    "--dial-aspect-h": geom.viewH,
  } as CSSProperties;

  const navHintAnchorPct = useMemo(() => {
    const anchor = navHintAnchor(geom, narrow);
    return {
      x: (anchor.x / geom.viewW) * 100,
      y: (anchor.y / geom.viewH) * 100,
    };
  }, [geom, narrow]);

  return (
    <section ref={layoutRef} className={layoutClass} aria-labelledby={labelId}>
      <div
        ref={dialRef}
        className="brand-dial"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-label="Sélectionner une marque"
        aria-valuemin={1}
        aria-valuemax={brands.length}
        aria-valuenow={panelIndex + 1}
        aria-valuetext={panelBrand?.name ?? ""}
        tabIndex={0}
      >
        <p id={labelId} className="brand-dial__sr-only">
          Faites défiler, glissez ou utilisez les flèches pour parcourir les marques.
        </p>

        <div className="brand-dial__stage" style={stageStyle}>
          <DialNavHint
            narrow={narrow}
            visible={navHintVisible && geomReady}
            anchorX={navHintAnchorPct.x}
            anchorY={navHintAnchorPct.y}
          />

          <svg
          className="brand-dial__svg"
          viewBox={`0 0 ${geom.viewW} ${geom.viewH}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          opacity={geomReady ? 1 : 0}
        >
          <path
            d={arcPathForGeom(geom, GHOST_SPAN_DEG, outerRadius)}
            className="brand-dial__track brand-dial__track--ghost"
            fill="none"
          />
          <path
            d={arcPathForGeom(geom, GHOST_SPAN_DEG, innerRadius)}
            className="brand-dial__track brand-dial__track--inner"
            fill="none"
          />
          <path
            d={arcPathForGeom(geom, ARC_SPAN_DEG)}
            className="brand-dial__track brand-dial__track--main"
            fill="none"
          />

          <g
            className="brand-dial__ring"
            transform={`rotate(${-rotationIndex * STEP_DEG} ${geom.cx} ${geom.cy})`}
          >
            {brands.map((brand, index) => {
              const displayAngle = notchAngle(index, rotationIndex, geom.needleAngle);
              if (!isNotchVisible(displayAngle, geom.needleAngle)) return null;

              const zone = notchZone(displayAngle, geom.needleAngle);
              const pos = polarToCartesian(
                geom.cx,
                geom.cy,
                geom.radius,
                geom.needleAngle + index * STEP_DEG,
              );
              const dist = Math.abs(displayAngle - geom.needleAngle);
              const fade =
                zone === "ghost"
                  ? Math.max(0.1, 0.35 - dist / GHOST_SPAN_DEG)
                  : Math.max(0.3, 1 - dist / (ARC_SPAN_DEG / 2 + STEP_DEG));
              const tickLen = zone === "ghost" ? geom.tickLen * 0.65 : geom.tickLen;
              const tickX = roundSvg(((geom.cx - pos.x) / geom.radius) * tickLen);
              const tickY = roundSvg(((geom.cy - pos.y) / geom.radius) * tickLen);
              const dotR = zone === "ghost" ? geom.notchR * 0.7 : geom.notchR;

              return (
                <g
                  key={brand.id}
                  className={`brand-dial__notch${zone === "ghost" ? " brand-dial__notch--ghost" : ""}`}
                  transform={`translate(${pos.x} ${pos.y})`}
                  opacity={fade}
                >
                  <circle r={dotR} className="brand-dial__dot" />
                  <line x1={0} y1={0} x2={tickX} y2={tickY} className="brand-dial__tick" />
                </g>
              );
            })}
          </g>

          <g className="brand-dial__needle">
            <line
              x1={needleTail.x}
              y1={needleTail.y}
              x2={needleTip.x}
              y2={needleTip.y}
              className="brand-dial__needle-shaft"
            />
            <circle cx={hub.x} cy={hub.y} r={geom.notchR + 2.5} className="brand-dial__needle-hub" />
            <circle cx={needleTip.x} cy={needleTip.y} r={2.5} className="brand-dial__needle-cap" />
          </g>
        </svg>
        </div>

        <p className="brand-dial__counter" aria-hidden="true">
          {panelIndex + 1}
          <span className="brand-dial__counter-sep">/</span>
          {brands.length}
        </p>
      </div>

      <div className="brand-dial-layout__panel">
        {panelBrand ? (
          <BrandDialPanel
            brand={panelBrand}
            index={panelIndex + 1}
            libraryTotal={totalLibrary}
            filteredTotal={totalFiltered}
            hasActiveFilters={hasActiveFilters}
          />
        ) : (
          <p className="brand-dial-panel__empty">Aucune marque</p>
        )}
      </div>
    </section>
  );
}
