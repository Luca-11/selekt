"use client";

import Link from "next/link";
import {
  SORT_LABELS,
  type SortOption,
} from "@/lib/brand-filters";

interface FilterBarProps {
  categories: string[];
  countries: string[];
  activeCategory: string;
  activeCountry: string;
  sort: SortOption;
  resultCount: number;
  hasActiveFilters: boolean;
  onCategoryChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onReset: () => void;
}

export function FilterBar({
  categories,
  countries,
  activeCategory,
  activeCountry,
  sort,
  resultCount,
  hasActiveFilters,
  onCategoryChange,
  onCountryChange,
  onSortChange,
  onReset,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="filter-bar__categories-wrap">
        <div className="filter-bar__categories" role="group" aria-label="Catégorie">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter ${activeCategory === cat ? "filter--active" : ""}`}
              onClick={() => onCategoryChange(cat)}
              aria-pressed={activeCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-bar__controls">
        <p className="filter-bar__count" aria-live="polite">
          {resultCount} marque{resultCount !== 1 ? "s" : ""}
        </p>

        <div className="filter-bar__selects">
          {countries.length > 0 && (
            <label className="filter-bar__field">
              Pays
              <select
                value={activeCountry}
                onChange={(e) => onCountryChange(e.target.value)}
                aria-label="Filtrer par pays"
              >
                <option value="Tout">Tous</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="filter-bar__field">
            Trier
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Trier les marques"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hasActiveFilters && (
          <button type="button" className="filter-bar__reset" onClick={onReset}>
            Réinitialiser
          </button>
        )}

        <Link href="/a-propos" className="filter-bar__about-link">
          Notes ?
        </Link>
      </div>
    </div>
  );
}
