"use client";

import { useEffect } from "react";
import { AnimatedCount } from "@/components/AnimatedCount";
import { TransitionLink } from "@/components/TransitionLink";
import { SORT_LABELS, type SortOption } from "@/lib/brand-filters";

interface DialFilterSheetProps {
  open: boolean;
  onClose: () => void;
  categories: string[];
  countries: string[];
  activeCategory: string;
  activeCountry: string;
  sort: SortOption;
  search: string;
  resultCount: number;
  libraryCount: number;
  hasActiveFilters: boolean;
  onCategoryChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

export function DialFilterSheet({
  open,
  onClose,
  categories,
  countries,
  activeCategory,
  activeCountry,
  sort,
  search,
  resultCount,
  libraryCount,
  hasActiveFilters,
  onCategoryChange,
  onCountryChange,
  onSortChange,
  onSearchChange,
  onReset,
}: DialFilterSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        className={`dial-filter-sheet__backdrop${open ? " dial-filter-sheet__backdrop--open" : ""}`}
        onClick={onClose}
        aria-label="Fermer les filtres"
        tabIndex={open ? 0 : -1}
      />

      <aside
        className={`dial-filter-sheet${open ? " dial-filter-sheet--open" : ""}`}
        aria-hidden={!open}
        aria-label="Filtres"
      >
        <div className="dial-filter-sheet__head">
          <div>
            <h2 className="dial-filter-sheet__title">Affiner</h2>
            <p className="dial-filter-sheet__count">
              <AnimatedCount value={resultCount} />
              <span> / {libraryCount} marques</span>
            </p>
          </div>
          <button type="button" className="dial-filter-sheet__close" onClick={onClose}>
            Fermer
          </button>
        </div>

        <label className="dial-filter-sheet__search">
          <span className="dial-filter-sheet__label">Recherche</span>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nom, tag, pays…"
            aria-label="Rechercher une marque"
          />
        </label>

        <div className="dial-filter-sheet__block">
          <span className="dial-filter-sheet__label">Catégorie</span>
          <div className="dial-filter-sheet__pills" role="group" aria-label="Catégorie">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter${activeCategory === cat ? " filter--active" : ""}`}
                onClick={() => onCategoryChange(cat)}
                aria-pressed={activeCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {countries.length > 0 && (
          <label className="dial-filter-sheet__field">
            <span className="dial-filter-sheet__label">Pays</span>
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

        <label className="dial-filter-sheet__field">
          <span className="dial-filter-sheet__label">Trier</span>
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

        <div className="dial-filter-sheet__foot">
          {hasActiveFilters && (
            <button type="button" className="dial-filter-sheet__reset" onClick={onReset}>
              Réinitialiser
            </button>
          )}
          <TransitionLink href="/a-propos" className="dial-filter-sheet__about" onClick={onClose}>
            Notes sur les scores
          </TransitionLink>
        </div>
      </aside>
    </>
  );
}
