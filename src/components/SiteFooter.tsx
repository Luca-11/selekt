import Link from "next/link";

interface SiteFooterProps {
  variant?: "home" | "about";
}

export function SiteFooter({ variant = "home" }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <p className="site-footer__tagline">selekt — curation indépendante</p>
      <nav className="site-footer__nav" aria-label="Navigation secondaire">
        {variant === "home" ? (
          <Link href="/a-propos" className="site-footer__page-link">
            Le projet
          </Link>
        ) : (
          <Link href="/" className="site-footer__page-link">
            Retour aux marques
          </Link>
        )}
      </nav>
    </footer>
  );
}
