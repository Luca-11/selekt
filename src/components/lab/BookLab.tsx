"use client";

import Link from "next/link";
import HTMLFlipBook from "react-pageflip";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { fallbackBrands } from "@/lib/brands-fallback";
import type { Brand } from "@/types/brand";

const BRAND_IDS = ["1", "14", "19", "24", "28", "12", "4", "20"];
const BRANDS = BRAND_IDS.map((id) => fallbackBrands.find((b) => b.id === id)!).filter(Boolean);

type PageFlipInstance = {
  flipNext: (corner?: string) => void;
  flipPrev: (corner?: string) => void;
  getCurrentPageIndex: () => number;
  turnToPage: (page: number) => void;
};

type FlipBookHandle = {
  pageFlip: () => PageFlipInstance;
};

const BookPage = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(
  function BookPage({ children, className = "" }, ref) {
    return (
      <div className={`book-page ${className}`} ref={ref} data-density="soft">
        <div className="book-page__sheet">{children}</div>
      </div>
    );
  },
);

function BrandLeft({ brand, index, total }: { brand: Brand; index: number; total: number }) {
  return (
    <div className="paper-left">
      <div className="paper-left__top">
        <span className="paper-left__brand">Selekt</span>
        <span className="paper-left__page">
          {String(index + 1).padStart(2, "0")}
          <em> / {String(total).padStart(2, "0")}</em>
        </span>
      </div>

      <div className="paper-left__mid">
        <span className="paper-left__rule" style={{ background: brand.color }} />
        <p className="paper-left__where">{brand.origin}</p>
        <h2 className="paper-left__title">{brand.name}</h2>
        <p className="paper-left__meta">
          {brand.category} · {brand.price}
        </p>
      </div>

      <ul className="paper-left__tags">
        {brand.tags.slice(0, 3).map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    </div>
  );
}

function BrandRight({ brand, index }: { brand: Brand; index: number }) {
  const dark = brand.textOnImg === "dark";
  const layout = index % 3;

  return (
    <div
      className={`paper-right paper-right--l${layout}${dark ? " paper-right--ink" : ""}`}
      style={
        {
          "--c": brand.color,
          "--a": brand.accent,
          color: dark ? "#16130f" : "#f7f2eb",
        } as CSSProperties
      }
    >
      <div className="paper-right__field" aria-hidden="true" />
      <div className="paper-right__inner">
        <p className="paper-right__kicker">Note</p>
        <h1 className="paper-right__name">{brand.name}</h1>
        <p className="paper-right__text">{brand.desc}</p>
        <div className="paper-right__row">
          {brand.score > 0 && (
            <span className="paper-right__score">
              {brand.score}
              {brand.partial ? "+" : ""}
              <i>/{brand.maxScore}</i>
            </span>
          )}
          <a href={brand.url} target="_blank" rel="noopener noreferrer" className="paper-right__link">
            Visiter →
          </a>
        </div>
      </div>
    </div>
  );
}

const STACK_DEPTH = 3;
const INTRO_HOLD_MS = 1000;
const INTRO_OPEN_MS = 1700;

export function BookLab() {
  const bookRef = useRef<FlipBookHandle | null>(null);
  const [page, setPage] = useState(0);
  const [stackIndex, setStackIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [bookReady, setBookReady] = useState(false);
  const [intro, setIntro] = useState<"idle" | "opening" | "done">("idle");
  const animating = useRef(false);
  const introLock = intro !== "done";
  const showIntro = intro !== "done";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fallback = window.setTimeout(() => setBookReady(true), 2000);
    return () => window.clearTimeout(fallback);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !bookReady) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setIntro("done");
      return;
    }

    if (intro === "idle") {
      const open = window.setTimeout(() => setIntro("opening"), INTRO_HOLD_MS);
      return () => window.clearTimeout(open);
    }

    if (intro === "opening") {
      const done = window.setTimeout(() => setIntro("done"), INTRO_OPEN_MS);
      return () => window.clearTimeout(done);
    }
  }, [mounted, bookReady, intro]);

  const brandIndex = Math.min(Math.floor(page / 2), BRANDS.length - 1);
  const lastSpreadStart = (BRANDS.length - 1) * 2;
  const active = BRANDS[brandIndex];

  const prevSlots = useMemo(
    () =>
      Array.from({ length: STACK_DEPTH }, (_, slot) => {
        const i = stackIndex - 1 - slot;
        return i >= 0 ? BRANDS[i] : null;
      }),
    [stackIndex],
  );

  const nextSlots = useMemo(
    () =>
      Array.from({ length: STACK_DEPTH }, (_, slot) => {
        const i = stackIndex + 1 + slot;
        return i < BRANDS.length ? BRANDS[i] : null;
      }),
    [stackIndex],
  );

  const getFlip = useCallback((): PageFlipInstance | null => {
    try {
      return bookRef.current?.pageFlip?.() ?? null;
    } catch {
      return null;
    }
  }, []);

  const goToBrand = useCallback(
    (i: number) => {
      if (introLock) return;
      const api = getFlip();
      if (!api || animating.current) return;
      const current = Math.floor(api.getCurrentPageIndex() / 2);
      if (i === current) return;
      setStackIndex(i);
      if (i === current + 1) {
        api.flipNext("top");
        return;
      }
      if (i === current - 1) {
        api.flipPrev("top");
        return;
      }
      if (i > current) {
        api.turnToPage((i - 1) * 2);
        window.requestAnimationFrame(() => getFlip()?.flipNext("top"));
      } else {
        api.turnToPage((i + 1) * 2);
        window.requestAnimationFrame(() => getFlip()?.flipPrev("top"));
      }
    },
    [getFlip, introLock],
  );

  const next = useCallback(() => {
    if (introLock || animating.current) return;
    const api = getFlip();
    if (!api) return;
    const current = Math.floor(api.getCurrentPageIndex() / 2);
    if (current >= BRANDS.length - 1) return;
    setStackIndex(current + 1);
    api.flipNext("top");
  }, [getFlip, introLock]);

  const prev = useCallback(() => {
    if (introLock || animating.current) return;
    const api = getFlip();
    if (!api) return;
    const current = Math.floor(api.getCurrentPageIndex() / 2);
    if (current <= 0) return;
    setStackIndex(current - 1);
    api.flipPrev("top");
  }, [getFlip, introLock]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const pages = useMemo(
    () =>
      BRANDS.flatMap((brand, i) => [
        <BookPage key={`${brand.id}-L`} className="book-page--left">
          <BrandLeft brand={brand} index={i} total={BRANDS.length} />
        </BookPage>,
        <BookPage key={`${brand.id}-R`} className="book-page--right">
          <BrandRight brand={brand} index={i} />
        </BookPage>,
      ]),
    [],
  );

  if (!mounted) {
    return (
      <div className="paper-lab">
        <div className="paper-lab__loading">…</div>
      </div>
    );
  }

  return (
    <div className={`paper-lab${intro === "done" ? " is-ready" : ""}`}>
      <header className="paper-lab__bar">
        <Link href="/" className="paper-lab__logo">
          Selekt
        </Link>
        <p className="paper-lab__count">{BRANDS.length} pages</p>
      </header>

      <div className={`paper-stage${showIntro ? " has-intro" : ""}`}>
        <div className="paper-stage__shadow" aria-hidden="true" />

        {showIntro && (
          <div
            className={`paper-intro paper-intro--${intro}`}
            aria-hidden="true"
            style={{ ["--intro-c" as string]: BRANDS[0]?.color ?? "#1a1612" }}
          >
            <div className="paper-intro__rig">
              <div className="paper-intro__pages">
                <div className="paper-intro__leaf paper-intro__leaf--left">
                  <span className="paper-intro__leaf-brand">Selekt</span>
                  <span className="paper-intro__leaf-title">{BRANDS[0]?.name}</span>
                  <span className="paper-intro__leaf-meta">
                    {BRANDS[0]?.origin} · {BRANDS[0]?.category}
                  </span>
                </div>
                <div className="paper-intro__leaf paper-intro__leaf--right" />
                <span className="paper-intro__edge" />
              </div>
              <div className="paper-intro__cover">
                <div className="paper-intro__face">
                  <p className="paper-intro__eyebrow">Curated independents</p>
                  <p className="paper-intro__brand">Selekt</p>
                  <p className="paper-intro__sub">Lookbook</p>
                  <span className="paper-intro__mark" />
                </div>
                <div className="paper-intro__inside" />
              </div>
            </div>
          </div>
        )}

        <div
          className={`paper-shell${intro === "idle" ? " is-waiting" : ""}${intro === "opening" ? " is-revealing" : ""}${intro === "done" ? " is-open" : ""}`}
        >
          <div className="paper-stack paper-stack--prev" aria-hidden="true">
            {prevSlots.map((brand, slot) => (
              <span
                key={`prev-${slot}`}
                className={`paper-stack__blade${brand && intro === "done" ? " is-on" : ""}`}
                style={
                  {
                    ["--c" as string]: brand?.color ?? "transparent",
                    ["--i" as string]: slot,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <div className="paper-stack paper-stack--next" aria-hidden="true">
            {nextSlots.map((brand, slot) => (
              <span
                key={`next-${slot}`}
                className={`paper-stack__blade${brand && intro === "done" ? " is-on" : ""}`}
                style={
                  {
                    ["--c" as string]: brand?.color ?? "transparent",
                    ["--i" as string]: slot,
                  } as CSSProperties
                }
              />
            ))}
          </div>

          <HTMLFlipBook
            ref={bookRef as never}
            className="paper-book"
            style={{ margin: "0 auto" }}
            width={360}
            height={480}
            size="stretch"
            minWidth={260}
            maxWidth={420}
            minHeight={360}
            maxHeight={560}
            showCover={false}
            usePortrait={false}
            drawShadow
            maxShadowOpacity={0.4}
            flippingTime={1100}
            useMouseEvents={!introLock}
            showPageCorners={!introLock}
            disableFlipByClick={introLock}
            swipeDistance={28}
            mobileScrollSupport
            clickEventForward
            startPage={0}
            autoSize
            startZIndex={0}
            onInit={() => {
              setBookReady(true);
            }}
            onFlip={(e: { data: number }) => {
              animating.current = false;
              const idx = Math.min(Math.floor(e.data / 2), BRANDS.length - 1);
              setPage(e.data);
              setStackIndex(idx);
            }}
            onChangeState={(e: { data: string }) => {
              animating.current = e.data === "flipping" || e.data === "user_fold";
            }}
          >
            {pages}
          </HTMLFlipBook>
        </div>
      </div>

      <div className="paper-controls">
        <button
          type="button"
          className="paper-controls__btn"
          onClick={prev}
          disabled={introLock || page <= 0}
          aria-label="Précédent"
        >
          −
        </button>

        <div className="paper-dots" role="tablist" aria-label="Marques">
          {BRANDS.map((brand, i) => (
            <button
              key={brand.id}
              type="button"
              role="tab"
              aria-selected={i === brandIndex}
              aria-label={brand.name}
              className={`paper-dots__item${i === brandIndex ? " is-active" : ""}`}
              onClick={() => goToBrand(i)}
              disabled={introLock}
              style={i === brandIndex ? ({ ["--dot" as string]: brand.color } as CSSProperties) : undefined}
            />
          ))}
        </div>

        <button
          type="button"
          className="paper-controls__btn"
          onClick={next}
          disabled={introLock || page >= lastSpreadStart}
          aria-label="Suivant"
        >
          +
        </button>
      </div>

      <p className="paper-lab__caption">{active.name}</p>
    </div>
  );
}
