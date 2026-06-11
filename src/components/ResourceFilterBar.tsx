"use client";

import { AnimatedCount } from "@/components/AnimatedCount";
import {
  RESOURCE_SORT_LABELS,
  type ResourceSortOption,
} from "@/lib/resource-filters";

interface ResourceFilterBarProps {
  categories: string[];
  origins?: string[];
  activeCategory: string;
  activeOrigin?: string;
  sort: ResourceSortOption;
  resultCount: number;
  hasActiveFilters: boolean;
  onCategoryChange: (value: string) => void;
  onOriginChange?: (value: string) => void;
  onSortChange: (value: ResourceSortOption) => void;
  onReset: () => void;
}

export function ResourceFilterBar({
  categories,
  origins,
  activeCategory,
  activeOrigin = "Tout",
  sort,
  resultCount,
  hasActiveFilters,
  onCategoryChange,
  onOriginChange,
  onSortChange,
  onReset,
}: ResourceFilterBarProps) {
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
        <p
          className="filter-bar__count filter-bar__count--results"
          aria-live="polite"
          aria-label={`${resultCount} résultat${resultCount !== 1 ? "s" : ""}`}
        >
          <AnimatedCount value={resultCount} />
        </p>

        <div className="filter-bar__selects">
          {origins && origins.length > 0 && onOriginChange && (
            <label className="filter-bar__field">
              <span className="filter-bar__field-label">Pays</span>
              <select
                value={activeOrigin}
                onChange={(e) => onOriginChange(e.target.value)}
                aria-label="Filtrer par pays"
              >
                <option value="Tout">Tous</option>
                {origins.map((origin) => (
                  <option key={origin} value={origin}>
                    {origin}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="filter-bar__field">
            <span className="filter-bar__field-label">Trier</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as ResourceSortOption)}
              aria-label="Trier les résultats"
            >
              {(Object.keys(RESOURCE_SORT_LABELS) as ResourceSortOption[]).map((key) => (
                <option key={key} value={key}>
                  {RESOURCE_SORT_LABELS[key]}
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
      </div>
    </div>
  );
}
