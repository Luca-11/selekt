import { AboutContent } from "@/components/AboutContent";
import { AppChrome } from "@/components/AppChrome";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Le projet — Selekt",
  description: "Comment lire Selekt : curation personnelle, notes subjectives et gammes de prix.",
};

export default function AboutPage() {
  return (
    <div className="app app--browse">
      <AppChrome variant="browse" />
      <main className="main main--about main--browse">
        <AboutContent />
      </main>
      <SiteFooter variant="about" />
    </div>
  );
}
