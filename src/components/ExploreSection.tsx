import { TransitionLink } from "@/components/TransitionLink";

interface ExploreSectionProps {
  title: string;
  text: string;
  variant: "retailer" | "account";
}

export function ExploreSection({ title, text, variant }: ExploreSectionProps) {
  const otherHref = variant === "retailer" ? "/a-suivre" : "/revendeurs";
  const otherLabel = variant === "retailer" ? "À suivre →" : "Revendeurs →";

  return (
    <section className="about-teaser" aria-labelledby="explore-teaser-title">
      <div className="about-teaser__inner">
        <div>
          <p className="about-teaser__eyebrow" id="explore-teaser-title">
            {title}
          </p>
          <p className="about-teaser__text">{text}</p>
        </div>
        <TransitionLink href={otherHref} className="about-teaser__link">
          {otherLabel}
        </TransitionLink>
      </div>
    </section>
  );
}
