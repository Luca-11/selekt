import type { CSSProperties } from "react";
import type { Brand } from "@/types/brand";
import { BrandImage } from "@/components/BrandImage";
import { BrandSocialLinks } from "@/components/BrandSocialLinks";
import { formatUpdatedAt } from "@/lib/format-date";
import { formatPriceShort } from "@/lib/price-tier";
import { scoreColor } from "@/lib/score";

interface BrandDialPanelProps {
  brand: Brand;
  index: number;
  libraryTotal: number;
  filteredTotal: number;
  hasActiveFilters: boolean;
}

export function BrandDialPanel({
  brand,
  index,
  libraryTotal,
  filteredTotal,
  hasActiveFilters,
}: BrandDialPanelProps) {
  const updatedLabel = formatUpdatedAt(brand.updatedAt);
  const scoreTint = scoreColor(brand.score, brand.maxScore);
  const hasUrl = Boolean(brand.url && brand.url !== "#");

  const panelStyle = {
    "--brand-accent": brand.accent,
    "--brand-color": brand.color,
  } as CSSProperties;

  return (
    <article className="brand-dial-panel" style={panelStyle}>
      <div className="brand-dial-panel__editorial" aria-label={`Marque ${index} sur ${libraryTotal}`}>
        <span className="brand-dial-panel__editorial-index">{String(index).padStart(3, "0")}</span>
        <span className="brand-dial-panel__editorial-sep">/</span>
        <span className="brand-dial-panel__editorial-total">{String(libraryTotal).padStart(3, "0")}</span>
        <span className="brand-dial-panel__editorial-label">marques</span>
      </div>

      {hasActiveFilters && filteredTotal !== libraryTotal && (
        <p className="brand-dial-panel__filter-hint">
          {filteredTotal} résultat{filteredTotal !== 1 ? "s" : ""} après filtres
        </p>
      )}

      <header className="brand-dial-panel__header">
        <div className="brand-dial-panel__score" style={{ color: scoreTint }}>
          <span className="brand-dial-panel__score-value">
            {brand.score}/{brand.maxScore}
          </span>
          {brand.partial && <span className="brand-dial-panel__partial">partiel</span>}
        </div>
      </header>

      <div className="brand-dial-panel__visual">
        {hasUrl ? (
          <a
            href={brand.url}
            target="_blank"
            rel="noopener noreferrer"
            className="brand-dial-panel__visual-link"
            aria-label={`Visiter ${brand.name}`}
          >
            <BrandImage brand={brand} />
          </a>
        ) : (
          <BrandImage brand={brand} />
        )}
      </div>

      <div className="brand-dial-panel__body">
        <div className="brand-dial-panel__meta">
          <h2 className="brand-dial-panel__name">{brand.name}</h2>
          <p className="brand-dial-panel__sub">
            {brand.origin} · {brand.category} · {formatPriceShort(brand.price)}
          </p>
        </div>

        <p className="brand-dial-panel__desc">{brand.desc}</p>
        {brand.actu && <p className="brand-dial-panel__actu">{brand.actu}</p>}

        <div className="brand-dial-panel__tags">
          {brand.tags.map((tag) => (
            <span key={tag} className="brand-dial-panel__tag">
              {tag}
            </span>
          ))}
        </div>

        {updatedLabel && <p className="brand-dial-panel__updated">Maj. {updatedLabel}</p>}

        {hasUrl && (
          <a
            href={brand.url}
            target="_blank"
            rel="noopener noreferrer"
            className="brand-dial-panel__visit"
          >
            Visiter le site ↗
          </a>
        )}
      </div>

      {brand.social && <BrandSocialLinks social={brand.social} brandName={brand.name} />}
    </article>
  );
}
