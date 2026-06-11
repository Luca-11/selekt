"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { curtainLabelForHref } from "@/lib/curtain-label";

type Phase = "idle" | "entering" | "exiting";

interface PageTransitionContextValue {
  navigate: (href: string) => void;
}

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

const REVEAL_FALLBACK_MS = 1800;

function normalizePath(href: string): string {
  return href.split("#")[0] || "/";
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [curtainLabel, setCurtainLabel] = useState("Selekt");
  const targetHrefRef = useRef<string | null>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const enterDoneRef = useRef(false);
  const routeReadyRef = useRef(false);

  const tryReveal = useCallback(() => {
    if (phase === "exiting" || phase === "idle") return;
    if (!enterDoneRef.current || !routeReadyRef.current) return;
    if (!targetHrefRef.current) return;

    requestAnimationFrame(() => setPhase("exiting"));
  }, [phase]);

  const navigate = useCallback(
    (href: string) => {
      if (phase !== "idle") return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        router.push(href);
        return;
      }

      const targetPath = normalizePath(href);
      const currentPath = normalizePath(pathname);
      if (targetPath === currentPath) return;

      targetHrefRef.current = href;
      enterDoneRef.current = false;
      routeReadyRef.current = false;
      setCurtainLabel(curtainLabelForHref(href));
      setPhase("entering");
      router.push(href);
    },
    [phase, pathname, router],
  );

  useEffect(() => {
    document.documentElement.toggleAttribute("data-page-transition", phase !== "idle");
    return () => document.documentElement.removeAttribute("data-page-transition");
  }, [phase]);

  useEffect(() => {
    if (!targetHrefRef.current) return;

    const targetPath = normalizePath(targetHrefRef.current);
    const currentPath = normalizePath(pathname);

    if (currentPath === targetPath) {
      routeReadyRef.current = true;
      tryReveal();
    }
  }, [pathname, tryReveal]);

  useEffect(() => {
    if (phase !== "entering") return;

    const curtain = curtainRef.current;
    if (!curtain) return;

    const onEnterEnd = (event: TransitionEvent) => {
      if (event.target !== curtain || event.propertyName !== "transform") return;
      enterDoneRef.current = true;
      tryReveal();
    };

    const fallback = window.setTimeout(() => {
      enterDoneRef.current = true;
      tryReveal();
    }, 300);

    curtain.addEventListener("transitionend", onEnterEnd);
    return () => {
      curtain.removeEventListener("transitionend", onEnterEnd);
      window.clearTimeout(fallback);
    };
  }, [phase, tryReveal]);

  useEffect(() => {
    if (phase !== "entering") return;

    const fallback = window.setTimeout(() => {
      routeReadyRef.current = true;
      tryReveal();
    }, REVEAL_FALLBACK_MS);

    return () => window.clearTimeout(fallback);
  }, [phase, tryReveal]);

  useEffect(() => {
    if (phase !== "exiting") return;

    const curtain = curtainRef.current;
    if (!curtain) return;

    const finish = () => {
      setPhase("idle");
      targetHrefRef.current = null;
      enterDoneRef.current = false;
      routeReadyRef.current = false;
    };

    const onExitEnd = (event: TransitionEvent) => {
      if (event.target !== curtain || event.propertyName !== "transform") return;
      finish();
    };

    const fallback = window.setTimeout(finish, 320);

    curtain.addEventListener("transitionend", onExitEnd);
    return () => {
      curtain.removeEventListener("transitionend", onExitEnd);
      window.clearTimeout(fallback);
    };
  }, [phase]);

  return (
    <PageTransitionContext.Provider value={{ navigate }}>
      {children}
      <div
        ref={curtainRef}
        className={`page-curtain page-curtain--${phase}`}
        aria-hidden="true"
      >
        <span className="page-curtain__label" key={curtainLabel}>
          {curtainLabel}
        </span>
      </div>
    </PageTransitionContext.Provider>
  );
}

export function usePageTransition(): PageTransitionContextValue {
  const context = useContext(PageTransitionContext);
  const router = useRouter();

  if (!context) {
    return {
      navigate: (href: string) => router.push(href),
    };
  }

  return context;
}
