"use client";

import { useMemo, useState } from "react";
import type { Brand } from "@/types/brand";
import { AboutSection } from "@/components/AboutSection";
import { BrandCard } from "@/components/BrandCard";
import { FilterBar } from "@/components/FilterBar";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  buildCategories,
  buildCountries,
  filterBrands,
  sortBrands,
  type SortOption,
} from "@/lib/brand-filters";

interface SelektAppProps {
  brands: Brand[];
  source: "notion" | "fallback";
}

export function SelektApp({ brands, source }: SelektAppProps) {
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [countryFilter, setCountryFilter] = useState("Tout");
  const [sort, setSort] = useState<SortOption>("score-desc");
  const [search, setSearch] = useState("");

  const categories = useMemo(() => buildCategories(brands), [brands]);
  const countries = useMemo(() => buildCountries(brands), [brands]);

  const filtered = useMemo(() => {
    const matched = filterBrands(brands, {
      category: activeFilter,
      country: countryFilter,
      search,
    });
    return sortBrands(matched, sort);
  }, [brands, activeFilter, countryFilter, search, sort]);

  const hasActiveFilters =
    activeFilter !== "Tout" || countryFilter !== "Tout" || search.trim().length > 0;

  function resetFilters() {
    setActiveFilter("Tout");
    setCountryFilter("Tout");
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
  );

  return (
    <div className="app">
      <PublicHeader showSearch search={searchField} />

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

        <AboutSection />

        <FilterBar
          categories={categories}
          countries={countries}
          activeCategory={activeFilter}
          activeCountry={countryFilter}
          sort={sort}
          resultCount={filtered.length}
          hasActiveFilters={hasActiveFilters}
          onCategoryChange={setActiveFilter}
          onCountryChange={setCountryFilter}
          onSortChange={setSort}
          onReset={resetFilters}
        />

        <div className="cards" key={`${activeFilter}-${countryFilter}-${search.trim()}-${sort}`}>
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

      <SiteFooter />
    </div>
  );
}
