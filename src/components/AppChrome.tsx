"use client";

import { useEffect, useRef } from "react";
import { SiteNav } from "@/components/SiteNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TransitionLink } from "@/components/TransitionLink";

interface AppChromeProps {
  variant?: "immersive" | "browse";
  onOpenFilters?: () => void;
  filtersActive?: boolean;
  libraryCount?: number;
  search?: React.ReactNode;
}

const SIGNAL_DURATION_MS = 12_000;

export function AppChrome({
  variant = "immersive",
  onOpenFilters,
  filtersActive = false,
  libraryCount,
  search,
}: AppChromeProps) {
  const clickTimestamps = useRef<number[]>([]);
  const signalTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (signalTimeout.current) window.clearTimeout(signalTimeout.current);
      document.documentElement.removeAttribute("data-signal-on");
    };
  }, []);

  function handleLogoClick() {
    const now = Date.now();
    clickTimestamps.current = clickTimestamps.current.filter((t) => now - t < 2000);
    clickTimestamps.current.push(now);
    if (clickTimestamps.current.length < 5) return;

    clickTimestamps.current = [];
    document.documentElement.setAttribute("data-signal-on", "");
    if (signalTimeout.current) window.clearTimeout(signalTimeout.current);
    signalTimeout.current = window.setTimeout(() => {
      document.documentElement.removeAttribute("data-signal-on");
      signalTimeout.current = null;
    }, SIGNAL_DURATION_MS);
  }

  return (
    <header className={`app-chrome app-chrome--${variant}`}>
      <div className="app-chrome__start">
        <TransitionLink
          href="/"
          className="app-chrome__brand"
          onClick={handleLogoClick}
          aria-label="Selekt"
        >
          <span className="logo" aria-hidden="true">
            <span className="logo__mark" aria-hidden="true">
              <span className="logo__chip" />
              <span className="logo__letter">S</span>
            </span>
            <span className="logo__word">elekt</span>
          </span>
        </TransitionLink>

        {variant === "immersive" && libraryCount != null && (
          <p className="app-chrome__library" aria-hidden="true">
            <span className="app-chrome__library-count">{libraryCount}</span> marques
          </p>
        )}

        <SiteNav />
      </div>

      <div className="app-chrome__actions">
        {search}
        {onOpenFilters && (
          <button
            type="button"
            className={`app-chrome__filter${filtersActive ? " app-chrome__filter--active" : ""}`}
            onClick={onOpenFilters}
            aria-label="Ouvrir les filtres"
          >
            Filtres
            {filtersActive && <span className="app-chrome__filter-dot" aria-hidden="true" />}
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
