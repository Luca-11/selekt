"use client";

import { useState } from "react";
import type { ExploreResource } from "@/types/resource";
import { paletteFromName } from "@/lib/palette";

interface ResourceImageProps {
  resource: ExploreResource;
}

export function ResourceImage({ resource }: ResourceImageProps) {
  const palette = paletteFromName(resource.name);
  const heroSrc = resource.imageUrl || resource.logoUrl;
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(heroSrc) && !photoFailed;

  const meta =
    resource.kind === "retailer"
      ? [resource.origin, resource.category].filter(Boolean).join(" · ")
      : [resource.contentType, resource.category].filter(Boolean).join(" · ");

  return (
    <div className="brand-image" style={{ background: palette.color }}>
      {showPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroSrc}
          alt=""
          className="brand-image__photo"
          onError={() => setPhotoFailed(true)}
        />
      )}

      {!showPhoto && (
        <svg
          className="brand-image__shapes"
          width="100%"
          height="100%"
          viewBox="0 0 400 200"
          aria-hidden="true"
        >
          <circle cx="340" cy="-30" r="120" fill={palette.accent} opacity="0.15" />
          <circle cx="340" cy="-30" r="70" fill={palette.accent} opacity="0.12" />
          <rect x="20" y="140" width="200" height="1" fill={palette.accent} opacity="0.3" />
          <rect x="20" y="148" width="120" height="1" fill={palette.accent} opacity="0.2" />
          <rect x="320" y="20" width="1" height="80" fill={palette.accent} opacity="0.25" />
          <polygon points="0,200 80,200 0,120" fill={palette.accent} opacity="0.08" />
        </svg>
      )}

      <div className="brand-image__gradient" />

      <div className="brand-image__footer">
        <div>
          <div className="brand-image__name">{resource.name}</div>
          {meta && <div className="brand-image__meta">{meta}</div>}
        </div>
      </div>
    </div>
  );
}
