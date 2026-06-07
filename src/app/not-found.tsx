import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <div className="app">
      <PublicHeader />
      <main className="main not-found">
        <p className="not-found__code">404</p>
        <h1>Cette page n&apos;existe pas</h1>
        <p className="not-found__text">
          Peut-être une vieille URL, ou une marque retirée de la liste. En tout cas, rien ici.
        </p>
        <div className="not-found__actions">
          <Link href="/" className="not-found__primary">
            Voir les marques
          </Link>
          <Link href="/a-propos" className="not-found__secondary">
            Le projet
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
