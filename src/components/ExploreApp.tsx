"use client";

import { useMemo, useState } from "react";
import type { ExploreResource } from "@/types/resource";
import { ExploreSection } from "@/components/ExploreSection";
import { HeroTitle } from "@/components/HeroTitle";
import { AppChrome } from "@/components/AppChrome";
import { ResourceCard } from "@/components/ResourceCard";
import { ResourceFilterBar } from "@/components/ResourceFilterBar";
import { SiteFooter } from "@/components/SiteFooter";
import {
  buildResourceCategories,
  buildResourceOrigins,
  filterResources,
  sortResources,
  type ResourceSortOption,
} from "@/lib/resource-filters";
import type { DataSource } from "@/lib/get-resources";

interface ExploreAppProps {
  resources: ExploreResource[];
  source: DataSource;
  variant: "retailer" | "account";
}

const COPY = {
  retailer: {
    title: "Où chercher.",
    subtitle: "Revendeurs de confiance pour retrouver des pièces vues en ligne ou explorer de nouvelles références.",
    searchLabel: "Rechercher un revendeur",
    emptyTitle: "Aucun revendeur trouvé",
    emptyHint: "Essaie un autre filtre ou un mot-clé différent.",
    emptyAction: "Voir tous les revendeurs",
    teaserTitle: "Bibliothèque en construction",
    teaserText:
      "Cette section recense les enseignes où je cherche en premier quand je repère une pièce — streetwear, sneakers, créateurs.",
  },
  account: {
    title: "Qui suivre.",
    subtitle: "Médias, créateurs et comptes utiles pour développer sa culture mode et rester informé.",
    searchLabel: "Rechercher un compte",
    emptyTitle: "Aucun compte trouvé",
    emptyHint: "Essaie un autre filtre ou un mot-clé différent.",
    emptyAction: "Voir tous les comptes",
    teaserTitle: "Veille mode",
    teaserText:
      "Au-delà des marques, une grande partie de la découverte passe par les créateurs de contenu — voici ceux que je recommande.",
  },
} as const;

export function ExploreApp({ resources, source, variant }: ExploreAppProps) {
  const copy = COPY[variant];
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [originFilter, setOriginFilter] = useState("Tout");
  const [sort, setSort] = useState<ResourceSortOption>("name");
  const [search, setSearch] = useState("");

  const categories = useMemo(() => buildResourceCategories(resources), [resources]);
  const origins = useMemo(
    () => (variant === "retailer" ? buildResourceOrigins(resources) : []),
    [resources, variant],
  );

  const filtered = useMemo(() => {
    const matched = filterResources(resources, {
      category: activeFilter,
      origin: variant === "retailer" ? originFilter : undefined,
      search,
    });
    return sortResources(matched, sort);
  }, [resources, activeFilter, originFilter, search, sort, variant]);

  const hasActiveFilters =
    activeFilter !== "Tout" ||
    (variant === "retailer" && originFilter !== "Tout") ||
    search.trim().length > 0;

  function resetFilters() {
    setActiveFilter("Tout");
    setOriginFilter("Tout");
    setSearch("");
  }

  const searchField = (
    <label className="search">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="search__icon"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Chercher…"
        aria-label={copy.searchLabel}
      />
      {search && (
        <button
          type="button"
          className="search__clear"
          onClick={() => setSearch("")}
          aria-label="Effacer la recherche"
        >
          ×
        </button>
      )}
    </label>
  );

  return (
    <div className="app app--browse">
      <AppChrome variant="browse" search={searchField} />

      <main className="main main--browse">
        <div className="hero">
          <HeroTitle lines={[copy.title]} />
          <p className="hero__lead">
            {copy.subtitle} — {resources.length} entrée{resources.length !== 1 ? "s" : ""}.
            {source === "fallback" && (
              <span className="hero__hint"> · Données locales (Notion non branché)</span>
            )}
          </p>
        </div>

        <ExploreSection title={copy.teaserTitle} text={copy.teaserText} variant={variant} />

        <ResourceFilterBar
          categories={categories}
          origins={variant === "retailer" ? origins : undefined}
          activeCategory={activeFilter}
          activeOrigin={originFilter}
          sort={sort}
          resultCount={filtered.length}
          hasActiveFilters={hasActiveFilters}
          onCategoryChange={setActiveFilter}
          onOriginChange={variant === "retailer" ? setOriginFilter : undefined}
          onSortChange={setSort}
          onReset={resetFilters}
        />

        <div className="cards">
          {filtered.length === 0 ? (
            <div className="empty">
              <p className="empty__title">{copy.emptyTitle}</p>
              <p className="empty__hint">{copy.emptyHint}</p>
              {hasActiveFilters && (
                <button type="button" className="empty__action" onClick={resetFilters}>
                  {copy.emptyAction}
                </button>
              )}
            </div>
          ) : (
            filtered.map((resource, index) => (
              <ResourceCard key={resource.id} resource={resource} index={index + 1} />
            ))
          )}
        </div>
      </main>

      <SiteFooter variant="explore" />
    </div>
  );
}
