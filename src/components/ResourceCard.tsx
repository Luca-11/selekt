import type { CSSProperties } from "react";
import type { ExploreResource } from "@/types/resource";
import { formatUpdatedAt } from "@/lib/format-date";
import { BrandSocialLinks } from "@/components/BrandSocialLinks";
import { ResourceImage } from "@/components/ResourceImage";

interface ResourceCardProps {
  resource: ExploreResource;
  index?: number;
}

export function ResourceCard({ resource, index }: ResourceCardProps) {
  const updatedLabel = formatUpdatedAt(resource.updatedAt);

  const cardStyle = {
    "--brand-accent": resource.kind === "retailer" ? "#8b9eb7" : "#b09a8f",
  } as CSSProperties;

  const className = "brand-card resource-card";

  const main = (
    <>
      <ResourceImage resource={resource} />
      <div className="brand-card__body resource-card__body">
        <div className="brand-card__content">
          <p className="brand-card__desc">{resource.desc}</p>
          <div className="brand-card__tags">
            {resource.tags.map((tag) => (
              <span key={tag} className="brand-card__tag">
                {tag}
              </span>
            ))}
          </div>
          {updatedLabel && <p className="brand-card__updated">Maj. {updatedLabel}</p>}
        </div>
        <div className="brand-card__aside resource-card__badge">
          <span className="resource-card__kind">
            {resource.kind === "retailer" ? "Revendeur" : "À suivre"}
          </span>
        </div>
      </div>
      {resource.url && resource.url !== "#" && (
        <span className="brand-card__external" aria-hidden="true">
          ↗
        </span>
      )}
    </>
  );

  return (
    <article className={className} style={cardStyle}>
      {index != null && (
        <span className="brand-card__index" aria-hidden="true">
          {String(index).padStart(3, "0")}
        </span>
      )}

      {resource.url && resource.url !== "#" ? (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="brand-card__main"
          aria-label={`Visiter ${resource.name} (nouvel onglet)`}
        >
          {main}
        </a>
      ) : (
        <div className="brand-card__main">{main}</div>
      )}
      {resource.social && (
        <BrandSocialLinks social={resource.social} brandName={resource.name} />
      )}
    </article>
  );
}
