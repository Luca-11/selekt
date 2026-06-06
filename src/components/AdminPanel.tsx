"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BrandDraft, BrandSocial, ScrapeResult } from "@/types/brand-draft";
import {
  BADGE_SUGGESTIONS,
  CATEGORY_OPTIONS,
  PRICE_OPTIONS,
  SOCIAL_FIELDS,
} from "@/types/brand-draft";
import { getPriceTier } from "@/lib/price-tier";
import { scoreColor } from "@/lib/score";

type Step = "login" | "url" | "review" | "done";

function AdminMediaPreview({
  src,
  fallbackSrc,
  emptyLabel,
  className,
}: {
  src?: string;
  fallbackSrc?: string;
  emptyLabel: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const display = src && !failed ? src : fallbackSrc;
  const isFallback = Boolean(display && display === fallbackSrc && src && failed);

  if (!display) {
    return <span className="admin__media-empty">{emptyLabel}</span>;
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={display}
        src={display}
        alt=""
        className={className}
        onError={() => setFailed(true)}
      />
      {isFallback && <span className="admin__media-fallback">Logo utilisé en fallback</span>}
    </>
  );
}

const emptyDraft = (): BrandDraft => ({
  name: "",
  url: "",
  origin: "–",
  category: "Indé",
  price: "Milieu de gamme",
  desc: "",
  tags: [],
});

export function AdminPanel() {
  const [step, setStep] = useState<Step>("login");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hints, setHints] = useState<string[]>([]);
  const [source, setSource] = useState<"ai" | "meta">("meta");
  const [aiAvailable, setAiAvailable] = useState(false);
  const [draft, setDraft] = useState<BrandDraft>(emptyDraft);
  const [score, setScore] = useState(3);
  const [maxScore] = useState(5);
  const [partial, setPartial] = useState(true);
  const [publishedName, setPublishedName] = useState("");
  const [publishedUpdated, setPublishedUpdated] = useState(false);

  const checkSession = useCallback(async () => {
    const res = await fetch("/api/admin/session");
    const data = (await res.json()) as { authenticated: boolean; configured: boolean };
    if (!data.configured) {
      setAuthError("Ajoute ADMIN_PASSWORD dans .env.local");
      setStep("login");
      return;
    }
    setStep(data.authenticated ? "url" : "login");
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setLoading(true);

    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setAuthError(data.error ?? "Erreur de connexion");
      return;
    }

    setPassword("");
    setStep("url");
  }

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = (await res.json()) as ScrapeResult & {
      error?: string;
      aiAvailable?: boolean;
    };

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erreur de scraping");
      return;
    }

    setDraft(data.draft);
    setSource(data.source);
    setHints(data.hints ?? []);
    setAiAvailable(Boolean(data.aiAvailable));
    setScore(0);
    setPartial(true);
    setStep("review");
  }

  function updateDraft(field: keyof BrandDraft, value: string | string[]) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function updateSocial(key: keyof BrandSocial, value: string) {
    setDraft((prev) => ({
      ...prev,
      social: {
        ...prev.social,
        [key]: value.trim() || undefined,
      },
    }));
  }

  function toggleTag(tag: string) {
    setDraft((prev) => {
      const has = prev.tags.includes(tag);
      if (has) return { ...prev, tags: prev.tags.filter((t) => t !== tag) };
      if (prev.tags.length >= 3) return prev;
      return { ...prev, tags: [...prev.tags, tag] };
    });
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, score, maxScore, partial }),
    });

    const data = (await res.json()) as {
      ok?: boolean;
      name?: string;
      created?: boolean;
      error?: string;
    };
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erreur de publication");
      return;
    }

    setPublishedName(data.name ?? draft.name);
    setPublishedUpdated(data.created === false);
    setStep("done");
  }

  async function handleLogout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setStep("login");
  }

  function resetForAnother() {
    setUrl("");
    setDraft(emptyDraft());
    setError("");
    setHints([]);
    setStep("url");
  }

  function useLogoAsHero() {
    if (draft.logoUrl) updateDraft("imageUrl", draft.logoUrl);
  }

  const scoreHue = scoreColor(score, maxScore);

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <Link href="/" className="admin__back">
            ← Selekt
          </Link>
          <h1>Ajouter une marque</h1>
          <p>Colle une URL, vérifie, publie — Notion se met à jour tout seul.</p>
        </div>
        {step !== "login" && (
          <button type="button" className="admin__logout" onClick={handleLogout}>
            Déconnexion
          </button>
        )}
      </header>

      {!aiAvailable && step !== "login" && (
        <div className="admin__banner">
          Mode meta actif — ajoute <code>OPENAI_API_KEY</code> (ChatGPT) dans{" "}
          <code>.env.local</code>. Supprime ou commente <code>ANTHROPIC_API_KEY</code> si tu
          n&apos;utilises pas Claude.
        </div>
      )}

      {step === "login" && (
        <form className="admin__card" onSubmit={handleLogin}>
          <label htmlFor="password">Mot de passe admin</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ADMIN_PASSWORD"
            autoComplete="current-password"
          />
          {authError && <p className="admin__error">{authError}</p>}
          <button type="submit" disabled={loading || !password}>
            {loading ? "Connexion…" : "Entrer"}
          </button>
        </form>
      )}

      {step === "url" && (
        <form className="admin__card" onSubmit={handleScrape}>
          <label htmlFor="brand-url">URL du site de la marque</label>
          <input
            id="brand-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://akimbo.store"
            required
          />
          {error && <p className="admin__error">{error}</p>}
          <button type="submit" disabled={loading || !url.trim()}>
            {loading ? "Analyse en cours…" : "Analyser"}
          </button>
        </form>
      )}

      {step === "review" && (
        <form className="admin__card admin__card--wide" onSubmit={handlePublish}>
          <div className="admin__meta">
            <span className={`admin__pill admin__pill--${source}`}>
              {source === "ai" ? "Enrichi par IA" : "Extraction meta"}
            </span>
            {hints.map((hint) => (
              <span key={hint} className="admin__hint">
                {hint}
              </span>
            ))}
          </div>

          <div className="admin__media">
            <div className="admin__media-block">
              <span className="admin__media-label">Logo</span>
              <div className="admin__logo-preview">
                <AdminMediaPreview src={draft.logoUrl} emptyLabel="Non détecté" />
              </div>
              <input
                type="text"
                value={draft.logoUrl ?? ""}
                onChange={(e) => updateDraft("logoUrl", e.target.value)}
                placeholder="URL du logo"
              />
            </div>
            <div className="admin__media-block admin__media-block--wide">
              <span className="admin__media-label">Image hero</span>
              <div className="admin__preview-img admin__preview-img--inline">
                <AdminMediaPreview
                  src={draft.imageUrl}
                  emptyLabel="L'IA la remplira si disponible — ou colle une URL"
                />
              </div>
              <input
                type="text"
                value={draft.imageUrl ?? ""}
                onChange={(e) => updateDraft("imageUrl", e.target.value)}
                placeholder="https://… (campagnes, produit, Instagram…)"
              />
              {draft.logoUrl && (
                <div className="admin__media-actions">
                  <button type="button" className="admin__secondary" onClick={useLogoAsHero}>
                    Utiliser le logo temporairement
                  </button>
                </div>
              )}
              <p className="admin__media-help">
                Pré-remplie par l&apos;IA quand elle est disponible — tu peux toujours la
                remplacer ici (colle une URL ou utilise le logo temporairement).
              </p>
            </div>
          </div>

          <fieldset className="admin__social">
            <legend>Réseaux sociaux (auto si trouvés dans le HTML)</legend>
            <div className="admin__social-grid">
              {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                <label key={key}>
                  {label}
                  <input
                    type="text"
                    value={draft.social?.[key] ?? ""}
                    onChange={(e) => updateSocial(key, e.target.value)}
                    placeholder={placeholder}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <div className="admin__grid">
            <label>
              Nom
              <input
                value={draft.name}
                onChange={(e) => updateDraft("name", e.target.value)}
                required
              />
            </label>
            <label>
              URL
              <input
                value={draft.url}
                onChange={(e) => updateDraft("url", e.target.value)}
                required
              />
            </label>
            <label>
              Pays
              <input
                value={draft.origin}
                onChange={(e) => updateDraft("origin", e.target.value)}
              />
            </label>
            <label>
              Catégorie
              <select
                value={draft.category}
                onChange={(e) => updateDraft("category", e.target.value)}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Gamme de prix
              <select value={draft.price} onChange={(e) => updateDraft("price", e.target.value)}>
                {PRICE_OPTIONS.map((p) => {
                  const tier = getPriceTier(p);
                  return (
                    <option key={p} value={p}>
                      {tier ? `${tier.label} — ${tier.range}` : p}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          <label>
            Description (ta voix)
            <textarea
              value={draft.desc}
              onChange={(e) => updateDraft("desc", e.target.value)}
              rows={3}
              required
            />
          </label>

          <label>
            Actu / dernier drop (optionnel)
            <input
              value={draft.actu ?? ""}
              onChange={(e) => updateDraft("actu", e.target.value)}
            />
          </label>

          <fieldset className="admin__badges">
            <legend>Badges (max 3)</legend>
            <div className="admin__badge-list">
              {BADGE_SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`admin__badge ${draft.tags.includes(tag) ? "admin__badge--on" : ""}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="admin__score-block">
            <div className="admin__score-header">
              <span>Ton score</span>
              <strong style={{ color: scoreHue }}>
                {score}/{maxScore}
              </strong>
            </div>
            <input
              type="range"
              min={0}
              max={maxScore}
              step={1}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="admin__slider"
              style={{ accentColor: scoreHue }}
            />
            <div className="admin__score-legend">
              <span>Rouge</span>
              <span>Vert</span>
            </div>
          </div>

          <div className="admin__checks">
            <label>
              <input
                type="checkbox"
                checked={partial}
                onChange={(e) => setPartial(e.target.checked)}
              />
              Score partiel (infos incomplètes)
            </label>
          </div>

          {error && <p className="admin__error">{error}</p>}

          <div className="admin__actions">
            <button type="button" className="admin__secondary" onClick={() => setStep("url")}>
              ← Autre URL
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Publication…" : "Publier dans Notion"}
            </button>
          </div>
          <p className="admin__upsert-hint">
            Si l&apos;URL existe déjà dans Notion, la fiche sera mise à jour (backfill image,
            réseaux, etc.).
          </p>
        </form>
      )}

      {step === "done" && (
        <div className="admin__card admin__success">
          <h2>
            {publishedName} {publishedUpdated ? "mis à jour" : "ajouté"} ✓
          </h2>
          <p>
            {publishedUpdated
              ? "La fiche Notion existante a été mise à jour. Le site se rafraîchit sous ~5 min (ou immédiatement au reload)."
              : "La marque a été ajoutée dans Notion. Elle apparaît sur le site dans quelques secondes."}
          </p>
          <div className="admin__actions">
            <button type="button" onClick={resetForAnother}>
              Ajouter une autre
            </button>
            <Link href="/" className="admin__link-btn">
              Voir le site
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
