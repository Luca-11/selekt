import { AppChrome } from "@/components/AppChrome";
import { SiteFooter } from "@/components/SiteFooter";
import { TransitionLink } from "@/components/TransitionLink";

export default function NotFound() {
  return (
    <div className="app app--browse">
      <AppChrome variant="browse" />
      <main className="main main--browse not-found">
        <p className="not-found__code">404</p>
        <h1>Cette page n&apos;existe pas</h1>
        <p className="not-found__text">
          Peut-être une vieille URL, ou une marque retirée de la liste. En tout cas, rien ici.
        </p>
        <div className="not-found__actions">
          <TransitionLink href="/" className="not-found__primary">
            Voir les marques
          </TransitionLink>
          <TransitionLink href="/a-propos" className="not-found__secondary">
            Le projet
          </TransitionLink>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
