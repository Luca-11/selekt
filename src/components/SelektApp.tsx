"use client";

import { useEffect, useMemo, useState } from "react";
import type { Brand } from "@/types/brand";
import { AppChrome } from "@/components/AppChrome";
import { BrandDial } from "@/components/BrandDial";
import { DialFilterSheet } from "@/components/DialFilterSheet";
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

export function SelektApp({ brands }: SelektAppProps) {
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [countryFilter, setCountryFilter] = useState("Tout");
  const [sort, setSort] = useState<SortOption>("score-desc");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const filterKey = `${activeFilter}-${countryFilter}-${search.trim()}-${sort}`;

  function resetFilters() {
    setActiveFilter("Tout");
    setCountryFilter("Tout");
    setSearch("");
  }

  useEffect(() => {
    document.documentElement.classList.add("immersive-dial");
    return () => document.documentElement.classList.remove("immersive-dial");
  }, []);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-filter-sheet-open", filtersOpen);
    return () => document.documentElement.removeAttribute("data-filter-sheet-open");
  }, [filtersOpen]);

  return (
    <div className="app app--immersive">
      <AppChrome
        variant="immersive"
        libraryCount={brands.length}
        filtersActive={hasActiveFilters}
        onOpenFilters={() => setFiltersOpen(true)}
      />

      <DialFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        categories={categories}
        countries={countries}
        activeCategory={activeFilter}
        activeCountry={countryFilter}
        sort={sort}
        search={search}
        resultCount={filtered.length}
        libraryCount={brands.length}
        hasActiveFilters={hasActiveFilters}
        onCategoryChange={setActiveFilter}
        onCountryChange={setCountryFilter}
        onSortChange={setSort}
        onSearchChange={setSearch}
        onReset={resetFilters}
      />

      {filtered.length === 0 ? (
        <div className="dial-empty-state">
          <p className="empty__title">Aucune marque trouvée</p>
          <p className="empty__hint">Essaie un autre filtre ou un mot-clé différent.</p>
          {hasActiveFilters && (
            <button type="button" className="empty__action" onClick={resetFilters}>
              Réinitialiser
            </button>
          )}
        </div>
      ) : (
        <BrandDial
          key={filterKey}
          brands={filtered}
          libraryTotal={brands.length}
          filteredTotal={filtered.length}
          hasActiveFilters={hasActiveFilters}
          immersive
        />
      )}
    </div>
  );
}
