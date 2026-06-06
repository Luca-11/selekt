import type { BrandSocial } from "@/types/brand";

const LINKS = [
  {
    key: "instagram" as const,
    label: "Instagram",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "tiktok" as const,
    label: "TikTok",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.5 3c.4 2.8 1.8 4.5 4.5 4.8v3.4c-1.7 0-3.2-.5-4.5-1.5v6.8c0 3.4-2.8 5.5-5.8 5.5-3 0-5.2-2-5.2-5 0-3.1 2.5-5 5.3-5 .4 0 .9.1 1.3.2v3.5c-.3-.1-.6-.2-1-.2-1.2 0-2 .7-2 1.9s.8 2 2 2c1.3 0 2-.8 2-2.4V3h3.4z" />
      </svg>
    ),
  },
  {
    key: "twitter" as const,
    label: "X",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.5 3h3.2l-7 8.1L21.5 21h-6.1l-4.8-6.3L5 21H1.8l7.5-8.6L2.5 3h6.2l4.3 5.7L17.5 3zm-1.1 16.2h1.8L7.9 4.8H6l10.4 14.4z" />
      </svg>
    ),
  },
];

interface BrandSocialLinksProps {
  social: BrandSocial;
  brandName: string;
}

export function BrandSocialLinks({ social, brandName }: BrandSocialLinksProps) {
  const items = LINKS.filter(({ key }) => social[key]);

  if (items.length === 0) return null;

  return (
    <div className="brand-card__social">
      {items.map(({ key, label, icon }) => (
        <a
          key={key}
          href={social[key]}
          target="_blank"
          rel="noopener noreferrer"
          className="brand-card__social-link"
          aria-label={`${brandName} sur ${label}`}
        >
          {icon}
        </a>
      ))}
    </div>
  );
}
