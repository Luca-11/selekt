import { AboutContent } from "@/components/AboutContent";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Le projet — Selekt",
  description: "Comment lire Selekt : curation personnelle, notes subjectives et gammes de prix.",
};

export default function AboutPage() {
  return (
    <div className="app">
      <PublicHeader />
      <main className="main main--about">
        <AboutContent />
      </main>
      <SiteFooter variant="about" />
    </div>
  );
}
