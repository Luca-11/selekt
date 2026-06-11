import { TransitionLink } from "@/components/TransitionLink";

interface SiteFooterProps {
  variant?: "home" | "about" | "explore";
}

export function SiteFooter({ variant = "home" }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <p className="site-footer__tagline">selekt — bibliothèque de découverte mode</p>
      <nav className="site-footer__nav" aria-label="Navigation secondaire">
        {variant === "about" ? (
          <TransitionLink href="/" className="site-footer__page-link">
            Retour aux marques
          </TransitionLink>
        ) : (
          <TransitionLink href="/a-propos" className="site-footer__page-link">
            Le projet
          </TransitionLink>
        )}
      </nav>
    </footer>
  );
}
