import type { Brand } from "@/types/brand";
import { formatPriceShort } from "@/lib/price-tier";
import { BrandImage } from "@/components/BrandImage";
import { BrandSocialLinks } from "@/components/BrandSocialLinks";
import { ScoreRing } from "@/components/ScoreRing";

interface BrandCardProps {
  brand: Brand;
}

export function BrandCard({ brand }: BrandCardProps) {
  const className = "brand-card";

  const main = (
    <>
      <BrandImage brand={brand} />
      <div className="brand-card__body">
        <div className="brand-card__content">
          <p className="brand-card__desc">{brand.desc}</p>
          {brand.actu && <p className="brand-card__actu">{brand.actu}</p>}
          <div className="brand-card__tags">
            {brand.tags.map((tag) => (
              <span key={tag} className="brand-card__tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="brand-card__aside">
          <ScoreRing score={brand.score} max={brand.maxScore} partial={brand.partial} />
          <span className="brand-card__price">{formatPriceShort(brand.price)}</span>
        </div>
      </div>
      {brand.url && brand.url !== "#" && (
        <span className="brand-card__external" aria-hidden="true">
          ↗
        </span>
      )}
    </>
  );

  return (
    <article className={className}>
      {brand.url && brand.url !== "#" ? (
        <a
          href={brand.url}
          target="_blank"
          rel="noopener noreferrer"
          className="brand-card__main"
          aria-label={`Visiter ${brand.name} (nouvel onglet)`}
        >
          {main}
        </a>
      ) : (
        <div className="brand-card__main">{main}</div>
      )}
      {brand.social && <BrandSocialLinks social={brand.social} brandName={brand.name} />}
    </article>
  );
}
