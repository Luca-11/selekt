"use client";

import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/TransitionLink";

const LINKS = [
  { href: "/", label: "Marques" },
  { href: "/revendeurs", label: "Revendeurs" },
  { href: "/a-suivre", label: "À suivre" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="site-nav" aria-label="Sections du site">
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <TransitionLink
            key={href}
            href={href}
            className={`site-nav__link${active ? " site-nav__link--active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </TransitionLink>
        );
      })}
    </nav>
  );
}
