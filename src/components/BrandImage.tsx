"use client";

import { useState } from "react";
import type { Brand } from "@/types/brand";

interface BrandImageProps {
  brand: Brand;
}

export function BrandImage({ brand }: BrandImageProps) {
  const { color, accent, name } = brand;
  const heroSrc = brand.imageUrl || brand.logoUrl;
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(heroSrc) && !photoFailed;

  return (
    <div className="brand-image" style={{ background: color }}>
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
          <circle cx="340" cy="-30" r="120" fill={accent} opacity="0.15" />
          <circle cx="340" cy="-30" r="70" fill={accent} opacity="0.12" />
          <rect x="20" y="140" width="200" height="1" fill={accent} opacity="0.3" />
          <rect x="20" y="148" width="120" height="1" fill={accent} opacity="0.2" />
          <rect x="320" y="20" width="1" height="80" fill={accent} opacity="0.25" />
          <polygon points="0,200 80,200 0,120" fill={accent} opacity="0.08" />
        </svg>
      )}

      <div className="brand-image__gradient" />

      <div className="brand-image__footer">
        <div>
          <div className="brand-image__name">{name}</div>
          <div className="brand-image__meta">
            {brand.origin} · {brand.category}
          </div>
        </div>
      </div>
    </div>
  );
}
