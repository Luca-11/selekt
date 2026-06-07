import Link from "next/link";

export function AboutSection() {
  return (
    <section className="about-teaser" aria-labelledby="about-teaser-title">
      <div className="about-teaser__inner">
        <div>
          <p className="about-teaser__eyebrow" id="about-teaser-title">
            Notes subjectives
          </p>
          <p className="about-teaser__text">
            Selekt, c&apos;est ma liste perso — les scores reflètent mon avis du moment, pas une
            vérité absolue.
          </p>
        </div>
        <Link href="/a-propos" className="about-teaser__link">
          Lire le projet →
        </Link>
      </div>
    </section>
  );
}
