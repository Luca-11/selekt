import { useState } from "react";

const brands = [
  {
    id: 1,
    name: "Akimbo",
    origin: "UK",
    category: "Streetwear",
    price: "€€€",
    score: 5,
    maxScore: 5,
    partial: false,
    featured: true,
    desc: "Pièces sculptées, univers cohérent. Une des rares marques indé avec une vraie identité visuelle de bout en bout — de la pièce à la com.",
    tags: ["Petites séries", "Matières soignées", "Identité forte"],
    url: "#",
    color: "#1a1a1a",
    accent: "#c8b89a",
    textOnImg: "light",
  },
  {
    id: 2,
    name: "Human With Attitude",
    origin: "Paris, FR",
    category: "Streetwear",
    price: "€€",
    score: 4,
    maxScore: 5,
    partial: true,
    featured: false,
    desc: "Streetwear parisien indépendant avec une vraie communauté derrière. Qualité consistante sur les pièces essentials.",
    tags: ["Made in FR", "Communauté", "Essentials"],
    url: "#",
    color: "#f0ece4",
    accent: "#2a2a2a",
    textOnImg: "dark",
  },
  {
    id: 3,
    name: "Edwin",
    origin: "Japon / EU",
    category: "Denim",
    price: "€€€",
    score: 3,
    maxScore: 5,
    partial: false,
    featured: false,
    desc: "Denim japonais de référence. Selvedge authentique, coupe iconique, héritage de plus de 70 ans de savoir-faire.",
    tags: ["Denim", "Selvedge", "Héritage"],
    url: "#",
    color: "#2b3a52",
    accent: "#7a9cc0",
    textOnImg: "light",
  },
  {
    id: 4,
    name: "Coutumes",
    origin: "France",
    category: "Bijoux",
    price: "€€€",
    score: 4,
    maxScore: 5,
    partial: true,
    featured: false,
    desc: "Bijoux masculins, fabrication artisanale française. Rare dans le genre — un positionnement très propre.",
    tags: ["Artisanal", "Made in FR", "Masculin"],
    url: "#",
    color: "#e8ddd0",
    accent: "#8b6f47",
    textOnImg: "dark",
  },
  {
    id: 5,
    name: "Walk in Paris",
    origin: "Paris, FR",
    category: "Urban",
    price: "€€",
    score: 3,
    maxScore: 5,
    partial: true,
    featured: false,
    desc: "Ancrage parisien fort, pièces durables pensées pour la ville. Un regard local assumé.",
    tags: ["FR", "Urban", "Durable"],
    url: "#",
    color: "#3d3530",
    accent: "#d4a96a",
    textOnImg: "light",
  },
  {
    id: 6,
    name: "Uhnother",
    origin: "–",
    category: "Indé",
    price: "€€",
    score: 2,
    maxScore: 5,
    partial: true,
    featured: false,
    desc: "À surveiller de près. Peu d'infos disponibles mais les pièces parlent d'elles-mêmes. Une vraie pépite en devenir.",
    tags: ["Indé", "À suivre"],
    url: "#",
    color: "#111",
    accent: "#e0e0e0",
    textOnImg: "light",
  },
];

const categories = ["Tout", "Streetwear", "Denim", "Bijoux", "Urban", "Indé", "FR"];

function scoreColor(score, max) {
  const ratio = score / max;
  if (ratio >= 0.8) return "#4ade80";
  if (ratio >= 0.6) return "#facc15";
  if (ratio >= 0.4) return "#fb923c";
  return "#f87171";
}

function BrandImage({ brand }) {
  const { color, accent, name, textOnImg } = brand;
  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: 200,
      background: color,
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {/* Geometric DA shapes */}
      <svg
        width="100%" height="100%"
        viewBox="0 0 400 200"
        style={{ position: "absolute", inset: 0 }}
        aria-hidden="true"
      >
        <circle cx="340" cy="-30" r="120" fill={accent} opacity="0.15" />
        <circle cx="340" cy="-30" r="70" fill={accent} opacity="0.12" />
        <rect x="20" y="140" width="200" height="1" fill={accent} opacity="0.3" />
        <rect x="20" y="148" width="120" height="1" fill={accent} opacity="0.2" />
        <rect x="320" y="20" width="1" height="80" fill={accent} opacity="0.25" />
        <polygon points="0,200 80,200 0,120" fill={accent} opacity="0.08" />
      </svg>

      {/* Bottom gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)",
      }} />

      {/* Brand name on image */}
      <div style={{
        position: "absolute",
        bottom: 14, left: 16, right: 16,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 19,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.01em",
            lineHeight: 1.1,
          }}>
            {name}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>
            {brand.origin} · {brand.category}
          </div>
        </div>
        {brand.featured && (
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#111",
            background: "#4ade80",
            padding: "3px 10px",
            borderRadius: 999,
          }}>
            Coup de cœur
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreRing({ score, max, partial }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const fill = (score / max) * circ;
  const color = scoreColor(score, max);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width="52" height="52" viewBox="0 0 52 52" aria-label={`Score ${score} sur ${max}`}>
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="3" />
        <circle
          cx="26" cy="26" r={r} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text
          x="26" y="30"
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill={color}
          fontFamily="'DM Mono', monospace"
        >
          {score}/{max}
        </text>
      </svg>
      {partial && (
        <div style={{ fontSize: 10, color: "rgba(128,128,128,0.6)", fontStyle: "italic", textAlign: "center" }}>
          partiel
        </div>
      )}
    </div>
  );
}

function BrandCard({ brand }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--card-bg, #fff)",
        border: brand.featured
          ? "1.5px solid #4ade80"
          : hovered
          ? "1px solid rgba(128,128,128,0.35)"
          : "1px solid rgba(128,128,128,0.15)",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 12px 40px rgba(0,0,0,0.1)"
          : "0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.25s ease",
      }}
    >
      <BrandImage brand={brand} />

      <div style={{ padding: "14px 16px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: 13,
            color: "rgba(0,0,0,0.55)",
            lineHeight: 1.6,
            marginBottom: 12,
            fontFamily: "'Lora', serif",
            fontStyle: "italic",
          }}>
            {brand.desc}
          </p>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {brand.tags.map(t => (
              <span key={t} style={{
                fontSize: 11,
                padding: "2px 9px",
                background: "rgba(0,0,0,0.04)",
                color: "rgba(0,0,0,0.5)",
                borderRadius: 6,
                border: "0.5px solid rgba(0,0,0,0.08)",
                fontFamily: "'DM Mono', monospace",
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <ScoreRing score={brand.score} max={brand.maxScore} partial={brand.partial} />
          <span style={{
            fontSize: 13,
            color: "rgba(0,0,0,0.4)",
            fontFamily: "'DM Mono', monospace",
          }}>
            {brand.price}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Selekt() {
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [search, setSearch] = useState("");

  const filtered = brands.filter(b => {
    const matchCat = activeFilter === "Tout" || b.category === activeFilter || (activeFilter === "FR" && b.origin.includes("FR"));
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f9f7f4",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital@0;1&family=DM+Sans:wght@300;400;500&family=DM+Mono&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        background: "#f9f7f4",
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            fontWeight: 900,
            color: "#111",
            letterSpacing: "0.03em",
          }}>
            Selekt
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: 10,
            padding: "6px 12px",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Chercher une marque..."
              style={{
                border: "none",
                background: "transparent",
                fontSize: 13,
                color: "#111",
                outline: "none",
                width: 160,
              }}
              aria-label="Rechercher une marque"
            />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 60px" }}>

        {/* Hero line */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 36,
            fontWeight: 900,
            color: "#111",
            lineHeight: 1.1,
            marginBottom: 8,
          }}>
            Des marques qui méritent<br />votre attention.
          </h1>
          <p style={{
            fontSize: 14,
            color: "rgba(0,0,0,0.45)",
            fontFamily: "'Lora', serif",
            fontStyle: "italic",
          }}>
            Une curation personnelle — {brands.length} marques, aucune fast fashion.
          </p>
        </div>

        {/* Filters */}
        <div style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 28,
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              style={{
                fontSize: 12,
                padding: "5px 14px",
                borderRadius: 999,
                border: activeFilter === cat
                  ? "1px solid #111"
                  : "1px solid rgba(0,0,0,0.12)",
                background: activeFilter === cat ? "#111" : "transparent",
                color: activeFilter === cat ? "#fff" : "rgba(0,0,0,0.5)",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: activeFilter === cat ? 500 : 400,
                transition: "all 0.15s ease",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 0",
              color: "rgba(0,0,0,0.3)",
              fontFamily: "'Lora', serif",
              fontStyle: "italic",
            }}>
              Aucune marque trouvée.
            </div>
          ) : (
            filtered.map(brand => <BrandCard key={brand.id} brand={brand} />)
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(0,0,0,0.06)",
        padding: "20px 24px",
        textAlign: "center",
        fontSize: 12,
        color: "rgba(0,0,0,0.25)",
        fontFamily: "'DM Mono', monospace",
      }}>
        selekt — curation indépendante
      </footer>
    </div>
  );
}
