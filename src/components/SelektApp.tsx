"use client";

import { useMemo, useState } from "react";
import type { Brand } from "@/types/brand";
import { buildCategories } from "@/lib/brands-fallback";
import { BrandCard } from "@/components/BrandCard";

interface SelektAppProps {
  brands: Brand[];
  source: "notion" | "fallback";
}

export function SelektApp({ brands, source }: SelektAppProps) {
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [search, setSearch] = useState("");
  const categories = useMemo(() => buildCategories(brands), [brands]);

  const filtered = brands.filter((brand) => {
    const matchCat =
      activeFilter === "Tout" ||
      brand.category === activeFilter ||
      (activeFilter === "FR" && brand.origin.toUpperCase().includes("FR"));
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      brand.name.toLowerCase().includes(q) ||
      brand.desc.toLowerCase().includes(q) ||
      brand.tags.some((t) => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const hasActiveFilters = activeFilter !== "Tout" || search.trim().length > 0;

  function resetFilters() {
    setActiveFilter("Tout");
    setSearch("");
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header__inner">
          <div className="logo">Selekt</div>
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
              placeholder="Chercher une marque..."
              aria-label="Rechercher une marque"
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
        </div>
      </header>

      <main className="main">
        <div className="hero">
          <h1>
            Des marques qui méritent
            <br />
            votre attention.
          </h1>
          <p>
            Une curation personnelle — {brands.length} marques, aucune fast fashion.
            {source === "fallback" && (
              <span className="hero__hint"> · Données locales (Notion non branché)</span>
            )}
          </p>
        </div>

        <div className="filters" role="group" aria-label="Filtrer par catégorie">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter ${activeFilter === cat ? "filter--active" : ""}`}
              onClick={() => setActiveFilter(cat)}
              aria-pressed={activeFilter === cat}
            >
              {cat}
            </button>
          ))}
          {!categories.includes("FR") && (
            <button
              type="button"
              className={`filter ${activeFilter === "FR" ? "filter--active" : ""}`}
              onClick={() => setActiveFilter("FR")}
              aria-pressed={activeFilter === "FR"}
            >
              FR
            </button>
          )}
        </div>

        <p className="results-meta" aria-live="polite">
          <span className="results-meta__count">
            {filtered.length} marque{filtered.length !== 1 ? "s" : ""}
          </span>
          {hasActiveFilters && (
            <button type="button" className="results-meta__reset" onClick={resetFilters}>
              Réinitialiser
            </button>
          )}
        </p>

        <div className="cards" key={`${activeFilter}-${search.trim()}`}>
          {filtered.length === 0 ? (
            <div className="empty">
              <p className="empty__title">Aucune marque trouvée</p>
              <p className="empty__hint">Essaie un autre filtre ou un mot-clé différent.</p>
              {hasActiveFilters && (
                <button type="button" className="empty__action" onClick={resetFilters}>
                  Voir toutes les marques
                </button>
              )}
            </div>
          ) : (
            filtered.map((brand) => <BrandCard key={brand.id} brand={brand} />)
          )}
        </div>
      </main>

      <footer className="footer">selekt — curation indépendante</footer>
    </div>
  );
}
