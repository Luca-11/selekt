import Link from "next/link";
import { PRICE_TIERS } from "@/lib/price-tier";

export function AboutContent({ compact = false }: { compact?: boolean }) {
  return (
    <article className={`about-content ${compact ? "about-content--compact" : ""}`}>
      {!compact && (
        <header className="about-content__header">
          <p className="about-content__eyebrow">Manifeste</p>
          <h1>C&apos;est quoi Selekt ?</h1>
          <p className="about-content__lead">
            Une curation personnelle de marques mode indépendantes — mon regard, mes notes, mes
            limites.
          </p>
        </header>
      )}

      <div className="about__block">
        <h2>Le principe</h2>
        <p>
          Selekt, c&apos;est ma liste perso de marques que je trouve intéressantes à suivre, tester
          ou recommander à des amis. Pas un comparateur, pas un classement officiel, pas de fast
          fashion.
        </p>
        <p>
          Chaque fiche, c&apos;est mon ressenti du moment : ce qui m&apos;a plu, ce que j&apos;en
          sais aujourd&apos;hui, parfois avec des infos incomplètes. Tu peux t&apos;en inspirer —
          pas t&apos;y fier aveuglément.
        </p>
      </div>

      <div className="about__block" id="notes">
        <h2>Les notes</h2>
        <p>
          Le score sur chaque carte, c&apos;est <strong>mon avis subjectif</strong>, pas une note
          « objective » ni un verdict sur la qualité réelle de la marque.
        </p>
        <ul className="about__list">
          <li>
            <span className="about__score-dot about__score-dot--low" aria-hidden="true" />
            Une note basse ne veut pas dire que la marque est mauvaise — je la connais peut-être
            peu, elle ne correspond pas à mon style, ou ma fiche est ancienne.
          </li>
          <li>
            <span className="about__score-dot about__score-dot--mid" aria-hidden="true" />
            Une note haute, c&apos;est un enthousiasme sincère — pas une garantie que tu aimeras
            pareil.
          </li>
          <li>
            <span className="about__score-dot about__score-dot--high" aria-hidden="true" />
            L&apos;échelle va du rouge au doré, sur 0 à 5. Plus la teinte est chaude et claire, plus
            je suis convaincu aujourd&apos;hui.
          </li>
        </ul>
        <p className="about__note">
          <em>« Partiel »</em> sous le score = fiche encore incomplète. La note peut évoluer quand
          j&apos;en sais plus.
        </p>
        <p className="about__note">
          La date « Maj. … » sur une carte indique la dernière modification de la fiche dans ma
          base — pas la date de création de la marque.
        </p>
      </div>

      <div className="about__block">
        <h2>La gamme de prix</h2>
        <p>Fourchette indicative pour se repérer, pas le prix d&apos;un produit précis :</p>
        <dl className="about__price-list">
          {PRICE_TIERS.map((tier) => (
            <div key={tier.value} className="about__price-row">
              <dt>{tier.label}</dt>
              <dd>{tier.range}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="about__disclaimer">
        Bref : prends ça comme une reco entre potes, pas comme une vérité. Si une marque te parle,
        va voir par toi-même.
      </p>

      {!compact && (
        <div className="about-content__footer">
          <Link href="/" className="about-content__back">
            ← Retour aux marques
          </Link>
        </div>
      )}
    </article>
  );
}
