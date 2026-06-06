import type { Brand } from "@/types/brand";
import { paletteFromName } from "@/lib/palette";

function brand(
  id: number,
  name: string,
  url: string,
  category: string,
  origin: string,
  price: string,
  tags: string[],
  desc = "À compléter",
  overrides: Partial<Brand> = {},
): Brand {
  const palette = paletteFromName(name);
  return {
    id: String(id),
    name,
    url,
    origin,
    category,
    price,
    score: 0,
    maxScore: 5,
    partial: true,
    featured: false,
    desc,
    tags,
    color: palette.color,
    accent: palette.accent,
    textOnImg: palette.textOnImg,
    ...overrides,
  };
}

/** Données locales — utilisées si Notion n'est pas configuré */
export const fallbackBrands: Brand[] = [
  brand(1, "Akimbo", "https://akimbo.store", "Streetwear", "UK", "Premium", ["Petites séries", "Matières soignées", "Identité forte"], "Pièces sculptées, univers cohérent. Une des rares marques indé avec une vraie identité visuelle de bout en bout.", { score: 5, maxScore: 5, partial: false, featured: true, color: "#1a1a1a", accent: "#c8b89a" }),
  brand(2, "Derschutze", "https://derschutze.com", "Streetwear", "Allemagne", "Milieu de gamme", ["Indé", "Streetwear"]),
  brand(3, "Sweats EU", "https://sweatseu.com", "Streetwear", "EU", "Milieu de gamme", ["Essentials", "EU"]),
  brand(4, "Shinzo", "https://shinzo.paris", "Streetwear", "Paris, FR", "Milieu de gamme", ["Made in FR", "Streetwear"]),
  brand(5, "Mutimer", "https://mutimer.com", "Streetwear", "France", "Milieu de gamme", ["Indé"]),
  brand(6, "Lil Lit", "https://lillit.fr", "Streetwear", "France", "Milieu de gamme", ["Indé"]),
  brand(7, "Angel Boy", "https://angelboy.fr", "Streetwear", "France", "Milieu de gamme", ["Indé"]),
  brand(8, "FiveFourFive", "https://fivefourfive.com", "Streetwear", "France", "Milieu de gamme", ["Indé"]),
  brand(9, "F/Fected", "https://fffected.com", "Streetwear", "France", "Milieu de gamme", ["Indé"]),
  brand(10, "DRMERS Club", "https://drmersclub.com", "Streetwear", "France", "Milieu de gamme", ["Indé"]),
  brand(11, "Ementa", "https://ementa.studio", "Streetwear", "Portugal", "Milieu de gamme", ["Indé"]),
  brand(12, "Uhnother", "https://uhnother.com", "Indé", "–", "Milieu de gamme", ["Indé", "À suivre"], "À surveiller de près. Peu d'infos disponibles mais les pièces parlent d'elles-mêmes.", { score: 2, partial: true }),
  brand(13, "Trendt Vision", "https://trendtvision.com", "Streetwear", "EU", "Milieu de gamme", ["Streetwear"]),
  brand(14, "Edwin", "https://edwin-europe.com", "Denim", "Japon / EU", "Premium", ["Denim", "Selvedge", "Héritage"], "Denim japonais de référence. Selvedge authentique, coupe iconique.", { score: 3, partial: false, color: "#2b3a52", accent: "#7a9cc0" }),
  brand(15, "The Frankie Shop", "https://thefrankieshop.com", "Tailoring", "Corée / EU", "Premium", ["Minimal", "Tailoring"]),
  brand(16, "Eme Studios", "https://emestudios.com", "Streetwear", "Espagne", "Milieu de gamme", ["Indé"]),
  brand(17, "Scuffers", "https://scuffers.com", "Streetwear", "Espagne", "Milieu de gamme", ["Streetwear"]),
  brand(18, "Spare Jeans", "https://sparejeans.com", "Denim", "France", "Milieu de gamme", ["Denim", "Made in FR"]),
  brand(19, "Walk in Paris", "https://walkinparis.com", "Urban", "Paris, FR", "Premium", ["FR", "Urban", "Durable"], "Ancrage parisien fort, pièces durables pensées pour la ville.", { score: 3, color: "#3d3530", accent: "#d4a96a" }),
  brand(20, "Arte Antwerp", "https://arte-antwerp.com", "Streetwear", "Belgique", "Premium", ["Streetwear", "EU"]),
  brand(21, "Weyz Clothing", "https://weyzclothing.com", "Streetwear", "France", "Milieu de gamme", ["Made in FR"]),
  brand(22, "DaVril Supply", "https://davrilsupply.com", "Workwear", "France", "Milieu de gamme", ["Workwear", "FR"]),
  brand(23, "Old Time Fever", "https://oldtimefever.com", "Vintage", "France", "Milieu de gamme", ["Vintage", "FR"]),
  brand(24, "Human With Attitude", "https://humanwithattitude.com", "Streetwear", "Paris, FR", "Milieu de gamme", ["Made in FR", "Communauté", "Essentials"], "Streetwear parisien indépendant avec une vraie communauté derrière.", { score: 4, color: "#f0ece4", accent: "#2a2a2a", textOnImg: "dark" }),
  brand(25, "Diemm", "https://diemm.fr", "Streetwear", "France", "Milieu de gamme", ["Made in FR"]),
  brand(26, "DivinByDivin", "https://divinbydivin.com", "Streetwear", "France", "Milieu de gamme", ["Indé"]),
  brand(27, "Supraw", "https://supraw.com", "Streetwear", "France", "Milieu de gamme", ["Made in FR"]),
  brand(28, "Coutumes", "https://coutumes.paris", "Bijoux", "France", "Premium", ["Artisanal", "Made in FR", "Masculin"], "Bijoux masculins, fabrication artisanale française.", { score: 4, color: "#e8ddd0", accent: "#8b6f47", textOnImg: "dark" }),
  brand(29, "Fragment Studio", "https://fragmentstudio.fr", "Bijoux", "France", "Premium", ["Artisanal", "Bijoux"]),
];

export function buildCategories(brands: Brand[]): string[] {
  const cats = new Set(brands.map((b) => b.category));
  return ["Tout", ...Array.from(cats).sort()];
}
